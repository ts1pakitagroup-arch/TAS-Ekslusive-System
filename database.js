// ============================================================
// TYRETRACK — DATABASE & AUTH SYSTEM (Supabase)
// ============================================================
//
// ⚠️  JALANKAN SQL INI SEKALI di Supabase → SQL Editor:
//
// -- 1. TABEL USERS (wajib untuk login & register)
//   CREATE TABLE IF NOT EXISTS users (
//     id text PRIMARY KEY,
//     name text,
//     email text UNIQUE,
//     password text,
//     role text DEFAULT 'viewer',
//     color text,
//     initial text,
//     username text,
//     phone text,
//     status text DEFAULT 'active',
//     photo_url text,
//     created_at timestamptz DEFAULT now()
//   );
//   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
//
// -- 2. TABEL DATA OPERASIONAL (format {id, data})
//   CREATE TABLE IF NOT EXISTS vehicles (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS trial_vehicles (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS alerts (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS claims (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS pelumas_records (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS pelumas_trial_records (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS duty_trips (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS closing_history (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS ban_otr_records (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS ban_otr_trial_records (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS aki_records (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS aki_trial_records (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS sales_notifications (id text PRIMARY KEY, data jsonb NOT NULL);
//   CREATE TABLE IF NOT EXISTS tech_notifications (id text PRIMARY KEY, data jsonb NOT NULL);
//
// -- 3. TABEL NOTIFIKASI UNIVERSAL
//   CREATE TABLE IF NOT EXISTS user_notifications (id text PRIMARY KEY, data jsonb NOT NULL);
//
// -- 4. TABEL ROLE PERMISSIONS
//   CREATE TABLE IF NOT EXISTS role_permissions (
//     role text PRIMARY KEY,
//     menus jsonb,
//     actions jsonb,
//     updated_at timestamptz DEFAULT now()
//   );
//
// -- 5. AKTIFKAN RLS untuk semua tabel operasional:
//   ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "allow_all" ON vehicles FOR ALL USING (true) WITH CHECK (true);
//   -- (ulangi untuk: trial_vehicles, alerts, claims, pelumas_records,
//   --  pelumas_trial_records, duty_trips, closing_history, ban_otr_records,
//   --  ban_otr_trial_records, aki_records, aki_trial_records,
//   --  sales_notifications, tech_notifications, user_notifications, role_permissions)
//
// -- 6. AKTIFKAN REALTIME untuk semua tabel (di Dashboard → Database → Replication)
//   ALTER PUBLICATION supabase_realtime ADD TABLE
//     vehicles, trial_vehicles, alerts, claims, pelumas_records,
//     pelumas_trial_records, duty_trips, closing_history, ban_otr_records,
//     ban_otr_trial_records, aki_records, aki_trial_records,
//     sales_notifications, tech_notifications, user_notifications,
//     role_permissions, users;
//

const SUPABASE_URL = 'https://miptmwevpsfaaggypwdp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcHRtd2V2cHNmYWFnZ3lwd2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTczMTYsImV4cCI6MjA4NzQzMzMxNn0.ZBl08CKmvC_sdxOhLYDUv0WkinQNjv28phOVeMJVdoQ';
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const SESSION_KEY = 'tyretrack_session';

// ---- Default users (fallback jika tabel users di Supabase belum dibuat) ----
const DEFAULT_USERS = [
  { id: 'u1', name: 'Administrator 1', email: 'taseklusive1@gmail.com',    password: 'Taseklusive01',    role: 'administrator', color: '#7c3aed', initial: 'A' },
  { id: 'u2', name: 'Administrator 2', email: 'taseklusive2@gmail.com',    password: 'Taseklusive02',    role: 'administrator', color: '#4f46e5', initial: 'A' },
  { id: 'u3', name: 'Supervisor 1',    email: 'taseklusivespv1@gmail.com', password: 'Taseklusivespv01', role: 'supervisor',     color: '#2563eb', initial: 'S' },
  { id: 'u4', name: 'Supervisor 2',    email: 'taseklusivespv2@gmail.com', password: 'Taseklusivespv02', role: 'supervisor',     color: '#0ea5e9', initial: 'S' },
];

// ---- Supabase helpers ----
async function supaUpsert(table, id, data) {
  try { await supa.from(table).upsert({ id: String(id), data: data }); }
  catch(e) { console.warn('supaUpsert error', table, e); }
}
async function supaDelete(table, id) {
  try { await supa.from(table).delete().eq('id', String(id)); }
  catch(e) { console.warn('supaDelete error', table, e); }
}
async function supaLoadAll(table) {
  try {
    const { data, error } = await supa.from(table).select('*');
    if (error) return [];
    return (data || []).map(r => r.data).filter(Boolean);
  } catch(e) { return []; }
}
async function supaUpsertClaim(claim) {
  try { await supa.from('claims').upsert({ id: String(claim.id), data: claim }); }
  catch(e) { console.warn('supaUpsertClaim error', e); }
}
async function supaUpsertNotif(notif) {
  try { await supa.from('sales_notifications').upsert({ id: String(notif.id), data: notif }); } catch(e) {}
}
async function supaUpsertTechNotif(notif) {
  try { await supa.from('tech_notifications').upsert({ id: String(notif.id), data: notif }); } catch(e) {}
}

// ============================================================
// NOTIFIKASI UNIVERSAL — user_notifications
// ============================================================
async function pushNotifToUser(userId, notif) {
  if (!userId) return;
  const rec = {
    id:        'UN-' + userId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,5),
    userId:    userId,
    type:      notif.type    || 'info',
    title:     notif.title   || '',
    desc:      notif.desc    || '',
    note:      notif.note    || '',
    status:    notif.status  || '',
    claimId:   notif.claimId || null,
    date:      notif.date    || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    read:      false,
  };
  try { await supa.from('user_notifications').upsert({ id: rec.id, data: rec }); }
  catch(e) { console.warn('pushNotifToUser error', e); }
}
async function pushNotifToRole(role, notif) {
  try {
    const { data: users } = await supa.from('users').select('id').eq('role', role);
    if (!users) return;
    for (const u of users) await pushNotifToUser(u.id, notif);
  } catch(e) { console.warn('pushNotifToRole error', role, e); }
}
async function pushNotifToAllTechSupport(notif) { await pushNotifToRole('technical_support', notif); }
async function pushNotifToAdminSupervisor(notif) {
  await pushNotifToRole('administrator', notif);
  await pushNotifToRole('supervisor', notif);
}
async function loadUserNotifications() {
  if (!currentUser) return;
  try {
    const { data, error } = await supa.from('user_notifications').select('*');
    if (error || !data) return;
    const mine = data.map(r => r.data).filter(Boolean)
      .filter(n => n.userId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    if (typeof USER_NOTIFICATIONS !== 'undefined') USER_NOTIFICATIONS = mine;
  } catch(e) { console.warn('loadUserNotifications error', e); }
}
async function markUserNotifRead(notifId) {
  if (typeof USER_NOTIFICATIONS === 'undefined') return;
  USER_NOTIFICATIONS = USER_NOTIFICATIONS.map(n => n.id === notifId ? { ...n, read: true } : n);
  const updated = USER_NOTIFICATIONS.find(n => n.id === notifId);
  if (updated) { try { await supa.from('user_notifications').upsert({ id: notifId, data: updated }); } catch(e) {} }
  if (typeof updateAlertBadge === 'function') updateAlertBadge();
}
async function markAllUserNotifsRead() {
  if (!currentUser || typeof USER_NOTIFICATIONS === 'undefined') return;
  const toUpdate = USER_NOTIFICATIONS.filter(n => n.userId === currentUser.id && !n.read);
  USER_NOTIFICATIONS = USER_NOTIFICATIONS.map(n => n.userId === currentUser.id ? { ...n, read: true } : n);
  for (const n of toUpdate) {
    try { await supa.from('user_notifications').upsert({ id: n.id, data: { ...n, read: true } }); } catch(e) {}
  }
  if (typeof updateAlertBadge === 'function') updateAlertBadge();
  if (typeof render === 'function' && typeof currentPage !== 'undefined' && currentPage === 'alerts') render();
}
async function loadSalesNotifications() {
  try {
    const { data, error } = await supa.from('sales_notifications').select('*');
    if (!error && data && data.length > 0) SALES_NOTIFICATIONS = data.map(r => r.data).filter(Boolean);
  } catch(e) {}
}
async function loadTechNotifications() {
  try {
    const { data, error } = await supa.from('tech_notifications').select('*');
    if (!error && data && data.length > 0 && typeof TECH_NOTIFICATIONS !== 'undefined') {
      TECH_NOTIFICATIONS = data.map(r => r.data).filter(Boolean).sort((a,b) => new Date(b.date) - new Date(a.date));
    }
  } catch(e) {}
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
      ['vehicles',              typeof vehicles             !== 'undefined' ? vehicles             : []],
      ['trial_vehicles',        typeof trialVehicles        !== 'undefined' ? trialVehicles        : []],
      ['alerts',                typeof alerts               !== 'undefined' ? alerts               : []],
      ['claims',                typeof claims               !== 'undefined' ? claims               : []],
      ['pelumas_records',       typeof pelumasRecords       !== 'undefined' ? pelumasRecords       : []],
      ['pelumas_trial_records', typeof pelumasTrialRecords  !== 'undefined' ? pelumasTrialRecords  : []],
      ['duty_trips',            typeof dutyTrips            !== 'undefined' ? dutyTrips            : []],
      ['closing_history',       typeof closingHistory       !== 'undefined' ? closingHistory       : []],
      ['ban_otr_records',       typeof banOtrRecords        !== 'undefined' ? banOtrRecords        : []],
      ['ban_otr_trial_records', typeof banOtrTrialRecords   !== 'undefined' ? banOtrTrialRecords   : []],
      ['aki_records',           typeof akiRecords           !== 'undefined' ? akiRecords           : []],
      ['aki_trial_records',     typeof akiTrialRecords      !== 'undefined' ? akiTrialRecords      : []],
    ];
    for (const [tbl, arr] of tbls) {
      for (const item of arr) { if (item && item.id) await supaUpsert(tbl, item.id, item); }
    }
  } catch(e) { console.warn('syncToSupabase error', e); }
}

// ---- Load all state from Supabase ----
async function loadFromSupabase() {
  try {
    const [v, tv, al, cl, pr, ptr, dt, ch, bor, botr, ar, atr] = await Promise.all([
      supaLoadAll('vehicles'), supaLoadAll('trial_vehicles'),
      supaLoadAll('alerts'), supaLoadAll('claims'),
      supaLoadAll('pelumas_records'), supaLoadAll('pelumas_trial_records'),
      supaLoadAll('duty_trips'), supaLoadAll('closing_history'),
      supaLoadAll('ban_otr_records'), supaLoadAll('ban_otr_trial_records'),
      supaLoadAll('aki_records'), supaLoadAll('aki_trial_records'),
    ]);
    if (v.length   && typeof vehicles             !== 'undefined') vehicles             = v;
    if (tv.length  && typeof trialVehicles        !== 'undefined') trialVehicles        = tv;
    if (al.length  && typeof alerts               !== 'undefined') alerts               = al;
    if (cl.length  && typeof claims               !== 'undefined') claims               = cl;
    if (pr.length  && typeof pelumasRecords       !== 'undefined') pelumasRecords       = pr;
    if (ptr.length && typeof pelumasTrialRecords  !== 'undefined') pelumasTrialRecords  = ptr;
    if (dt.length  && typeof dutyTrips            !== 'undefined') dutyTrips            = dt;
    if (ch.length  && typeof closingHistory       !== 'undefined') {
      closingHistory = ch;
      if (typeof closedTires !== 'undefined') closedTires = [...ch];
    }
    if (bor.length  && typeof banOtrRecords      !== 'undefined') banOtrRecords      = bor;
    if (botr.length && typeof banOtrTrialRecords !== 'undefined') banOtrTrialRecords = botr;
    if (ar.length   && typeof akiRecords         !== 'undefined') akiRecords         = ar;
    if (atr.length  && typeof akiTrialRecords    !== 'undefined') akiTrialRecords    = atr;
    if (cl.length) CLAIMS = cl;
    await loadSalesNotifications();
    await loadTechNotifications();
    await loadUserNotifications();
    await loadRolePerms();
    return true;
  } catch(e) { return false; }
}

// ---- Load users (fallback ke DEFAULT_USERS) ----
async function supaGetUsers() {
  try {
    const { data, error } = await supa.from('users').select('*');
    if (!error && data && data.length > 0) return data;
    return DEFAULT_USERS;
  } catch(e) { return DEFAULT_USERS; }
}

// ---- Cek apakah tabel users sudah siap ----
async function isUsersTableReady() {
  try {
    const { error } = await supa.from('users').select('id').limit(1);
    return !error;
  } catch(e) { return false; }
}

const ROLE_LABELS = {
  administrator: 'Administrator', supervisor: 'Supervisor',
  technical_support: 'Technical Support', sales: 'Sales',
  sales_counter: 'Sales Counter', viewer: 'Viewer',
};

// ---- Session ----
function sessionGet() {
  try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; }
}
function sessionSet(user) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch(e) {} }
function sessionClear()   { try { localStorage.removeItem(SESSION_KEY); } catch(e) {} }

// ---- Login shortcut ----
function loginAs(email, password) {
  const ef = document.getElementById('login-email');
  const pf = document.getElementById('login-password');
  if (ef) ef.value = email;
  if (pf) pf.value = password;
  doLogin();
}

// ── Tampilkan halaman Register ──
function showRegister() {
  const lp = document.getElementById('login-page');
  const rp = document.getElementById('register-page');
  if (!lp || !rp) return;

  // Sembunyikan login page terlebih dahulu
  lp.style.transition = 'opacity 0.3s';
  lp.style.opacity = '0';
  lp.style.pointerEvents = 'none';
  setTimeout(() => {
    lp.style.display = 'none';
    lp.style.opacity = '';
    lp.style.pointerEvents = '';
    lp.style.transition = '';
  }, 320);

  // Tampilkan register page
  rp.style.display = 'flex';
  rp.style.opacity = '0';
  rp.style.transition = 'opacity 0.3s';
  setTimeout(() => { rp.style.opacity = '1'; }, 20);

  // Reset form
  ['reg-name','reg-email','reg-phone','reg-password','reg-password2'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['reg-error','reg-success'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.remove('show');
  });
}

// ── Tampilkan halaman Login ──
function showLogin() {
  const lp = document.getElementById('login-page');
  const rp = document.getElementById('register-page');
  if (!lp || !rp) return;

  // Sembunyikan register page
  rp.style.transition = 'opacity 0.3s';
  rp.style.opacity = '0';
  setTimeout(() => {
    rp.style.display = 'none';
    rp.style.opacity = '';
    rp.style.transition = '';
  }, 320);

  // Tampilkan login page
  lp.style.display = 'flex';
  lp.style.opacity = '0';
  lp.style.transition = 'opacity 0.3s';
  setTimeout(() => { lp.style.opacity = '1'; }, 20);
}

// ── Registrasi akun baru ──
async function doRegister() {
  const name      = (document.getElementById('reg-name')?.value     || '').trim();
  const email     = (document.getElementById('reg-email')?.value    || '').trim().toLowerCase();
  const phone     = (document.getElementById('reg-phone')?.value    || '').trim();
  const password  =  document.getElementById('reg-password')?.value || '';
  const password2 =  document.getElementById('reg-password2')?.value|| '';
  const errEl     = document.getElementById('reg-error');
  const sucEl     = document.getElementById('reg-success');
  const btn       = document.getElementById('reg-btn');

  if (!errEl || !sucEl || !btn) return;

  const DAFTAR_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>';

  errEl.classList.remove('show');
  sucEl.classList.remove('show');

  const showErr  = (msg) => { errEl.textContent = msg; errEl.classList.add('show'); };
  const resetBtn = ()    => { btn.disabled = false; btn.innerHTML = DAFTAR_ICON + ' Daftar'; };

  // Validasi
  if (!name)               return showErr('Nama lengkap wajib diisi.');
  if (!email)              return showErr('Email wajib diisi.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr('Format email tidak valid.');
  if (!password)           return showErr('Password wajib diisi.');
  if (password.length < 6) return showErr('Password minimal 6 karakter.');
  if (password !== password2) return showErr('Konfirmasi password tidak cocok.');

  btn.disabled = true;
  btn.textContent = 'Mendaftarkan...';

  try {
    // FIX: Cek apakah tabel users sudah ada sebelum melanjutkan
    const tableReady = await isUsersTableReady();
    if (!tableReady) {
      showErr('⚠️ Database belum dikonfigurasi. Hubungi administrator untuk menjalankan SQL setup di Supabase.');
      resetBtn();
      return;
    }

    // FIX: Tangani error dari maybeSingle() dengan benar
    const { data: existing, error: checkErr } = await supa.from('users')
      .select('id').eq('email', email).maybeSingle();

    if (checkErr && checkErr.code !== 'PGRST116') {
      // Error bukan "no rows found" → masalah koneksi/permission
      showErr('Gagal memeriksa data: ' + (checkErr.message || 'Coba lagi.'));
      resetBtn();
      return;
    }
    if (existing) {
      showErr('Email ini sudah terdaftar. Silakan login.');
      resetBtn();
      return;
    }

    const newId   = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const colors  = ['#059669','#2563eb','#7c3aed','#d97706','#0e7490','#db2777','#65a30d'];
    const newUser = {
      id: newId, name, email, password, phone: phone || null,
      role: 'viewer', status: 'active',
      color:   colors[Math.floor(Math.random() * colors.length)],
      initial: name.charAt(0).toUpperCase(),
      username: email.split('@')[0],
    };

    const { error: insertErr } = await supa.from('users').insert(newUser);
    if (insertErr) {
      showErr('Gagal mendaftar: ' + (insertErr.message || 'Coba lagi.'));
      resetBtn();
      return;
    }

    sucEl.textContent = '✅ Akun berhasil dibuat! Silakan login.';
    sucEl.classList.add('show');
    resetBtn();

    setTimeout(() => {
      const ef = document.getElementById('login-email');
      const pf = document.getElementById('login-password');
      if (ef) ef.value = email;
      if (pf) pf.value = '';
      showLogin();
    }, 2000);

  } catch(e) {
    showErr('Koneksi bermasalah. Periksa internet Anda dan coba lagi.');
    resetBtn();
  }
}

// ── Login ──
async function doLogin() {
  const emailEl  = document.getElementById('login-email');
  const pwEl     = document.getElementById('login-password');
  const errorEl  = document.getElementById('login-error');
  const loginBtn = document.querySelector('#login-page .login-btn');

  if (!emailEl || !pwEl || !errorEl) return;

  const email    = emailEl.value.trim().toLowerCase();
  const password = pwEl.value;

  errorEl.classList.remove('show');

  if (!email || !password) {
    errorEl.textContent = 'Email dan password wajib diisi.';
    errorEl.classList.add('show');
    return;
  }

  const MASUK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>';
  const resetBtn = () => { if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = MASUK_ICON + ' Masuk'; } };

  if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = 'Memuat...'; }

  let users;
  try { users = await supaGetUsers(); } catch(e) { users = DEFAULT_USERS; }

  let user = (users || []).find(u => u.email && u.email.toLowerCase() === email && u.password === password);
  if (!user) {
    // Fallback cari di DEFAULT_USERS juga
    user = DEFAULT_USERS.find(u => u.email && u.email.toLowerCase() === email && u.password === password);
  }

  if (!user) {
    errorEl.textContent = 'Email atau password salah. Coba lagi.';
    errorEl.classList.add('show');
    pwEl.value = '';
    resetBtn();
    return;
  }

  sessionSet(user);

  currentUser = {
    id:          user.id,
    name:        user.name,
    username:    user.username || (user.email ? user.email.split('@')[0] : 'user'),
    email:       user.email,
    role:        user.role,
    status:      user.status || 'active',
    avatar:      user.initial || (user.name ? user.name[0].toUpperCase() : 'U'),
    avatarColor: user.color || '#6b7280',
  };

  try { await loadFromSupabase(); } catch(e) { console.warn('loadFromSupabase:', e); }

  applySession(user);
  applyRolePermsToNav();

  if (typeof startRealtimeSubscription === 'function') {
    if (_realtimeChannel) { try { supa.removeChannel(_realtimeChannel); } catch(e) {} }
    _realtimeChannel = startRealtimeSubscription();
  }

  // Sembunyikan login page
  const loginPage = document.getElementById('login-page');
  if (loginPage) {
    loginPage.style.transition = 'opacity 0.35s';
    loginPage.style.opacity    = '0';
    loginPage.style.pointerEvents = 'none';
    document.body.classList.remove('login-active');
    setTimeout(() => {
      loginPage.style.display       = 'none';
      loginPage.style.opacity       = '';
      loginPage.style.pointerEvents = '';
      loginPage.style.transition    = '';
    }, 380);
  }

  const infoBar  = document.getElementById('db-info-bar');
  const infoText = document.getElementById('db-info-text');
  const appEl    = document.getElementById('app');
  if (infoBar)  infoBar.classList.add('show');
  if (infoText) infoText.textContent = `Database: Supabase ☁️ · ${user.name} (${ROLE_LABELS[user.role] || user.role}) · Data tersimpan online`;
  if (appEl)    appEl.style.paddingTop = '38px';

  resetBtn();
}

function doLogout() {
  if (!confirm('Keluar dari TyreTrack?')) return;
  sessionClear();
  currentUser = null;

  if (_realtimeChannel) { try { supa.removeChannel(_realtimeChannel); } catch(e) {} _realtimeChannel = null; }

  const ib    = document.getElementById('db-info-bar');
  const appEl = document.getElementById('app');
  if (ib)    ib.classList.remove('show');
  if (appEl) appEl.style.paddingTop = '0';

  // Reset form
  ['login-email','login-password'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.classList.remove('show');

  // Tampilkan login page
  const lp = document.getElementById('login-page');
  if (lp) {
    lp.style.display    = 'flex';
    lp.style.opacity    = '0';
    lp.style.transition = 'opacity 0.35s';
    document.body.classList.add('login-active');
    setTimeout(() => { lp.style.opacity = '1'; }, 20);
  }
}

function applySession(user) {
  // Load appUsers dari Supabase
  supa.from('users').select('*').then(({ data, error }) => {
    if (!error && data && data.length > 0) {
      appUsers = data.map(u => ({
        id: u.id, name: u.name,
        username:    u.username || (u.email ? u.email.split('@')[0] : 'user'),
        email:       u.email,       phone:     u.phone || '',
        role:        u.role,        password:  u.password || '',
        status:      u.status || 'active',
        avatar:      u.initial || (u.name ? u.name[0].toUpperCase() : 'U'),
        avatarColor: u.color || '#6b7280',
        photoUrl:    u.photo_url || null,
      }));
      const meUpdated = appUsers.find(u => u.id === currentUser.id);
      if (meUpdated) {
        currentUser.password = meUpdated.password;
        if (meUpdated.photoUrl) currentUser.photoUrl = meUpdated.photoUrl;
      }
      if (typeof render === 'function') { try { render(); } catch(e) {} }
    }
  }).catch(() => {});

  // Sidebar user info
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl   = document.getElementById('sidebar-user-name');
  const chipEl   = document.getElementById('sidebar-role-chip');
  const labelEl  = document.getElementById('sidebar-role-label');

  if (avatarEl) {
    if (user.photoUrl || user.photo_url) {
      const src = user.photoUrl || user.photo_url;
      avatarEl.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      avatarEl.style.background = 'transparent';
      currentUser.photoUrl = src;
    } else {
      avatarEl.innerHTML    = '';
      avatarEl.textContent  = user.initial || (user.name ? user.name[0].toUpperCase() : 'U');
      avatarEl.style.background = `linear-gradient(135deg, ${user.color||'#6b7280'}, ${user.color||'#6b7280'}aa)`;
    }
  }
  if (nameEl)  nameEl.textContent  = user.name;
  if (labelEl) labelEl.textContent = ROLE_LABELS[user.role] || user.role;
  if (chipEl)  { chipEl.className = 'role-chip ' + user.role; chipEl.style.fontSize = '9px'; chipEl.style.padding = '1px 7px'; }

  // Sync currentUser dari appUsers
  if (typeof appUsers !== 'undefined' && appUsers.length > 0) {
    const matched = appUsers.find(u => u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase());
    if (matched) currentUser = matched;
  }

  // Menu per role
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
    'nav-dashboard':'dashboard','nav-vehicles':'vehicles','nav-customer':'customer',
    'nav-monitoring':'monitoring','nav-alerts':'alerts','nav-claims':'claims',
    'nav-duty':'duty','nav-closing':'closing','nav-laporan':'laporan',
    'nav-kpi':'kpi','nav-settings':'settings','nav-users':'users',
  };
  Object.entries(NAV_MAP).forEach(([navId, menuKey]) => {
    const el = document.getElementById(navId);
    if (el) el.style.setProperty('display', allowed.has(menuKey) ? '' : 'none', 'important');
  });

  const adminDivider = document.querySelector('#sidebar .sidebar-nav > div');
  if (adminDivider) adminDivider.style.setProperty('display', user.role === 'administrator' ? '' : 'none', 'important');

  // DB info bar & export/reset buttons
  const isAdmin   = user.role === 'administrator';
  const exportBtn = document.getElementById('btn-export-db');
  const resetBtn  = document.getElementById('btn-reset-db');
  const infoBar   = document.getElementById('db-info-bar');
  const canExport = isAdmin || (typeof canDoAction === 'function' && canDoAction('export_data'));
  if (exportBtn) exportBtn.style.display = canExport ? '' : 'none';
  if (resetBtn)  resetBtn.style.display  = isAdmin   ? '' : 'none';
  if (!isAdmin && infoBar) {
    infoBar.style.setProperty('display', 'none', 'important');
    const appEl = document.getElementById('app'); if (appEl) appEl.style.paddingTop = '0';
  } else if (infoBar) { infoBar.style.removeProperty('display'); }

  // Re-render
  if (user.role === 'viewer' && typeof navigate === 'function') {
    navigate('vehicles');
  } else if (typeof render === 'function') {
    try { render(); } catch(e) { console.warn('render error:', e); }
  }
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
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'tyretrack_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function clearDB() {
  if (!confirm('Reset semua data database?')) return;
  const tables = ['vehicles','trial_vehicles','alerts','claims','pelumas_records','pelumas_trial_records','duty_trips','closing_history'];
  for (const t of tables) { try { await supa.from(t).delete().neq('id','__never__'); } catch(e) {} }
  alert('Database direset. Halaman akan dimuat ulang.');
  location.reload();
}

// ---- Persist state ----
function persistState() {
  try {
    localStorage.setItem('tyretrack_state', JSON.stringify({
      vehicles:            typeof vehicles            !== 'undefined' ? vehicles            : [],
      trialVehicles:       typeof trialVehicles       !== 'undefined' ? trialVehicles       : [],
      alerts:              typeof alerts              !== 'undefined' ? alerts              : [],
      claims:              typeof claims              !== 'undefined' ? claims              : [],
      pelumasRecords:      typeof pelumasRecords      !== 'undefined' ? pelumasRecords      : [],
      pelumasTrialRecords: typeof pelumasTrialRecords !== 'undefined' ? pelumasTrialRecords : [],
      dutyTrips:           typeof dutyTrips           !== 'undefined' ? dutyTrips           : [],
      closingHistory:      typeof closingHistory      !== 'undefined' ? closingHistory      : [],
    }));
  } catch(e) {}
  syncToSupabase().catch(e => console.warn('sync error', e));
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem('tyretrack_state');
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (s.vehicles            && typeof vehicles            !== 'undefined') vehicles            = s.vehicles;
    if (s.trialVehicles       && typeof trialVehicles       !== 'undefined') trialVehicles       = s.trialVehicles;
    if (s.alerts              && typeof alerts              !== 'undefined') alerts              = s.alerts;
    if (s.claims              && typeof claims              !== 'undefined') claims              = s.claims;
    if (s.pelumasRecords      && typeof pelumasRecords      !== 'undefined') pelumasRecords      = s.pelumasRecords;
    if (s.pelumasTrialRecords && typeof pelumasTrialRecords !== 'undefined') pelumasTrialRecords = s.pelumasTrialRecords;
    if (s.dutyTrips           && typeof dutyTrips           !== 'undefined') dutyTrips           = s.dutyTrips;
    if (s.closingHistory      && typeof closingHistory      !== 'undefined') closingHistory      = s.closingHistory;
    return true;
  } catch(e) { return false; }
}

// ---- Supabase Realtime ----
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

// FIX UTAMA: debounce realtime dari 30000ms (30 detik!) → 300ms
const _realtimeDebounces = {};
function _onRealtimeChange(table, payload) {
  clearTimeout(_realtimeDebounces[table]);
  _realtimeDebounces[table] = setTimeout(() => {
    try {
      const eventType = payload.eventType;
      const newData   = payload.new?.data;
      const oldId     = payload.old?.id;
      const setter    = TABLE_VAR_SET[table];
      const getter    = TABLE_VAR_MAP[table];
      if (!setter || !getter) return;
      const arr = getter() || [];
      if      (eventType === 'INSERT' && newData && !arr.find(x => x && x.id === newData.id)) setter([newData, ...arr]);
      else if (eventType === 'UPDATE' && newData) setter(arr.map(x => (x && x.id === newData.id) ? newData : x));
      else if (eventType === 'DELETE' && oldId)   setter(arr.filter(x => x && String(x.id) !== String(oldId)));
      if (typeof render === 'function') { try { render(); } catch(e) {} }
    } catch(e) { console.warn('realtime change error', table, e); }
  }, 300); // FIXED: was 30000 (30 detik!)
}

function _showToastNotif(bg, html, onClick) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:60px;right:20px;background:' + bg + ';color:white;padding:14px 20px;border-radius:16px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 8px 30px rgba(0,0,0,0.3);max-width:340px;cursor:pointer;transition:opacity .3s;line-height:1.5;';
  t.innerHTML = html;
  if (onClick) t.onclick = () => { onClick(); t.remove(); };
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => { if (t.parentNode) t.remove(); }, 400); }, 7000);
}

function startRealtimeSubscription() {
  const TABLES = ['vehicles','trial_vehicles','pelumas_records','pelumas_trial_records','duty_trips','closing_history'];
  const channel = supa.channel('tyretrack-rt-' + Date.now());

  TABLES.forEach(table => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => _onRealtimeChange(table, payload));
  });

  // Claims
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'claims' }, (payload) => {
    const nc = payload.new?.data; if (!nc) return;
    if (!CLAIMS.find(c => c.id === nc.id)) CLAIMS.unshift(nc);
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'alerts' || currentPage === 'claims') { try { render(); } catch(e) {} }
    if (currentUser && (currentUser.role === 'administrator' || currentUser.role === 'supervisor') && nc.needsApproval) {
      _showToastNotif('linear-gradient(135deg,#7c3aed,#6d28d9)',
        '🔔 <strong>Pengajuan Klaim Baru!</strong><br><span style="font-weight:500;font-size:12px;opacity:.9;">' + (nc.ticket||'') + ' · ' + (nc.plate||'') + ' — ' + (nc.customer||'') + '<br>Klik untuk review</span>',
        () => { if (typeof navigate === 'function') navigate('alerts'); });
    }
  });
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'claims' }, (payload) => {
    const uc = payload.new?.data; if (!uc) return;
    CLAIMS = CLAIMS.map(c => c.id === uc.id ? uc : c);
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'claims' || currentPage === 'alerts') { try { render(); } catch(e) {} }
  });

  // user_notifications
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_notifications' }, (payload) => {
    const notif = payload.new?.data;
    if (!notif || !currentUser || notif.userId !== currentUser.id) return;
    if (typeof USER_NOTIFICATIONS === 'undefined') return;
    if (USER_NOTIFICATIONS.find(n => n.id === notif.id)) return;
    USER_NOTIFICATIONS.unshift(notif);
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'alerts') { try { render(); } catch(e) {} }
    const type = notif.type || '';
    let bg = '#2563eb';
    if (type === 'claim_task')                                bg = 'linear-gradient(135deg,#0e7490,#0891b2)';
    else if (type === 'claim' && notif.status === 'Approved') bg = 'linear-gradient(135deg,#059669,#047857)';
    else if (type === 'claim' && notif.status === 'Rejected') bg = 'linear-gradient(135deg,#e11d48,#be123c)';
    else if (type === 'duty'  && notif.status === 'Approved') bg = 'linear-gradient(135deg,#059669,#047857)';
    else if (type === 'duty'  && notif.status === 'Rejected') bg = 'linear-gradient(135deg,#e11d48,#be123c)';
    else if (type === 'monitoring' || type === 'trial')       bg = 'linear-gradient(135deg,#d97706,#b45309)';
    const icon = bg.includes('059669') ? '✅' : bg.includes('e11d48') ? '❌' : bg.includes('d97706') ? '📋' : '🔔';
    _showToastNotif(bg, icon + ' <strong>' + (notif.title||'') + '</strong><br><span style="font-weight:500;font-size:12px;opacity:.9;">' + (notif.desc||'') + (notif.note ? '<br>' + notif.note : '') + '</span>',
      () => { if (typeof navigate === 'function') navigate('alerts'); });
  });
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_notifications' }, (payload) => {
    const updated = payload.new?.data;
    if (!updated || !currentUser || updated.userId !== currentUser.id) return;
    if (typeof USER_NOTIFICATIONS !== 'undefined')
      USER_NOTIFICATIONS = USER_NOTIFICATIONS.map(n => n.id === updated.id ? updated : n);
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'alerts') { try { render(); } catch(e) {} }
  });

  // sales_notifications (legacy)
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales_notifications' }, (payload) => {
    const notif = payload.new?.data; if (!notif || !currentUser || notif.submittedBy !== currentUser.id) return;
    if (!SALES_NOTIFICATIONS.find(n => n.id === notif.id)) SALES_NOTIFICATIONS.unshift(notif);
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'alerts') { try { render(); } catch(e) {} }
  });
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sales_notifications' }, (payload) => {
    const updated = payload.new?.data; if (!updated) return;
    SALES_NOTIFICATIONS = SALES_NOTIFICATIONS.map(n => n.id === updated.id ? updated : n);
    if (currentUser && updated.submittedBy === currentUser.id) {
      if (typeof updateAlertBadge === 'function') updateAlertBadge();
      if (currentPage === 'alerts') { try { render(); } catch(e) {} }
    }
  });

  // tech_notifications (legacy)
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tech_notifications' }, (payload) => {
    const notif = payload.new?.data;
    if (!notif || !currentUser || currentUser.role !== 'technical_support') return;
    if (typeof TECH_NOTIFICATIONS !== 'undefined' && !TECH_NOTIFICATIONS.find(n => n.id === notif.id))
      TECH_NOTIFICATIONS.unshift(notif);
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'alerts') { try { render(); } catch(e) {} }
  });
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tech_notifications' }, (payload) => {
    const updated = payload.new?.data;
    if (!updated || !currentUser || currentUser.role !== 'technical_support') return;
    if (typeof TECH_NOTIFICATIONS !== 'undefined')
      TECH_NOTIFICATIONS = TECH_NOTIFICATIONS.map(n => n.id === updated.id ? updated : n);
    if (typeof updateAlertBadge === 'function') updateAlertBadge();
    if (currentPage === 'alerts') { try { render(); } catch(e) {} }
  });

  // role_permissions
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, async () => {
    await loadRolePerms();
    applyRolePermsToNav();
    if (currentPage === 'settings') { try { render(); } catch(e) {} }
    const infoEl = document.getElementById('db-info-text');
    if (infoEl && currentUser && currentUser.role === 'administrator') {
      const orig = infoEl.textContent; infoEl.style.color = '#7c3aed';
      infoEl.textContent = '🔐 Hak akses diperbarui...';
      setTimeout(() => { infoEl.style.color = ''; infoEl.textContent = orig; }, 2500);
    }
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      const infoEl  = document.getElementById('db-info-text');
      const session = sessionGet();
      if (infoEl && session)
        infoEl.textContent = `Database: Supabase ☁️ · Realtime aktif 🟢 · ${session.name} (${ROLE_LABELS[session.role] || session.role})`;
    }
  });

  return channel;
}

let _realtimeChannel = null;

// ---- INIT ----
(async function init() {
  try {
    const session = sessionGet();
    if (!session) {
      document.body.classList.add('login-active');
      const lp = document.getElementById('login-page');
      if (lp) { lp.style.display = 'flex'; }
    } else {
      // User sudah punya sesi
      const lp = document.getElementById('login-page');
      if (lp) lp.style.display = 'none';

      const infoBar  = document.getElementById('db-info-bar');
      const infoText = document.getElementById('db-info-text');
      const appEl    = document.getElementById('app');
      if (infoBar)  infoBar.classList.add('show');
      if (infoText) infoText.textContent = 'Database: Supabase ☁️ · Menghubungkan...';
      if (appEl)    appEl.style.paddingTop = '38px';

      // Set currentUser segera dari session
      currentUser = {
        id:          session.id,
        name:        session.name,
        username:    session.username || (session.email ? session.email.split('@')[0] : 'user'),
        email:       session.email,
        role:        session.role,
        status:      session.status || 'active',
        avatar:      session.initial || (session.name ? session.name[0].toUpperCase() : 'U'),
        avatarColor: session.color || '#6b7280',
      };

      try { await loadFromSupabase(); } catch(e) { loadPersistedState(); }
      applySession(session);
      applyRolePermsToNav();

      if (_realtimeChannel) { try { supa.removeChannel(_realtimeChannel); } catch(e) {} }
      _realtimeChannel = startRealtimeSubscription();
    }
  } catch(e) {
    console.error('TyreTrack init error:', e);
    // Fallback aman: tampilkan login
    document.body.classList.add('login-active');
    const lp = document.getElementById('login-page');
    if (lp) lp.style.display = 'flex';
  }

  if (typeof render === 'function') { try { render(); } catch(e) { console.warn('init render error:', e); } }

  // Wrap render agar juga menyimpan state
  if (typeof render === 'function') {
    const _origRender = render;
    render = function() {
      try { _origRender(); } catch(e) { console.warn('render error:', e); }
      persistState();
    };
  }
})();
