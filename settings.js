function openAddUserModal() {
  activeEditUserId = null;
  userStatusDraft = 'active';
  document.getElementById('modal-user-title').textContent = 'Tambah User Baru';
  document.getElementById('u-name').value = '';
  document.getElementById('u-username').value = '';
  document.getElementById('u-email').value = '';
  document.getElementById('u-phone').value = '';
  document.getElementById('u-role').value = 'technical_support';
  setUserStatus('active');
  previewRolePerms('technical_support');
  document.getElementById('modal-user').classList.add('open');
}

function openEditUserModal(id) {
  const u = appUsers.find(x => x.id === id);
  if (!u) return;
  activeEditUserId = id;
  userStatusDraft = u.status;
  document.getElementById('modal-user-title').textContent = 'Edit User';
  document.getElementById('u-name').value = u.name;
  document.getElementById('u-username').value = u.username;
  document.getElementById('u-email').value = u.email;
  document.getElementById('u-phone').value = u.phone || '';
  document.getElementById('u-role').value = u.role;
  setUserStatus(u.status);
  previewRolePerms(u.role);
  document.getElementById('modal-user').classList.add('open');
}

function closeUserModal() {
  document.getElementById('modal-user').classList.remove('open');
  activeEditUserId = null;
}

function setUserStatus(status) {
  userStatusDraft = status;
  document.getElementById('u-status-active').classList.toggle('active', status === 'active');
  document.getElementById('u-status-inactive').classList.toggle('active', status === 'inactive');
}

function previewRolePerms(roleKey) {
  const perms = rolePerms[roleKey];
  if (!perms) return;
  const menuList = ALL_MENUS.filter(m => perms.menus[m.key]).map(m => m.icon + ' ' + m.label).join(', ');
  const actionList = ALL_ACTIONS.filter(a => perms.actions[a.key]).map(a => a.label).join(', ');
  const colors = { administrator:'#5b21b6', supervisor:'#1e40af', technical_support:'#0e7490', sales:'#c2410c', viewer:'#6b7280' };
  document.getElementById('role-preview-content').innerHTML = `
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Menu yang Dapat Diakses</div>
      <div style="font-size:12px;color:${colors[roleKey] || 'var(--text)'};">${menuList || '(tidak ada)'}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Aksi yang Diizinkan</div>
      <div style="font-size:12px;color:${colors[roleKey] || 'var(--text)'};">${actionList || '(hanya lihat)'}</div>
    </div>`;
}

// ====== PROFILE MANAGEMENT ======

function togglePwVis(inputId, iconEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  iconEl.innerHTML = isHidden
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function showMsg(elId, text, isError) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
  el.style.background = isError ? 'rgba(225,29,72,0.1)' : 'rgba(5,150,105,0.1)';
  el.style.border = isError ? '1px solid rgba(225,29,72,0.25)' : '1px solid rgba(5,150,105,0.25)';
  el.style.color = isError ? '#e11d48' : '#059669';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}

async function saveNewEmail() {
  const newEmail = (document.getElementById('new-email-input')?.value || '').trim().toLowerCase();
  if (!newEmail) return showMsg('email-msg', 'Email tidak boleh kosong.', true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return showMsg('email-msg', 'Format email tidak valid.', true);
  if (newEmail === (currentUser.email || '').toLowerCase()) return showMsg('email-msg', 'Email sama dengan yang sekarang.', true);
  try {
    const { data } = await supa.from('users').select('id').eq('email', newEmail).maybeSingle();
    if (data) return showMsg('email-msg', 'Email sudah digunakan akun lain.', true);
    const { error } = await supa.from('users').update({ email: newEmail }).eq('id', currentUser.id);
    if (error) throw error;
    currentUser.email = newEmail;
    appUsers = appUsers.map(u => u.id === currentUser.id ? { ...u, email: newEmail } : u);
    showMsg('email-msg', '✓ Email berhasil diperbarui.', false);
  } catch(e) {
    showMsg('email-msg', 'Gagal menyimpan. Coba lagi.', true);
  }
}

async function saveNewPassword() {
  const oldPw  = document.getElementById('pw-old')?.value  || '';
  const newPw  = document.getElementById('pw-new')?.value  || '';
  const newPw2 = document.getElementById('pw-new2')?.value || '';
  if (!oldPw)  return showMsg('pw-msg', 'Masukkan password lama.', true);
  if (oldPw !== currentUser.password) return showMsg('pw-msg', 'Password lama tidak sesuai.', true);
  if (!newPw)  return showMsg('pw-msg', 'Password baru tidak boleh kosong.', true);
  if (newPw.length < 6) return showMsg('pw-msg', 'Password baru minimal 6 karakter.', true);
  if (newPw !== newPw2) return showMsg('pw-msg', 'Konfirmasi password tidak cocok.', true);
  if (newPw === oldPw)  return showMsg('pw-msg', 'Password baru sama dengan yang lama.', true);
  try {
    const { error } = await supa.from('users').update({ password: newPw }).eq('id', currentUser.id);
    if (error) throw error;
    currentUser.password = newPw;
    appUsers = appUsers.map(u => u.id === currentUser.id ? { ...u, password: newPw } : u);
    ['pw-old','pw-new','pw-new2'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    showMsg('pw-msg', '✓ Password berhasil diperbarui.', false);
  } catch(e) {
    showMsg('pw-msg', 'Gagal menyimpan. Coba lagi.', true);
  }
}

function handleProfilePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('Ukuran foto maksimal 2MB.'); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    try { await supa.from('users').update({ photo_url: base64 }).eq('id', currentUser.id); } catch(err) {}
    currentUser.photoUrl = base64;
    appUsers = appUsers.map(u => u.id === currentUser.id ? { ...u, photoUrl: base64 } : u);
    // Update sidebar avatar langsung
    const avatarEl = document.getElementById('sidebar-avatar');
    if (avatarEl) avatarEl.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    // Update preview
    const preview = document.getElementById('prof-avatar-preview');
    if (preview) preview.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;" />`;
    // Munculkan tombol hapus
    render();
  };
  reader.readAsDataURL(file);
}

async function removeProfilePhoto() {
  if (!confirm('Hapus foto profil?')) return;
  try { await supa.from('users').update({ photo_url: null }).eq('id', currentUser.id); } catch(e) {}
  currentUser.photoUrl = null;
  appUsers = appUsers.map(u => u.id === currentUser.id ? { ...u, photoUrl: null } : u);
  const avatarEl = document.getElementById('sidebar-avatar');
  if (avatarEl) {
    avatarEl.innerHTML = currentUser.avatar || currentUser.name[0].toUpperCase();
    avatarEl.style.background = `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}aa)`;
  }
  render();
}

function submitUser() {
  const name = document.getElementById('u-name').value.trim();
  const username = document.getElementById('u-username').value.trim();
  const email = document.getElementById('u-email').value.trim();
  const phone = document.getElementById('u-phone').value.trim();
  const role = document.getElementById('u-role').value;
  if (!name || !username || !email) { alert('Harap isi Nama, Username, dan Email.'); return; }

  const avatarColors = { administrator:'#7c3aed', supervisor:'#2563eb', technical_support:'#0891b2', sales:'#ea580c', sales_counter:'#9d174d', viewer:'#6b7280' };
  if (activeEditUserId) {
    const updated = appUsers.map(u => u.id === activeEditUserId
      ? { ...u, name, username, email, phone, role, status: userStatusDraft, avatarColor: avatarColors[role] || u.avatarColor, avatar: name.charAt(0).toUpperCase() }
      : u);
    appUsers = updated;
    // Sync ke Supabase
    const u = updated.find(x => x.id === activeEditUserId);
    if (u) supa.from('users').update({ name: u.name, email: u.email, role: u.role, initial: u.avatar, color: u.avatarColor }).eq('id', u.id).then(({error}) => { if(error) console.warn('update user error', error); });
  } else {
    const newUser = { id: randId(), name, username, email, phone, role, status: userStatusDraft, avatar: name.charAt(0).toUpperCase(), avatarColor: avatarColors[role] || '#6b7280' };
    appUsers.push(newUser);
    // Sync ke Supabase
    supa.from('users').insert({ id: newUser.id, name: newUser.name, email: newUser.email, password: '', role: newUser.role, color: newUser.avatarColor, initial: newUser.avatar }).then(({error}) => { if(error) console.warn('insert user error', error); });
  }
  closeUserModal();
  render();
}

function toggleUserStatus(id) {
  appUsers = appUsers.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u);
  render();
}

function deleteUser(id) {
  const u = appUsers.find(x => x.id === id);
  if (!confirm(`Hapus user "${u?.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  appUsers = appUsers.filter(x => x.id !== id);
  // Sync ke Supabase
  supa.from('users').delete().eq('id', id).then(({error}) => { if(error) console.warn('delete user error', error); });
  render();
}

// ====== ROLE PERMISSION MODAL ======
function openRoleModal(roleKey) {
  activeEditRoleKey = roleKey;
  const roleLabels = { administrator:'Administrator', supervisor:'Supervisor', technical_support:'Technical Support', sales:'Sales', sales_counter:'Sales Counter', viewer:'Viewer (Hanya Lihat)' };
  document.getElementById('modal-role-title').textContent = `Hak Akses – ${roleLabels[roleKey]}`;
  const perms = rolePerms[roleKey];
  document.getElementById('role-perm-body').innerHTML = `
    <div class="perm-section">
      <div class="perm-section-title">📋 Akses Menu</div>
      ${ALL_MENUS.map(m => `
      <div class="perm-row">
        <span class="perm-label">
          <span style="font-size:16px;">${m.icon}</span>${m.label}
        </span>
        <label class="perm-toggle">
          <input type="checkbox" id="rp-menu-${m.key}" ${perms.menus[m.key] ? 'checked' : ''} ${roleKey === 'administrator' && m.key === 'dashboard' ? 'disabled' : ''} />
          <span class="perm-slider"></span>
        </label>
      </div>`).join('')}
    </div>
    <div class="perm-section">
      <div class="perm-section-title">⚡ Izin Aksi</div>
      ${ALL_ACTIONS.map(a => `
      <div class="perm-row">
        <span class="perm-label">${a.label}</span>
        <label class="perm-toggle">
          <input type="checkbox" id="rp-action-${a.key}" ${perms.actions[a.key] ? 'checked' : ''} ${roleKey === 'administrator' ? 'disabled' : ''} />
          <span class="perm-slider"></span>
        </label>
      </div>`).join('')}
    </div>
    ${roleKey === 'administrator' ? `<div style="background:rgba(124,58,237,0.07);border:1px solid #c4b5fd;border-radius:12px;padding:12px 16px;font-size:12px;color:#5b21b6;display:flex;align-items:center;gap:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Administrator memiliki akses penuh ke semua fitur dan tidak dapat dibatasi.</div>` : ''}`;
  document.getElementById('modal-role').classList.add('open');
}

function closeRoleModal() {
  document.getElementById('modal-role').classList.remove('open');
  activeEditRoleKey = null;
}

// ====== INLINE LEGEND PERMISSION TOGGLE ======
function toggleLegendPerm(type, key, roleKey, cellEl) {
  if (roleKey === 'administrator') return;
  const current = type === 'menu' ? rolePerms[roleKey].menus[key] : rolePerms[roleKey].actions[key];
  const newVal = current ? 0 : 1;
  if (type === 'menu') rolePerms[roleKey].menus[key] = newVal;
  else rolePerms[roleKey].actions[key] = newVal;

  // Update visual in-place without full re-render
  const span = cellEl.querySelector('span[class^="perm-badge"]');
  if (span) {
    if (newVal) {
      span.className = 'perm-badge-on';
      span.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#d1fae5;border-radius:50%;border:1.5px solid #6ee7b7;transition:all .2s;';
      span.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    } else {
      span.className = 'perm-badge-off';
      span.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#f3f4f6;border-radius:50%;border:1.5px solid #e5e7eb;transition:all .2s;';
      span.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    }
    span.style.transform = 'scale(1.4)';
    setTimeout(function() { span.style.transform = 'scale(1)'; }, 200);
  }
  cellEl.title = newVal ? 'Klik untuk cabut izin ini' : 'Klik untuk beri izin ini';
  clearTimeout(toggleLegendPerm._debounce);
  toggleLegendPerm._debounce = setTimeout(() => saveRolePermsToSupabase(roleKey), 800);

  // Show subtle toast
  var existingToast = document.getElementById('perm-toast');
  if (existingToast) existingToast.remove();
  var toast = document.createElement('div');
  toast.id = 'perm-toast';
  var roleLabels2 = { administrator:'Administrator', supervisor:'Supervisor', technical_support:'Technical Support', sales:'Sales', sales_counter:'Sales Counter', viewer:'Viewer' };
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:10px 20px;border-radius:12px;font-size:12px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.25);display:flex;align-items:center;gap:8px;transition:opacity .3s;white-space:nowrap;';
  toast.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:' + (newVal ? '#059669' : '#e11d48') + ';border-radius:50%;flex-shrink:0;">' + (newVal ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>') + '</span> ' + roleLabels2[roleKey] + ': ' + (newVal ? 'izin ditambahkan' : 'izin dicabut');
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity='0'; setTimeout(function(){toast.remove();},400); }, 1800);
}

function resetAllRolePerms() {
  if (!confirm('Reset semua hak akses ke pengaturan default? Perubahan yang Anda buat akan hilang.')) return;
  rolePerms = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMS));
  Object.keys(DEFAULT_ROLE_PERMS).forEach(rk => { if (rk !== 'administrator') saveRolePermsToSupabase(rk); });
  applyRolePermsToNav();
  render();
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#b45309;color:white;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(180,83,9,0.4);transition:opacity .3s;';
  toast.textContent = '\u21ba Hak akses direset ke pengaturan default';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity='0'; setTimeout(function(){toast.remove();},400); }, 2200);
}

function saveRolePerms() {
  if (!activeEditRoleKey || activeEditRoleKey === 'administrator') {
    closeRoleModal();
    return;
  }
  const newMenus = {};
  ALL_MENUS.forEach(m => {
    newMenus[m.key] = document.getElementById(`rp-menu-${m.key}`)?.checked ? 1 : 0;
  });
  const newActions = {};
  ALL_ACTIONS.forEach(a => {
    newActions[a.key] = document.getElementById(`rp-action-${a.key}`)?.checked ? 1 : 0;
  });
  rolePerms[activeEditRoleKey] = { menus: newMenus, actions: newActions };
  saveRolePermsToSupabase(activeEditRoleKey);
  closeRoleModal();
  render();
  applyRolePermsToNav();
  const saved = document.createElement('div');
  saved.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:white;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(5,150,105,0.4);transition:opacity .3s;';
  saved.textContent = '✓ Hak akses disimpan & diterapkan ke semua user';
  document.body.appendChild(saved);
  setTimeout(() => { saved.style.opacity='0'; setTimeout(()=>saved.remove(), 400); }, 2500);
}


let currentLang = 'id';
let currentTheme = 'light';

const LANG = {
  id: {
    settings: 'Pengaturan',
    settingsSub: 'Konfigurasi sistem TyreTrack.',
    appInfo: 'Informasi Sistem',
    version: 'Versi Aplikasi',
    platform: 'Platform',
    lastUpdate: 'Terakhir Diperbarui',
    appearance: 'Tampilan',
    themeLabel: 'Mode Tema',
    lightMode: '☀️ Light Mode',
    darkMode: '🌙 Dark Mode',
    langLabel: 'Bahasa / Language',
    langID: '🇮🇩 Bahasa Indonesia',
    langEN: '🇬🇧 English',
    contact: 'Hubungi Administrator',
    contactSub: 'Jika Anda mengalami kendala teknis atau membutuhkan bantuan lebih lanjut.',
    emailAdmin: 'Email Admin',
    waSupport: 'WhatsApp Support',
    // nav
    navDashboard: 'Beranda', navVehicles: 'Kendaraan', navMonitoring: 'Monitoring',
    navAlerts: 'Peringatan', navClaims: 'Claim Proses', navDuty: 'Dinas Luar Kota',
    navClosing: 'Closing Data', navSettings: 'Pengaturan',
    addVehicle: 'Tambah Kendaraan', searchPlaceholder: 'Cari kendaraan...',
  },
  en: {
    settings: 'Settings',
    settingsSub: 'TyreTrack system configuration.',
    appInfo: 'System Information',
    version: 'App Version',
    platform: 'Platform',
    lastUpdate: 'Last Updated',
    appearance: 'Appearance',
    themeLabel: 'Theme Mode',
    lightMode: '☀️ Light Mode',
    darkMode: '🌙 Dark Mode',
    langLabel: 'Language / Bahasa',
    langID: '🇮🇩 Bahasa Indonesia',
    langEN: '🇬🇧 English',
    contact: 'Contact Administrator',
    contactSub: 'If you experience technical issues or need further assistance.',
    emailAdmin: 'Email Admin',
    waSupport: 'WhatsApp Support',
    // nav
    navDashboard: 'Dashboard', navVehicles: 'Vehicles', navMonitoring: 'Monitoring',
    navAlerts: 'Alerts', navClaims: 'Claim Process', navDuty: 'Out-of-Town Duty',
    navClosing: 'Closing Data', navSettings: 'Settings',
    addVehicle: 'Add Vehicle', searchPlaceholder: 'Search vehicles...',
  }
};

function t(key) { return LANG[currentLang][key] || LANG['id'][key] || key; }

function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle('dark', theme === 'dark');
  localStorage && localStorage.setItem('theme', theme);
}

function applyLang(lang) {
  currentLang = lang;
  localStorage && localStorage.setItem('lang', lang);
  // Update nav labels
  const navMap = { dashboard: 'navDashboard', vehicles: 'navVehicles', monitoring: 'navMonitoring', alerts: 'navAlerts', claims: 'navClaims', duty: 'navDuty', closing: 'navClosing', settings: 'navSettings' };
  Object.entries(navMap).forEach(([page, key]) => {
    const el = document.getElementById('nav-' + page);
    if (el) {
      // Keep SVG, update text node
      const svg = el.querySelector('svg');
      const badge = el.querySelector('.nav-badge');
      el.innerHTML = '';
      if (svg) el.appendChild(svg);
      el.appendChild(document.createTextNode(' ' + t(key)));
      if (badge) el.appendChild(badge);
    }
  });
  // Update add vehicle button and search
  const addBtn = document.querySelector('#header .btn-primary');
  if (addBtn) addBtn.childNodes[addBtn.childNodes.length-1].textContent = ' ' + t('addVehicle');
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = t('searchPlaceholder');
  // Re-render current content if settings page
  if (currentPage === 'settings') render();
}

// ====== PROFILE PAGE ======
function renderProfile() {
  const roleLabel = { administrator:'Administrator', supervisor:'Supervisor', technical_support:'Technical Support', sales:'Sales', sales_counter:'Sales Counter', viewer:'Viewer' };
  const roleColor = { administrator:'#7c3aed', supervisor:'#2563eb', technical_support:'#0e7490', sales:'#d97706', sales_counter:'#9d174d', viewer:'#6b7280' };
  const roleBg    = { administrator:'#ede9fe', supervisor:'#dbeafe', technical_support:'#ecfeff', sales:'#fff7ed', sales_counter:'#fdf2f8', viewer:'#f3f4f6' };
  const avatarBg  = currentUser.avatarColor || '#059669';
  const hasPhoto  = currentUser.photoUrl;
  return `
  <div style="max-width:520px;margin:0 auto;">
    <div class="page-header">
      <div class="page-title">Profil Saya</div>
      <div class="page-sub">Kelola foto, email, dan password akun Anda.</div>
    </div>
<!-- ===== PROFIL SAYA ===== -->
    <div class="card" style="margin-bottom:16px;">
      <div style="padding:24px;">
        <div style="font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profil Saya
        </div>

        <!-- Foto Profil -->
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--border);">
          <div style="position:relative;flex-shrink:0;">
            <div id="prof-avatar-preview" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,${avatarBg},${avatarBg}cc);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:white;font-family:'Syne',sans-serif;overflow:hidden;border:3px solid var(--border);">
              ${hasPhoto
                ? `<img src="${currentUser.photoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
                : (currentUser.avatar || currentUser.name[0].toUpperCase())}
            </div>
            <label for="prof-photo-input" style="position:absolute;bottom:0;right:0;width:26px;height:26px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid var(--surface);box-shadow:0 2px 8px rgba(0,0,0,0.15);" title="Ganti foto profil">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </label>
            <input type="file" id="prof-photo-input" accept="image/*" style="display:none;" onchange="handleProfilePhoto(this)" />
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:17px;font-weight:800;color:var(--text);margin-bottom:4px;">${currentUser.name}</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${currentUser.email || '—'}</div>
            <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${roleBg[currentUser.role]||'#f3f4f6'};color:${roleColor[currentUser.role]||'#6b7280'};">
              ${roleLabel[currentUser.role] || currentUser.role}
            </span>
          </div>
          ${hasPhoto ? `<button onclick="removeProfilePhoto()" style="padding:7px 12px;border-radius:10px;border:1px solid #fecdd3;background:#fff1f2;color:#e11d48;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;flex-shrink:0;" title="Hapus foto">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>` : ''}
        </div>

        <!-- Ganti Email -->
        <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:12px;display:flex;align-items:center;gap:7px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Ganti Email
          </div>
          <div id="email-msg" style="display:none;margin-bottom:10px;padding:9px 13px;border-radius:10px;font-size:12px;font-weight:600;"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input class="form-input" type="email" id="new-email-input" placeholder="Email baru" value="${currentUser.email||''}"
              style="flex:1;min-width:180px;" onkeydown="if(event.key==='Enter')saveNewEmail()" />
            <button onclick="saveNewEmail()" class="btn btn-primary" style="flex-shrink:0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Simpan
            </button>
          </div>
        </div>

        <!-- Ganti Password -->
        <div>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:12px;display:flex;align-items:center;gap:7px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Ganti Password
          </div>
          <div id="pw-msg" style="display:none;margin-bottom:10px;padding:9px 13px;border-radius:10px;font-size:12px;font-weight:600;"></div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="position:relative;">
              <input class="form-input" type="password" id="pw-old" placeholder="Password lama" style="width:100%;padding-right:40px;" />
              <span onclick="togglePwVis('pw-old',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--muted);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </span>
            </div>
            <div style="position:relative;">
              <input class="form-input" type="password" id="pw-new" placeholder="Password baru (min. 6 karakter)" style="width:100%;padding-right:40px;" />
              <span onclick="togglePwVis('pw-new',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--muted);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </span>
            </div>
            <div style="position:relative;">
              <input class="form-input" type="password" id="pw-new2" placeholder="Konfirmasi password baru" style="width:100%;padding-right:40px;" onkeydown="if(event.key==='Enter')saveNewPassword()" />
              <span onclick="togglePwVis('pw-new2',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--muted);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </span>
            </div>
            <button onclick="saveNewPassword()" class="btn btn-primary" style="align-self:flex-start;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Ganti Password
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderSettings() {
  const viewerReadOnly = currentUser.role === 'viewer';
  const lastUpdated = new Date().toLocaleDateString(currentLang === 'id' ? 'id-ID' : 'en-US', {day:'numeric',month:'long',year:'numeric'});

  return `
  <div style="max-width:600px;margin:0 auto;">
    <div class="page-header"><div class="page-title">${t('settings')}</div><div class="page-sub">${t('settingsSub')}</div></div>



        <!-- Appearance Card -->
    <div class="card" style="margin-bottom:16px;">
      <div style="padding:24px;">
        <div style="font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ${t('appearance')}
        </div>

        <!-- Theme -->
        <div style="margin-bottom:20px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:10px;">${t('themeLabel')}</div>
          <div class="settings-toggle-group">
            <button class="settings-toggle-btn ${currentTheme==='light'?'active':''}" onclick="applyTheme('light');render()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ${t('lightMode')}
            </button>
            <button class="settings-toggle-btn ${currentTheme==='dark'?'active':''}" onclick="applyTheme('dark');render()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ${t('darkMode')}
            </button>
          </div>
        </div>

        <!-- Language -->
        <div>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:10px;">${t('langLabel')}</div>
          <div class="settings-toggle-group">
            <button class="settings-toggle-btn ${currentLang==='id'?'active':''}" onclick="applyLang('id')">
              ${t('langID')}
            </button>
            <button class="settings-toggle-btn ${currentLang==='en'?'active':''}" onclick="applyLang('en')">
              ${t('langEN')}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- System Info Card -->
    <div class="card" style="margin-bottom:16px;">
      <div style="padding:24px;">
        <div style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          ${t('appInfo')}
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);font-size:14px;"><span style="color:var(--muted);">${t('version')}</span><span style="font-family:'DM Mono',monospace;font-weight:500;">1.0.0</span></div>
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);font-size:14px;"><span style="color:var(--muted);">${t('platform')}</span><span style="font-weight:500;">Web (All Device)</span></div>
        <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:14px;"><span style="color:var(--muted);">${t('lastUpdate')}</span><span style="font-weight:500;">${lastUpdated}</span></div>
      </div>
    </div>

    <!-- Contact Card -->
    <div class="card" style="margin-bottom:16px;">
      <div style="padding:24px;">
        <div style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.46 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          ${t('contact')}
        </div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:16px;">${t('contactSub')}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="alert('Menghubungi administrator via email...')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            ${t('emailAdmin')}
          </button>
          <button class="btn" style="background:#25d366;color:white;" onclick="alert('Membuka WhatsApp support...')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            ${t('waSupport')}
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

// ====== VEHICLE ACTIONS ======
function selectVehicle(id) {
  selectedVehicleId = id;
  if (currentPage === 'dashboard') render();
}

function goToMonitoringDetail(vehicleId) {
  selectedVehicleId = vehicleId;
  monitoringView = 'detail';
  // Determine which list this vehicle belongs to
  monitoringTab = trialVehicles.some(v => v.id === vehicleId) ? 'trial' : 'monitoring';
  navigate('monitoring');
}

function deleteVehicle(id) {
  if (!confirm('Hapus kendaraan ini dari pemantauan?')) return;
  vehicles = vehicles.filter(v => v.id !== id);
  trialVehicles = trialVehicles.filter(v => v.id !== id);
  if (selectedVehicleId === id) {
    selectedVehicleId = vehicles.length > 0 ? vehicles[0].id : null;
  }
  render();
}
// ====== ADD VEHICLE MODAL ======
let currentWizardStep = 1;

let addVehicleTarget = 'monitoring'; // 'monitoring' | 'trial'

// ====== SALES COMPANY PICKER HELPERS ======
function onSalesRadioChange() {
  // Visual feedback is handled by CSS :checked selector — nothing extra needed
}
function getSalesCompany() {
  const checked = document.querySelector('input[name="f-sales-company"]:checked');
  return checked ? checked.value : '';
}
function resetSalesPicker() {
  document.querySelectorAll('input[name="f-sales-company"]').forEach(r => r.checked = false);
}
// Customer value (plain text input)
function getCustomerValue() {
  const inp = document.getElementById('f-customer');
  return inp ? inp.value.trim() : '';
}

function openAddVehicleModal(target) {
  addVehicleTarget = target || 'monitoring';
  // Update modal title label to show which category
  const labelEl = document.getElementById('modal-add-vehicle-category');
  if (labelEl) labelEl.textContent = addVehicleTarget === 'trial' ? 'Kategori: Trial' : 'Kategori: Monitoring';
  currentWizardStep = 1;
  tempPhotoOdo = null;
  tempPhotoUnit = null;
  updateWizardUI();
  buildTireConfigs();
  document.getElementById('add-vehicle-form').reset();
  // reset customer select/input
  const cInp = document.getElementById('f-customer');
  if (cInp) cInp.value = '';
  resetSalesPicker();
  // reset foto previews
  clearPhoto('odo');
  clearPhoto('unit');
  document.getElementById('f-installdate').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal-add-vehicle').classList.add('open');
}
function closeAddVehicleModal() {
  document.getElementById('modal-add-vehicle').classList.remove('open');
}

function updateWizardUI() {
  // pages
  document.getElementById('wizard-step-1').classList.toggle('active', currentWizardStep === 1);
  document.getElementById('wizard-step-2').classList.toggle('active', currentWizardStep === 2);
  // step dots
  const d1 = document.getElementById('step-dot-1');
  const d2 = document.getElementById('step-dot-2');
  const l2 = document.getElementById('step-label-2');
  const line = document.getElementById('step-line');
  const stepLabel = document.getElementById('modal-step-label');
  if (currentWizardStep === 1) {
    d1.style.background = 'var(--green)'; d1.style.color = 'white';
    d2.style.background = '#e5e7eb'; d2.style.color = 'var(--muted)';
    l2.style.color = 'var(--muted)';
    line.style.width = '0%';
    stepLabel.textContent = 'Langkah 1 dari 2 — Informasi Kendaraan';
  } else {
    d1.style.background = '#059669'; d1.innerHTML = '✓'; d1.style.color = 'white';
    d2.style.background = 'var(--green)'; d2.style.color = 'white'; d2.innerHTML = '2';
    l2.style.color = 'var(--text)';
    line.style.width = '100%';
    stepLabel.textContent = 'Langkah 2 dari 2 — Detail Ban';
  }
  // buttons
  document.getElementById('btn-modal-back').style.display = currentWizardStep === 2 ? 'inline-flex' : 'none';
  document.getElementById('btn-modal-cancel').style.display = currentWizardStep === 1 ? 'inline-flex' : 'none';
  const nextBtn = document.getElementById('btn-modal-next'); if (currentWizardStep === 2) {
    nextBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Simpan Kendaraan`;
    nextBtn.onclick = () => document.getElementById('add-vehicle-form').requestSubmit();
  } else {
    nextBtn.innerHTML = `Lanjut ke Detail Ban <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
    nextBtn.onclick = wizardNext;
  }
}

function wizardNext() {
  if (currentWizardStep === 1) {
    // validasi step 1
    const plate = document.getElementById('f-plate').value.trim();
    const customer = getCustomerValue();
    const make = document.getElementById('f-make').value.trim();
    if (!plate || !customer || !make) {
      alert('Harap isi minimal: Nama Customer, Nomor Plat, dan Merk Kendaraan.');
      return;
    }
    currentWizardStep = 2;
    updateWizardUI();
  }
}

function wizardBack() {
  if (currentWizardStep === 2) {
    currentWizardStep = 1;
    document.getElementById('step-dot-1').innerHTML = '1';
    updateWizardUI();
  }
}

function buildTireConfigs() {
  const container = document.getElementById('tire-configs');
  container.innerHTML = TIRE_POSITIONS.map((pos, i) => `
    <tr id="tire-row-${i}">
      <td>
        <div style="display:flex;align-items:center;">
          <span class="tire-pos-badge">${i+1}</span>
          <span class="tire-pos-name">${pos}</span>
        </div>
      </td>
      <td><input class="form-input" type="text" id="tc-brand-${i}" placeholder="Bridgestone" /></td>
      <td><input class="form-input" type="text" id="tc-model-${i}" placeholder="Turanza" /></td>
      <td><input class="form-input" type="number" step="0.1" id="tc-nsd-${i}" placeholder="8.0" min="0" max="30" /></td>
      <td><input class="form-input" type="number" id="tc-psi-${i}" placeholder="32" min="0" max="120" /></td>
      <td><input class="form-input" type="number" id="tc-price-${i}" placeholder="0" min="0" step="1000" style="min-width:110px;" /></td>
      <td style="text-align:center;">
        <div class="tire-photo-btn" id="tire-photo-btn-${i}" title="Upload foto kondisi ban">
          <input type="file" accept="image/*" onchange="handleTirePhoto(event,${i})" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3"/></svg>
        </div>
      </td>
    </tr>`).join('');
  // reset array foto ban
  tirePhoots = new Array(TIRE_POSITIONS.length).fill(null);
}

let tirePhoots = [];

function handleTirePhoto(event, idx) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    tirePhoots[idx] = dataUrl;
    const btn = document.getElementById(`tire-photo-btn-${idx}`);
    const inputEl = btn.querySelector('input[type=file]');
    btn.classList.add('has-photo');
    btn.innerHTML = '';
    btn.appendChild(inputEl);
    const img = document.createElement('img');
    img.src = dataUrl;
    btn.appendChild(img);
    const x = document.createElement('span');
    x.className = 'remove-x';
    x.innerHTML = '✕';
    x.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); clearTirePhoto(idx); };
    btn.appendChild(x);
  };
  reader.readAsDataURL(file);
}

function clearTirePhoto(idx) {
  tirePhoots[idx] = null;
  const btn = document.getElementById(`tire-photo-btn-${idx}`);
  btn.classList.remove('has-photo');
  btn.innerHTML = `
    <input type="file" accept="image/*" onchange="handleTirePhoto(event,${idx})" />
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3"/></svg>`;
}
function submitAddVehicle(e) {
  e.preventDefault();
  const tires = TIRE_POSITIONS.map((pos, i) => {
    const psiRaw   = document.getElementById(`tc-psi-${i}`)?.value.trim() || '';
    const nsdRaw   = document.getElementById(`tc-nsd-${i}`)?.value.trim() || '';
    const brandRaw = document.getElementById(`tc-brand-${i}`)?.value.trim() || '';
    const modelRaw = document.getElementById(`tc-model-${i}`)?.value.trim() || '';
    const priceRaw = document.getElementById(`tc-price-${i}`)?.value.trim() || '';
    const hasData  = psiRaw !== '' || nsdRaw !== '' || brandRaw !== '' || !!tirePhoots[i];
    // Posisi tidak diisi — simpan tanpa measurements (tidak ditampilkan di monitoring)
    if (!hasData) {
      return { id: randId(), position: pos, brand: '', model: '', price: 0, installDate: new Date().toISOString().split('T')[0], photo: null, status: 'good', measurements: [] };
    }
    const pressure = parseFloat(psiRaw) || 32;
    const tread    = parseFloat(nsdRaw) || 8;
    const price    = parseInt(priceRaw) || 0;
    const status   = getTireStatus(pressure, tread);
    return {
      id: randId(),
      position: pos,
      brand: brandRaw,
      model: modelRaw,
      price,
      installDate: new Date().toISOString().split('T')[0],
      photo: tirePhoots[i] || null,
      status,
      measurements: [{ id: randId(), timestamp: new Date().toISOString(), pressure, treadDepth: tread, odometer: null, notes: '' }]
    };
  });
  const v = {
    id: randId(),
    plateNumber: document.getElementById('f-plate').value.toUpperCase(),
    make: document.getElementById('f-make').value,
    model: document.getElementById('f-model').value,
    customerName: getCustomerValue(),
    salesCompany: getSalesCompany(),
    salesName: document.getElementById('f-sales-name')?.value.trim() || '',
    salesPhone: document.getElementById('f-sales-phone')?.value.trim() || '',
    picNumber: document.getElementById('f-pic').value || '',
    tonnage: parseFloat(document.getElementById('f-tonnage').value) || 0,
    installDate: document.getElementById('f-installdate').value || new Date().toISOString().split('T')[0],
    installOdo: parseInt(document.getElementById('f-odo').value) || null,
    photoOdo: tempPhotoOdo || null,
    photoUnit: tempPhotoUnit || null,
    inputBy: currentUser ? currentUser.username : '',
    createdBy: currentUser ? currentUser.id : null,
    tires
  };
  if (addVehicleTarget === 'trial') {
    trialVehicles.push(v);
  } else {
    vehicles.push(v);
    selectedVehicleId = v.id;
  }

  // Sync ke Supabase
  supaUpsert(addVehicleTarget === 'trial' ? 'trial_vehicles' : 'vehicles', v.id, v);

  closeAddVehicleModal();
  // Stay on monitoring page, set correct tab
  monitoringView = 'list';
  monitoringTab = addVehicleTarget;
  navigate('monitoring');

  // Toast sukses
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(5,150,105,0.4);transition:opacity .3s;';
  toast.innerHTML = `✓ Kendaraan ${v.plateNumber} berhasil ditambahkan`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2500);
}

// ====== MEASUREMENT MODAL ======
function openMeasureModal(tireId) {
  activeMeasureTireId = tireId;
  const { tire } = findTireById(tireId);
  if (!tire) return;
  const latest = tire.measurements[tire.measurements.length - 1];
  document.getElementById('measure-pos').textContent = tire.position;
  document.getElementById('m-pressure').value = latest?.pressure ?? 32;
  document.getElementById('m-tread').value = latest?.treadDepth ?? 8;
  document.getElementById('m-odometer').value = latest?.odometer ?? '';
  document.getElementById('m-notes').value = '';
  document.getElementById('m-removed').checked = false;
  document.getElementById('modal-measurement').classList.add('open');
}
function closeMeasureModal() {
  document.getElementById('modal-measurement').classList.remove('open');
  activeMeasureTireId = null;
}
function submitMeasurement() {
  const pressure = parseFloat(document.getElementById('m-pressure').value);
  const tread = parseFloat(document.getElementById('m-tread').value);
  const odometer = parseInt(document.getElementById('m-odometer').value) || null;
  const notes = document.getElementById('m-notes').value.trim();
  const isRemoved = document.getElementById('m-removed').checked;

  if (isNaN(pressure) || isNaN(tread)) { alert('Harap isi Tekanan dan Alur dengan benar.'); return; }

  if (isRemoved) {
    if (!confirm('Ban ini akan ditandai sebagai SUDAH DILEPAS dan dipindahkan ke Closing Data. Lanjutkan?')) return;
  }

  const { tire: t, vehicle: v } = findTireById(activeMeasureTireId);
  let closedEntry = null;

  if (isRemoved && t && v) {
    const m = { id: randId(), timestamp: new Date().toISOString(), pressure, treadDepth: tread, odometer, notes };
    closedEntry = {
      id: randId(), tireId: t.id, vehicleId: v.id,
      plateNumber: v.plateNumber, customerName: v.customerName,
      position: t.position, brand: t.brand, model: t.model,
      pressure, treadDepth: tread, odometer, notes,
      closedAt: new Date().toISOString(),
      measurements: [...t.measurements, m],
    };
  }

  updateTireInLists(activeMeasureTireId, t => {
    const m = { id: randId(), timestamp: new Date().toISOString(), pressure, treadDepth: tread, odometer, notes };
    if (isRemoved) {
      return { ...t, status: 'good', removed: true, measurements: [...t.measurements, m] };
    }
    return { ...t, status: getTireStatus(pressure, tread), measurements: [...t.measurements, m] };
  });

  // Sync kendaraan yang diupdate ke Supabase
  const { vehicle: updatedVehicle } = findTireById(activeMeasureTireId);
  if (updatedVehicle) {
    const isInTrial = trialVehicles.some(v => v.id === updatedVehicle.id);
    supaUpsert(isInTrial ? 'trial_vehicles' : 'vehicles', updatedVehicle.id, updatedVehicle);
  }

  if (closedEntry) {
    closedTires.unshift(closedEntry);
    closingHistory.unshift(closedEntry);
    supaUpsert('closing_history', closedEntry.id, closedEntry);
  }
  closeMeasureModal();
  render();
}

// ====== HISTORY MODAL ======
function openHistoryModal(vehicleId, tireId) {
  const { tire, vehicle } = findTireById(tireId);
  if (!tire) return;
  const vId = vehicleId || (vehicle && vehicle.id) || '';
  const sorted = [...tire.measurements].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp));
  document.getElementById('history-pos').textContent = `${tire.position} • ${tire.brand} ${tire.model}`;
  const canEdit = currentUser && (currentUser.role === 'administrator' || currentUser.role === 'supervisor' || currentUser.role === 'technical_support');
  document.getElementById('history-body').innerHTML = sorted.length === 0 ? '<p style="text-align:center;color:var(--muted);padding:20px;">Belum ada riwayat.</p>' : `
    <div class="timeline">
      ${sorted.map((m,i) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-date">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${formatDate(m.timestamp)}
            ${i===0?'<span style="margin-left:auto;background:var(--green-light);color:#065f46;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;">Terbaru</span>':''}
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            <div><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">Tekanan</div><div style="font-family:'DM Mono',monospace;font-size:14px;font-weight:500;">${m.pressure} PSI</div></div>
            <div><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">Alur</div><div style="font-family:'DM Mono',monospace;font-size:14px;font-weight:500;">${m.treadDepth} mm</div></div>
            <div><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">Odometer</div><div style="font-family:'DM Mono',monospace;font-size:14px;font-weight:500;">${m.odometer != null ? m.odometer.toLocaleString('id-ID') + ' km' : '—'}</div></div>
          </div>
          ${m.notes ? `<div style="margin-top:10px;padding:8px 10px;background:rgba(0,0,0,0.03);border-radius:8px;font-size:12px;color:var(--muted);border-left:3px solid var(--green);">${m.notes}</div>` : ''}
          <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
            <button onclick="downloadSingleHistoryPDF('${vId}','${tireId}','${m.id}')"
              style="padding:5px 10px;background:#ede9fe;color:#7c3aed;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px;"
              onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#ede9fe'">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              PDF
            </button>
            ${canEdit ? `
            <button onclick="openEditMeasureModal('${vId}','${tireId}','${m.id}')"
              style="padding:5px 10px;background:#fef3c7;color:#92400e;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px;"
              onmouseover="this.style.background='#fde68a'" onmouseout="this.style.background='#fef3c7'">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button onclick="deleteMeasurement('${vId}','${tireId}','${m.id}')"
              style="padding:5px 10px;background:#fef2f2;color:#dc2626;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px;"
              onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              Hapus
            </button>` : ''}
          </div>
        </div>
      </div>`).join('')}
    </div>`;
  document.getElementById('modal-history').classList.add('open');
}
function closeHistoryModal() {
  document.getElementById('modal-history').classList.remove('open');
}

// ====== EDIT MEASUREMENT ======
function openEditMeasureModal(vehicleId, tireId, measureId) {
  const { tire } = findTireById(tireId);
  if (!tire) return;
  const m = tire.measurements.find(x => x.id === measureId);
  if (!m) return;
  document.getElementById('em-vehicle-id').value = vehicleId;
  document.getElementById('em-tire-id').value = tireId;
  document.getElementById('em-measure-id').value = measureId;
  document.getElementById('edit-measure-subtitle').textContent = `${tire.position} • ${tire.brand} ${tire.model}`;
  document.getElementById('em-pressure').value = m.pressure ?? '';
  document.getElementById('em-tread').value = m.treadDepth ?? '';
  document.getElementById('em-odo').value = m.odometer ?? '';
  document.getElementById('em-notes').value = m.notes ?? '';
  // Format timestamp for datetime-local input
  const dt = new Date(m.timestamp);
  const pad = n => String(n).padStart(2,'0');
  const localDT = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  document.getElementById('em-timestamp').value = localDT;
  document.getElementById('modal-history').classList.remove('open');
  document.getElementById('modal-edit-measure').classList.add('open');
}

function closeEditMeasureModal() {
  document.getElementById('modal-edit-measure').classList.remove('open');
}

function submitEditMeasure() {
  const vehicleId = document.getElementById('em-vehicle-id').value;
  const tireId    = document.getElementById('em-tire-id').value;
  const measureId = document.getElementById('em-measure-id').value;
  const pressure  = parseFloat(document.getElementById('em-pressure').value);
  const tread     = parseFloat(document.getElementById('em-tread').value);
  const odoVal    = document.getElementById('em-odo').value.trim();
  const odometer  = odoVal ? parseInt(odoVal) : null;
  const notes     = document.getElementById('em-notes').value.trim();
  const tsRaw     = document.getElementById('em-timestamp').value;
  if (isNaN(pressure) || isNaN(tread)) { alert('Tekanan dan Alur wajib diisi.'); return; }

  const applyEdit = arr => arr.map(v => {
    if (v.id !== vehicleId) return v;
    return { ...v, tires: v.tires.map(t => {
      if (t.id !== tireId) return t;
      const updatedMs = t.measurements.map(m => {
        if (m.id !== measureId) return m;
        return { ...m, pressure, treadDepth: tread, odometer, notes, timestamp: tsRaw ? new Date(tsRaw).toISOString() : m.timestamp };
      });
      const latestMs = updatedMs[updatedMs.length - 1];
      const newStatus = getTireStatus(latestMs.pressure, latestMs.treadDepth);
      return { ...t, measurements: updatedMs, status: newStatus };
    })};
  });

  vehicles      = applyEdit(vehicles);
  trialVehicles = applyEdit(trialVehicles);
  closeEditMeasureModal();
  render();
  // Supabase sync
  const allV = [...vehicles, ...trialVehicles];
  const updV = allV.find(v => v.id === vehicleId);
  if (updV) {
    const tbl = trialVehicles.some(v => v.id === vehicleId) ? 'trial_vehicles' : 'vehicles';
    supa.from(tbl).update({ tires: updV.tires }).eq('id', vehicleId).then(({error}) => { if(error) console.warn('edit measure sync error', error); });
  }
  // Toast
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:white;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;';
  t.textContent = '✓ Data pengecekan berhasil diperbarui';
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 2500);
}

function deleteMeasurement(vehicleId, tireId, measureId) {
  if (!confirm('Hapus data pengecekan ini? Tindakan tidak dapat dibatalkan.')) return;

  const applyDelete = arr => arr.map(v => {
    if (v.id !== vehicleId) return v;
    return { ...v, tires: v.tires.map(t => {
      if (t.id !== tireId) return t;
      const filtered = t.measurements.filter(m => m.id !== measureId);
      const last = filtered.length > 0 ? filtered[filtered.length-1] : null;
      const newStatus = last ? getTireStatus(last.pressure, last.treadDepth) : 'good';
      return { ...t, measurements: filtered, status: newStatus };
    })};
  });

  vehicles      = applyDelete(vehicles);
  trialVehicles = applyDelete(trialVehicles);
  document.getElementById('modal-history').classList.remove('open');
  render();
  const allV = [...vehicles, ...trialVehicles];
  const updV = allV.find(v => v.id === vehicleId);
  if (updV) {
    const tbl = trialVehicles.some(v => v.id === vehicleId) ? 'trial_vehicles' : 'vehicles';
    supa.from(tbl).update({ tires: updV.tires }).eq('id', vehicleId).then(({error}) => { if(error) console.warn('delete measure sync error', error); });
  }
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#dc2626;color:white;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;';
  t.textContent = '🗑 Data pengecekan dihapus';
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 2000);
}

function downloadSingleHistoryPDF(vehicleId, tireId, measureId) {
  const allV = [...vehicles, ...trialVehicles];
  const v    = allV.find(x => x.id === vehicleId);
  const tire = v && v.tires.find(t => t.id === tireId);
  const m    = tire && tire.measurements.find(x => x.id === measureId);
  if (!v || !tire || !m) { alert('Data tidak ditemukan.'); return; }
  if (typeof window.jspdf === 'undefined') { alert('Library PDF belum siap, coba beberapa saat lagi.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const now = new Date();
  const fmtDt = ts => new Date(ts).toLocaleString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const ps = getTireStatus(m.pressure, m.treadDepth);
  const statusLbl = ps === 'critical' ? 'KRITIS' : ps === 'warning' ? 'PERINGATAN' : 'BAIK';

  doc.setFont('helvetica','bold');
  doc.setFontSize(16);
  doc.text('LAPORAN PENGECEKAN BAN - TYRETRACK', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.text('Dicetak: ' + now.toLocaleString('id-ID'), 14, 25);
  doc.setDrawColor(5,150,105);
  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.text('INFORMASI KENDARAAN', 14, 36);
  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  const info = [
    ['Plat Nomor', v.plateNumber], ['Customer', v.customerName],
    ['Merk / Model', v.make + ' ' + v.model], ['Tonase', v.tonnage + ' Ton'],
    ['Sales', v.salesCompany || '—'], ['Tgl Pasang', v.installDate || '—'],
  ];
  let y = 43;
  info.forEach(([label, val]) => { doc.setFont('helvetica','bold'); doc.text(label + ':', 14, y); doc.setFont('helvetica','normal'); doc.text(val, 70, y); y += 7; });

  y += 3;
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.text('DETAIL BAN & PENGECEKAN', 14, y); y += 7;
  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  const detail = [
    ['Posisi', tire.position], ['Merk Ban', tire.brand + ' ' + (tire.model||'')],
    ['Harga Ban', tire.price ? 'Rp ' + tire.price.toLocaleString('id-ID') : '—'],
    ['Tgl Pengecekan', fmtDt(m.timestamp)],
    ['Tekanan', m.pressure + ' PSI'], ['Alur (NSD)', m.treadDepth + ' mm'],
    ['Odometer', m.odometer != null ? m.odometer.toLocaleString('id-ID') + ' km' : '—'],
    ['Status', statusLbl], ['Catatan', m.notes || '—'],
  ];
  detail.forEach(([label, val]) => { doc.setFont('helvetica','bold'); doc.text(label + ':', 14, y); doc.setFont('helvetica','normal'); doc.text(String(val), 70, y); y += 7; });

  doc.setFontSize(8);
  doc.setTextColor(120,120,120);
  doc.text('Generated by TyreTrack · ' + now.toLocaleString('id-ID'), 14, 285);

  const fname = `Cek_${v.plateNumber.replace(/\s/g,'_')}_${tire.position.replace(/\s/g,'_')}_${now.toISOString().slice(0,10)}.pdf`;
  doc.save(fname);
}

// ====== SEARCH ======
function handleSearch(val) {
  searchQuery = val;
  render();
}

// ====== CLOSE MODAL ON OVERLAY CLICK ======
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', function(e) {
    if (e.target === el) {
      el.classList.remove('open');
      activeMeasureTireId = null;
    }
  });
});

// ====== SAMPLE DATA ======
function makeTires(configs, baseOdo, lastCheckDaysAgo) {
  const odo1 = (baseOdo || 50000) + 3000;
  const odo2 = odo1 + 4000;
  const odo3 = odo2 + 5000;
  const ago  = lastCheckDaysAgo || 0;
  return TIRE_POSITIONS.map((pos, i) => {
    const c = configs[i] || {};
    const pressure = c.psi ?? 32;
    const tread = c.nsd ?? 7.5;
    return {
      id: randId(),
      position: pos,
      brand: c.brand ?? 'Bridgestone',
      model: c.model ?? 'R150',
      installDate: c.date ?? '2025-08-01',
      photo: null,
      status: getTireStatus(pressure, tread),
      measurements: [
        { id: randId(), timestamp: new Date(Date.now() - (ago+40)*24*3600000).toISOString(), pressure: pressure + 2, treadDepth: tread + 0.5, odometer: odo1, notes: '' },
        { id: randId(), timestamp: new Date(Date.now() - (ago+20)*24*3600000).toISOString(), pressure: pressure + 1, treadDepth: tread + 0.2, odometer: odo2, notes: '' },
        { id: randId(), timestamp: new Date(Date.now() - ago*24*3600000).toISOString(), pressure, treadDepth: tread, odometer: odo3, notes: '' },
      ]
    };
  });
}
// ====== PELUMAS FUNCTIONS ======
function openEditVehicleModal(vehicleId) {
  const allV = [...vehicles, ...trialVehicles];
  const vehicle = allV.find(v => v.id === vehicleId);
  if (!vehicle) return;

  // Validasi: User hanya bisa edit data yang mereka buat sendiri
  if (vehicle.createdBy && currentUser && vehicle.createdBy !== currentUser.id) {
    alert('Anda hanya dapat mengedit data yang Anda input sendiri.');
    return;
  }

  // Check permission - gunakan rolePerms untuk enforcement
  if (!canDoAction('edit_vehicle')) {
    alert('Anda tidak memiliki izin untuk mengedit kendaraan.');
    return;
  }

  editVehicleId = vehicleId;

  // Pre-fill form
  document.getElementById('ev-plate').value = vehicle.plateNumber;
  document.getElementById('ev-make').value = vehicle.make;
  document.getElementById('ev-model').value = vehicle.model;
  document.getElementById('ev-customer').value = vehicle.customerName;
  document.getElementById('ev-pic').value = vehicle.picNumber || '';
  document.getElementById('ev-tonnage').value = vehicle.tonnage || '';
  document.getElementById('ev-installdate').value = vehicle.installDate || '';
  document.getElementById('ev-odo').value = vehicle.installOdo || '';

  document.getElementById('modal-edit-vehicle').classList.add('open');
}

function closeEditVehicleModal() {
  document.getElementById('modal-edit-vehicle').classList.remove('open');
  editVehicleId = null;
}

function submitEditVehicle() {
  if (!editVehicleId) return;

  const plate = document.getElementById('ev-plate').value.trim().toUpperCase();
  const make = document.getElementById('ev-make').value.trim();
  const model = document.getElementById('ev-model').value.trim();
  const customer = document.getElementById('ev-customer').value.trim();

  if (!plate || !make || !model || !customer) {
    alert('Harap isi Nomor Plat, Merek, Model, dan Customer.');
    return;
  }

  const updateVehicle = (arr) => arr.map(v => {
    if (v.id !== editVehicleId) return v;
    return {
      ...v,
      plateNumber: plate,
      make,
      model,
      customerName: customer,
      picNumber: document.getElementById('ev-pic').value.trim(),
      tonnage: parseFloat(document.getElementById('ev-tonnage').value) || v.tonnage,
      installDate: document.getElementById('ev-installdate').value || v.installDate,
      installOdo: parseInt(document.getElementById('ev-odo').value) || v.installOdo,
    };
  });

  vehicles = updateVehicle(vehicles);
  trialVehicles = updateVehicle(trialVehicles);

  // Sync to Supabase
  const updated = [...vehicles, ...trialVehicles].find(v => v.id === editVehicleId);
  if (updated) {
    const isInTrial = trialVehicles.some(v => v.id === editVehicleId);
    supaUpsert(isInTrial ? 'trial_vehicles' : 'vehicles', updated.id, updated);
  }

  closeEditVehicleModal();
  render();

  // Toast
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#f59e0b;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(245,158,11,0.4);transition:opacity .3s;';
  toast.innerHTML = '✓ Data kendaraan berhasil diperbarui';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2500);
}

// Delete Vehicle
function confirmDeleteVehicle(vehicleId) {
  // Check permission - gunakan rolePerms untuk enforcement
  if (!canDoAction('delete_vehicle')) {
    alert('Anda tidak memiliki izin untuk menghapus kendaraan.');
    return;
  }

  const allV = [...vehicles, ...trialVehicles];
  const vehicle = allV.find(v => v.id === vehicleId);
  if (!vehicle) return;

  const confirmed = confirm(`Apakah Anda yakin ingin menghapus kendaraan ${vehicle.plateNumber}?\n\nSemua data pengecekan ban akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`);
  if (!confirmed) return;

  // Determine table BEFORE removing from arrays
  const isInTrial = trialVehicles.some(v => v.id === vehicleId);

  // Remove from arrays
  vehicles = vehicles.filter(v => v.id !== vehicleId);
  trialVehicles = trialVehicles.filter(v => v.id !== vehicleId);

  // Delete from Supabase
  supaDelete(isInTrial ? 'trial_vehicles' : 'vehicles', vehicleId);

  // If viewing detail, go back to list
  if (vehiclesDetailId === vehicleId) {
    vehiclesView = 'list';
    vehiclesDetailId = null;
    vehiclesSelectedTireId = null;
  }

  render();

  // Toast
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#dc2626;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(220,38,38,0.4);transition:opacity .3s;';
  toast.innerHTML = '✓ Kendaraan berhasil dihapus';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2500);
}

// Download Vehicle History as PDF
async function downloadVehicleHistoryPDF(vehicleId, tireId) {
  const allV = [...vehicles, ...trialVehicles];
  const vehicle = allV.find(v => v.id === vehicleId);
  if (!vehicle) return;

  const tire = vehicle.tires.find(t => t.id === tireId);
  if (!tire || !tire.measurements || tire.measurements.length === 0) return;

  // Show loading toast
  const loadingToast = document.createElement('div');
  loadingToast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#7c3aed;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(124,58,237,0.4);';
  loadingToast.innerHTML = '⏳ Generating PDF...';
  document.body.appendChild(loadingToast);

  try {
    // Import jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Riwayat Pengecekan Ban', 14, 20);

    // Vehicle Info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nomor Plat: ${vehicle.plateNumber}`, 14, 30);
    doc.text(`Kendaraan: ${vehicle.make} ${vehicle.model}`, 14, 36);
    doc.text(`Customer: ${vehicle.customerName}`, 14, 42);
    doc.text(`Posisi Ban: ${tire.position}`, 14, 48);
    doc.text(`Merk Ban: ${tire.brand} ${tire.model}`, 14, 54);

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(14, 58, 196, 58);

    // Table header
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    const startY = 66;
    doc.text('Tanggal', 14, startY);
    doc.text('Tekanan (PSI)', 55, startY);
    doc.text('NSD (mm)', 95, startY);
    doc.text('Odometer (km)', 125, startY);
    doc.text('Status', 165, startY);

    // Line under header
    doc.setLineWidth(0.3);
    doc.line(14, startY + 2, 196, startY + 2);

    // Table data
    doc.setFont(undefined, 'normal');
    const history = [...tire.measurements].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let yPos = startY + 8;

    history.forEach((m, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const date = new Date(m.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const status = getTireStatus(m.pressure, m.treadDepth);
      const statusLabel = status === 'critical' ? 'Kritis' : status === 'warning' ? 'Peringatan' : 'Baik';

      doc.text(date, 14, yPos);
      doc.text(m.pressure.toString(), 55, yPos);
      doc.text(m.treadDepth.toString(), 95, yPos);
      doc.text(m.odometer ? m.odometer.toLocaleString('id-ID') : '-', 125, yPos);
      doc.text(statusLabel, 165, yPos);

      if (m.notes) {
        yPos += 5;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Catatan: ${m.notes}`, 14, yPos);
        doc.setTextColor(0);
        doc.setFontSize(9);
      }

      yPos += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`TyreTrack - Generated on ${new Date().toLocaleDateString('id-ID')} - Page ${i} of ${pageCount}`, 14, 285);
    }

    // Save
    const filename = `Riwayat_${vehicle.plateNumber}_${tire.position.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    // Success toast
    loadingToast.remove();
    const successToast = document.createElement('div');
    successToast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(5,150,105,0.4);transition:opacity .3s;';
    successToast.innerHTML = '✓ PDF berhasil diunduh';
    document.body.appendChild(successToast);
    setTimeout(() => { successToast.style.opacity = '0'; setTimeout(() => successToast.remove(), 400); }, 2500);

  } catch (error) {
    console.error('Error generating PDF:', error);
    loadingToast.remove();
    alert('Gagal membuat PDF. Silakan coba lagi.');
  }
}

// ====== INIT ======
