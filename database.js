// ============================================================
// TYRETRACK — DATABASE & AUTH SYSTEM (Supabase)
// ============================================================

const SUPABASE_URL = 'https://miptmwevpsfaaggypwdp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1Qo7BI_cDEnb_5EquHURFg_KW9SUglg';
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const SESSION_KEY = 'tyretrack_session';

// ---- Default users ----
const DEFAULT_USERS = [
  { id: 'u1', name: 'Administrator 1', email: 'taseklusive1@gmail.com',    password: 'Taseklusive01', role: 'administrator', color: '#7c3aed', initial: 'A' },
  { id: 'u2', name: 'Administrator 2', email: 'taseklusive2@gmail.com',    password: 'Taseklusive02', role: 'administrator', color: '#4f46e5', initial: 'A' },
  { id: 'u3', name: 'Supervisor 1',    email: 'taseklusivespv1@gmail.com', password: 'Taseklusivespv01', role: 'supervisor',  color: '#2563eb', initial: 'S' },
  { id: 'u4', name: 'Supervisor 2',    email: 'taseklusivespv2@gmail.com', password: 'Taseklusivespv02', role: 'supervisor',  color: '#0ea5e9', initial: 'S' },
];

// ---- Supabase helpers ----
async function supaUpsert(table, id, data) {
  try {
    await supa.from(table).upsert({ id: String(id), data: data });
  } catch(e) { console.warn('supaUpsert error', table, e); }
}
async function supaDelete(table, id) {
  try {
    await supa.from(table).delete().eq('id', String(id));
  } catch(e) { console.warn('supaDelete error', table, e); }
}
async function supaLoadAll(table) {
  try {
    const { data } = await supa.from(table).select('*');
    return (data || []).map(r => r.data);
  } catch(e) { return []; }
}
async function supaUpsertClaim(claim) {
  try { await supa.from('claims').upsert({ id: String(claim.id), data: claim }); }
  catch(e) { console.warn('supaUpsertClaim error', e); }
}
async function supaUpsertNotif(notif) {
  try { await supa.from('sales_notifications').upsert({ id: String(notif.id), data: notif }); }
  catch(e) { console.warn('supaUpsertNotif error', e); }
}
async function supaUpsertTechNotif(notif) {
  try { await supa.from('tech_notifications').upsert({ id: String(notif.id), data: notif }); }
  catch(e) { console.warn('supaUpsertTechNotif error', e); }
}
async function loadSalesNotifications() {
  try {
    const { data } = await supa.from('sales_notifications').select('*');
    if (data && data.length > 0) SALES_NOTIFICATIONS = data.map(r => r.data).filter(Boolean);
  } catch(e) { console.warn('loadSalesNotifications error', e); }
}
async function loadTechNotifications() {
  try {
    const { data } = await supa.from('tech_notifications').select('*');
    if (data && data.length > 0 && typeof TECH_NOTIFICATIONS !== 'undefined') {
      TECH_NOTIFICATIONS = data.map(r => r.data).filter(Boolean)
        .sort((a,b) => new Date(b.date) - new Date(a.date));
    }
  } catch(e) { console.warn('loadTechNotifications error', e); }
}
async function loadRolePerms() {
  try {
    const { data, error } = await supa.from('role_permissions').select('*');
    if (error || !data || !data.length) return;
    data.forEach(row => { if (DEFAULT_ROLE_PERMS[row.role]) rolePerms[row.role] = { menus: row.menus, actions: row.actions }; });
  } catch(e) { console.warn('loadRolePerms error', e); }
}
async function saveRolePermsToSupabase(roleKey) {
  try {
    await supa.from('role_permissions').upsert({
      role: roleKey, menus: rolePerms[roleKey].menus, actions: rolePerms[roleKey].actions,
      updated_at: new Date().toISOString()
    }, { onConflict: 'role' });
  } catch(e) { console.warn('saveRolePermsToSupabase error', e); }
}
function applyRolePermsToNav() {
  if (!currentUser || currentUser.role === 'administrator') return;
  const perms = rolePerms[currentUser.role];
  if (!perms) return;
  const NAV_MAP = {
    'nav-dashboard':'dashboard','nav-vehicles':'vehicles','nav-customer':'customer',
    'nav-monitoring':'monitoring','nav-alerts':'alerts','nav-claims':'claims',
    'nav-duty':'duty','nav-closing':'closing','nav-laporan':'laporan',
    'nav-kpi':'kpi','nav-settings':'settings','nav-users':'users',
  };
  Object.entries(NAV_MAP).forEach(([navId, menuKey]) => {
    const el = document.getElementById(navId);
    if (!el) return;
    el.style.display = perms.menus[menuKey] ? '' : 'none';
  });
}

// ---- Sync all state to Supabase ----
async function syncToSupabase() {
  try {
    const tbls = [
      ['vehicles', typeof vehicles !== 'undefined' ? vehicles : []],
      ['trial_vehicles', typeof trialVehicles !== 'undefined' ? trialVehicles : []],
      ['alerts', typeof alerts !== 'undefined' ? alerts : []],
      ['claims', typeof claims !== 'undefined' ? claims : []],
      ['pelumas_records', typeof pelumasRecords !== 'undefined' ? pelumasRecords : []],
      ['pelumas_trial_records', typeof pelumasTrialRecords !== 'undefined' ? pelumasTrialRecords : []],
      ['duty_trips', typeof dutyTrips !== 'undefined' ? dutyTrips : []],
      ['closing_history', typeof closingHistory !== 'undefined' ? closingHistory : []],
    ];
    for (const [tbl, arr] of tbls) {
      for (const item of arr) {
        if (item && item.id) await supaUpsert(tbl, item.id, item);
      }
    }
  } catch(e) { console.warn('syncToSupabase error', e); }
}

// ---- Load all state from Supabase ----
async function loadFromSupabase() {
  try {
    const [v, tv, al, cl, pr, ptr, dt, ch] = await Promise.all([
      supaLoadAll('vehicles'),
      supaLoadAll('trial_vehicles'),
      supaLoadAll('alerts'),
      supaLoadAll('claims'),
      supaLoadAll('pelumas_records'),
      supaLoadAll('pelumas_trial_records'),
      supaLoadAll('duty_trips'),
      supaLoadAll('closing_history'),
    ]);
    if (v.length  && typeof vehicles !== 'undefined') vehicles = v;
    if (tv.length && typeof trialVehicles !== 'undefined') trialVehicles = tv;
    if (al.length && typeof alerts !== 'undefined') alerts = al;
    if (cl.length && typeof claims !== 'undefined') claims = cl;
    if (pr.length && typeof pelumasRecords !== 'undefined') pelumasRecords = pr;
    if (ptr.length && typeof pelumasTrialRecords !== 'undefined') pelumasTrialRecords = ptr;
    if (dt.length && typeof dutyTrips !== 'undefined') dutyTrips = dt;
    if (ch.length && typeof closingHistory !== 'undefined') closingHistory = ch;
    if (cl.length) CLAIMS = cl;
    await loadSalesNotifications();
    await loadTechNotifications();
    await loadRolePerms();
    return true;
  } catch(e) { return false; }
}

// ---- Load users dari Supabase; fallback ke DEFAULT_USERS jika gagal ----
async function supaGetUsers() {
  try {
    const { data, error } = await supa.from('users').select('*');
    if (!error && data && data.length > 0) return data;
    // Fallback: gunakan akun default yang tertanam
    return DEFAULT_USERS;
  } catch(e) { return DEFAULT_USERS; }
}

const ROLE_LABELS = {
  administrator: 'Administrator',
  supervisor: 'Supervisor',
  technical_support: 'Technical Support',
  sales: 'Sales',
  sales_counter: 'Sales Counter',
  viewer: 'Viewer',
};

// ---- Session ----
function sessionGet() {
  try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; }
  catch(e) { return null; }
}
function sessionSet(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function sessionClear() { localStorage.removeItem(SESSION_KEY); }

// ---- Login logic ----
function loginAs(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  doLogin();
}

// ── Navigasi antara Login & Register ──
function showRegister() {
  document.getElementById('login-page').classList.add('hidden');
  const rp = document.getElementById('register-page');
  rp.classList.add('active');
  setTimeout(() => rp.classList.remove('hidden'), 10);
  // Reset form register
  ['reg-name','reg-email','reg-phone','reg-password','reg-password2'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('reg-error').classList.remove('show');
  document.getElementById('reg-success').classList.remove('show');
}

function showLogin() {
  const rp = document.getElementById('register-page');
  rp.classList.add('hidden');
  setTimeout(() => rp.classList.remove('active'), 400);
  const lp = document.getElementById('login-page');
  lp.classList.remove('hidden');
}

// ── Registrasi akun baru ──
async function doRegister() {
  const name      = (document.getElementById('reg-name').value || '').trim();
  const email     = (document.getElementById('reg-email').value || '').trim().toLowerCase();
  const phone     = (document.getElementById('reg-phone').value || '').trim();
  const password  = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  const errEl     = document.getElementById('reg-error');
  const sucEl     = document.getElementById('reg-success');
  const btn       = document.getElementById('reg-btn');

  errEl.classList.remove('show');
  sucEl.classList.remove('show');

  // Validasi
  if (!name)              { errEl.textContent = 'Nama lengkap wajib diisi.'; errEl.classList.add('show'); return; }
  if (!email)             { errEl.textContent = 'Email wajib diisi.'; errEl.classList.add('show'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Format email tidak valid.'; errEl.classList.add('show'); return; }
  if (!password)          { errEl.textContent = 'Password wajib diisi.'; errEl.classList.add('show'); return; }
  if (password.length < 6){ errEl.textContent = 'Password minimal 6 karakter.'; errEl.classList.add('show'); return; }
  if (password !== password2){ errEl.textContent = 'Konfirmasi password tidak cocok.'; errEl.classList.add('show'); return; }

  // Loading
  btn.disabled = true;
  btn.textContent = 'Mendaftarkan...';

  try {
    // Cek email sudah terdaftar
    const { data: existing, error: checkErr } = await supa.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) {
      errEl.textContent = 'Email ini sudah terdaftar. Silakan login.';
      errEl.classList.add('show');
      btn.disabled = false;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Daftar';
      return;
    }

    // Generate ID unik
    const newId = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const initial = name.charAt(0).toUpperCase();
    const colors = ['#059669','#2563eb','#7c3aed','#d97706','#0e7490','#db2777','#65a30d'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newUser = {
      id: newId,
      name: name,
      email: email,
      password: password,
      role: 'viewer',      // semua akun baru = viewer
      color: color,
      initial: initial,
      phone: phone || null,
    };

    const { error: insertErr } = await supa.from('users').insert(newUser);
    if (insertErr) {
      errEl.textContent = 'Gagal mendaftar: ' + (insertErr.message || 'Coba lagi.');
      errEl.classList.add('show');
      btn.disabled = false;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Daftar';
      return;
    }

    // Berhasil!
    sucEl.textContent = '✅ Akun berhasil dibuat! Silakan login dengan email dan password Anda.';
    sucEl.classList.add('show');
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Daftar';

    // Isi otomatis email di form login lalu pindah ke login
    setTimeout(() => {
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = '';
      showLogin();
    }, 2000);

  } catch(e) {
    errEl.textContent = 'Koneksi bermasalah. Coba lagi.';
    errEl.classList.add('show');
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Daftar';
  }
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');
  const loginBtn = document.querySelector('.login-btn');
  errorEl.classList.remove('show');

  // Tampilkan loading di tombol
  if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = 'Memuat...'; }

  const resetBtn = () => {
    if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Masuk'; }
  };

  // 1. Ambil daftar user dari Supabase
  let users;
  try { users = await supaGetUsers(); }
  catch(e) { users = DEFAULT_USERS; }

  // 2. Cocokkan email & password — cek Supabase dulu, fallback ke DEFAULT_USERS
  let user = users.find(u => u.email && u.email.toLowerCase() === email && u.password === password);
  // Fallback: cek DEFAULT_USERS jika tidak ketemu di Supabase (misal data Supabase berbeda)
  if (!user) {
    user = DEFAULT_USERS.find(u => u.email && u.email.toLowerCase() === email && u.password === password);
  }
  if (!user) {
    errorEl.textContent = 'Email atau password salah. Coba lagi.';
    errorEl.classList.add('show');
    document.getElementById('login-password').value = '';
    resetBtn();
    return;
  }

  // 3. Simpan sesi
  sessionSet(user);

  // 3b. Set currentUser SEGERA dari data login (sebelum async Supabase selesai)
  //     agar inputBy selalu terisi dengan benar saat tambah kendaraan
  currentUser = {
    id: user.id,
    name: user.name,
    username: user.username || user.email.split('@')[0],
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    avatar: user.initial || user.name[0].toUpperCase(),
    avatarColor: user.color || '#6b7280',
  };

  // 4. Load data operasional (tidak blokir login jika gagal)
  try { await loadFromSupabase(); } catch(e) { console.warn('loadFromSupabase:', e); }

  // 5. Terapkan sesi & tampilkan app
  applySession(user);
  applyRolePermsToNav();

  // 6. Mulai Supabase Realtime subscription
  if (typeof startRealtimeSubscription === 'function') {
    if (_realtimeChannel) supa.removeChannel(_realtimeChannel);
    _realtimeChannel = startRealtimeSubscription();
  }

  const loginPage = document.getElementById('login-page');
  loginPage.classList.add('hidden');
  document.body.classList.remove('login-active');
  setTimeout(() => { loginPage.style.display = 'none'; }, 400);

  document.getElementById('db-info-bar').classList.add('show');
  document.getElementById('db-info-text').textContent =
    `Database: Supabase ☁️ · Pengguna: ${user.name} (${ROLE_LABELS[user.role] || user.role}) · Data tersimpan online`;
  document.getElementById('app').style.paddingTop = '38px';

  resetBtn();
}

function doLogout() {
  if (!confirm('Keluar dari TyreTrack?')) return;
  sessionClear();
  if (_realtimeChannel) { supa.removeChannel(_realtimeChannel); _realtimeChannel = null; }
  const ib = document.getElementById('db-info-bar');
  if (ib) { ib.classList.remove('show'); ib.style.removeProperty('display'); }
  const appEl = document.getElementById('app');
  if (appEl) appEl.style.paddingTop = '0';
  // Reset login form
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').classList.remove('show');
  // Show login page
  const lp = document.getElementById('login-page');
  lp.style.display = 'flex';
  lp.style.opacity = '0';
  document.body.classList.add('login-active');
  requestAnimationFrame(() => { lp.style.opacity = '1'; lp.classList.remove('hidden'); });
  document.getElementById('db-info-bar').classList.remove('show');
  document.getElementById('app').style.paddingTop = '';
}

function applySession(user) {
  // ── 0. Load appUsers dari Supabase agar daftar user selalu up-to-date ──
  supa.from('users').select('*').then(({ data }) => {
    if (data && data.length > 0) {
      appUsers = data.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username || u.email.split('@')[0],
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        password: u.password || '',
        status: u.status || 'active',
        avatar: u.initial || u.name[0].toUpperCase(),
        avatarColor: u.color || '#6b7280',
        photoUrl: u.photo_url || null,
      }));
      // Sync foto & password ke currentUser jika ada
      const meUpdated = appUsers.find(u => u.id === currentUser.id);
      if (meUpdated) {
        currentUser.password = meUpdated.password;
        if (meUpdated.photoUrl) currentUser.photoUrl = meUpdated.photoUrl;
      }
      if (typeof render === 'function') render();
    }
  });

  // ── 1. Update sidebar user info ──
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl   = document.getElementById('sidebar-user-name');
  const chipEl   = document.getElementById('sidebar-role-chip');
  const labelEl  = document.getElementById('sidebar-role-label');

  if (avatarEl) {
    if (user.photoUrl || user.photo_url) {
      const photoSrc = user.photoUrl || user.photo_url;
      avatarEl.innerHTML = `<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      avatarEl.style.background = 'transparent';
      // Sync ke currentUser
      currentUser.photoUrl = photoSrc;
    } else {
      avatarEl.innerHTML = '';
      avatarEl.textContent = user.initial || user.name[0].toUpperCase();
      avatarEl.style.background = `linear-gradient(135deg, ${user.color}, ${user.color}aa)`;
    }
  }
  if (nameEl)  nameEl.textContent = user.name;
  if (labelEl) labelEl.textContent = ROLE_LABELS[user.role] || user.role;
  if (chipEl) {
    chipEl.className = 'role-chip ' + user.role;
    chipEl.style.fontSize = '9px';
    chipEl.style.padding = '1px 7px';
  }

  // ── 2. Sync into app currentUser ──
  if (typeof appUsers !== 'undefined') {
    const matched = appUsers.find(u => u.email && u.email.toLowerCase() === user.email.toLowerCase());
    currentUser = matched || {
      id: user.id, name: user.name,
      username: user.email.split('@')[0],
      email: user.email, role: user.role, status: 'active',
      avatar: user.initial || user.name[0].toUpperCase(), avatarColor: user.color,
    };
  }

  // ── 3. Menu yang tampil per role ──
  const ROLE_MENUS = {
    administrator:     new Set(['dashboard','vehicles','customer','monitoring','alerts','claims','duty','closing','laporan','kpi','settings','users','profile']),
    supervisor:        new Set(['dashboard','vehicles','customer','monitoring','alerts','claims','duty','closing','laporan','kpi','profile']),
    technical_support: new Set(['dashboard','vehicles','customer','monitoring','alerts','duty','laporan','profile']),
    sales:             new Set(['vehicles','alerts','claims','duty','settings','profile']),
    sales_counter:     new Set(['vehicles','alerts','claims','duty','settings','profile']),
    viewer:            new Set(['vehicles','duty','claims','settings','profile']),
  };
  const allowed = ROLE_MENUS[user.role] || new Set(['dashboard']);

  const NAV_MAP = {
    'nav-dashboard':  'dashboard',
    'nav-vehicles':   'vehicles',
    'nav-customer':   'customer',
    'nav-monitoring': 'monitoring',
    'nav-alerts':     'alerts',
    'nav-claims':     'claims',
    'nav-duty':       'duty',
    'nav-closing':    'closing',
    'nav-laporan':    'laporan',
    'nav-kpi':        'kpi',
    'nav-settings':   'settings',
    'nav-users':      'users',
  };

  Object.entries(NAV_MAP).forEach(([navId, menuKey]) => {
    const el = document.getElementById(navId);
    if (el) el.style.setProperty('display', allowed.has(menuKey) ? '' : 'none', 'important');
  });

  // Sembunyikan label divider Admin jika bukan admin
  const adminDivider = document.querySelector('#sidebar .sidebar-nav > div');
  if (adminDivider) {
    adminDivider.style.setProperty('display', user.role === 'administrator' ? '' : 'none', 'important');
  }

  // ── 4. Kontrol visibilitas db-info-bar & tombol admin ──
  const isAdmin = user.role === 'administrator';
  const exportBtn = document.getElementById('btn-export-db');
  const resetBtn  = document.getElementById('btn-reset-db');
  const infoBar   = document.getElementById('db-info-bar');
  if (exportBtn) exportBtn.style.display = isAdmin ? '' : 'none';
  if (resetBtn)  resetBtn.style.display  = isAdmin ? '' : 'none';
  const infoTextEl = document.getElementById('db-info-text');
  if (infoTextEl && !isAdmin) {
    if (infoBar) infoBar.style.setProperty('display', 'none', 'important');
    const appEl = document.getElementById('app');
    if (appEl) appEl.style.paddingTop = '0';
  } else if (infoBar) {
    infoBar.style.removeProperty('display');
  }

  // ── 5. Re-render ──
  if (user.role === 'viewer' && typeof navigate === 'function') {
    navigate('vehicles');
  } else if (typeof render === 'function') render();
}


// ---- Export / Reset DB ----
function exportDB() {
  const state = {
    vehicles: typeof vehicles !== 'undefined' ? vehicles : [],
    trialVehicles: typeof trialVehicles !== 'undefined' ? trialVehicles : [],
    alerts: typeof alerts !== 'undefined' ? alerts : [],
    claims: typeof claims !== 'undefined' ? claims : [],
    pelumasRecords: typeof pelumasRecords !== 'undefined' ? pelumasRecords : [],
    pelumasTrialRecords: typeof pelumasTrialRecords !== 'undefined' ? pelumasTrialRecords : [],
    dutyTrips: typeof dutyTrips !== 'undefined' ? dutyTrips : [],
    closingHistory: typeof closingHistory !== 'undefined' ? closingHistory : [],
  };
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tyretrack_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
}
async function clearDB() {
  if (!confirm('Reset semua data database?')) return;
  const tables = ['vehicles','trial_vehicles','alerts','claims','pelumas_records','pelumas_trial_records','duty_trips','closing_history'];
  for (const t of tables) await supa.from(t).delete().neq('id','__never__');
  alert('Database telah direset. Halaman akan dimuat ulang.');
  location.reload();
}

// ---- Patch: sync to Supabase on each render ----
function persistState() {
  // Also keep localStorage as fallback
  try {
    const state = {
      vehicles: typeof vehicles !== 'undefined' ? vehicles : [],
      trialVehicles: typeof trialVehicles !== 'undefined' ? trialVehicles : [],
      alerts: typeof alerts !== 'undefined' ? alerts : [],
      claims: typeof claims !== 'undefined' ? claims : [],
      pelumasRecords: typeof pelumasRecords !== 'undefined' ? pelumasRecords : [],
      pelumasTrialRecords: typeof pelumasTrialRecords !== 'undefined' ? pelumasTrialRecords : [],
      dutyTrips: typeof dutyTrips !== 'undefined' ? dutyTrips : [],
      closingHistory: typeof closingHistory !== 'undefined' ? closingHistory : [],
    };
    localStorage.setItem('tyretrack_state', JSON.stringify(state));
  } catch(e) {}
  // Sync to Supabase (non-blocking)
  syncToSupabase().catch(e => console.warn('sync error', e));
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem('tyretrack_state');
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (state.vehicles          && typeof vehicles          !== 'undefined') vehicles          = state.vehicles;
    if (state.trialVehicles     && typeof trialVehicles     !== 'undefined') trialVehicles     = state.trialVehicles;
    if (state.alerts            && typeof alerts            !== 'undefined') alerts            = state.alerts;
    if (state.claims            && typeof claims            !== 'undefined') claims            = state.claims;
    if (state.pelumasRecords    && typeof pelumasRecords    !== 'undefined') pelumasRecords    = state.pelumasRecords;
    if (state.pelumasTrialRecords && typeof pelumasTrialRecords !== 'undefined') pelumasTrialRecords = state.pelumasTrialRecords;
    if (state.dutyTrips         && typeof dutyTrips         !== 'undefined') dutyTrips         = state.dutyTrips;
    if (state.closingHistory    && typeof closingHistory    !== 'undefined') closingHistory    = state.closingHistory;
    return true;
  } catch(e) { return false; }
}

// ---- Supabase Realtime ----
// Map nama tabel Supabase ke variabel lokal
const TABLE_VAR_MAP = {
  'vehicles':              () => vehicles,
  'trial_vehicles':        () => trialVehicles,
  'alerts':                () => alerts,
  'pelumas_records':       () => pelumasRecords,
  'pelumas_trial_records': () => pelumasTrialRecords,
  'duty_trips':            () => dutyTrips,
  'closing_history':       () => closingHistory,
  'tech_notifications':    () => typeof TECH_NOTIFICATIONS !== 'undefined' ? TECH_NOTIFICATIONS : [],
};
const TABLE_VAR_SET = {
  'vehicles':              v => { vehicles = v; },
  'trial_vehicles':        v => { trialVehicles = v; },
  'alerts':                v => { alerts = v; },
  'pelumas_records':       v => { pelumasRecords = v; },
  'pelumas_trial_records': v => { pelumasTrialRecords = v; },
  'duty_trips':            v => { dutyTrips = v; },
  'closing_history':       v => { closingHistory = v; },
  'tech_notifications':    v => { if (typeof TECH_NOTIFICATIONS !== 'undefined') TECH_NOTIFICATIONS = v; },
};

// Debounce per-tabel agar tidak flood render
const _realtimeDebounces = {};
function _onRealtimeChange(table, payload) {
  clearTimeout(_realtimeDebounces[table]);
  _realtimeDebounces[table] = setTimeout(() => {
    try {
      const eventType = payload.eventType; // INSERT | UPDATE | DELETE
      const newData   = payload.new?.data;
      const oldId     = payload.old?.id;
      const setter    = TABLE_VAR_SET[table];
      const getter    = TABLE_VAR_MAP[table];
      if (!setter || !getter) return;

      const arr = getter() || [];

      if (eventType === 'INSERT' && newData) {
        // Tambah hanya jika belum ada
        if (!arr.find(x => x && x.id === newData.id)) {
          setter([newData, ...arr]);
        }
      } else if (eventType === 'UPDATE' && newData) {
        // Update item yang berubah saja
        setter(arr.map(x => (x && x.id === newData.id) ? newData : x));
      } else if (eventType === 'DELETE' && oldId) {
        // Hapus item yang dihapus
        setter(arr.filter(x => x && String(x.id) !== String(oldId)));
      }

      if (typeof render === 'function') render();
    } catch(e) { console.warn('realtime change error', table, e); }
  }, 30000); // debounce 30 detik — interval refresh realtime
}

function startRealtimeSubscription() {
  // tech_notifications ditangani dengan listener khusus (INSERT & UPDATE) di bawah
  const TABLES = ['vehicles','trial_vehicles','pelumas_records','pelumas_trial_records','duty_trips','closing_history'];
  const channel = supa.channel('tyretrack-realtime');
  TABLES.forEach(table => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => _onRealtimeChange(table, payload));
  });

  // ── Listener khusus: tech_notifications INSERT → popup ke Technical Support ──
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tech_notifications' }, (payload) => {
    const notif = payload.new?.data;
    if (!notif) return;

    // Simpan ke array lokal jika belum ada
    if (typeof TECH_NOTIFICATIONS !== 'undefined' && !TECH_NOTIFICATIONS.find(n => n.id === notif.id)) {
      TECH_NOTIFICATIONS.unshift(notif);
    }

    // Update badge & re-render halaman alerts jika sedang terbuka
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'alerts' && typeof render === 'function') render();

    // Tampilkan popup hanya untuk user dengan role technical_support
    if (!currentUser || currentUser.role !== 'technical_support') return;

    const t = document.createElement('div');
    t.style.cssText = [
      'position:fixed;top:60px;right:20px;',
      'background:linear-gradient(135deg,#2563eb,#1d4ed8);',
      'color:white;padding:16px 20px;border-radius:16px;',
      'font-size:13px;font-weight:700;z-index:9999;',
      'box-shadow:0 8px 30px rgba(37,99,235,0.45);',
      'max-width:340px;cursor:pointer;',
      'transition:opacity .3s, transform .3s;',
      'transform:translateX(0);',
    ].join('');

    t.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<div style="width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        '</div>' +
        '<span style="font-size:14px;font-weight:800;">🔔 Klaim Baru Masuk!</span>' +
      '</div>' +
      '<div style="font-size:12px;font-weight:600;opacity:.9;line-height:1.5;">' +
        '<span style="font-family:monospace;background:rgba(255,255,255,0.15);padding:1px 6px;border-radius:6px;">' + (notif.ticket || '') + '</span>' +
        ' &nbsp;' + (notif.plate || '') +
        '<br>👤 ' + (notif.customer || '') +
        '<br>🔧 ' + (notif.pos || '') + ' — ' + (notif.reason || '') +
        '<br><span style="opacity:.75;">Dibuat oleh: ' + (notif.createdBy || '') + '</span>' +
      '</div>' +
      '<div style="margin-top:10px;font-size:11px;font-weight:700;background:rgba(255,255,255,0.18);border-radius:8px;padding:5px 10px;text-align:center;">' +
        'Klik untuk ambil tugas →' +
      '</div>';

    t.onclick = () => {
      if (typeof navigate === 'function') navigate('alerts');
      t.remove();
    };
    document.body.appendChild(t);

    // Auto-dismiss setelah 8 detik
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(20px)';
      setTimeout(() => t.remove(), 400);
    }, 8000);
  });

  // ── Listener khusus: tech_notifications UPDATE (misal klaim diambil TS lain, atau diputuskan admin) ──
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tech_notifications' }, (payload) => {
    const updated = payload.new?.data;
    if (!updated || typeof TECH_NOTIFICATIONS === 'undefined') return;
    TECH_NOTIFICATIONS = TECH_NOTIFICATIONS.map(n => n.id === updated.id ? updated : n);
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'alerts' && typeof render === 'function') render();

    // Popup notifikasi ke TS jika klaim yang dia kerjakan baru di-approve/reject
    if (!currentUser || currentUser.role !== 'technical_support') return;
    if (!updated.decisionStatus || !updated.takenBy || updated.takenBy !== currentUser.id) return;

    const isApproved = updated.decisionStatus === 'Approved';
    const t = document.createElement('div');
    t.style.cssText = [
      'position:fixed;top:60px;right:20px;',
      'background:' + (isApproved ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#e11d48,#be123c)') + ';',
      'color:white;padding:16px 20px;border-radius:16px;',
      'font-size:13px;font-weight:700;z-index:9999;',
      'box-shadow:0 8px 30px ' + (isApproved ? 'rgba(5,150,105,0.45)' : 'rgba(225,29,72,0.45)') + ';',
      'max-width:340px;cursor:pointer;',
      'transition:opacity .3s, transform .3s;',
    ].join('');

    t.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<div style="width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          (isApproved
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>') +
        '</div>' +
        '<span style="font-size:14px;font-weight:800;">' + (isApproved ? '✅ Klaim Disetujui!' : '❌ Klaim Ditolak') + '</span>' +
      '</div>' +
      '<div style="font-size:12px;font-weight:600;opacity:.9;line-height:1.5;">' +
        '<span style="font-family:monospace;background:rgba(255,255,255,0.15);padding:1px 6px;border-radius:6px;">' + (updated.ticket || '') + '</span>' +
        ' ' + (updated.plate || '') +
        (updated.decisionNote ? '<br><span style="opacity:.85;">Catatan: ' + updated.decisionNote + '</span>' : '') +
        '<br><span style="opacity:.75;">Oleh: ' + (updated.decisionBy || 'Administrator/Supervisor') + '</span>' +
      '</div>' +
      '<div style="margin-top:10px;font-size:11px;font-weight:700;background:rgba(255,255,255,0.18);border-radius:8px;padding:5px 10px;text-align:center;">' +
        (isApproved ? 'Klik untuk melihat detail →' : 'Klik untuk upload ulang foto →') +
      '</div>';

    t.onclick = () => {
      if (typeof navigate === 'function') navigate('alerts');
      t.remove();
    };
    document.body.appendChild(t);

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(20px)';
      setTimeout(() => t.remove(), 400);
    }, 9000);
  });
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'claims' }, (payload) => {
    const nc = payload.new?.data; if (!nc) return;
    if (!CLAIMS.find(c => c.id === nc.id)) CLAIMS.unshift(nc);
    updateAlertBadge();
    if (currentPage === 'alerts' || currentPage === 'claims') render();
    if (currentUser && (currentUser.role === 'administrator' || currentUser.role === 'supervisor') && nc.needsApproval) {
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;top:60px;right:20px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;padding:14px 20px;border-radius:16px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 8px 30px rgba(124,58,237,0.4);max-width:320px;cursor:pointer;transition:opacity .3s;';
      t.innerHTML = '🔔 Pengajuan Klaim Baru!<br><span style="font-weight:500;font-size:12px;opacity:.9;">' + (nc.ticket||'') + ' · ' + nc.plate + ' — ' + nc.customer + '<br>Klik untuk review</span>';
      t.onclick = () => { navigate('alerts'); t.remove(); }; document.body.appendChild(t);
      setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 6000);
    }
  });
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'claims' }, (payload) => {
    const uc = payload.new?.data; if (!uc) return;
    CLAIMS = CLAIMS.map(c => c.id === uc.id ? uc : c);
    updateAlertBadge();
    if (currentPage === 'claims' || currentPage === 'alerts') render();
  });
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales_notifications' }, (payload) => {
    const notif = payload.new?.data; if (!notif) return;
    if (!currentUser || notif.submittedBy !== currentUser.id) return;
    if (!SALES_NOTIFICATIONS.find(n => n.id === notif.id)) SALES_NOTIFICATIONS.unshift(notif);
    updateAlertBadge();
    if (currentPage === 'alerts') render();
    const isApproved = notif.status === 'Approved';
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:60px;right:20px;background:' + (isApproved ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#e11d48,#be123c)') + ';color:white;padding:14px 20px;border-radius:16px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,0.25);max-width:320px;cursor:pointer;transition:opacity .3s;';
    t.innerHTML = (isApproved ? '✅' : '❌') + ' ' + notif.title + '<br><span style="font-weight:500;font-size:12px;opacity:.9;">' + notif.desc + '<br>Klik untuk lihat</span>';
    t.onclick = () => { navigate('alerts'); t.remove(); }; document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 7000);
  });
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sales_notifications' }, (payload) => {
    const updated = payload.new?.data; if (!updated) return;
    SALES_NOTIFICATIONS = SALES_NOTIFICATIONS.map(n => n.id === updated.id ? updated : n);
    if (currentUser && updated.submittedBy === currentUser.id) { updateAlertBadge(); if (currentPage === 'alerts') render(); }
  });
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, async () => {
    await loadRolePerms(); applyRolePermsToNav();
    if (currentPage === 'settings') render();
    const infoEl = document.getElementById('db-info-text');
    if (infoEl && currentUser && currentUser.role === 'administrator') {
      const orig = infoEl.textContent; infoEl.style.color = '#7c3aed';
      infoEl.textContent = '🔐 Hak akses diperbarui oleh Administrator...';
      setTimeout(() => { infoEl.style.color = ''; infoEl.textContent = orig; }, 2500);
    }
  });
  channel.subscribe((status) => {
    const infoEl = document.getElementById('db-info-text');
    if (status === 'SUBSCRIBED' && infoEl) {
      // Update info bar untuk tampilkan status realtime
      const session = sessionGet();
      if (session) {
        infoEl.textContent = `Database: Supabase ☁️ · Realtime aktif 🟢 · ${session.name} (${ROLE_LABELS[session.role] || session.role})`;
      }
    }
  });
  return channel;
}

let _realtimeChannel = null;

// ---- INIT on page load ----
(async function init() {
  const session = sessionGet();
  if (!session) {
    document.body.classList.add('login-active');
  } else {
    const lp = document.getElementById('login-page');
    if (lp) lp.style.display = 'none';
    document.getElementById('db-info-bar').classList.add('show');
    document.getElementById('db-info-text').textContent =
      `Database: Supabase ☁️ · Menghubungkan realtime...`;
    document.getElementById('app').style.paddingTop = '38px';
    try { await loadFromSupabase(); } catch(e) { loadPersistedState(); }
    applySession(session);
    applyRolePermsToNav();
    // Mulai realtime subscription setelah login
    if (_realtimeChannel) supa.removeChannel(_realtimeChannel);
    _realtimeChannel = startRealtimeSubscription();
  }
  if (typeof render === 'function') render();
  const _origRender = render;
  render = function() { _origRender(); persistState(); };
})();

// ── Demo button binding removed ──