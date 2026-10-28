/* ============ NOTARIX — shared app logic ============ */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUSES = ['For Submission', 'Submitted'];
/* Location always follows the status — staff never pick it manually */
const STATUS_LOCATION = { 'For Submission': 'Law Office', 'Submitted': 'Main Office' };

/* ---------- NOTARIX logo ----------
   Matches the office brand reference: a serif navy "N" over a document,
   circled by a gold swoosh with a gold pen nib. theme 'light' renders the
   navy-and-gold look for white backgrounds; theme 'dark' inverts the ink
   to ivory so the mark stays crisp on the navy/green app chrome. */
function notarixMark(size, theme = 'light') {
  const light = theme === 'light';
  const ink = light ? '#13294b' : '#f4f1e8';        // wordmark ink (navy / ivory)
  const docLine = light ? '#f8f7f2' : '#13294b';    // lines on the document
  const fold = light ? '#274b77' : '#dcd6c3';       // folded corner of the document
  const hole = light ? '#f8f7f2' : '#13294b';       // nib hole
  const gold = '#c5a45d';
  const goldDeep = '#a8873f';
  const id = `nxG${light ? 'L' : 'D'}`;
  return `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="${id}" x1="6" y1="82" x2="92" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#9c7c35"/><stop offset=".45" stop-color="${gold}"/><stop offset="1" stop-color="#dcc07c"/>
    </linearGradient>
  </defs>
  <path d="M56.5 6.5h19.4L88.5 19v27H56.5z" fill="${ink}"/>
  <path d="M75.9 6.5V19h12.6z" fill="${fold}"/>
  <path d="M63.5 29h16M63.5 35.5h16M63.5 42h9" stroke="${docLine}" stroke-width="3.4" stroke-linecap="round"/>
  <ellipse cx="46" cy="57" rx="41.5" ry="14.8" transform="rotate(-13.5 46 57)" stroke="url(#${id})" stroke-width="4.8" fill="none"/>
  <text x="8" y="89.5" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="77" fill="${ink}">N</text>
  <ellipse cx="46" cy="57" rx="41.5" ry="14.8" transform="rotate(-13.5 46 57)" stroke="url(#${id})" stroke-width="4.8" fill="none"
    pathLength="100" stroke-dasharray="0 55 41 4" stroke-linecap="round"/>
  <path d="M37.4 72.3C34 60.6 41.9 49.6 50.2 45.4l6.1 6.6c-2.2 10.5-8.8 18.8-16.2 21.2z" fill="url(#${id})" stroke="${goldDeep}" stroke-width=".8"/>
  <path d="M43.2 61.5 38.7 70" stroke="${goldDeep}" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="45.2" cy="56.4" r="2.3" fill="${hole}"/>
</svg>`;
}
const faviconSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="#13294b"/><path d="M54 11h17l11 11v21H54z" fill="#f4f1e8"/><path d="M71 11v11h11z" fill="#cfc8b4"/><path d="M61 29h13M61 35h13" stroke="#13294b" stroke-width="3" stroke-linecap="round"/><text x="14" y="82" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="56" fill="#f4f1e8">N</text><ellipse cx="47" cy="59" rx="39" ry="13.8" transform="rotate(-14 47 59)" stroke="#C5A45D" stroke-width="4.4" pathLength="100" stroke-dasharray="0 32 54 14" fill="none"/><path d="M37.5 74.5C34.7 62.5 42 51.5 49.8 47.8l6.3 6.6c-1.8 10.2-8.2 18.3-15.1 20.4z" fill="#C5A45D"/></svg>`);
function insertFavicon() {
  if (!document.querySelector('link[rel="icon"]')) {
    const l = document.createElement('link');
    l.rel = 'icon'; l.type = 'image/svg+xml';
    l.href = 'data:image/svg+xml,' + faviconSvg;
    document.head.appendChild(l);
  }
}
insertFavicon();

/* ---------- Icons ---------- */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="9.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5"/></svg>',
  records: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
  report: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M21.5 20h-19"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-6-6.7"/></svg>',
  docType: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 7.5 12 3l9 4.5M6 12v6M18 12v6M3 21h18"/></svg>',
  view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.9 10.9 0 0 1 12 20c-7 0-11-8-11-8a19 19 0 0 1 5.06-5.94M9.9 4.24A9.9 9.9 0 0 1 12 4c7 0 11 8 11 8a19 19 0 0 1-2.16 3.19M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  caret: '<svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/></svg>',
  arrowRight: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="17" rx="2"/><path d="M8 2.5V7M16 2.5V7M3 10.5h18"/></svg>',
  scales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M8 21h8M12 3 6 5.5M12 3l6 2.5M3.5 12 6 5.5l2.5 6.5a2.8 2.8 0 0 1-5 0zM15.5 12 18 5.5l2.5 6.5a2.8 2.8 0 0 1-5 0z"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 3.4c-.6 4-1.7 8-4.6 10.4-1.4 1.2-3.4 2-4.7 2.1l-2.6-2.6c.1-1.3.9-3.3 2.1-4.7C12.8 5.7 16.2 4.5 20.2 3.4z"/><path d="M4.5 20.5 15.6 9.4"/></svg>'
};

/* ---------- Helpers ---------- */
function badgeClass(status) {
  return { 'For Submission': 'for-submission', 'Submitted': 'submitted' }[status] || 'for-submission';
}
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + (d.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(dt)) return d;
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}
function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
function toast(msg, isError) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = '', 3200);
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
async function api(url, opts = {}) {
  const res = await fetch(url, { cache: 'no-store', ...opts });
  if (res.status === 401) { location.href = 'login.html'; throw new Error('unauthorized'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* Styled confirmation dialog (replaces window.confirm) */
function confirmAction({ title = 'Are you sure?', message = '', confirmText = 'Confirm', danger = true } = {}) {
  return new Promise(resolve => {
    let ov = document.getElementById('confirmOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'modal-overlay'; ov.id = 'confirmOverlay';
      ov.innerHTML = `
        <div class="modal modal-confirm">
          <div id="confirmIcon">${ICONS.trash}</div>
          <h3 id="confirmTitle"></h3>
          <p id="confirmMsg"></p>
          <div style="display:flex;gap:9px;justify-content:flex-end;">
            <button type="button" class="btn btn-outline" id="confirmNo">Cancel</button>
            <button type="button" class="btn btn-danger" id="confirmYes">${confirmText}</button>
          </div>
        </div>`;
      document.body.appendChild(ov);
    }
    ov.querySelector('#confirmTitle').textContent = title;
    ov.querySelector('#confirmMsg').textContent = message;
    const yes = ov.querySelector('#confirmYes'), no = ov.querySelector('#confirmNo'), icon = ov.querySelector('#confirmIcon');
    icon.innerHTML = danger ? ICONS.trash : ICONS.doc;
    yes.textContent = confirmText;
    yes.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
    ov.classList.add('open');
    const done = val => { ov.classList.remove('open'); yes.onclick = no.onclick = ov.onclick = null; resolve(val); };
    yes.addEventListener('click', () => done(true), { once: true });
    no.addEventListener('click', () => done(false), { once: true });
    ov.addEventListener('click', e => { if (e.target === ov) done(false); });
  });
}

/* Table row skeletons */
function skeletonRows(cols, rows = 5) {
  return Array.from({ length: rows }, () =>
    `<tr>${Array.from({ length: cols }, (_, i) =>
      `<td><div class="skeleton" style="width:${60 + ((i * 37) % 30)}%"></div></td>`).join('')}</tr>`).join('');
}
/* Loading / empty / error states for tables */
function stateRow(message, sub = '') {
  return `<tr><td colspan="10"><div class="state">${sub ? sub : ''}<div class="state-title">${esc(message)}</div></div></td></tr>`;
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ---------- App shell (sidebar + topbar) ---------- */
const NAV_MAIN = [
  { href: 'dashboard.html', label: 'Dashboard', icon: 'dashboard', match: 'dashboard' },
  { href: 'records.html',   label: 'Notarization Records', icon: 'records', match: 'records' },
  { href: 'reports.html',   label: 'Reports', icon: 'report', match: 'reports' }
];
const NAV_ADMIN = [
  { href: 'users.html',          label: 'Staff Accounts',   icon: 'users',   match: 'users' },
  { href: 'document-types.html', label: 'Document Types',   icon: 'docType', match: 'document-types' },
  { href: 'settings.html',       label: 'Office Settings',  icon: 'settings', match: 'settings' }
];
const PAGE_TITLES = {
  dashboard: 'Dashboard', records: 'Notarization Records',
  'add-record': 'New Notarization Record', search: 'Search Records',
  status: 'Document Status & Location', reports: 'Reports',
  users: 'Staff Accounts', 'document-types': 'Document Types', settings: 'Office Settings'
};
function userInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ? parts[0][0] : '?')).toUpperCase();
}

async function initShell() {
  const page = location.pathname.split('/').pop().replace('.html', '');
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  const scrim = document.getElementById('scrim');
  const menuBtn = document.getElementById('menuBtn');

  let user = null;
  try {
    user = await api('/api/auth/me');
  } catch (e) { return null; }
  window.CURRENT_USER = user;
  const isAdmin = user.role === 'Admin';

  const navLinks = list => list.map(n =>
    `<a href="${n.href}" class="${page === n.match ? 'active' : ''}">${ICONS[n.icon]}${n.label}</a>`).join('');

  sidebar.innerHTML = `
    <div class="brand">
      <div class="brand-mark">${notarixMark(40, 'dark')}</div>
      <span class="brand-name">NOTARIX</span>
      <span class="brand-rule"></span>
    </div>
    <nav class="side-main">
      ${navLinks(NAV_MAIN)}
      ${isAdmin ? `<div class="nav-label">Administration</div>${navLinks(NAV_ADMIN)}` : ''}
    </nav>
    <div class="side-bottom">
      <div class="nav-divider"></div>
      <button class="logout-btn" id="sideLogout">${ICONS.logout}Logout</button>
    </div>`;

  const menuBtnSvg = document.getElementById('menuBtn');
  if (menuBtnSvg) menuBtnSvg.innerHTML = ICONS.menu;

  /* topbar: breadcrumb + notifications + user */
  if (topbar) {
    const pageTitle = PAGE_TITLES[page] || 'Dashboard';
    topbar.innerHTML = `
      <div class="crumbs">
        <span class="crumbs-app">NOTARIX</span><span class="crumbs-sep">/</span><b class="crumbs-page">${pageTitle}</b>
      </div>
      <div class="top-right">
        <div class="bell-wrap" id="bellWrap">
          <button class="bell-btn" id="bellBtn" title="Notifications">${ICONS.bell}<span class="dot" id="bellDot"></span></button>
          <div class="bell-menu" id="bellMenu"></div>
        </div>
        <span class="topbar-sep"></span>
        <div class="user-chip" id="userChip">
          <div class="avatar">${userInitials(user.name)}</div>
          <span class="chip-name">${esc(user.name)}<span class="chip-role">${esc(user.role)}</span></span>
          ${ICONS.caret}
        </div>
        <div class="user-menu" id="userMenu">
          <div class="u-info"><b>${esc(user.name)}</b><span>${esc(user.email)} · ${esc(user.role)}</span></div>
          <button id="menuLogout">${ICONS.logout}Log out</button>
        </div>
      </div>`;
    const chip = document.getElementById('userChip');
    const menu = document.getElementById('userMenu');
    const bellBtn = document.getElementById('bellBtn');
    const bellDot = document.getElementById('bellDot');
    const bellMenu = document.getElementById('bellMenu');
    chip.addEventListener('click', e => { menu.classList.toggle('open'); e.stopPropagation(); });
    document.addEventListener('click', e => {
      if (!chip.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('open');
      if (!bellBtn.contains(e.target)) bellMenu.classList.remove('open');
    });
    const logoutFn = async () => {
      await api('/api/auth/logout', { method: 'POST' });
      localStorage.setItem('notarium_logged_out', '1');
      location.href = 'login.html';
    };
    document.getElementById('menuLogout').addEventListener('click', logoutFn);
    document.getElementById('sideLogout').addEventListener('click', logoutFn);

    /* notifications: records waiting for submission */
    let pending = null;
    try { pending = await api('/api/records?status=' + encodeURIComponent('For Submission') + '&limit=4&page=1'); } catch {}
    const count = pending ? pending.total : 0;
    if (count === 0) bellDot.style.display = 'none';
    bellMenu.innerHTML = count === 0
      ? `<div class="bell-empty">No documents waiting for submission.</div>`
      : (pending.rows.map(r => `
          <button class="bell-item" onclick="location.href='search.html?q=${encodeURIComponent(r.doc_number)}'">
            <b>${esc(r.doc_number)}</b><span>${esc(r.client_name)} · ${esc(r.doc_type)}</span>
          </button>`).join('')
        + `<a class="bell-foot" href="status.html">Track document locations</a>`);
    bellBtn.addEventListener('click', e => { bellMenu.classList.toggle('open'); e.stopPropagation(); });
  }

  /* sidebar toggle: collapse on desktop, off-canvas on mobile */
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (window.innerWidth > 980) {
        sidebar.classList.toggle('collapsed');
      } else {
        const open = sidebar.classList.toggle('open');
        if (scrim) scrim.classList.toggle('show', open);
      }
    });
  }
  if (scrim) scrim.addEventListener('click', () => {
    sidebar.classList.remove('open'); scrim.classList.remove('show');
  });

  return user;
}
