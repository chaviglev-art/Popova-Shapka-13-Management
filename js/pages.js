/* ============================================================
   Pages — every screen of the portal
   ============================================================ */
const PAGES = {};
const ST_CLS = { new: 'b-info', in_progress: 'b-warn', resolved: 'b-good', closed: 'b-neutral', planned: 'b-neutral', done: 'b-good' };
const EXP_CATS = ['repair', 'cleaning', 'elevator', 'electricity', 'water', 'insurance', 'admin', 'fund', 'other'];
const EXP_COLORS = { repair: 'var(--s1)', cleaning: 'var(--s2)', elevator: 'var(--s3)', electricity: 'var(--s4)', water: 'var(--s5)', insurance: 'var(--s6)', admin: 'var(--text-3)', fund: 'var(--axis)', other: 'var(--grid)' };
const REQ_CATS = ['maintenance', 'cleaning', 'noise', 'security', 'suggestion', 'question', 'other'];
const DOC_CATS = ['rules', 'insurance', 'contract', 'minutes', 'report', 'other'];
const CT_ROLES = ['manager', 'elevator', 'plumber', 'electrician', 'cleaning', 'emergency', 'other'];
const EV_TYPES = ['meeting', 'inspection', 'maintenance', 'social', 'other'];
const AFTER = []; function afterRender() { while (AFTER.length) AFTER.shift()(); }
const head = (title, sub, actions = '') => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row wrap">${actions}</div></div>`;
const empty = (ic, txt) => `<div class="empty">${icon(ic)}<div>${txt || t('empty_list')}</div></div>`;
const kpi = (ic, cls, label, value, sub = '', accent = false) => `<div class="card kpi ${accent ? 'accent' : ''}"><div class="ic ${cls}">${icon(ic)}</div><div style="min-width:0"><div class="l">${label}</div><div class="v">${value}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div></div>`;
const bannerHtml = () => DB.building.banner ? `<div class="banner">${icon('alert')}<div><b>${t('important')}:</b> ${esc(DB.building.banner)}</div></div>` : '';
const selectOpts = (arr, prefix, cur) => arr.map(k => `<option value="${k}" ${k === cur ? 'selected' : ''}>${t(prefix + k)}</option>`).join('');
function greeting() { const h = new Date().getHours(); return t(h < 12 ? 'good_morning' : h < 18 ? 'good_afternoon' : 'good_evening'); }
const floorLabel = f => f == -1 ? t('garages') : f == 0 ? t('rooms') + ' / 0' : t('floor') + ' ' + f;
const unitAccent = u => u.type === 'garage' ? 'violet' : u.type === 'room' ? 'amber' : 'blue';
// "1" < "2" < ... < "15" instead of the string-sort order Postgres gives us ("1","10","11",...,"2",...);
// also handles a letter prefix (G1, R1) by comparing that first, then the numeric part.
function naturalUnitCompare(a, b) {
  const pa = String(a).match(/^(\D*)(\d+)/) || [, String(a), '0'];
  const pb = String(b).match(/^(\D*)(\d+)/) || [, String(b), '0'];
  return pa[1] !== pb[1] ? pa[1].localeCompare(pb[1]) : parseInt(pa[2], 10) - parseInt(pb[2], 10);
}
function statusBadge(st, kind = 'req') { const key = (kind === 'work' ? 'w_' : 'st_') + st; return `<span class="badge ${ST_CLS[st] || 'b-neutral'}">${t(key)}</span>`; }
function payStatus(u, period) { const p = paidFor(u.id, period); return p >= u.fee ? 'paid' : p > 0 ? 'partial' : 'unpaid'; }
function payBadge(s) { return `<span class="badge ${s === 'paid' ? 'b-good' : s === 'partial' ? 'b-warn' : 'b-bad'}">${icon(s === 'paid' ? 'check' : s === 'partial' ? 'clock' : 'alert')}${t(s)}</span>`; }

/* ================= HOME ================= */
PAGES.home = () => isAdmin() ? homeAdmin() : homeResident();
function homeAdmin() {
  const per = monthISO(); const totalFee = DB.units.reduce((s, u) => s + u.fee, 0);
  const collected = DB.payments.filter(p => p.period === per).reduce((s, p) => s + p.amount, 0);
  const rate = totalFee ? Math.min(100, collected / totalFee * 100) : 0; const bb = buildingBalance();
  const openReq = DB.requests.filter(r => r.status === 'new' || r.status === 'in_progress').length;
  const debtors = DB.units.map(u => ({ u, bal: unitBalance(u.id) })).filter(x => x.bal < 0).sort((a, b) => a.bal - b.bal);
  AFTER.push(() => Charts.bars($('#chartIE'), monthlySeries(12), [{ key: 'income', label: t('income'), color: 'var(--s1)' }, { key: 'expenses', label: t('expenses'), color: 'var(--s2)' }]));
  return `${head(`${greeting()}, ${esc(currentUser.name)}`, t('home_admin_sub'), `<button class="btn btn-primary" onclick="openPaymentModal()">${icon('plus')}${t('qa_record_payment')}</button>`)}${bannerHtml()}
  <div class="kpis">
    ${kpi('wallet', 'blue', t('kpi_balance'), fmtMoney(bb.balance), t('opening_balance') + ' ' + fmtMoneyPlain(bb.opening), true)}
    <div class="card kpi"><div>${Charts.ring(rate, 64, rate >= 90 ? 'var(--good)' : rate >= 60 ? 'var(--warn)' : 'var(--bad)')}</div><div><div class="l">${t('kpi_collection')}</div><div class="v">${fmtMoney(collected, { compact: true, noDual: true })}</div><div class="s">${t('of')} ${fmtMoneyPlain(totalFee)} · ${fmtPeriod(per)}</div></div></div>
    ${kpi('inbox', openReq ? 'amber' : 'green', t('kpi_open_requests'), openReq, DB.requests.filter(r => r.status === 'new').length + ' ' + t('new_label').toLowerCase())}
    ${kpi('vote', 'violet', t('kpi_active_votes'), DB.votes.filter(v => !v.closed && v.deadline >= todayISO()).length, DB.units.length + ' ' + t('units'))}
  </div>
  <div class="two-col">
    <div class="stack">
      <div class="card"><div class="card-head"><h3>${t('income_vs_expenses')}</h3></div><div class="card-body"><div id="chartIE"></div></div></div>
      <div class="card"><div class="card-head"><h3>${t('debtors')}</h3><span class="badge ${debtors.length ? 'b-bad' : 'b-good'} right">${debtors.length}</span></div>
        ${debtors.length ? `<div class="list">${debtors.slice(0, 6).map(x => `<div class="list-item clickable" onclick="openUnitDetail('${x.u.id}')"><div class="ic red" style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center">${icon(unitIcon(x.u))}</div><div class="grow"><b>${unitLabel(x.u)}</b><div class="small muted">${esc(x.u.owner)}</div></div><div class="tabular" style="color:var(--bad);font-weight:700">${fmtMoney(x.bal, { noDual: true })}</div></div>`).join('')}${debtors.length > 6 ? `<div class="list-item"><a href="#" onclick="ui.finTab='matrix';go('finances');return false" class="small">${t('see_all')} →</a></div>` : ''}</div>` : `<div class="empty">${t('no_debtors')}</div>`}</div>
    </div>
    <div class="stack">
      <div class="card"><div class="card-head"><h3>${t('quick_actions')}</h3></div><div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn btn-secondary" onclick="openExpenseModal()">${icon('receipt')}${t('qa_add_expense')}</button><button class="btn btn-secondary" onclick="openNewsModal()">${icon('news')}${t('qa_post_news')}</button>
        <button class="btn btn-secondary" onclick="openVoteModal()">${icon('vote')}${t('qa_new_vote')}</button><button class="btn btn-secondary" onclick="openEventModal()">${icon('calendar')}${t('add_event')}</button></div></div>
      ${widgetRequests()}${widgetEvents()}${widgetWorks()}
    </div>
  </div>`;
}
function homeResident() {
  const u = myUnit(); const per = monthISO(); const st = payStatus(u, per); const bal = unitBalance(u.id); const bb = buildingBalance();
  const ahead = (() => { let n = 0; let d = new Date(); d.setMonth(d.getMonth() + 1); while (paidFor(u.id, monthISO(d)) >= u.fee && n < 24) { n++; d.setMonth(d.getMonth() + 1); } return n; })();
  const need = activeVotesFor();
  return `${head(`${greeting()}, ${esc(currentUser.name)}`, t('home_res_sub'), `<button class="btn btn-primary" onclick="openRequestModal()">${icon('plus')}${t('qa_new_request')}</button>`)}${bannerHtml()}
  <div class="kpis">
    ${kpi('home', 'blue', t('kpi_my_fee'), fmtMoney(u.fee), unitLabel(u) + ' · ' + u.size + ' m²', true)}
    <div class="card kpi"><div class="ic ${st === 'paid' ? 'green' : st === 'partial' ? 'amber' : 'red'}">${icon(st === 'paid' ? 'check' : 'alert')}</div><div><div class="l">${t('kpi_my_status')}</div><div class="v" style="font-size:1.1rem">${payBadge(st)}</div><div class="s">${fmtPeriod(per)}${ahead ? ' · +' + ahead + ' ' + t('months_ahead') : ''}</div></div></div>
    ${kpi('trend', bal >= 0 ? 'green' : 'red', t('kpi_my_balance'), `<span style="color:${bal < 0 ? 'var(--bad)' : 'var(--good)'}">${fmtMoney(bal, { noDual: true })}</span>`, bal < 0 ? t('overdue') : bal > 0 ? t('in_credit') : t('up_to_date'))}
    ${kpi('wallet', 'violet', t('kpi_balance'), fmtMoney(bb.balance, { noDual: true }), t('collection_rate') + ' ' + Math.round(DB.units.filter(x => payStatus(x, per) === 'paid').length / DB.units.length * 100) + '%')}
  </div>
  <div class="two-col">
    <div class="stack">
      ${need.length ? `<div class="card" style="border-color:var(--brass)"><div class="card-head"><h3>${icon('vote')} ${t('needs_your_vote')}</h3></div><div class="list">${need.map(v => `<div class="list-item clickable" onclick="go('votes')"><div class="grow"><b>${esc(v.title)}</b><div class="small muted">${t('deadline')}: ${fmtDate(v.deadline)}</div></div>${icon('chevron_r')}</div>`).join('')}</div></div>` : ''}
      <div class="card"><div class="card-head"><h3>${t('tab_statement')} · ${new Date().getFullYear()}</h3><button class="btn btn-ghost btn-sm right" onclick="ui.finTab='statement';go('finances')">${t('see_all')}</button></div><div class="card-body">${Charts.strip(u.id, new Date().getFullYear())}<div class="legend" style="margin-top:12px"><span><i style="background:var(--good)"></i>${t('paid')}</span><span><i style="background:var(--warn)"></i>${t('partial')}</span><span><i style="background:var(--bad)"></i>${t('unpaid')}</span><span><i style="background:var(--border-2)"></i>${t('future')}</span></div></div></div>
      ${bankBox()}
      ${widgetNews()}
    </div>
    <div class="stack">${widgetEvents()}${widgetWorks()}${widgetMyRequests()}</div>
  </div>`;
}
function bankBox() {
  const b = DB.building; if (!b.iban) return '';
  return `<div class="bank-box"><div class="row" style="margin-bottom:10px">${icon('wallet')}<b>${t('bank_details')}</b></div><div class="grid-2" style="gap:10px"><div><div class="l">${t('iban')}</div><div class="v">${esc(b.iban)}</div></div><div><div class="l">${t('bank_name')}</div><div class="v">${esc(b.bank || '—')}</div></div><div><div class="l">${t('beneficiary')}</div><div class="v">${esc(b.beneficiary || '—')}</div></div><div><div class="l">${t('note')}</div><div class="v small">${t('reason_hint')}</div></div></div><div style="margin-top:12px"><button class="btn btn-sm" onclick="copyText('${esc(b.iban)}')">${icon('copy')}${t('copy')} IBAN</button></div></div>`;
}
function widgetNews() { const n = DB.news.slice().sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)).slice(0, 3); return `<div class="card"><div class="card-head"><h3>${t('latest_news')}</h3><button class="btn btn-ghost btn-sm right" onclick="go('news')">${t('see_all')}</button></div>${n.length ? `<div class="list">${n.map(x => `<div class="list-item clickable" onclick="go('news')"><div class="grow"><div class="tiny subtle">${fmtDate(x.date)}${x.pinned ? ' · 📌' : ''}</div><b>${esc(x.title)}</b><div class="small muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(x.body)}</div></div></div>`).join('')}</div>` : empty('news')}</div>`; }
function widgetEvents() { const ev = DB.events.filter(e => e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3); return `<div class="card"><div class="card-head"><h3>${t('upcoming_events')}</h3><button class="btn btn-ghost btn-sm right" onclick="go('calendar')">${t('see_all')}</button></div>${ev.length ? `<div class="list">${ev.map(e => `<div class="list-item"><div class="date-badge"><b>${e.date.slice(8)}</b><small>${t('months')[parseInt(e.date.slice(5, 7)) - 1]}</small></div><div class="grow"><b>${esc(e.title)}</b><div class="small muted">${e.time || ''} ${e.location ? '· ' + esc(e.location) : ''}</div></div></div>`).join('')}</div>` : `<div class="empty">${t('no_events')}</div>`}</div>`; }
function widgetWorks() { const w = DB.works.filter(x => x.status !== 'done').slice(0, 3); if (!w.length) return ''; return `<div class="card"><div class="card-head"><h3>${t('active_works')}</h3><button class="btn btn-ghost btn-sm right" onclick="go('news')">${t('see_all')}</button></div><div class="list">${w.map(x => `<div class="list-item"><div class="grow"><div class="row"><b>${esc(x.title)}</b>${statusBadge(x.status, 'work')}</div><div class="progress" style="margin-top:8px"><i style="width:${x.progress}%"></i></div></div><b class="small">${x.progress}%</b></div>`).join('')}</div></div>`; }
function widgetRequests() { const r = DB.requests.filter(x => x.status === 'new' || x.status === 'in_progress').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4); return `<div class="card"><div class="card-head"><h3>${t('kpi_open_requests')}</h3><button class="btn btn-ghost btn-sm right" onclick="go('requests')">${t('see_all')}</button></div>${r.length ? `<div class="list">${r.map(x => requestRow(x)).join('')}</div>` : empty('inbox')}</div>`; }
function widgetMyRequests() { const r = DB.requests.filter(x => x.unitId === currentUser.unitId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3); return `<div class="card"><div class="card-head"><h3>${t('my_requests')}</h3><button class="btn btn-ghost btn-sm right" onclick="go('requests')">${t('see_all')}</button></div>${r.length ? `<div class="list">${r.map(x => requestRow(x)).join('')}</div>` : empty('inbox')}</div>`; }

/* ================= FINANCES ================= */
PAGES.finances = () => {
  const tabs = isAdmin() ? ['overview', 'matrix', 'expenses', 'history'] : ['overview', 'statement', 'matrix', 'expenses'];
  if (!tabs.includes(ui.finTab)) ui.finTab = tabs[0];
  const tabBar = `<div class="tabs">${tabs.map(x => `<button class="tab ${ui.finTab === x ? 'active' : ''}" onclick="ui.finTab='${x}';render()">${t('tab_' + x)}</button>`).join('')}</div>`;
  const actions = isAdmin() ? `<button class="btn btn-secondary" onclick="openExpenseModal()">${icon('receipt')}${t('add_expense')}</button><button class="btn btn-primary" onclick="openPaymentModal()">${icon('plus')}${t('record_payment')}</button>` : `<button class="btn btn-secondary" onclick="window.print()">${icon('print')}${t('print')}</button>`;
  return head(t('fin_title'), isAdmin() ? t('fin_sub_admin') : t('fin_sub_res'), actions) + tabBar + ({ overview: finOverview, matrix: finMatrix, statement: finStatement, expenses: finExpenses, history: finHistory })[ui.finTab]();
};
function finOverview() {
  const bb = buildingBalance(); const per = monthISO(); const totalFee = DB.units.reduce((s, u) => s + u.fee, 0);
  const collected = DB.payments.filter(p => p.period === per).reduce((s, p) => s + p.amount, 0);
  const cats = EXP_CATS.map(c => ({ label: t('exp_' + c), value: DB.expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0), color: EXP_COLORS[c] })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  const top = cats.slice(0, 5); const rest = cats.slice(5).reduce((s, x) => s + x.value, 0); if (rest) top.push({ label: t('exp_other'), value: rest, color: 'var(--grid)' });
  AFTER.push(() => { Charts.bars($('#chartIE2'), monthlySeries(12), [{ key: 'income', label: t('income'), color: 'var(--s1)' }, { key: 'expenses', label: t('expenses'), color: 'var(--s2)' }]); if (top.length) Charts.donut($('#chartCat'), top, { sub: t('expenses') }); });
  const paidUnits = DB.units.filter(u => payStatus(u, per) === 'paid').length;
  return `<div class="kpis">
    ${kpi('wallet', 'blue', t('current_balance'), fmtMoney(bb.balance), '', true)}
    ${kpi('trend', 'green', t('total_collected'), fmtMoney(bb.income, { noDual: true }), t('opening_balance') + ': ' + fmtMoneyPlain(bb.opening))}
    ${kpi('receipt', 'amber', t('total_expenses'), fmtMoney(bb.expenses, { noDual: true }), DB.expenses.length + ' ' + t('expenses').toLowerCase())}
    ${kpi('check', 'violet', t('collection_rate') + ' · ' + fmtPeriod(per), Math.round(paidUnits / DB.units.length * 100) + '%', fmtMoneyPlain(collected) + ' ' + t('of') + ' ' + fmtMoneyPlain(totalFee))}
  </div>
  <div class="two-col">
    <div class="card"><div class="card-head"><h3>${t('income_vs_expenses')}</h3></div><div class="card-body"><div id="chartIE2"></div></div></div>
    <div class="card"><div class="card-head"><h3>${t('expenses_by_category')}</h3></div><div class="card-body">${top.length ? '<div id="chartCat"></div>' : empty('receipt')}</div></div>
  </div>
  <div class="card" style="margin-top:18px"><div class="card-head"><h3>${t('status')} · ${fmtPeriod(per)}</h3></div><div class="table-wrap"><table><thead><tr><th>${t('unit')}</th><th>${t('owner')}</th><th class="num">${t('fee')}</th><th class="num">${t('paid')}</th><th class="num">${t('balance')}</th><th>${t('status')}</th></tr></thead><tbody>
    ${DB.units.map(u => { const p = paidFor(u.id, per); const b = unitBalance(u.id); return `<tr class="${u.id === currentUser.unitId ? 'me' : ''}" ${isAdmin() ? `style="cursor:pointer" onclick="openUnitDetail('${u.id}')"` : ''}><td><b>${unitLabel(u)}</b></td><td>${esc(u.owner)}</td><td class="num">${fmtMoney(u.fee, { noDual: true })}</td><td class="num">${fmtMoney(p, { noDual: true })}</td><td class="num" style="color:${b < 0 ? 'var(--bad)' : 'var(--good)'};font-weight:600">${fmtMoney(b, { noDual: true })}</td><td>${payBadge(payStatus(u, per))}</td></tr>`; }).join('')}
  </tbody></table></div></div>`;
}
function finMatrix() {
  const y = ui.matrixYear; const cur = monthISO(); const colT = new Array(12).fill(0); let grand = 0;
  const rows = DB.units.map(u => { let rt = 0; const cells = []; for (let m = 1; m <= 12; m++) { const per = y + '-' + String(m).padStart(2, '0'); const p = paidFor(u.id, per); rt += p; colT[m - 1] += p; const cls = per > cur ? 'future' : p >= u.fee ? 'paid' : p > 0 ? 'partial' : 'unpaid'; cells.push(`<td><span class="mcell ${cls} ${isAdmin() ? '' : 'ro'}" ${isAdmin() && cls !== 'future' ? `onclick="openPaymentModal('${u.id}','${per}')"` : ''} title="${fmtPeriod(per)}: ${fmtMoneyPlain(p)} / ${fmtMoneyPlain(u.fee)}">${cls === 'future' ? '·' : cls === 'unpaid' ? '✕' : fmtShort(p)}</span></td>`); } grand += rt; return `<tr class="${u.id === currentUser.unitId ? 'me' : ''}"><td><b>${unitLabel(u)}</b><div class="tiny subtle">${esc(u.owner)}</div></td>${cells.join('')}<td class="num"><b>${fmtShort(rt)}</b></td></tr>`; }).join('');
  return `<div class="row wrap" style="margin-bottom:14px"><div class="segmented"><button onclick="ui.matrixYear--;render()">${icon('chevron_l')}</button><button class="active">${y}</button><button onclick="ui.matrixYear++;render()">${icon('chevron_r')}</button></div><div class="legend right"><span><i style="background:var(--good)"></i>${t('paid')}</span><span><i style="background:var(--warn)"></i>${t('partial')}</span><span><i style="background:var(--bad)"></i>${t('unpaid')}</span><span><i style="background:var(--border-2)"></i>${t('future')}</span></div></div>
  <div class="card"><div class="table-wrap"><table class="matrix"><thead><tr><th>${t('unit')}</th>${t('months').map((m, i) => `<th style="${y + '-' + String(i + 1).padStart(2, '0') === cur ? 'color:var(--primary)' : ''}">${m}</th>`).join('')}<th class="num">${t('total')}</th></tr></thead><tbody>${rows}<tr style="background:var(--surface-2)"><td><b>${t('total_collected')}</b></td>${colT.map(v => `<td class="tabular"><b>${v ? fmtShort(v) : '—'}</b></td>`).join('')}<td class="num"><b>${fmtShort(grand)}</b></td></tr></tbody></table></div></div>
  ${isAdmin() ? `<p class="help">${icon('info')} ${t('matrix_hint')}</p>` : ''}`;
}
function finStatement() {
  const u = myUnit(); const rows = []; let bal = 0; const start = firstPeriodFor(u.id); let d = new Date(start + '-01T12:00:00'); const cur = monthISO();
  while (monthISO(d) <= cur) { const per = monthISO(d); const p = paidFor(u.id, per); bal += p - u.fee; rows.push({ per, fee: u.fee, paid: p, bal }); d.setMonth(d.getMonth() + 1); }
  rows.reverse();
  return `<div class="two-col"><div class="card"><div class="card-head"><h3>${t('statement_of')} — ${unitLabel(u)}</h3><button class="btn btn-secondary btn-sm right no-print" onclick="window.print()">${icon('print')}${t('download_statement')}</button></div><div class="table-wrap"><table><thead><tr><th>${t('month')}</th><th class="num">${t('charged')}</th><th class="num">${t('paid')}</th><th class="num">${t('running_balance')}</th><th>${t('status')}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${fmtPeriod(r.per)}</td><td class="num">${fmtMoney(r.fee, { noDual: true })}</td><td class="num">${fmtMoney(r.paid, { noDual: true })}</td><td class="num" style="font-weight:600;color:${r.bal < 0 ? 'var(--bad)' : 'var(--good)'}">${fmtMoney(r.bal, { noDual: true })}</td><td>${payBadge(r.paid >= r.fee ? 'paid' : r.paid > 0 ? 'partial' : 'unpaid')}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="stack">${bankBox() || `<div class="card card-body muted small">${t('bank_details')}: —</div>`}<div class="card"><div class="card-head"><h3>${t('payment_history')}</h3></div><div class="list">${DB.payments.filter(p => p.unitId === u.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map(p => `<div class="list-item"><div class="grow"><b>${fmtPeriod(p.period)}</b><div class="tiny subtle">${fmtDate(p.date)} ${p.note ? '· ' + esc(p.note) : ''}</div></div><b style="color:var(--good)">${fmtMoney(p.amount, { noDual: true })}</b></div>`).join('') || empty('wallet')}</div></div></div></div>`;
}
function finExpenses() {
  const list = DB.expenses.slice().sort((a, b) => b.date.localeCompare(a.date));
  const byYear = {}; list.forEach(e => { const y = e.date.slice(0, 4); byYear[y] = (byYear[y] || 0) + e.amount; });
  return `<div class="card"><div class="card-head"><h3>${t('expenses')}</h3><div class="right row small muted">${Object.keys(byYear).sort().reverse().slice(0, 2).map(y => `<span>${y}: <b>${fmtMoneyPlain(byYear[y])}</b></span>`).join('')}</div></div>
  ${list.length ? `<div class="table-wrap"><table><thead><tr><th>${t('date')}</th><th>${t('category')}</th><th>${t('description')}</th><th class="num">${t('amount')}</th><th></th></tr></thead><tbody>${list.map(e => `<tr><td class="tabular">${fmtDate(e.date)}</td><td><span class="badge b-neutral"><i class="dot" style="background:${EXP_COLORS[e.category]}"></i>${t('exp_' + e.category)}</span></td><td>${esc(e.note)}${e.vendor ? `<div class="tiny subtle">${esc(e.vendor)}</div>` : ''}${e.url ? ` <a href="${esc(e.url)}" target="_blank" rel="noopener" class="small">↗</a>` : ''}</td><td class="num" style="font-weight:600">${fmtMoney(e.amount, { noDual: true })}</td><td style="text-align:right;white-space:nowrap">${isAdmin() ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="openExpenseModal('${e.id}')">${icon('edit')}</button><button class="btn btn-ghost btn-sm btn-icon" onclick="confirmDialog('',()=>{DB.expenses=DB.expenses.filter(x=>x.id!=='${e.id}');audit('expense_deleted');saveData();render()})">${icon('trash')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : empty('receipt')}</div>`;
}
function finHistory() {
  const list = DB.payments.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 200);
  return `<div class="card"><div class="card-head"><h3>${t('tab_history')}</h3><button class="btn btn-secondary btn-sm right" onclick="exportCSV()">${icon('download')}${t('export_csv')}</button></div><div class="table-wrap"><table><thead><tr><th>${t('date')}</th><th>${t('unit')}</th><th>${t('owner')}</th><th>${t('period')}</th><th class="num">${t('amount')}</th><th>${t('note')}</th><th></th></tr></thead><tbody>${list.map(p => { const u = DB.units.find(x => x.id === p.unitId); return `<tr><td class="tabular">${fmtDate(p.date)}</td><td><b>${unitLabel(u)}</b></td><td>${esc(u ? u.owner : '')}</td><td>${fmtPeriod(p.period)}</td><td class="num" style="color:var(--good);font-weight:600">${fmtMoney(p.amount, { noDual: true })}</td><td class="small muted">${esc(p.note)}</td><td style="text-align:right"><button class="btn btn-ghost btn-sm btn-icon" onclick="confirmDialog('',()=>{DB.payments=DB.payments.filter(x=>x.id!=='${p.id}');audit('payment_deleted');saveData();render()})">${icon('trash')}</button></td></tr>`; }).join('') || `<tr><td colspan="7">${empty('wallet')}</td></tr>`}</tbody></table></div></div>`;
}
function exportCSV() {
  const rows = [['date', 'unit', 'owner', 'period', 'amount', 'note']].concat(DB.payments.map(p => { const u = DB.units.find(x => x.id === p.unitId); return [p.date, u ? unitLabel(u) : '', u ? u.owner : '', p.period, p.amount, p.note || '']; }));
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  downloadFile('payments_' + todayISO() + '.csv', '﻿' + csv, 'text/csv');
}
function downloadFile(name, content, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); }

function openPaymentModal(unitId, period) {
  const per = period || monthISO(); const uid0 = unitId || DB.units[0].id;
  const existing = unitId ? DB.payments.filter(p => p.unitId === unitId && p.period === per) : [];
  openModal({ title: t('record_payment'), body: `
    <div class="grid-2"><div class="field"><label>${t('unit')}</label><select class="select" id="pmUnit" onchange="$('#pmAmount').value=DB.units.find(u=>u.id===this.value).fee">${DB.units.map(u => `<option value="${u.id}" ${u.id === uid0 ? 'selected' : ''}>${unitLabel(u)} — ${esc(u.owner)}</option>`).join('')}</select></div>
    <div class="field"><label>${t('period')}</label><input class="input" type="month" id="pmPeriod" value="${per}"></div></div>
    <div class="grid-2"><div class="field"><label>${t('amount')}</label><input class="input" type="number" step="0.01" min="0" id="pmAmount" value="${DB.units.find(u => u.id === uid0).fee}"></div><div class="field"><label>${t('date')}</label><input class="input" type="date" id="pmDate" value="${todayISO()}"></div></div>
    <div class="field"><label>${t('note')} <span class="subtle">(${t('optional')})</span></label><input class="input" id="pmNote"></div>
    ${existing.length ? `<div class="label">${t('payments_for')} ${fmtPeriod(per)}</div><div class="list card" style="box-shadow:none">${existing.map(p => `<div class="list-item"><b style="color:var(--good)">${fmtMoney(p.amount, { noDual: true })}</b><span class="small muted grow">${fmtDate(p.date)} ${esc(p.note)}</span><button class="btn btn-ghost btn-sm btn-icon" onclick="DB.payments=DB.payments.filter(x=>x.id!=='${p.id}');audit('payment_deleted');saveData();closeModal();render()">${icon('trash')}</button></div>`).join('')}</div>` : (unitId ? `<p class="help">${t('no_payments')}</p>` : '')}`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="pmSave">${icon('check')}${t('save')}</button>`,
    onOpen: ov => $('#pmSave', ov).onclick = () => { const amt = parseFloat($('#pmAmount').value); if (!amt || !$('#pmPeriod').value || !$('#pmDate').value) return toast(t('required'), 'err'); DB.payments.push({ id: uid('p'), unitId: $('#pmUnit').value, amount: amt, period: $('#pmPeriod').value, date: $('#pmDate').value, note: $('#pmNote').value.trim(), method: 'bank' }); audit('payment_recorded', $('#pmUnit').value + ' ' + $('#pmPeriod').value + ' ' + amt); saveData(); closeModal(); toast(t('payment_recorded')); render(); } });
}
function openExpenseModal(id) {
  const e = id ? DB.expenses.find(x => x.id === id) : { date: todayISO(), amount: '', category: 'repair', note: '', vendor: '', url: '' };
  openModal({ title: t('add_expense'), body: `<div class="grid-2"><div class="field"><label>${t('amount')}</label><input class="input" type="number" step="0.01" min="0" id="exAmount" value="${e.amount}"></div><div class="field"><label>${t('date')}</label><input class="input" type="date" id="exDate" value="${e.date}"></div></div>
    <div class="field"><label>${t('category')}</label><select class="select" id="exCat">${selectOpts(EXP_CATS, 'exp_', e.category)}</select></div>
    <div class="field"><label>${t('description')}</label><input class="input" id="exNote" value="${esc(e.note)}"></div>
    <div class="grid-2"><div class="field"><label>${t('vendor')} <span class="subtle">(${t('optional')})</span></label><input class="input" id="exVendor" value="${esc(e.vendor)}"></div><div class="field"><label>${t('receipt_url')} <span class="subtle">(${t('optional')})</span></label><input class="input" id="exUrl" value="${esc(e.url)}" placeholder="https://"></div></div>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="exSave">${t('save')}</button>`,
    onOpen: ov => $('#exSave', ov).onclick = () => { const amt = parseFloat($('#exAmount').value); if (!amt || !$('#exDate').value) return toast(t('required'), 'err'); const obj = { amount: amt, date: $('#exDate').value, category: $('#exCat').value, note: $('#exNote').value.trim(), vendor: $('#exVendor').value.trim(), url: $('#exUrl').value.trim() }; if (id) Object.assign(e, obj); else DB.expenses.push(Object.assign({ id: uid('e') }, obj)); audit(id ? 'expense_edited' : 'expense_added', obj.note + ' ' + amt); saveData(); closeModal(); toast(t('saved')); render(); } });
}

/* ================= REQUESTS ================= */
function requestRow(r) { const u = DB.units.find(x => x.id === r.unitId); return `<div class="req" onclick="openRequestDetail('${r.id}')"><span class="pr ${r.priority}" title="${t('prio_' + r.priority)}"></span><div style="min-width:0"><div class="row wrap" style="gap:6px"><b>${esc(r.subject)}</b>${statusBadge(r.status)}</div><div class="small muted">${isAdmin() ? unitLabel(u) + ' · ' : ''}${t('cat_' + r.category)} · ${fmtDate(r.date)}${r.comments && r.comments.length ? ' · 💬 ' + r.comments.length : ''}${r.photo ? ' · 📷' : ''}</div></div>${icon('chevron_r', 'subtle')}</div>`; }
PAGES.requests = () => {
  let list = isAdmin() ? DB.requests.slice() : DB.requests.filter(r => r.unitId === currentUser.unitId);
  const counts = { all: list.length, open: list.filter(r => r.status === 'new' || r.status === 'in_progress').length, resolved: list.filter(r => r.status === 'resolved' || r.status === 'closed').length };
  if (ui.reqFilter === 'open') list = list.filter(r => r.status === 'new' || r.status === 'in_progress'); else if (ui.reqFilter === 'resolved') list = list.filter(r => r.status === 'resolved' || r.status === 'closed');
  list.sort((a, b) => (b.status === 'new') - (a.status === 'new') || b.date.localeCompare(a.date));
  const resolvedDays = DB.requests.filter(r => r.resolvedAt).map(r => (new Date(r.resolvedAt) - new Date(r.date)) / 864e5); const avg = resolvedDays.length ? (resolvedDays.reduce((a, b) => a + b, 0) / resolvedDays.length).toFixed(1) : '—';
  return head(isAdmin() ? t('inbox_title') : t('req_title'), isAdmin() ? t('inbox_sub') : t('req_sub'), `<button class="btn btn-primary" onclick="openRequestModal()">${icon('plus')}${t('req_new')}</button>`) +
    `<div class="kpis" style="grid-template-columns:repeat(3,1fr)">${kpi('inbox', 'amber', t('open_count'), counts.open)}${kpi('check', 'green', t('resolved_count'), counts.resolved)}${kpi('clock', 'blue', t('avg_resolution'), avg)}</div>
    <div class="chips" style="margin-bottom:14px">${['open', 'resolved', 'all'].map(f => `<button class="chip ${ui.reqFilter === f ? 'active' : ''}" onclick="ui.reqFilter='${f}';render()">${f === 'all' ? t('all') : t(f + '_count')} · ${counts[f]}</button>`).join('')}</div>
    <div class="card">${list.length ? `<div class="list">${list.map(requestRow).join('')}</div>` : empty('inbox')}</div>`;
};
function openRequestModal() {
  const u = myUnit();
  openModal({ title: t('req_new'), body: `${isAdmin() ? `<div class="field"><label>${t('unit')}</label><select class="select" id="rqUnit">${DB.units.map(x => `<option value="${x.id}">${unitLabel(x)} — ${esc(x.owner)}</option>`).join('')}</select></div>` : `<p class="small muted" style="margin-bottom:12px">${unitLabel(u)} · ${esc(u.owner)}</p>`}
    <div class="grid-2"><div class="field"><label>${t('req_category')}</label><select class="select" id="rqCat">${selectOpts(REQ_CATS, 'cat_', 'maintenance')}</select></div><div class="field"><label>${t('req_priority')}</label><select class="select" id="rqPrio">${selectOpts(['low', 'normal', 'high', 'urgent'], 'prio_', 'normal')}</select></div></div>
    <div class="field"><label>${t('req_subject')}</label><input class="input" id="rqSubject" maxlength="90"></div>
    <div class="field"><label>${t('req_body')}</label><textarea class="textarea" id="rqBody" rows="5"></textarea></div>
    <div class="field"><label>${t('req_photo')} <span class="subtle">(${t('optional')})</span></label><input type="file" accept="image/*" id="rqPhoto" class="input" onchange="readPhoto(this)"><div class="help">${t('req_photo_hint')}</div><img id="rqPreview" class="photo-thumb" hidden></div>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="rqSend">${icon('check')}${t('req_new')}</button>`,
    onOpen: ov => $('#rqSend', ov).onclick = () => { const s = $('#rqSubject').value.trim(), b = $('#rqBody').value.trim(); if (!s || !b) return toast(t('required'), 'err'); DB.requests.push({ id: uid('s'), unitId: isAdmin() ? $('#rqUnit').value : u.id, category: $('#rqCat').value, priority: $('#rqPrio').value, subject: s, body: b, date: todayISO(), status: 'new', photo: $('#rqPreview').src && !$('#rqPreview').hidden ? $('#rqPreview').src : '', internalNote: '', comments: [] }); audit('request_created', s); saveData(); closeModal(); toast(t('req_sent')); ui.reqFilter = 'open'; render(); } });
}
function readPhoto(input) { const f = input.files[0]; if (!f) return; if (f.size > 1048576) { toast(t('req_photo_hint'), 'err'); input.value = ''; return; } const r = new FileReader(); r.onload = e => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const k = Math.min(1, 1000 / img.width); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); const p = $('#rqPreview'); p.src = c.toDataURL('image/jpeg', .7); p.hidden = false; }; img.src = e.target.result; }; r.readAsDataURL(f); }
function openRequestDetail(id) {
  const r = DB.requests.find(x => x.id === id); const u = DB.units.find(x => x.id === r.unitId);
  const thread = `<div class="thread">${(r.comments || []).map(c => `<div class="msg ${c.by === 'admin' ? 'admin' : ''}"><div class="who">${c.by === 'admin' ? t('role_admin') : esc(u ? u.owner : '')} · ${fmtDate(c.date)}</div>${esc(c.text)}</div>`).join('')}</div>`;
  openModal({ title: esc(r.subject), wide: true, body: `<div class="row wrap" style="gap:6px;margin-bottom:12px">${statusBadge(r.status)}<span class="badge b-neutral">${t('cat_' + r.category)}</span><span class="badge b-neutral"><span class="pr ${r.priority}" style="width:8px;height:8px;margin:0"></span>${t('prio_' + r.priority)}</span><span class="small muted right">${unitLabel(u)} · ${esc(u ? u.owner : '')} · ${fmtDate(r.date)}</span></div>
    <p style="white-space:pre-line;margin-bottom:12px">${esc(r.body)}</p>${r.photo ? `<img src="${r.photo}" class="photo-thumb" style="max-height:320px;margin-bottom:12px">` : ''}
    ${(r.comments || []).length ? `<div class="label">${t('timeline')}</div>${thread}` : ''}
    <div class="field" style="margin-top:14px"><label>${isAdmin() ? t('reply') : t('add_comment')}</label><textarea class="textarea" id="rdText" rows="3"></textarea></div>
    ${isAdmin() ? `<div class="grid-2"><div class="field"><label>${t('status')}</label><select class="select" id="rdStatus">${selectOpts(['new', 'in_progress', 'resolved', 'closed'], 'st_', r.status)}</select></div><div class="field"><label>${t('internal_note')}</label><input class="input" id="rdNote" value="${esc(r.internalNote)}"></div></div>` : ''}`,
    footer: `${isAdmin() ? `<button class="btn btn-danger btn-sm" onclick="confirmDialog('',()=>{DB.requests=DB.requests.filter(x=>x.id!=='${id}');audit('request_deleted');saveData();closeModal();render()})">${icon('trash')}${t('delete')}</button>` : ''}<span class="grow"></span><button class="btn btn-secondary" onclick="closeModal()">${t('close')}</button><button class="btn btn-primary" id="rdSave">${icon('check')}${t('save')}</button>`,
    onOpen: ov => $('#rdSave', ov).onclick = () => { const txt = $('#rdText').value.trim(); if (txt) r.comments.push({ by: isAdmin() ? 'admin' : 'owner', date: todayISO(), text: txt }); if (isAdmin()) { const ns = $('#rdStatus').value; if (ns !== r.status && (ns === 'resolved' || ns === 'closed')) r.resolvedAt = todayISO(); r.status = ns; r.internalNote = $('#rdNote').value.trim(); } audit('request_updated', r.subject); saveData(); closeModal(); toast(t('saved')); render(); } });
}

/* ================= VOTES ================= */
PAGES.votes = () => {
  const today = todayISO(); const votes = DB.votes.slice().sort((a, b) => (a.closed || a.deadline < today) - (b.closed || b.deadline < today) || b.deadline.localeCompare(a.deadline));
  return head(t('votes_title'), t('votes_sub'), isAdmin() ? `<button class="btn btn-primary" onclick="openVoteModal()">${icon('plus')}${t('new_vote')}</button>` : '') + (votes.length ? votes.map(voteCard).join('') : `<div class="card">${empty('vote')}</div>`);
};
function voteCard(v) {
  const today = todayISO(); const over = v.closed || v.deadline < today; const ballots = v.ballots || {}; const total = Object.keys(ballots).length; const my = ballots[currentUser.unitId];
  const canVote = !over && !my && !isAdmin() && myUnit(); const turnout = Math.round(total / DB.units.length * 100); const counts = {}; Object.values(ballots).forEach(o => counts[o] = (counts[o] || 0) + 1);
  return `<div class="card" style="margin-bottom:14px"><div class="card-body">
    <div class="row wrap" style="align-items:flex-start;margin-bottom:6px"><h3 style="font-size:1.05rem" class="grow">${esc(v.title)}</h3>${over ? `<span class="badge b-neutral">${t('vote_closed')}</span>` : `<span class="badge b-good">${t('vote_active')}</span>`}${isAdmin() ? `${!v.closed ? `<button class="btn btn-secondary btn-sm" onclick="const v=DB.votes.find(x=>x.id==='${v.id}');v.closed=true;audit('vote_closed');saveData();render()">${t('close_vote')}</button>` : ''}<button class="btn btn-ghost btn-sm btn-icon" onclick="confirmDialog('',()=>{DB.votes=DB.votes.filter(x=>x.id!=='${v.id}');audit('vote_deleted');saveData();render()})">${icon('trash')}</button>` : ''}</div>
    <div class="small muted" style="margin-bottom:14px">${t('deadline')}: ${fmtDate(v.deadline)} · ${total} ${t('votes_cast')} · ${t('turnout')} ${turnout}% ${v.quorum ? `· <span class="${turnout >= v.quorum ? 'success' : 'error'}" style="margin:0;font-size:inherit">${turnout >= v.quorum ? t('quorum_reached') : t('quorum_missing')} (${v.quorum}%)</span>` : ''}</div>
    ${v.options.map(o => { const c = counts[o] || 0; const pct = total ? Math.round(c / total * 100) : 0; return `<div class="vote-opt ${canVote ? 'votable' : ''} ${my === o ? 'mine' : ''}" ${canVote ? `onclick="castVote('${v.id}',${JSON.stringify(o).replace(/"/g, '&quot;')})"` : ''}><span class="lab">${my === o ? '✓ ' : ''}${esc(o)}</span><div class="bar"><i style="width:${pct}%"></i></div><span class="pct">${pct}%</span><span class="tiny subtle" style="width:28px">${c}</span></div>`; }).join('')}
    ${canVote ? `<p class="help">${t('vote_hint')}</p>` : my ? `<p class="success">${t('you_voted')}: ${esc(my)}</p>` : ''}</div></div>`;
}
function castVote(id, opt) { const v = DB.votes.find(x => x.id === id); if (!v || v.ballots[currentUser.unitId]) return; v.ballots[currentUser.unitId] = opt; audit('vote_cast', v.title); saveData(); toast(t('you_voted') + ': ' + opt); render(); }
function openVoteModal() {
  openModal({ title: t('new_vote'), body: `<div class="field"><label>${t('question')}</label><input class="input" id="vtTitle"></div><div class="field"><label>${t('options')}</label><textarea class="textarea" id="vtOpts" rows="4">${LANG === 'bg' ? 'Да\nНе\nВъздържал се' : 'Yes\nNo\nAbstain'}</textarea></div><div class="grid-2"><div class="field"><label>${t('deadline')}</label><input class="input" type="date" id="vtDl" value="${monthISO(new Date(Date.now() + 14 * 864e5)) + '-' + String(new Date(Date.now() + 14 * 864e5).getDate()).padStart(2, '0')}"></div><div class="field"><label>${t('quorum')} %</label><input class="input" type="number" min="0" max="100" id="vtQ" value="50"></div></div>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="vtSave">${t('save')}</button>`,
    onOpen: ov => $('#vtSave', ov).onclick = () => { const title = $('#vtTitle').value.trim(); const opts = $('#vtOpts').value.split('\n').map(s => s.trim()).filter(Boolean); if (!title || opts.length < 2 || !$('#vtDl').value) return toast(t('required'), 'err'); DB.votes.push({ id: uid('v'), title, options: opts, ballots: {}, deadline: $('#vtDl').value, quorum: parseInt($('#vtQ').value) || 0, closed: false, created: todayISO() }); audit('vote_created', title); saveData(); closeModal(); render(); } });
}

/* ================= NEWS & WORKS ================= */
PAGES.news = () => {
  const news = DB.news.slice().sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
  return head(t('news_title'), t('news_sub'), isAdmin() ? `<button class="btn btn-secondary" onclick="openWorkModal()">${icon('wrench')}${t('add_work')}</button><button class="btn btn-primary" onclick="openNewsModal()">${icon('plus')}${t('post_news')}</button>` : '') + bannerHtml() +
    `<div class="two-col"><div class="stack">${news.length ? news.map(n => `<div class="card news-card ${n.pinned ? 'pinned' : ''}"><div class="row wrap tiny subtle">${fmtDate(n.date, 'long')}${n.pinned ? `<span class="badge b-info">${icon('pin')}${t('pinned')}</span>` : ''}${isAdmin() ? `<span class="right row" style="gap:2px"><button class="btn btn-ghost btn-sm btn-icon" onclick="openNewsModal('${n.id}')">${icon('edit')}</button><button class="btn btn-ghost btn-sm btn-icon" onclick="confirmDialog('',()=>{DB.news=DB.news.filter(x=>x.id!=='${n.id}');audit('news_deleted');saveData();render()})">${icon('trash')}</button></span>` : ''}</div><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></div>`).join('') : `<div class="card">${empty('news')}</div>`}</div>
    <div class="stack"><div class="card"><div class="card-head"><h3>${t('works_title')}</h3></div>${DB.works.length ? `<div class="list">${DB.works.map(w => `<div class="list-item" style="align-items:flex-start"><div class="grow"><div class="row wrap"><b>${esc(w.title)}</b>${statusBadge(w.status, 'work')}</div>${w.desc ? `<div class="small muted">${esc(w.desc)}</div>` : ''}<div class="progress" style="margin:8px 0 4px"><i style="width:${w.progress}%"></i></div><div class="tiny subtle">${w.start ? fmtDate(w.start) : ''}${w.end ? ' → ' + fmtDate(w.end) : ''} · ${w.progress}%</div></div>${isAdmin() ? `<div class="row" style="gap:2px"><button class="btn btn-ghost btn-sm btn-icon" onclick="openWorkModal('${w.id}')">${icon('edit')}</button><button class="btn btn-ghost btn-sm btn-icon" onclick="confirmDialog('',()=>{DB.works=DB.works.filter(x=>x.id!=='${w.id}');saveData();render()})">${icon('trash')}</button></div>` : ''}</div>`).join('')}</div>` : empty('wrench')}</div></div></div>`;
};
function openNewsModal(id) {
  const n = id ? DB.news.find(x => x.id === id) : { title: '', body: '', pinned: false, banner: false };
  openModal({ title: t('post_news'), body: `<div class="field"><label>${t('title')}</label><input class="input" id="nwTitle" value="${esc(n.title)}"></div><div class="field"><label>${t('body')}</label><textarea class="textarea" id="nwBody" rows="6">${esc(n.body)}</textarea></div><label class="check"><input type="checkbox" id="nwPin" ${n.pinned ? 'checked' : ''}>${t('pinned')}</label><label class="check" style="margin-top:8px"><input type="checkbox" id="nwBanner" ${DB.building.banner && DB.building.banner === n.title ? 'checked' : ''}>${t('banner')}</label>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="nwSave">${t('save')}</button>`,
    onOpen: ov => $('#nwSave', ov).onclick = () => { const title = $('#nwTitle').value.trim(), body = $('#nwBody').value.trim(); if (!title || !body) return toast(t('required'), 'err'); if (id) Object.assign(n, { title, body, pinned: $('#nwPin').checked }); else DB.news.push({ id: uid('n'), title, body, pinned: $('#nwPin').checked, date: todayISO() }); if ($('#nwBanner').checked) DB.building.banner = title; else if (DB.building.banner === n.title) DB.building.banner = ''; audit('news_posted', title); saveData(); closeModal(); render(); } });
}
function openWorkModal(id) {
  const w = id ? DB.works.find(x => x.id === id) : { title: '', desc: '', status: 'planned', progress: 0, start: '', end: '' };
  openModal({ title: t('add_work'), body: `<div class="field"><label>${t('title')}</label><input class="input" id="wkTitle" value="${esc(w.title)}"></div><div class="field"><label>${t('description')}</label><textarea class="textarea" id="wkDesc" rows="3">${esc(w.desc)}</textarea></div><div class="grid-2"><div class="field"><label>${t('status')}</label><select class="select" id="wkStatus">${selectOpts(['planned', 'in_progress', 'done'], 'w_', w.status)}</select></div><div class="field"><label>${t('progress')} %</label><input class="input" type="number" min="0" max="100" id="wkProg" value="${w.progress}"></div></div><div class="grid-2"><div class="field"><label>${t('start')}</label><input class="input" type="date" id="wkStart" value="${w.start}"></div><div class="field"><label>${t('end')}</label><input class="input" type="date" id="wkEnd" value="${w.end}"></div></div>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="wkSave">${t('save')}</button>`,
    onOpen: ov => $('#wkSave', ov).onclick = () => { const title = $('#wkTitle').value.trim(); if (!title) return toast(t('required'), 'err'); const obj = { title, desc: $('#wkDesc').value.trim(), status: $('#wkStatus').value, progress: Math.min(100, parseInt($('#wkProg').value) || 0), start: $('#wkStart').value, end: $('#wkEnd').value }; if (obj.status === 'done') obj.progress = 100; if (id) Object.assign(w, obj); else DB.works.push(Object.assign({ id: uid('w') }, obj)); saveData(); closeModal(); render(); } });
}

/* ================= CALENDAR ================= */
PAGES.calendar = () => {
  const d = ui.calDate; const y = d.getFullYear(), m = d.getMonth(); const first = new Date(y, m, 1); let dow = (first.getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate(); const today = todayISO();
  let cells = ''; for (let i = 0; i < dow; i++) cells += '<div class="d pad"></div>';
  for (let day = 1; day <= days; day++) { const iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'); const evs = DB.events.filter(e => e.date === iso); cells += `<div class="d ${iso === today ? 'today' : ''}"><div class="n">${day}</div>${evs.map(e => `<div class="ev ${e.type}" onclick="openEventModal('${e.id}')" title="${esc(e.title)}">${e.time ? e.time + ' ' : ''}${esc(e.title)}</div>`).join('')}</div>`; }
  const upcoming = DB.events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')).slice(0, 8);
  return head(t('cal_title'), t('cal_sub'), isAdmin() ? `<button class="btn btn-primary" onclick="openEventModal()">${icon('plus')}${t('add_event')}</button>` : '') +
    `<div class="two-col"><div class="card"><div class="card-head"><button class="btn btn-ghost btn-icon" onclick="ui.calDate=new Date(${y},${m - 1},1);render()">${icon('chevron_l')}</button><h3 class="grow" style="text-align:center">${t('months_long')[m]} ${y}</h3><button class="btn btn-ghost btn-icon" onclick="ui.calDate=new Date(${y},${m + 1},1);render()">${icon('chevron_r')}</button></div><div class="card-body"><div class="cal">${t('days_short').map(x => `<div class="dh">${x}</div>`).join('')}${cells}</div></div></div>
    <div class="card"><div class="card-head"><h3>${t('upcoming_events')}</h3></div>${upcoming.length ? `<div class="list">${upcoming.map(e => `<div class="list-item ${isAdmin() ? 'clickable' : ''}" ${isAdmin() ? `onclick="openEventModal('${e.id}')"` : ''}><div class="date-badge"><b>${e.date.slice(8)}</b><small>${t('months')[parseInt(e.date.slice(5, 7)) - 1]}</small></div><div class="grow"><div class="row wrap"><b>${esc(e.title)}</b><span class="badge b-neutral">${t('ev_' + e.type)}</span></div><div class="small muted">${e.time || ''}${e.location ? ' · ' + esc(e.location) : ''}${e.desc ? ' · ' + esc(e.desc) : ''}</div></div></div>`).join('')}</div>` : `<div class="empty">${t('no_events')}</div>`}</div></div>`;
};
function openEventModal(id) {
  if (id && !isAdmin()) return;
  const e = id ? DB.events.find(x => x.id === id) : { title: '', desc: '', date: todayISO(), time: '18:00', type: 'meeting', location: '' };
  openModal({ title: t('add_event'), body: `<div class="field"><label>${t('title')}</label><input class="input" id="evTitle" value="${esc(e.title)}"></div><div class="grid-3"><div class="field"><label>${t('date')}</label><input class="input" type="date" id="evDate" value="${e.date}"></div><div class="field"><label>${t('time')}</label><input class="input" type="time" id="evTime" value="${e.time}"></div><div class="field"><label>${t('type')}</label><select class="select" id="evType">${selectOpts(EV_TYPES, 'ev_', e.type)}</select></div></div><div class="field"><label>${t('location')}</label><input class="input" id="evLoc" value="${esc(e.location)}"></div><div class="field"><label>${t('description')}</label><textarea class="textarea" id="evDesc" rows="3">${esc(e.desc)}</textarea></div>`,
    footer: `${id ? `<button class="btn btn-danger btn-sm" onclick="confirmDialog('',()=>{DB.events=DB.events.filter(x=>x.id!=='${id}');saveData();closeModal();render()})">${icon('trash')}${t('delete')}</button><span class="grow"></span>` : ''}<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="evSave">${t('save')}</button>`,
    onOpen: ov => $('#evSave', ov).onclick = () => { const title = $('#evTitle').value.trim(); if (!title || !$('#evDate').value) return toast(t('required'), 'err'); const obj = { title, date: $('#evDate').value, time: $('#evTime').value, type: $('#evType').value, location: $('#evLoc').value.trim(), desc: $('#evDesc').value.trim() }; if (id) Object.assign(e, obj); else DB.events.push(Object.assign({ id: uid('ev') }, obj)); audit('event_saved', title); saveData(); closeModal(); render(); } });
}

/* ================= DOCUMENTS ================= */
PAGES.documents = () => {
  const groups = DOC_CATS.map(c => ({ c, docs: DB.documents.filter(d => d.category === c) })).filter(g => g.docs.length);
  return head(t('docs_title'), t('docs_sub'), isAdmin() ? `<button class="btn btn-primary" onclick="openDocModal()">${icon('plus')}${t('add_doc')}</button>` : '') + (groups.length ? groups.map(g => `<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>${t('doc_' + g.c)}</h3><span class="badge b-neutral right">${g.docs.length}</span></div><div class="list">${g.docs.map(d => `<div class="list-item"><div class="ic blue" style="width:38px;height:38px;border-radius:10px;display:grid;place-items:center">${icon('folder')}</div><div class="grow"><b>${esc(d.name)}</b><div class="tiny subtle">${fmtDate(d.date)}${d.note ? ' · ' + esc(d.note) : ''}</div></div>${d.url ? `<a class="btn btn-secondary btn-sm" href="${esc(d.url)}" target="_blank" rel="noopener">${t('open')} ↗</a>` : `<span class="tiny subtle">${t('no_link')}</span>`}${isAdmin() ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="openDocModal('${d.id}')">${icon('edit')}</button><button class="btn btn-ghost btn-sm btn-icon" onclick="confirmDialog('',()=>{DB.documents=DB.documents.filter(x=>x.id!=='${d.id}');saveData();render()})">${icon('trash')}</button>` : ''}</div>`).join('')}</div></div>`).join('') : `<div class="card">${empty('folder')}</div>`);
};
function openDocModal(id) {
  const d = id ? DB.documents.find(x => x.id === id) : { name: '', category: 'rules', url: '', note: '' };
  openModal({ title: t('add_doc'), body: `<div class="field"><label>${t('name')}</label><input class="input" id="dcName" value="${esc(d.name)}"></div><div class="field"><label>${t('category')}</label><select class="select" id="dcCat">${selectOpts(DOC_CATS, 'doc_', d.category)}</select></div><div class="field"><label>${t('link')}</label><input class="input" id="dcUrl" value="${esc(d.url)}" placeholder="https://"></div><div class="field"><label>${t('note')}</label><input class="input" id="dcNote" value="${esc(d.note)}"></div>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="dcSave">${t('save')}</button>`,
    onOpen: ov => $('#dcSave', ov).onclick = () => { const name = $('#dcName').value.trim(); if (!name) return toast(t('required'), 'err'); const obj = { name, category: $('#dcCat').value, url: $('#dcUrl').value.trim(), note: $('#dcNote').value.trim() }; if (id) Object.assign(d, obj); else DB.documents.push(Object.assign({ id: uid('d'), date: todayISO() }, obj)); saveData(); closeModal(); render(); } });
}

/* ================= DIRECTORY ================= */
PAGES.directory = () => {
  const floors = {}; DB.units.slice().sort((a, b) => naturalUnitCompare(a.num, b.num)).forEach(u => { (floors[u.floor] = floors[u.floor] || []).push(u); });
  const ctIcon = { manager: 'user', elevator: 'building', plumber: 'wrench', electrician: 'sparkle', cleaning: 'sparkle', emergency: 'alert', other: 'phone' };
  return head(t('dir_title'), t('dir_sub'), isAdmin() ? `<button class="btn btn-primary" onclick="openContactModal()">${icon('plus')}${t('add_contact')}</button>` : '') +
    `<div class="two-col"><div class="card"><div class="card-head"><h3>${t('neighbours')}</h3><span class="badge b-neutral right">${DB.units.length} ${t('units')}</span></div>${Object.keys(floors).sort((a, b) => b - a).map(f => `<div class="nav-label" style="padding:12px 20px 4px">${floorLabel(f)}</div>${floors[f].map(u => `<div class="person"><div class="avatar" style="background:${u.type === 'garage' ? 'var(--text-3)' : ''}">${esc((u.owner || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase())}</div><div class="grow"><b>${esc(u.owner)}</b>${u.tenant ? ` <span class="tiny subtle">(${t('tenant')}: ${esc(u.tenant)})</span>` : ''}<div class="small muted">${unitLabel(u)}</div></div>${(isAdmin() || u.sharePhone) && u.phone ? `<a class="btn btn-secondary btn-sm" href="tel:${esc(u.phone)}">${icon('phone')}${esc(u.phone)}</a>` : ''}</div>`).join('')}`).join('')}</div>
    <div class="stack"><div class="card"><div class="card-head"><h3>${t('useful_contacts')}</h3></div>${DB.contacts.length ? `<div class="list">${DB.contacts.map(c => `<div class="list-item"><div class="ic ${c.role === 'emergency' ? 'red' : 'blue'}" style="width:40px;height:40px;border-radius:11px;display:grid;place-items:center">${icon(ctIcon[c.role] || 'phone')}</div><div class="grow"><b>${esc(c.name)}</b><div class="small muted">${t('ct_' + c.role)}${c.note ? ' · ' + esc(c.note) : ''}</div></div>${c.phone ? `<a class="btn btn-secondary btn-sm" href="tel:${esc(c.phone)}">${icon('phone')}${esc(c.phone)}</a>` : ''}${isAdmin() ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="openContactModal('${c.id}')">${icon('edit')}</button>` : ''}</div>`).join('')}</div>` : empty('phone')}</div>
    ${DB.building.managerName ? `<div class="card card-body"><div class="label">${t('ct_manager')}</div><b>${esc(DB.building.managerName)}</b><div class="small muted">${esc(DB.building.managerPhone)} ${DB.building.managerEmail ? '· ' + esc(DB.building.managerEmail) : ''}</div></div>` : ''}</div></div>`;
};
function openContactModal(id) {
  const c = id ? DB.contacts.find(x => x.id === id) : { role: 'other', name: '', phone: '', note: '' };
  openModal({ title: t('add_contact'), body: `<div class="field"><label>${t('role')}</label><select class="select" id="ctRole">${selectOpts(CT_ROLES, 'ct_', c.role)}</select></div><div class="field"><label>${t('name')}</label><input class="input" id="ctName" value="${esc(c.name)}"></div><div class="field"><label>${t('phone')}</label><input class="input" id="ctPhone" value="${esc(c.phone)}"></div><div class="field"><label>${t('note')}</label><input class="input" id="ctNote" value="${esc(c.note)}"></div>`,
    footer: `${id ? `<button class="btn btn-danger btn-sm" onclick="DB.contacts=DB.contacts.filter(x=>x.id!=='${id}');saveData();closeModal();render()">${icon('trash')}${t('delete')}</button><span class="grow"></span>` : ''}<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="ctSave">${t('save')}</button>`,
    onOpen: ov => $('#ctSave', ov).onclick = () => { const name = $('#ctName').value.trim(); if (!name) return toast(t('required'), 'err'); const obj = { role: $('#ctRole').value, name, phone: $('#ctPhone').value.trim(), note: $('#ctNote').value.trim() }; if (id) Object.assign(c, obj); else DB.contacts.push(Object.assign({ id: uid('c') }, obj)); saveData(); closeModal(); render(); } });
}

/* ================= PROFILE (resident) ================= */
PAGES.profile = () => {
  const u = myUnit(); const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return head(t('profile_title'), t('profile_sub')) + `<div class="two-col"><div class="stack">
    <div class="card"><div class="card-head"><h3>${t('my_unit')}</h3></div><div class="card-body grid-2"><div><div class="label">${t('unit')}</div><b>${unitLabel(u)}</b></div><div><div class="label">${t('owner')}</div><b>${esc(u.owner)}</b></div><div><div class="label">${t('floor')}</div>${u.floor}</div><div><div class="label">${t('size')}</div>${u.size} m²</div><div><div class="label">${t('monthly_fee')}</div>${fmtMoney(u.fee)}</div></div></div>
    <div class="card"><div class="card-head"><h3>${t('phone')} & ${t('email')}</h3></div><div class="card-body"><div class="grid-2"><div class="field"><label>${t('phone')}</label><input class="input" id="pfPhone" value="${esc(u.phone)}"></div><div class="field"><label>${t('email')}</label><input class="input" id="pfEmail" value="${esc(u.email)}"></div></div><label class="check"><input type="checkbox" id="pfShare" ${u.sharePhone ? 'checked' : ''}>${t('share_contact')}</label><div style="margin-top:14px"><button class="btn btn-primary" onclick="const u=myUnit();u.phone=$('#pfPhone').value.trim();u.email=$('#pfEmail').value.trim();u.sharePhone=$('#pfShare').checked;saveData();toast(t('saved'))">${t('save')}</button></div></div></div></div>
    <div class="stack"><div class="card"><div class="card-head"><h3>${t('preferences')}</h3></div><div class="card-body"><div class="field"><label>${t('language')}</label><div class="segmented"><button class="${LANG === 'bg' ? 'active' : ''}" onclick="setLang('bg');render()">Български</button><button class="${LANG === 'en' ? 'active' : ''}" onclick="setLang('en');render()">English</button></div></div><div class="field"><label>${t('theme')}</label><div class="segmented">${['light', 'dark', 'auto'].map(x => `<button class="${(localStorage.getItem('ps13_theme') || 'auto') === x ? 'active' : ''}" onclick="localStorage.setItem('ps13_theme','${x}');applyTheme();render()">${t('theme_' + x)}</button>`).join('')}</div></div></div></div>
    <div class="card"><div class="card-head"><h3>${t('s_security')}</h3></div><div class="card-body"><button class="btn btn-secondary" onclick="openChangePassword()">${icon('key')}${t('change_password')}</button></div></div></div></div>`;
};

/* ================= UNITS (admin) ================= */
function unitCard(u, per) {
  const st = payStatus(u, per); const bal = unitBalance(u.id); const accent = unitAccent(u);
  return `<div class="card unit-card" onclick="openUnitDetail('${u.id}')"><span class="st dot" style="background:${st === 'paid' ? 'var(--good)' : st === 'partial' ? 'var(--warn)' : 'var(--bad)'}"></span>
    <div class="unit-card-head"><div class="icn ${accent}">${icon(unitIcon(u))}</div><div class="num-badge ${accent}">${esc(u.num)}</div></div>
    <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(u.owner)}</div><div class="tiny subtle">${t('t_' + u.type)} · ${u.size} m²</div>
    <div class="small" style="margin-top:8px;color:${bal < 0 ? 'var(--bad)' : 'var(--good)'};font-weight:600">${bal < 0 ? t('owes') + ' ' + fmtMoney(-bal, { noDual: true }) : t('up_to_date')}</div></div>`;
}
PAGES.units = () => {
  const q = (ui.unitQuery || '').toLowerCase(); const per = monthISO();
  let list = DB.units.slice(); if (ui.unitTab !== 'all') list = list.filter(u => u.type === ui.unitTab); if (q) list = list.filter(u => (u.owner + ' ' + u.num + ' ' + (u.tenant || '')).toLowerCase().includes(q));
  list.sort((a, b) => naturalUnitCompare(a.num, b.num));
  const tabs = [['all', t('all'), DB.units.length], ['apartment', t('apartments'), DB.units.filter(u => u.type === 'apartment').length], ['room', t('rooms'), DB.units.filter(u => u.type === 'room').length], ['garage', t('garages'), DB.units.filter(u => u.type === 'garage').length]];
  const floors = [...new Set(list.map(u => u.floor))].sort((a, b) => b - a);
  const body = floors.length
    ? floors.map(f => `<div class="floor-group"><div class="floor-label">${floorLabel(f)}</div><div class="unit-grid">${list.filter(u => u.floor === f).map(u => unitCard(u, per)).join('')}</div></div>`).join('')
    : `<div class="card">${empty('building', t('no_results'))}</div>`;
  return head(t('units_title'), t('units_sub'), `<button class="btn btn-primary" onclick="openUnitModal()">${icon('plus')}${t('add_unit')}</button>`) +
    `<div class="row wrap" style="margin-bottom:14px"><div class="chips">${tabs.map(x => `<button class="chip ${ui.unitTab === x[0] ? 'active' : ''}" onclick="ui.unitTab='${x[0]}';render()">${x[1]} · ${x[2]}</button>`).join('')}</div><input class="input right" style="max-width:260px" placeholder="${t('search')}" value="${esc(ui.unitQuery || '')}" oninput="ui.unitQuery=this.value;render();this.focus();this.setSelectionRange(this.value.length,this.value.length)"></div>
    ${body}`;
};
function openUnitDetail(id) {
  const u = DB.units.find(x => x.id === id); const pays = DB.payments.filter(p => p.unitId === id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10); const bal = unitBalance(id); const reqs = DB.requests.filter(r => r.unitId === id).length;
  const login = loginForUnit(id);
  openModal({ title: `${unitLabel(u)} — ${esc(u.owner)}`, wide: true, body: `<div class="kpis" style="grid-template-columns:repeat(3,1fr)">${kpi('wallet', bal < 0 ? 'red' : 'green', t('balance'), `<span style="color:${bal < 0 ? 'var(--bad)' : 'var(--good)'}">${fmtMoney(bal, { noDual: true })}</span>`)}${kpi('home', 'blue', t('monthly_fee'), fmtMoney(u.fee, { noDual: true }))}${kpi('inbox', 'amber', t('nav_requests'), reqs)}</div>
    <div class="grid-2" style="margin-bottom:14px"><div><div class="label">${t('tenant')}</div>${esc(u.tenant) || '—'}</div><div><div class="label">${t('phone')}</div>${u.phone ? `<a href="tel:${esc(u.phone)}">${esc(u.phone)}</a>` : '—'}</div><div><div class="label">${t('email')}</div>${esc(u.email) || '—'}</div></div>
    <div class="label">${t('access')}</div><div class="card" style="box-shadow:none;margin-bottom:16px"><div class="card-body row wrap" style="align-items:center;gap:10px">
      ${login ? `<span class="badge b-good">${icon('check')}${t('login_active')}</span><span class="grow"></span><button class="btn btn-secondary btn-sm" onclick="openResetLoginModal('${id}','${login.id}')">${icon('key')}${t('reset_password')}</button><button class="btn btn-ghost btn-sm" onclick="removeLogin('${id}','${login.id}')">${icon('trash')}${t('remove_login')}</button>`
        : `<span class="badge b-warn">${icon('alert')}${t('no_login')}</span><span class="grow"></span><button class="btn btn-primary btn-sm" onclick="openCreateLoginModal('${id}')">${icon('plus')}${t('create_login')}</button>`}
    </div></div>
    <div class="label">${new Date().getFullYear()}</div>${Charts.strip(id, new Date().getFullYear())}
    <div class="label" style="margin-top:16px">${t('payment_history')}</div><div class="card" style="box-shadow:none"><div class="list">${pays.map(p => `<div class="list-item"><b>${fmtPeriod(p.period)}</b><span class="small muted grow">${fmtDate(p.date)} ${esc(p.note)}</span><b style="color:var(--good)">${fmtMoney(p.amount, { noDual: true })}</b></div>`).join('') || empty('wallet')}</div></div>`,
    footer: `<button class="btn btn-danger btn-sm" onclick="confirmDialog('',()=>{DB.units=DB.units.filter(x=>x.id!=='${id}');audit('unit_deleted','${esc(u.num)}');saveData();closeModal();render()})">${icon('trash')}</button><span class="grow"></span><button class="btn btn-secondary" onclick="openPaymentModal('${id}','${monthISO()}')">${icon('plus')}${t('record_payment')}</button><button class="btn btn-primary" onclick="openUnitModal('${id}')">${icon('edit')}${t('edit')}</button>` });
}
/* ---------- login access (create/reset/remove) — calls the manage-login Edge Function,
   the only place that's allowed to touch Supabase Auth users. ---------- */
async function callManageLogin(body) {
  const { data, error } = await sb.functions.invoke('manage-login', { body });
  if (error) { let msg = error.message; try { msg = (await error.context.json()).error || msg; } catch (e) { } return { error: msg }; }
  if (data && data.error) return { error: data.error };
  return { data };
}
function openCreateLoginModal(unitId) {
  const u = DB.units.find(x => x.id === unitId);
  openModal({ title: t('create_login') + ' — ' + unitLabel(u), body: `
    <div class="field"><label>${t('email')}</label><input class="input" id="clEmail" autocapitalize="off"></div>
    <div class="field"><label>${t('password')}</label><div class="row"><input class="input" id="clPass" value="${randomPassword(8)}"><button class="btn btn-secondary btn-sm" onclick="$('#clPass').value=randomPassword(8)">${icon('key')}</button></div></div>
    <div class="error" id="clErr" hidden></div>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="clSave">${t('save')}</button>`,
    onOpen: ov => $('#clSave', ov).onclick = async () => {
      const email = $('#clEmail').value.trim(), password = $('#clPass').value; const err = $('#clErr');
      const fail = m => { err.textContent = m; err.hidden = false; };
      if (!email || !password) return fail(t('required'));
      $('#clSave').disabled = true;
      const res = await callManageLogin({ action: 'create', unitId, email, password, displayName: u.owner });
      $('#clSave').disabled = false;
      if (res.error) return fail(res.error);
      audit('login_created', unitLabel(u)); await loadRemoteData(); closeModal(); toast(t('saved')); render();
    }
  });
}
function openResetLoginModal(unitId, userId) {
  const u = DB.units.find(x => x.id === unitId); const pw = randomPassword(8);
  openModal({ title: t('reset_password') + ' — ' + unitLabel(u), body: `<p class="muted" style="margin-bottom:12px">${t('give_to_owner')}</p><div class="label">${t('new_password_is')}</div><div class="code" id="rlPw">${pw}</div><div class="error" id="rlErr" hidden></div>`,
    footer: `<button class="btn btn-secondary" onclick="copyText('${pw}')">${icon('copy')}${t('copy')}</button><button class="btn btn-primary" id="rlSave">${t('save')}</button>`,
    onOpen: ov => $('#rlSave', ov).onclick = async () => {
      $('#rlSave').disabled = true;
      const res = await callManageLogin({ action: 'reset_password', userId, password: pw });
      $('#rlSave').disabled = false;
      if (res.error) { const e = $('#rlErr'); e.textContent = res.error; e.hidden = false; return; }
      audit('password_reset', unitLabel(u)); closeModal(); toast(t('pw_changed')); render();
    }
  });
}
function removeLogin(unitId, userId) {
  const u = DB.units.find(x => x.id === unitId);
  confirmDialog(t('remove_login_confirm'), async () => {
    const res = await callManageLogin({ action: 'remove', userId });
    if (res.error) { toast(res.error, 'err'); return; }
    audit('login_removed', unitLabel(u)); await loadRemoteData(); toast(t('saved')); render();
  });
}
function openUnitModal(id) {
  const u = id ? DB.units.find(x => x.id === id) : { num: '', type: 'apartment', floor: 1, size: '', owner: '', tenant: '', phone: '', email: '', fee: DB.building.defaultFee || 40 };
  openModal({ title: id ? t('edit') + ' — ' + unitLabel(u) : t('add_unit'), body: `<div class="grid-3"><div class="field"><label>${t('number')}</label><input class="input" id="unNum" value="${esc(u.num)}"></div><div class="field"><label>${t('type')}</label><select class="select" id="unType">${selectOpts(['apartment', 'room', 'garage'], 't_', u.type)}</select></div><div class="field"><label>${t('floor')}</label><input class="input" type="number" id="unFloor" value="${u.floor}"></div></div>
    <div class="grid-2"><div class="field"><label>${t('size')}</label><input class="input" type="number" id="unSize" value="${u.size}"></div><div class="field"><label>${t('monthly_fee')}</label><input class="input" type="number" step="0.01" id="unFee" value="${u.fee}"></div></div>
    <div class="field"><label>${t('owner')}</label><input class="input" id="unOwner" value="${esc(u.owner)}"></div><div class="field"><label>${t('tenant')} <span class="subtle">(${t('tenant_hint')})</span></label><input class="input" id="unTenant" value="${esc(u.tenant)}"></div>
    <div class="grid-2"><div class="field"><label>${t('phone')}</label><input class="input" id="unPhone" value="${esc(u.phone)}"></div><div class="field"><label>${t('email')}</label><input class="input" id="unEmail" value="${esc(u.email)}"></div></div>
    ${!id ? `<div class="help" style="margin-top:6px">${t('unit_login_hint')}</div>` : ''}`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="unSave">${t('save')}</button>`,
    onOpen: ov => $('#unSave', ov).onclick = () => { const obj = { num: $('#unNum').value.trim(), type: $('#unType').value, floor: parseInt($('#unFloor').value) || 0, size: parseFloat($('#unSize').value) || 0, owner: $('#unOwner').value.trim(), tenant: $('#unTenant').value.trim(), phone: $('#unPhone').value.trim(), email: $('#unEmail').value.trim(), fee: parseFloat($('#unFee').value) || 0 }; if (!obj.num || !obj.owner) return toast(t('required'), 'err'); if (id) Object.assign(u, obj); else DB.units.push(Object.assign({ id: uid('u'), sharePhone: false }, obj)); audit(id ? 'unit_edited' : 'unit_added', obj.num); saveData(); closeModal(); toast(t('saved')); render(); } });
}

/* ================= SETTINGS (admin) ================= */
PAGES.settings = () => {
  const tabs = ['building', 'banking', 'security', 'backup', 'audit']; const b = DB.building;
  const tabBar = `<div class="tabs">${tabs.map(x => `<button class="tab ${ui.settingsTab === x ? 'active' : ''}" onclick="ui.settingsTab='${x}';render()">${t('s_' + x)}</button>`).join('')}</div>`;
  let body = '';
  if (ui.settingsTab === 'building') body = `<div class="card"><div class="card-body"><div class="grid-2"><div class="field"><label>${t('building_name')}</label><input class="input" id="sbName" value="${esc(b.name)}"></div><div class="field"><label>${t('address')}</label><input class="input" id="sbAddr" value="${esc(b.address)}"></div></div><div class="grid-3"><div class="field"><label>${t('manager_name')}</label><input class="input" id="sbMgr" value="${esc(b.managerName)}"></div><div class="field"><label>${t('manager_phone')}</label><input class="input" id="sbMgrP" value="${esc(b.managerPhone)}"></div><div class="field"><label>${t('manager_email')}</label><input class="input" id="sbMgrE" value="${esc(b.managerEmail)}"></div></div><div class="grid-3"><div class="field"><label>${t('currency')}</label><select class="select" id="sbCur"><option value="EUR" ${b.currency === 'EUR' ? 'selected' : ''}>EUR €</option><option value="BGN" ${b.currency === 'BGN' ? 'selected' : ''}>BGN лв.</option></select></div><div class="field"><label>${t('default_fee')}</label><input class="input" type="number" id="sbFee" value="${b.defaultFee}"></div><div class="field"><label>${t('opening_balance')}</label><input class="input" type="number" step="0.01" id="sbOpen" value="${b.openingBalance}"></div></div><div class="field"><label>${t('fees_since')}</label><input class="input" type="month" id="sbSince" value="${b.feesSince || ''}"><div class="help">${t('fees_since_hint')}</div></div><label class="check"><input type="checkbox" id="sbDual" ${b.showDual ? 'checked' : ''}>${t('show_dual')}</label><div class="field" style="margin-top:14px"><label>${t('banner')}</label><input class="input" id="sbBanner" value="${esc(b.banner)}"></div><button class="btn btn-primary" onclick="Object.assign(DB.building,{name:$('#sbName').value.trim(),address:$('#sbAddr').value.trim(),managerName:$('#sbMgr').value.trim(),managerPhone:$('#sbMgrP').value.trim(),managerEmail:$('#sbMgrE').value.trim(),currency:$('#sbCur').value,defaultFee:parseFloat($('#sbFee').value)||0,openingBalance:parseFloat($('#sbOpen').value)||0,feesSince:$('#sbSince').value,showDual:$('#sbDual').checked,banner:$('#sbBanner').value.trim()});audit('settings_saved');saveData();toast(t('saved'));render()">${t('save')}</button></div></div>`;
  else if (ui.settingsTab === 'banking') body = `<div class="two-col"><div class="card"><div class="card-body"><div class="field"><label>${t('iban')}</label><input class="input" id="sbIban" value="${esc(b.iban)}" placeholder="BG00 XXXX 0000 0000 0000 00"></div><div class="grid-2"><div class="field"><label>${t('bank_name')}</label><input class="input" id="sbBank" value="${esc(b.bank)}"></div><div class="field"><label>${t('beneficiary')}</label><input class="input" id="sbBen" value="${esc(b.beneficiary)}"></div></div><button class="btn btn-primary" onclick="Object.assign(DB.building,{iban:$('#sbIban').value.trim().toUpperCase(),bank:$('#sbBank').value.trim(),beneficiary:$('#sbBen').value.trim()});audit('bank_saved');saveData();toast(t('saved'));render()">${t('save')}</button></div></div><div>${bankBox() || `<div class="card card-body muted">${t('bank_details')}</div>`}</div></div>`;
  else if (ui.settingsTab === 'security') body = `<div class="two-col"><div class="card"><div class="card-head"><h3>${t('change_password')}</h3></div><div class="card-body"><button class="btn btn-primary" onclick="openChangePassword()">${icon('key')}${t('change_password')}</button></div></div><div class="card"><div class="card-head"><h3>${t('access')}</h3></div><div class="card-body"><p class="muted small">${t('login_access_note')}</p></div></div></div>`;
  else if (ui.settingsTab === 'backup') body = `<div class="card"><div class="card-body stack"><div class="banner" style="margin:0">${icon('info')}<div>${t('storage_note')}</div></div><div class="row wrap"><button class="btn btn-primary" onclick="downloadFile('popova13_backup_'+todayISO()+'.json',JSON.stringify(DB,null,2),'application/json');audit('backup_exported')">${icon('download')}${t('export_json')}</button><button class="btn btn-secondary" onclick="exportCSV()">${icon('download')}${t('export_csv')}</button></div></div></div>`;
  else body = `<div class="card">${DB.audit.length ? `<div class="table-wrap"><table><thead><tr><th>${t('date')}</th><th>${t('username')}</th><th>${t('type')}</th><th>${t('description')}</th></tr></thead><tbody>${DB.audit.slice(0, 120).map(a => `<tr><td class="tabular small">${a.date.replace('T', ' ').slice(0, 16)}</td><td>${esc(a.by)}</td><td><code class="small">${esc(a.action)}</code></td><td class="small muted">${esc(a.detail)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('audit_empty')}</div>`}</div>`;
  return head(t('settings_title'), t('settings_sub')) + tabBar + body;
};
