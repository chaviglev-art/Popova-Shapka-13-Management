/* ============================================================
   Store — data model, persistence (Supabase), realtime sync
   ============================================================ */
const BGN_PER_EUR = 1.95583;

function uid(prefix = 'x') { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayISO() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function monthISO(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

/* ---------- empty shape (populated for real once Supabase answers) ---------- */
function emptyData() {
  return {
    building: { name: '', address: '', managerName: '', managerPhone: '', managerEmail: '', currency: 'EUR', showDual: true, defaultFee: 40, iban: '', bank: '', beneficiary: '', openingBalance: 0, feesSince: '', banner: '' },
    units: [], payments: [], expenses: [], news: [], works: [], events: [], requests: [], documents: [], votes: [], contacts: [], audit: [],
  };
}
let DB = emptyData();
let DB_SNAPSHOT = null;   // last state known to be persisted — saveData() diffs against this

/* ---------- column-name maps: js camelCase <-> Supabase snake_case ---------- */
const TABLE_MAPS = {
  building: [['name', 'name'], ['address', 'address'], ['managerName', 'manager_name'], ['managerPhone', 'manager_phone'], ['managerEmail', 'manager_email'], ['currency', 'currency'], ['showDual', 'show_dual'], ['defaultFee', 'default_fee'], ['iban', 'iban'], ['bank', 'bank'], ['beneficiary', 'beneficiary'], ['openingBalance', 'opening_balance'], ['feesSince', 'fees_since'], ['banner', 'banner']],
  units: [['id', 'id'], ['num', 'num'], ['type', 'type'], ['floor', 'floor'], ['size', 'size'], ['owner', 'owner'], ['tenant', 'tenant'], ['phone', 'phone'], ['email', 'email'], ['sharePhone', 'share_phone'], ['fee', 'fee'], ['feeSince', 'fee_since']],
  payments: [['id', 'id'], ['unitId', 'unit_id'], ['amount', 'amount'], ['period', 'period'], ['date', 'date'], ['note', 'note'], ['method', 'method']],
  expenses: [['id', 'id'], ['date', 'date'], ['amount', 'amount'], ['category', 'category'], ['note', 'note'], ['vendor', 'vendor'], ['url', 'url']],
  news: [['id', 'id'], ['title', 'title'], ['body', 'body'], ['date', 'date'], ['pinned', 'pinned'], ['banner', 'banner']],
  works: [['id', 'id'], ['title', 'title'], ['desc', 'description'], ['status', 'status'], ['progress', 'progress'], ['start', 'start_date'], ['end', 'end_date']],
  events: [['id', 'id'], ['title', 'title'], ['desc', 'description'], ['date', 'date'], ['time', 'time'], ['type', 'type'], ['location', 'location']],
  requests: [['id', 'id'], ['unitId', 'unit_id'], ['category', 'category'], ['priority', 'priority'], ['subject', 'subject'], ['body', 'body'], ['date', 'date'], ['status', 'status'], ['photo', 'photo'], ['internalNote', 'internal_note']],
  documents: [['id', 'id'], ['name', 'name'], ['category', 'category'], ['url', 'url'], ['note', 'note'], ['date', 'date']],
  votes: [['id', 'id'], ['title', 'title'], ['options', 'options'], ['deadline', 'deadline'], ['quorum', 'quorum'], ['closed', 'closed'], ['created', 'created']],
  contacts: [['id', 'id'], ['role', 'role'], ['name', 'name'], ['phone', 'phone'], ['note', 'note']],
};
function rowToJs(row, map) { const o = {}; map.forEach(([js, db]) => o[js] = row[db]); return o; }
function jsToRow(obj, map) { const o = {}; map.forEach(([js, db]) => o[db] = obj[js]); return o; }

/* ---------- load everything from Supabase ---------- */
async function fetchPublicBuildingName() {
  try { const { data } = await sb.rpc('public_building_info'); if (data && data[0]) Object.assign(DB.building, { name: data[0].name, address: data[0].address }); } catch (e) { }
}
async function loadRemoteData() {
  const [b, u, p, ex, nw, wk, ev, rq, rc, doc, vo, ba, ct, au] = await Promise.all([
    sb.from('building').select('*').eq('id', 1).single(),
    sb.from('units').select('*').order('num'),
    sb.from('payments').select('*'),
    sb.from('expenses').select('*').order('date', { ascending: false }),
    sb.from('news').select('*').order('date', { ascending: false }),
    sb.from('works').select('*'),
    sb.from('events').select('*').order('date'),
    sb.from('requests').select('*').order('date', { ascending: false }),
    sb.from('request_comments').select('*').order('date'),
    sb.from('documents').select('*').order('date', { ascending: false }),
    sb.from('votes').select('*').order('created', { ascending: false }),
    sb.from('ballots').select('*'),
    sb.from('contacts').select('*'),
    sb.from('audit').select('*').order('date', { ascending: false }).limit(300),
  ]);
  const firstError = [b, u, p, ex, nw, wk, ev, rq, rc, doc, vo, ba, ct, au].find(r => r.error);
  if (firstError) { console.warn('load failed', firstError.error); return false; }
  if (b.data) Object.assign(DB.building, rowToJs(b.data, TABLE_MAPS.building));
  DB.units = (u.data || []).map(r => rowToJs(r, TABLE_MAPS.units));
  DB.payments = (p.data || []).map(r => rowToJs(r, TABLE_MAPS.payments));
  DB.expenses = (ex.data || []).map(r => rowToJs(r, TABLE_MAPS.expenses));
  DB.news = (nw.data || []).map(r => rowToJs(r, TABLE_MAPS.news));
  DB.works = (wk.data || []).map(r => rowToJs(r, TABLE_MAPS.works));
  DB.events = (ev.data || []).map(r => rowToJs(r, TABLE_MAPS.events));
  const commentsByReq = {};
  (rc.data || []).forEach(c => { (commentsByReq[c.request_id] || (commentsByReq[c.request_id] = [])).push({ id: c.id, by: c.by, date: c.date, text: c.text, _synced: true }); });
  DB.requests = (rq.data || []).map(r => Object.assign(rowToJs(r, TABLE_MAPS.requests), { comments: commentsByReq[r.id] || [] }));
  DB.documents = (doc.data || []).map(r => rowToJs(r, TABLE_MAPS.documents));
  const ballotsByVote = {};
  (ba.data || []).forEach(row => { (ballotsByVote[row.vote_id] || (ballotsByVote[row.vote_id] = {}))[row.unit_id] = row.choice; });
  DB.votes = (vo.data || []).map(r => Object.assign(rowToJs(r, TABLE_MAPS.votes), { ballots: ballotsByVote[r.id] || {} }));
  DB.contacts = (ct.data || []).map(r => rowToJs(r, TABLE_MAPS.contacts));
  DB.audit = (au.data || []).map(r => ({ date: r.date, by: r.by, action: r.action, detail: r.detail, _synced: true }));
  DB_SNAPSHOT = JSON.parse(JSON.stringify(DB));
  return true;
}

/* ---------- save: diff current DB against the last-synced snapshot, push only what changed ---------- */
async function syncCollection(table, map, prevArr, curArr) {
  const prevIds = new Set((prevArr || []).map(x => x.id));
  const curIds = new Set(curArr.map(x => x.id));
  const toDelete = [...prevIds].filter(id => !curIds.has(id));
  const toUpsert = curArr.filter(obj => { const prev = (prevArr || []).find(p => p.id === obj.id); return !prev || JSON.stringify(jsToRow(obj, map)) !== JSON.stringify(jsToRow(prev, map)); });
  if (toDelete.length) { const { error } = await sb.from(table).delete().in('id', toDelete); if (error) console.warn(table, 'delete failed', error); }
  if (toUpsert.length) { const { error } = await sb.from(table).upsert(toUpsert.map(o => jsToRow(o, map))); if (error) console.warn(table, 'upsert failed', error); }
}
async function syncRequestComments(curRequests) {
  for (const r of curRequests) {
    const toInsert = (r.comments || []).filter(c => !c._synced);
    for (const c of toInsert) {
      const { error } = await sb.from('request_comments').insert({ request_id: r.id, by: c.by, date: c.date, text: c.text });
      if (!error) c._synced = true; else console.warn('comment insert failed', error);
    }
  }
}
async function syncBallots(curVotes, prevVotes) {
  for (const v of curVotes) {
    const prevV = (prevVotes || []).find(p => p.id === v.id);
    const prevBallots = (prevV && prevV.ballots) || {};
    const curBallots = v.ballots || {};
    const changed = Object.keys(curBallots).filter(unitId => curBallots[unitId] !== prevBallots[unitId]);
    if (changed.length) {
      const { error } = await sb.from('ballots').upsert(changed.map(unitId => ({ vote_id: v.id, unit_id: unitId, choice: curBallots[unitId] })), { onConflict: 'vote_id,unit_id' });
      if (error) console.warn('ballot upsert failed', error);
    }
  }
}
async function syncAudit() {
  const toInsert = DB.audit.filter(a => !a._synced);
  if (!toInsert.length) return;
  const { error } = await sb.from('audit').insert(toInsert.map(a => ({ date: a.date, by: a.by, action: a.action, detail: a.detail })));
  if (!error) toInsert.forEach(a => a._synced = true); else console.warn('audit insert failed', error);
}
async function syncBuilding() {
  const prev = DB_SNAPSHOT && DB_SNAPSHOT.building;
  if (prev && JSON.stringify(jsToRow(DB.building, TABLE_MAPS.building)) === JSON.stringify(jsToRow(prev, TABLE_MAPS.building))) return;
  const { error } = await sb.from('building').update(jsToRow(DB.building, TABLE_MAPS.building)).eq('id', 1);
  if (error) console.warn('building update failed', error);
}
async function saveData() {
  if (!DB_SNAPSHOT) return; // not logged in / not loaded yet — nothing to diff against
  try {
    const s = DB_SNAPSHOT;
    await Promise.all([
      syncCollection('units', TABLE_MAPS.units, s.units, DB.units),
      syncCollection('payments', TABLE_MAPS.payments, s.payments, DB.payments),
      syncCollection('expenses', TABLE_MAPS.expenses, s.expenses, DB.expenses),
      syncCollection('news', TABLE_MAPS.news, s.news, DB.news),
      syncCollection('works', TABLE_MAPS.works, s.works, DB.works),
      syncCollection('events', TABLE_MAPS.events, s.events, DB.events),
      syncCollection('requests', TABLE_MAPS.requests, s.requests, DB.requests),
      syncCollection('documents', TABLE_MAPS.documents, s.documents, DB.documents),
      syncCollection('votes', TABLE_MAPS.votes, s.votes, DB.votes),
      syncCollection('contacts', TABLE_MAPS.contacts, s.contacts, DB.contacts),
      syncRequestComments(DB.requests),
      syncBallots(DB.votes, s.votes),
      syncAudit(),
      syncBuilding(),
    ]);
    DB_SNAPSHOT = JSON.parse(JSON.stringify(DB));
  } catch (e) {
    console.warn('save failed', e);
    if (typeof toast === 'function') toast(t('sync_error'), 'err');
  }
}
function audit(action, detail) {
  const by = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.name : 'system';
  DB.audit.unshift({ date: new Date().toISOString(), by, action, detail: detail || '' });
  if (DB.audit.length > 300) DB.audit.length = 300;
}

/* ---------- realtime: any change from anyone re-pulls everything and re-renders ---------- */
let REALTIME_TIMER = null;
function subscribeRealtime() {
  const tables = ['building', 'units', 'payments', 'expenses', 'news', 'works', 'events', 'requests', 'request_comments', 'documents', 'votes', 'ballots', 'contacts'];
  const channel = sb.channel('ps13-live');
  tables.forEach(tbl => channel.on('postgres_changes', { event: '*', schema: 'public', table: tbl }, () => {
    clearTimeout(REALTIME_TIMER);
    REALTIME_TIMER = setTimeout(async () => { await loadRemoteData(); if (typeof render === 'function') render(); }, 500);
  }));
  channel.subscribe();
}

/* ---------- money & date formatting ---------- */
function fmtMoney(v, opts = {}) {
  const cur = DB.building.currency || 'EUR';
  const n = Number(v) || 0;
  const main = new Intl.NumberFormat(LANG === 'bg' ? 'bg-BG' : 'en-GB', { style: 'currency', currency: cur, minimumFractionDigits: opts.compact ? 0 : 2, maximumFractionDigits: opts.compact ? 0 : 2 }).format(n);
  if (opts.noDual || !DB.building.showDual) return main;
  const other = cur === 'EUR' ? n * BGN_PER_EUR : n / BGN_PER_EUR;
  const otherCur = cur === 'EUR' ? 'BGN' : 'EUR';
  const sub = new Intl.NumberFormat(LANG === 'bg' ? 'bg-BG' : 'en-GB', { style: 'currency', currency: otherCur, maximumFractionDigits: 0 }).format(other);
  return main + '<span class="dual">' + sub + '</span>';
}
function fmtDate(iso, style = 'short') {
  if (!iso) return '—';
  const d = new Date(iso.length === 7 ? iso + '-01T12:00:00' : iso + 'T12:00:00');
  if (isNaN(d)) return iso;
  if (iso.length === 7) return t('months_long')[d.getMonth()] + ' ' + d.getFullYear();
  const loc = LANG === 'bg' ? 'bg-BG' : 'en-GB';
  return style === 'long' ? d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtPeriod(p) { const [y, m] = p.split('-'); return t('months')[parseInt(m, 10) - 1] + ' ' + y; }

/* ---------- finance helpers ---------- */
function paidFor(unitId, period) { return DB.payments.filter(p => p.unitId === unitId && p.period === period).reduce((s, p) => s + p.amount, 0); }
function unitBalance(unitId, uptoPeriod) {
  // charged since the first payment/period we know of, or 12 months back — positive = credit, negative = debt
  const u = DB.units.find(x => x.id === unitId); if (!u) return 0;
  const start = (u.feeSince) || firstPeriodFor(unitId);
  let charged = 0; const cur = uptoPeriod || monthISO();
  let d = new Date(start + '-01T12:00:00');
  while (monthISO(d) <= cur) { charged += u.fee; d.setMonth(d.getMonth() + 1); }
  const paid = DB.payments.filter(p => p.unitId === unitId && p.period <= cur).reduce((s, p) => s + p.amount, 0);
  return +(paid - charged).toFixed(2);
}
function firstPeriodFor(unitId) {
  if (DB.building.feesSince) return DB.building.feesSince;
  const ps = DB.payments.map(p => p.period).sort();   // earliest period we have any record for
  return ps.length ? ps[0] : monthISO();
}
function buildingBalance() {
  const inc = DB.payments.reduce((s, p) => s + p.amount, 0);
  const exp = DB.expenses.reduce((s, e) => s + e.amount, 0);
  return { opening: DB.building.openingBalance || 0, income: inc, expenses: exp, balance: (DB.building.openingBalance || 0) + inc - exp };
}
function monthlySeries(n = 12) {
  const out = []; const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const per = monthISO(d);
    out.push({ period: per, label: t('months')[d.getMonth()], income: DB.payments.filter(p => p.period === per).reduce((s, p) => s + p.amount, 0), expenses: DB.expenses.filter(e => e.date && e.date.slice(0, 7) === per).reduce((s, e) => s + e.amount, 0) });
  }
  return out;
}
function unitLabel(u) { if (!u) return '—'; return t('t_' + u.type) + ' ' + u.num; }
function unitIcon(u) { return u.type === 'garage' ? 'car' : u.type === 'room' ? 'door' : 'home'; }
