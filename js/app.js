/* ============================================================
   App core — icons, shell, auth, routing, modals, notifications
   ============================================================ */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  wallet: '<path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H6a2 2 0 0 0-2 2v2"/><circle cx="16" cy="14" r="1.5"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  vote: '<path d="M9 12l2 2 4-5"/><path d="M5 21h14a2 2 0 0 0 2-2v-8H3v8a2 2 0 0 0 2 2z"/><path d="M7 11V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6"/>',
  news: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5A5 5 0 0 1 21.5 20"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2M10 22v-4h4v4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6L9 17l-5-5"/>', chevron_l: '<path d="M15 18l-6-6 6-6"/>', chevron_r: '<path d="M9 18l6-6-6-6"/>', chevron_d: '<path d="M6 9l6 6 6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  car: '<path d="M5 17h14M3 12l2-5h14l2 5v6H3z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
  door: '<path d="M6 3h12v18H6z"/><circle cx="15" cy="12" r="1"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M10.9 12.1L21 2M15 8l3 3M18 5l3 3"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  trend: '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/>',
  mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M22 6l-10 7L2 6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pin: '<path d="M12 17v5M9 3h6l-1 7 3 3H7l3-3z"/>', camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  receipt: '<path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- state ---------- */
let currentUser = null;        // {id, role:'admin'|'resident', unitId, name} — id is the Supabase Auth user id
let route = 'home';
let ui = { finTab: 'overview', matrixYear: new Date().getFullYear(), calDate: new Date(), reqFilter: 'open', unitTab: 'all', settingsTab: 'building', notifOpen: false, sidebarOpen: false };

/* ---------- theme ---------- */
function applyTheme() {
  const pref = localStorage.getItem('ps13_theme') || 'auto';
  const dark = pref === 'dark' || (pref === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  $('meta[name=theme-color]').setAttribute('content', dark ? '#0f1422' : '#16213a');
}
function toggleTheme() { const cur = document.documentElement.getAttribute('data-theme'); localStorage.setItem('ps13_theme', cur === 'dark' ? 'light' : 'dark'); applyTheme(); render(); }
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

/* ---------- toast ---------- */
function toast(msg, type = 'ok') {
  const el = document.createElement('div'); el.className = 'toast' + (type === 'err' ? ' err' : ''); el.innerHTML = icon(type === 'err' ? 'alert' : 'check') + esc(msg);
  $('#toasts').appendChild(el); setTimeout(() => el.remove(), 2600);
}

/* ---------- modal ---------- */
function openModal({ title, body, footer = '', wide = false, onOpen }) {
  closeModal();
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'modal';
  ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="modal-head"><h2>${title}</h2><button class="btn btn-ghost btn-icon right" onclick="closeModal()" aria-label="${t('close')}">${icon('x')}</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}</div>`;
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
  document.body.appendChild(ov); document.body.style.overflow = 'hidden';
  const first = ov.querySelector('input,textarea,select'); if (first) setTimeout(() => first.focus(), 50);
  if (onOpen) onOpen(ov);
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); document.body.style.overflow = ''; }
function confirmDialog(msg, onYes) {
  openModal({ title: t('confirm_delete').split('?')[0] + '?', body: `<p>${esc(msg || t('confirm_delete'))}</p>`, footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-danger" id="confirmYes">${t('delete')}</button>`, onOpen: ov => $('#confirmYes', ov).onclick = () => { closeModal(); onYes(); } });
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); ui.notifOpen = false; } });

/* ---------- auth (Supabase Auth — email + password, real server-side verification) ---------- */
function isAdmin() { return currentUser && currentUser.role === 'admin'; }
function myUnit() { return currentUser ? DB.units.find(u => u.id === currentUser.unitId) : null; }

// Resolves the signed-in Supabase user into currentUser via their `profiles` row.
// Returns true on success; on any mismatch (no profile, or profile points at a
// unit that no longer exists) it signs the user back out and returns false.
async function establishCurrentUser(authUser) {
  const { data: profile, error } = await sb.from('profiles').select('*').eq('id', authUser.id).single();
  if (error || !profile) { await sb.auth.signOut(); return false; }
  const ok = await loadRemoteData();
  if (!ok) { await sb.auth.signOut(); return false; }
  if (profile.is_admin) {
    currentUser = { id: authUser.id, role: 'admin', unitId: null, name: DB.building.managerName || t('role_admin') };
    return true;
  }
  const unit = DB.units.find(u => u.id === profile.unit_id);
  if (!unit) { await sb.auth.signOut(); return false; }
  currentUser = { id: authUser.id, role: 'resident', unitId: unit.id, name: unit.owner };
  return true;
}
async function tryLogin(email, password) {
  email = (email || '').trim(); password = password || '';
  if (!email || !password) return false;
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return false;
  return await establishCurrentUser(data.user);
}
async function doLogin() {
  $('#loginBtn').disabled = true;
  const ok = await tryLogin($('#loginUser').value, $('#loginPass').value);
  $('#loginBtn').disabled = false;
  if (!ok) { $('#loginErr').hidden = false; $('#loginPass').select(); return; }
  subscribeRealtime();
  audit('login'); saveData(); route = 'home'; render();
}
async function doLogout() { audit('logout'); saveData(); await sb.auth.signOut(); currentUser = null; DB_SNAPSHOT = null; DB = emptyData(); await fetchPublicBuildingName(); ui.sidebarOpen = false; render(); }
async function restoreSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return false;
  const ok = await establishCurrentUser(session.user);
  if (ok) subscribeRealtime();
  return ok;
}

/* ---------- navigation ---------- */
function navItems() {
  const items = [
    { id: 'home', icon: 'home', label: t('nav_home'), section: 'section_main' },
    { id: 'finances', icon: 'wallet', label: t('nav_finances') },
    { id: 'requests', icon: 'inbox', label: t('nav_requests'), count: isAdmin() ? DB.requests.filter(r => r.status === 'new').length : 0 },
    { id: 'votes', icon: 'vote', label: t('nav_votes'), count: activeVotesFor().length },
    { id: 'news', icon: 'news', label: t('nav_news'), section: 'section_building' },
    { id: 'calendar', icon: 'calendar', label: t('nav_calendar') },
    { id: 'documents', icon: 'folder', label: t('nav_documents') },
    { id: 'directory', icon: 'users', label: t('nav_directory') },
  ];
  if (isAdmin()) items.push({ id: 'units', icon: 'building', label: t('nav_units'), section: 'section_admin' }, { id: 'settings', icon: 'settings', label: t('nav_settings') });
  else items.push({ id: 'profile', icon: 'user', label: t('nav_profile'), section: 'section_admin' });
  return items;
}
function go(r) { route = r; ui.sidebarOpen = false; ui.notifOpen = false; window.scrollTo({ top: 0 }); render(); }
function activeVotesFor() { const today = todayISO(); return DB.votes.filter(v => !v.closed && v.deadline >= today && !(v.ballots && v.ballots[currentUser && currentUser.unitId])); }

/* ---------- notifications ----------
   "read since" is per-device UI state (like the theme choice), not shared
   business data, so it lives in localStorage rather than the database. */
function readMarksGet() { try { return JSON.parse(localStorage.getItem('ps13_read_marks') || '{}'); } catch (e) { return {}; } }
function readMarksSet(key, val) { const m = readMarksGet(); m[key] = val; try { localStorage.setItem('ps13_read_marks', JSON.stringify(m)); } catch (e) { } }
function notifications() {
  if (!currentUser) return [];
  const seen = readMarksGet()[currentUser.id] || '1970-01-01';
  const items = [];
  DB.news.forEach(n => { if (n.date > seen) items.push({ date: n.date, icon: 'news', cls: 'blue', text: t('n_news') + ': ' + n.title, route: 'news' }); });
  DB.votes.forEach(v => { if (!v.closed && v.created > seen) items.push({ date: v.created, icon: 'vote', cls: 'violet', text: t('n_vote') + ': ' + v.title, route: 'votes' }); });
  const soon = new Date(); soon.setDate(soon.getDate() + 7);
  DB.events.forEach(e => { if (e.date >= todayISO() && e.date <= monthISO(soon) + '-' + String(soon.getDate()).padStart(2, '0')) items.push({ date: e.date, icon: 'calendar', cls: 'amber', text: t('n_event') + ': ' + e.title + ' · ' + fmtDate(e.date), route: 'calendar' }); });
  if (isAdmin()) DB.requests.forEach(r => { if (r.status === 'new' && r.date > seen) items.push({ date: r.date, icon: 'inbox', cls: 'red', text: t('n_request') + ' ' + unitLabel(DB.units.find(u => u.id === r.unitId)) + ': ' + r.subject, route: 'requests' }); });
  else DB.requests.filter(r => r.unitId === currentUser.unitId).forEach(r => { (r.comments || []).forEach(c => { if (c.by === 'admin' && c.date > seen) items.push({ date: c.date, icon: 'inbox', cls: 'green', text: t('n_reply') + ': ' + r.subject, route: 'requests' }); }); });
  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
}
function markAllRead() { readMarksSet(currentUser.id, todayISO()); ui.notifOpen = false; render(); }

/* ---------- render shell ---------- */
function render() {
  const root = $('#root');
  if (!currentUser) { root.innerHTML = renderLogin(); return; }
  const items = navItems(); let nav = ''; let lastSection = null;
  items.forEach(it => {
    if (it.section && it.section !== lastSection) { nav += `<div class="nav-label">${t(it.section)}</div>`; lastSection = it.section; }
    nav += `<div class="nav-item ${route === it.id ? 'active' : ''}" onclick="go('${it.id}')">${icon(it.icon)}<span>${it.label}</span>${it.count ? `<span class="count">${it.count}</span>` : ''}</div>`;
  });
  const notifs = notifications(); const initials = currentUser.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bottom = [items[0], items[1], items[2], items[3], { id: '__more', icon: 'more', label: t('nav_more') }];
  root.innerHTML = `
  <div id="app">
    ${ui.sidebarOpen ? '<div class="scrim" onclick="ui.sidebarOpen=false;render()"></div>' : ''}
    <aside class="sidebar ${ui.sidebarOpen ? 'open' : ''}">
      <div class="brand"><img src="assets/logo.svg" alt=""><div><b>${esc(DB.building.name)}</b><small>${t('app_sub')}</small></div></div>
      ${nav}
      <div class="user"><div class="avatar">${esc(initials)}</div><div class="grow" style="min-width:0"><div style="font-weight:600;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(currentUser.name)}</div><div class="tiny subtle">${isAdmin() ? t('role_admin') : unitLabel(myUnit())}</div></div><button class="btn btn-ghost btn-icon" title="${t('logout')}" onclick="doLogout()">${icon('logout')}</button></div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="btn btn-ghost btn-icon menu-btn" onclick="ui.sidebarOpen=!ui.sidebarOpen;render()" aria-label="menu">${icon('menu')}</button>
        <div class="title">${items.find(i => i.id === route) ? items.find(i => i.id === route).label : ''}</div>
        <div class="right row" style="gap:4px;position:relative">
          <div class="segmented hide-mobile"><button class="${LANG === 'bg' ? 'active' : ''}" onclick="setLang('bg');render()">BG</button><button class="${LANG === 'en' ? 'active' : ''}" onclick="setLang('en');render()">EN</button></div>
          <button class="btn btn-ghost btn-icon show-mobile" onclick="setLang(LANG==='bg'?'en':'bg');render()" title="${t('language')}">${icon('globe')}</button>
          <button class="btn btn-ghost btn-icon" onclick="toggleTheme()" title="${t('theme')}">${icon(dark ? 'sun' : 'moon')}</button>
          <button class="btn btn-ghost btn-icon bell" onclick="ui.notifOpen=!ui.notifOpen;render()" title="${t('notif_title')}">${icon('bell')}${notifs.length ? `<span class="count">${notifs.length}</span>` : ''}</button>
          ${ui.notifOpen ? `<div class="popover"><div class="card-head"><h3>${t('notif_title')}</h3><button class="btn btn-ghost btn-sm right" onclick="markAllRead()">${t('mark_read')}</button></div><div class="list">${notifs.length ? notifs.map(n => `<div class="list-item clickable" onclick="go('${n.route}')"><div class="ic ${n.cls}">${icon(n.icon)}</div><div><div>${esc(n.text)}</div><div class="tiny subtle">${fmtDate(n.date)}</div></div></div>`).join('') : `<div class="empty">${t('notif_empty')}</div>`}</div></div>` : ''}
        </div>
      </header>
      <main class="content"><div class="page" id="page"></div></main>
      <nav class="bottom-nav">${bottom.map(b => `<button class="${route === b.id ? 'active' : ''}" onclick="${b.id === '__more' ? 'ui.sidebarOpen=true;render()' : `go('${b.id}')`}">${icon(b.icon)}<span>${b.label}</span></button>`).join('')}</nav>
    </div>
  </div>`;
  const pageFn = PAGES[route] || PAGES.home;
  $('#page').innerHTML = pageFn();
  if (typeof afterRender === 'function') afterRender();
}

/* ---------- login page ---------- */
function renderLogin() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return `<div id="login">
    <div class="login-topbar"><div class="segmented"><button class="${LANG === 'bg' ? 'active' : ''}" onclick="setLang('bg');render()">BG</button><button class="${LANG === 'en' ? 'active' : ''}" onclick="setLang('en');render()">EN</button></div><button class="btn btn-secondary btn-icon" onclick="toggleTheme()">${icon(dark ? 'sun' : 'moon')}</button></div>
    <section class="login-hero">
      <img class="bg" src="assets/building.svg" alt="">
      <div class="brand"><img src="assets/logo.svg" alt=""><div><b style="font-size:1.05rem">${esc(DB.building.name)}</b><div class="small" style="opacity:.75">${t('city')}</div></div></div>
      <div><h1>${t('login_tagline')}</h1><p style="opacity:.8;max-width:420px">${t('app_sub')}</p>
        <div class="feats"><span>${icon('check')}${t('login_feat1')}</span><span>${icon('check')}${t('login_feat2')}</span><span>${icon('check')}${t('login_feat3')}</span></div></div>
    </section>
    <section class="login-form"><div class="login-card">
      <h2>${t('welcome_back')}</h2><p class="muted" style="margin-bottom:22px">${t('login_hint')}</p>
      <div class="field"><label>${t('username')}</label><input class="input" id="loginUser" autocomplete="username" autocapitalize="off" onkeydown="if(event.key==='Enter')doLogin()"></div>
      <div class="field"><label>${t('password')}</label><div class="pw-wrap"><input class="input" id="loginPass" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"><button class="pw-toggle" type="button" onclick="togglePw('loginPass',this)">${t('show_password')}</button></div></div>
      <div class="error" id="loginErr" hidden>${t('login_error')}</div>
      <button class="btn btn-primary btn-block" id="loginBtn" style="margin-top:8px;padding:12px" onclick="doLogin()">${t('login')}</button>
      <div style="text-align:center;margin-top:14px"><a href="#" onclick="toast(t('forgot_hint'));return false" class="small">${t('forgot')}</a></div>
      <p class="tiny subtle" style="margin-top:18px">${t('install_hint')}</p>
    </div></section>
  </div>`;
}
function togglePw(id, btn) { const i = $('#' + id); i.type = i.type === 'password' ? 'text' : 'password'; btn.textContent = i.type === 'password' ? t('show_password') : t('hide_password'); }

/* ---------- password change ----------
   Passwords now live in Supabase Auth, not in our own tables — changing one
   just re-authenticates the already-signed-in user via the Supabase client.
   Forgotten passwords are reset by the building manager from the Supabase
   dashboard (see supabase/README.md), same as creating a login in the first
   place — there is no self-service recovery code any more. */
function openChangePassword() {
  openModal({ title: t('change_password'), body: `
    <div class="field"><label>${t('new_password')}</label><input class="input" type="password" id="cpNew"></div>
    <div class="field"><label>${t('confirm_password')}</label><input class="input" type="password" id="cpConf"></div><div class="error" id="cpErr" hidden></div>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">${t('cancel')}</button><button class="btn btn-primary" id="cpSave">${t('save')}</button>`,
    onOpen: ov => { $('#cpSave', ov).onclick = async () => {
      const nw = $('#cpNew').value, cf = $('#cpConf').value, err = $('#cpErr');
      const fail = m => { err.textContent = m; err.hidden = false; };
      if (nw.length < 6) return fail(t('pw_short')); if (nw !== cf) return fail(t('pw_mismatch'));
      const { error } = await sb.auth.updateUser({ password: nw });
      if (error) return fail(error.message);
      audit('password_changed'); saveData(); closeModal(); toast(t('pw_changed'));
    }; }
  });
}
function copyText(s) { navigator.clipboard && navigator.clipboard.writeText(s).then(() => toast(t('copied'))); }

/* ---------- boot ---------- */
async function boot() {
  applyTheme(); setLang(LANG);
  await fetchPublicBuildingName();   // so the login screen shows the real building name
  await restoreSession();            // resumes a previous Supabase session, if any
  render();
}
boot();
