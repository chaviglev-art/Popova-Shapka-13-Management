/* ============================================================
   Store — data model, persistence, migration, security helpers
   ============================================================ */
const STORE_KEY = 'popova13_data';      // same key as v1 → existing data is migrated in place
const SCHEMA_VERSION = 2;
const DEFAULT_ADMIN_PASSWORD = 'Popova13';   // used only on first run / migration; must be changed at first login
const BGN_PER_EUR = 1.95583;

/* ---------- tiny synchronous SHA-256 (no dependencies) ---------- */
function sha256(ascii) {
  function rightRotate(v, a) { return (v >>> a) | (v << (32 - a)); }
  const mathPow = Math.pow, maxWord = mathPow(2, 32), lengthProperty = 'length';
  let result = '', words = [], asciiBitLength = ascii[lengthProperty] * 8;
  let hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], primeCounter = k[lengthProperty];
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii[lengthProperty]; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return; // ASCII only (we pre-encode to UTF-8)
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength);
  for (let j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16), oldHash = hash;
    hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i]
        + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) {
    const b = (hash[i] >> (j * 8)) & 255;
    result += ((b < 16) ? 0 : '') + b.toString(16);
  }
  return result;
}
function hashPassword(pw, salt) {
  const s = salt || 'ps13';
  return 'v2$' + s + '$' + sha256(unescape(encodeURIComponent(s + ':' + pw)));
}
function verifyPassword(pw, stored) {
  if (!stored) return false;
  if (stored.startsWith('v2$')) { const salt = stored.split('$')[1]; return hashPassword(pw, salt) === stored; }
  return pw === stored; // legacy plaintext (migrated on first successful login)
}
function randomPassword(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = ''; const arr = new Uint32Array(len); crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}
function uid(prefix = 'x') { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayISO() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function monthISO(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

/* ---------- default (demo) dataset ---------- */
function defaultData() {
  const sizes = [55, 62, 48, 70, 80, 55, 62, 48, 70, 80, 55, 62, 48, 70, 80];
  const units = [];
  for (let i = 1; i <= 15; i++) units.push({ id: 'apt' + i, num: String(i), type: 'apartment', floor: Math.floor((i - 1) / 3) + 1, size: sizes[i - 1], owner: (LANG === 'bg' ? 'Собственик ' : 'Owner ') + i, tenant: '', phone: '', email: '', sharePhone: false, fee: 40, username: 'apt' + i, password: hashPassword('pass123'), mustChangePassword: true });
  units.push({ id: 'room1', num: 'R1', type: 'room', floor: 0, size: 25, owner: LANG === 'bg' ? 'Стая — наемател' : 'Room tenant', tenant: '', phone: '', email: '', sharePhone: false, fee: 25, username: 'room1', password: hashPassword('pass123'), mustChangePassword: true });
  for (let i = 1; i <= 7; i++) units.push({ id: 'gar' + i, num: 'G' + i, type: 'garage', floor: -1, size: 14, owner: (LANG === 'bg' ? 'Собственик ' : 'Owner ') + i, tenant: '', phone: '', email: '', sharePhone: false, fee: 15, username: 'gar' + i, password: hashPassword('pass123'), mustChangePassword: true });

  const now = new Date(); const payments = []; const expenses = [];
  // Seed 8 months of demo history so the charts have shape
  for (let m = 8; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1); const per = monthISO(d);
    units.forEach((u, idx) => { const lag = [1, 5, 8, 11, 18].includes(idx); if (!(lag && m < 3) && !(m === 0 && idx % 4 === 1)) payments.push({ id: uid('p'), unitId: u.id, amount: u.fee, period: per, date: per + '-' + String(3 + (idx % 20)).padStart(2, '0'), note: '', method: idx % 3 === 0 ? 'cash' : 'bank' }); });
    expenses.push({ id: uid('e'), date: per + '-10', amount: 120, category: 'cleaning', note: LANG === 'bg' ? 'Месечно почистване' : 'Monthly cleaning', vendor: '', url: '' });
    expenses.push({ id: uid('e'), date: per + '-15', amount: 85, category: 'electricity', note: LANG === 'bg' ? 'Ток общи части' : 'Common-area electricity', vendor: '', url: '' });
    if (m % 3 === 0) expenses.push({ id: uid('e'), date: per + '-20', amount: 240, category: 'elevator', note: LANG === 'bg' ? 'Сервиз асансьор' : 'Elevator service', vendor: '', url: '' });
    if (m === 4) expenses.push({ id: uid('e'), date: per + '-22', amount: 690, category: 'repair', note: LANG === 'bg' ? 'Ремонт на покрива' : 'Roof repair', vendor: '', url: '' });
  }
  const nextMeeting = new Date(now.getFullYear(), now.getMonth() + 1, 12);
  return {
    schemaVersion: SCHEMA_VERSION,
    building: { name: 'Попова шапка 13', address: 'ул. „Попова шапка“ 13, 1505 София', managerName: '', managerPhone: '', managerEmail: '', currency: 'EUR', showDual: true, defaultFee: 40, iban: '', bank: '', beneficiary: '', openingBalance: 1500, feesSince: '', banner: '' },
    adminUser: { username: 'admin', password: hashPassword(DEFAULT_ADMIN_PASSWORD), mustChangePassword: true, recoveryCode: null },
    units, payments, expenses,
    news: [
      { id: 'n1', title: LANG === 'bg' ? 'Добре дошли в новия портал' : 'Welcome to the new portal', body: LANG === 'bg' ? 'Тук ще намирате такси, новини, документи и можете да подавате сигнали. Приложението работи и на телефон.' : 'Here you will find fees, news, documents and can submit requests. The app also works on your phone.', date: todayISO(), pinned: true, banner: false },
    ],
    works: [
      { id: 'w1', title: LANG === 'bg' ? 'Ремонт на асансьора' : 'Elevator overhaul', desc: LANG === 'bg' ? 'Подмяна на кабела и ревизия на механизма.' : 'Cable replacement and mechanism inspection.', status: 'in_progress', progress: 60, start: monthISO() + '-01', end: monthISO(new Date(now.getFullYear(), now.getMonth() + 1, 1)) + '-15' },
      { id: 'w2', title: LANG === 'bg' ? 'Боядисване на стълбището' : 'Staircase repainting', desc: '', status: 'planned', progress: 0, start: '', end: '' },
    ],
    events: [
      { id: 'e1', title: LANG === 'bg' ? 'Общо събрание' : 'General meeting', desc: LANG === 'bg' ? 'Годишно събрание на собствениците' : 'Annual owners meeting', date: monthISO(nextMeeting) + '-12', time: '18:30', type: 'meeting', location: LANG === 'bg' ? 'Входа, партер' : 'Entrance hall' },
    ],
    requests: [
      { id: 's1', unitId: 'apt3', category: 'maintenance', priority: 'high', subject: LANG === 'bg' ? 'Теч в банята' : 'Leak in the bathroom', body: LANG === 'bg' ? 'От известно време има теч от тавана на банята.' : 'There has been a leak from the bathroom ceiling for a while.', date: todayISO(), status: 'in_progress', photo: '', internalNote: '', comments: [{ by: 'admin', date: todayISO(), text: LANG === 'bg' ? 'Изпратихме водопроводчик, ще се свърже с вас до 2 дни.' : 'A plumber has been dispatched and will contact you within 2 days.' }] },
    ],
    documents: [
      { id: 'd1', name: LANG === 'bg' ? 'Правилник за вътрешния ред' : 'House rules', category: 'rules', url: '', note: '', date: todayISO() },
      { id: 'd2', name: LANG === 'bg' ? 'Застраховка на сградата' : 'Building insurance', category: 'insurance', url: '', note: '', date: todayISO() },
    ],
    votes: [
      { id: 'v1', title: LANG === 'bg' ? 'Да инсталираме ли видеонаблюдение във входа?' : 'Should we install CCTV at the entrance?', options: [LANG === 'bg' ? 'Да' : 'Yes', LANG === 'bg' ? 'Не' : 'No', LANG === 'bg' ? 'Въздържал се' : 'Abstain'], ballots: {}, deadline: monthISO(nextMeeting) + '-30', quorum: 50, closed: false, created: todayISO() },
    ],
    contacts: [
      { id: 'c1', role: 'emergency', name: LANG === 'bg' ? 'Спешен телефон' : 'Emergency', phone: '112', note: '' },
    ],
    audit: [],
    readMarks: {},
  };
}

/* ---------- migration from v1 (the original app) ---------- */
const V1_TYPE = { 'Апартамент': 'apartment', 'Стая': 'room', 'Гараж': 'garage' };
const V1_STATUS = { 'Нов': 'new', 'В процес': 'in_progress', 'Решен': 'resolved' };
const V1_WORK = { 'Планирана': 'planned', 'В процес': 'in_progress', 'Завършена': 'done' };
const V1_CAT = { 'Поддръжка': 'maintenance', 'Шум': 'noise', 'Предложение': 'suggestion', 'Въпрос': 'question', 'Друго': 'other' };
const V1_EXP = { 'Ремонт': 'repair', 'Почистване': 'cleaning', 'Асансьор': 'elevator', 'Ел. Консумация': 'electricity', 'Водоснабдяване': 'water', 'Застраховка': 'insurance', 'Административни': 'admin', 'Друго': 'other' };
const V1_DOC = { 'Правилник': 'rules', 'Застраховка': 'insurance', 'Договор': 'contract', 'Протокол': 'minutes', 'Друго': 'other' };

function migrateV1(d) {
  const fresh = defaultData();
  const out = Object.assign({}, fresh, {
    units: (d.units || []).map(u => ({ id: u.id, num: u.num, type: V1_TYPE[u.type] || 'apartment', floor: u.floor, size: u.size, owner: u.owner || '', tenant: u.tenant || '', phone: u.phone || '', email: '', sharePhone: false, fee: u.fee || 0, username: u.username, password: u.password && u.password.startsWith('v2$') ? u.password : hashPassword(u.password || 'pass123'), mustChangePassword: false })),
    payments: (d.payments || []).map(p => Object.assign({ method: 'bank' }, p)),
    expenses: (d.expenses || []).map(e => ({ id: e.id, date: e.date, amount: e.amount, category: V1_EXP[e.category] || 'other', note: e.note || '', vendor: '', url: '' })),
    news: (d.news || []).map(n => ({ id: n.id, title: n.title, body: n.body, date: n.date, pinned: !!n.pinned, banner: false })),
    works: (d.activities || []).map(a => ({ id: a.id, title: a.title, desc: a.desc || '', status: V1_WORK[a.status] || 'planned', progress: a.progress || 0, start: a.start || '', end: a.end || '' })),
    events: (d.events || []).map(e => ({ id: e.id, title: e.title, desc: e.desc || '', date: e.date, time: e.time && e.time !== '—' ? e.time : '', type: 'other', location: '' })),
    requests: (d.submissions || []).map(s => ({ id: s.id, unitId: s.unitId, category: V1_CAT[s.category] || 'other', priority: 'normal', subject: s.subject, body: s.body, date: s.date, status: V1_STATUS[s.status] || 'new', photo: '', internalNote: '', comments: s.reply ? [{ by: 'admin', date: s.date, text: s.reply }] : [] })),
    documents: (d.documents || []).map(x => ({ id: x.id, name: x.name, category: V1_DOC[x.category] || 'other', url: x.url === '#' ? '' : (x.url || ''), note: x.note || '', date: x.date })),
    votes: (d.votes || []).map(v => {
      const ballots = {}; Object.keys(v.votes || {}).forEach(k => { if (!v.options.includes(k)) ballots[k] = v.votes[k]; });
      return { id: v.id, title: v.title, options: v.options, ballots, deadline: v.deadline, quorum: 50, closed: false, created: v.deadline };
    }),
    contacts: fresh.contacts,
    audit: [{ date: new Date().toISOString(), by: 'system', action: 'migrated_v1' }],
  });
  out.building.currency = 'BGN'; out.building.showDual = true; // legacy amounts were entered in leva
  out.building.openingBalance = d.bankBalance || 0;
  out.building.banner = d.announcement || '';
  // Admin password is RESET on migration (owner lost it) and must be changed at first login
  out.adminUser = { username: (d.adminUser && d.adminUser.username) || 'admin', password: hashPassword(DEFAULT_ADMIN_PASSWORD), mustChangePassword: true, recoveryCode: null };
  out.migratedFromV1 = true;
  return out;
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (!d.schemaVersion) return migrateV1(d);
      // forward-compatible defaults
      const fresh = defaultData();
      ['contacts', 'works', 'requests', 'audit'].forEach(k => { if (!d[k]) d[k] = []; });
      d.building = Object.assign({}, fresh.building, d.building || {});
      d.readMarks = d.readMarks || {};
      return d;
    }
  } catch (e) { console.warn('load failed', e); }
  return defaultData();
}
let DB = loadData();
function saveData() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) { console.warn('save failed', e); } }
function audit(action, detail) {
  DB.audit.unshift({ date: new Date().toISOString(), by: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.username : 'system', action, detail: detail || '' });
  if (DB.audit.length > 300) DB.audit.length = 300;
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
