// ====== DATA ======
const TIRE_POSITIONS = [
  'Depan Kiri','Depan Kanan',
  'B1 Kiri Luar','B1 Kiri Dalam','B1 Kanan Dalam','B1 Kanan Luar',
  'B2 Kiri Luar','B2 Kiri Dalam','B2 Kanan Dalam','B2 Kanan Luar',
  'Ban Serep 1','Ban Serep 2'
];

let vehicles = [];
let selectedVehicleId = null;
let currentPage = 'dashboard';
let searchQuery = '';
let activeMeasureTireId = null;
let activeHistoryTireId = null;
let pressureChart = null;
let closedTires = []; // ban yang sudah dilepas → closing data
let monitoringView     = 'list';       // 'list' | 'detail'
let vehiclesView       = 'list';       // 'list' | 'detail'
let vehiclesDetailId   = null;         // id kendaraan yang dibuka di halaman vehicles
let vehiclesSelectedTireId = null;     // id ban yang dipilih di dropdown history
let monitoringCategory = 'ban';        // 'ban' | 'pelumas'
let monitoringTab      = 'monitoring'; // 'monitoring' | 'trial' (sub of 'ban')
let trialVehicles = []; // kendaraan dalam kategori trial

// ====== PELUMAS DATA ======
let pelumasRecords = [];    // data monitoring pelumas
let pelumasTrialRecords = []; // data trial pelumas
let pelumasTab = 'monitoring'; // 'monitoring' | 'trial'
let activePelumasModalTarget = 'monitoring';

// ====== LAPORAN HARIAN DATA ======
// Setiap entri: { id, username, date, type:'rencana'|'realisasi', content, items:[], createdAt, updatedAt }
let laporanHarian = [];

// ====== USER MANAGEMENT DATA ======
const ALL_MENUS = [
  { key: 'dashboard',  label: 'Beranda',          icon: '🏠' },
  { key: 'vehicles',   label: 'Kendaraan',         icon: '🚛' },
  { key: 'monitoring', label: 'Monitoring Ban',     icon: '📊' },
  { key: 'alerts',     label: 'Peringatan',         icon: '🔔' },
  { key: 'claims',     label: 'Claim Proses',       icon: '📄' },
  { key: 'duty',       label: 'Dinas Luar Kota',    icon: '📍' },
  { key: 'closing',    label: 'Closing Data',       icon: '✅' },
  { key: 'settings',   label: 'Pengaturan',         icon: '⚙️' },
];
const ALL_ACTIONS = [
  { key: 'view',   label: 'Lihat Data' },
  { key: 'add',    label: 'Tambah Data' },
  { key: 'edit',   label: 'Edit / Update Data' },
  { key: 'delete', label: 'Hapus Data' },
  { key: 'export', label: 'Export / Download' },
];

// Default permissions per role
const DEFAULT_ROLE_PERMS = {
  administrator: {
    menus:   { dashboard:1,vehicles:1,customer:1,monitoring:1,alerts:1,claims:1,duty:1,closing:1,settings:1 },
    actions: { view:1,add:1,edit:1,delete:1,export:1 }
  },
  supervisor: {
    menus:   { dashboard:1,vehicles:1,customer:1,monitoring:1,alerts:1,claims:1,duty:1,closing:1,settings:0 },
    actions: { view:1,add:1,edit:1,delete:0,export:1 }
  },
  technical_support: {
    menus:   { dashboard:1,vehicles:1,customer:1,monitoring:1,alerts:1,claims:0,duty:1,closing:0,settings:0 },
    actions: { view:1,add:1,edit:1,delete:0,export:0 }
  },
  sales: {
    menus:   { dashboard:0,vehicles:1,customer:0,monitoring:0,alerts:1,claims:1,duty:1,closing:0,settings:1 },
    actions: { view:1,add:1,edit:0,delete:0,export:1 }
  },
  sales_counter: {
    menus:   { dashboard:0,vehicles:1,customer:0,monitoring:0,alerts:1,claims:1,duty:1,closing:0,settings:1 },
    actions: { view:1,add:1,edit:0,delete:0,export:1 }
  },
  viewer: {
    menus:   { dashboard:0,vehicles:1,customer:0,monitoring:0,alerts:0,claims:1,duty:1,closing:0,settings:1 },
    actions: { view:1,add:0,edit:0,delete:0,export:0 }
  },
};

// Mutable role permissions (can be edited by admin)
let rolePerms = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMS));

// ====== USER MANAGEMENT ======
let appUsers = [
  { id: randId(), name:'Administrator 1', username:'taseklusive1',    email:'taseklusive1@gmail.com',    phone:'', role:'administrator', status:'active', avatar:'A', avatarColor:'#7c3aed' },
  { id: randId(), name:'Administrator 2', username:'taseklusive2',    email:'taseklusive2@gmail.com',    phone:'', role:'administrator', status:'active', avatar:'A', avatarColor:'#4f46e5' },
  { id: randId(), name:'Supervisor 1',    username:'taseklusivespv1', email:'taseklusivespv1@gmail.com', phone:'', role:'supervisor',     status:'active', avatar:'S', avatarColor:'#2563eb' },
  { id: randId(), name:'Supervisor 2',    username:'taseklusivespv2', email:'taseklusivespv2@gmail.com', phone:'', role:'supervisor',     status:'active', avatar:'S', avatarColor:'#0ea5e9' },
];

let activeEditUserId = null;
let activeEditRoleKey = null;
let userStatusDraft = 'active';

// Temp foto saat mengisi form
let tempPhotoOdo = null;
let tempPhotoUnit = null;

function handlePhotoUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const wrapId = type === 'odo' ? 'upload-odo-wrap' : 'upload-unit-wrap';
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    if (type === 'odo') tempPhotoOdo = dataUrl;
    else tempPhotoUnit = dataUrl;
    wrap.classList.add('has-photo');
    // Hapus konten lama, tapi pertahankan input file
    const input = wrap.querySelector('input[type=file]');
    wrap.innerHTML = '';
    wrap.appendChild(input);
    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'photo-preview';
    wrap.appendChild(img);
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'photo-remove-btn';
    removeBtn.title = 'Hapus foto';
    removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    removeBtn.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); clearPhoto(type); };
    wrap.appendChild(removeBtn);
  };
  reader.readAsDataURL(file);
}

function clearPhoto(type) {
  const wrapId = type === 'odo' ? 'upload-odo-wrap' : 'upload-unit-wrap';
  const label = type === 'odo' ? 'Klik untuk upload foto odometer' : 'Klik untuk upload foto unit';
  if (type === 'odo') tempPhotoOdo = null;
  else tempPhotoUnit = null;
  const wrap = document.getElementById(wrapId);
  wrap.classList.remove('has-photo');
  wrap.innerHTML = `
    <input type="file" accept="image/*" onchange="handlePhotoUpload(event,'${type}')" />
    <svg class="photo-upload-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
    <div style="font-size:12px;font-weight:600;color:var(--muted);">${label}</div>
    <div style="font-size:11px;color:#9ca3af;margin-top:3px;">JPG, PNG maks. 5MB</div>`;
}

function randId() { return Math.random().toString(36).substr(2,9); }

// Find a tire (and its vehicle) across both monitoring + trial lists
function findTireById(tireId) {
  let tire = null, vehicle = null;
  [...vehicles, ...trialVehicles].forEach(v => v.tires.forEach(t => {
    if (t.id === tireId) { tire = t; vehicle = v; }
  }));
  return { tire, vehicle };
}
// Update tire in the correct list
function updateTireInLists(tireId, updaterFn) {
  vehicles = vehicles.map(v => ({ ...v, tires: v.tires.map(t => t.id === tireId ? updaterFn(t) : t) }));
  trialVehicles = trialVehicles.map(v => ({ ...v, tires: v.tires.map(t => t.id === tireId ? updaterFn(t) : t) }));
}

function getTireStatus(pressure, tread) {
  // Kritis: tread sangat rendah, atau tekanan sangat rendah (bocor)
  if (tread < 2 || pressure < 26) return 'critical';
  // Peringatan: tread rendah, tekanan rendah, atau tekanan berlebih
  // Untuk truk besar (80-115 PSI) dan kendaraan ringan (28-38 PSI)
  // Tekanan berlebih: >120 PSI untuk truk, >40 PSI untuk kendaraan ringan
  const overInflated = pressure > 120;
  if (tread < 3 || pressure < 28 || overInflated) return 'warning';
  return 'good';
}

function statusLabel(s) {
  if (s === 'good') return 'Bagus';
  if (s === 'warning') return 'Peringatan';
  return 'Kritis';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ====== DOWNLOAD LAPORAN PENGECEKAN TERAKHIR ======
function downloadLastCheckReport(vehicleId) {
  const allV = [...vehicles, ...trialVehicles];
  const v = allV.find(x => x.id === vehicleId);
  if (!v) return;

  const now = new Date();
  const nowStr = now.toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric' });

  // Hitung umur pemakaian berdasarkan selisih KM (odometer pasang - odometer cek terakhir)
  let usageLabel = '-';
  if (v.installOdo != null) {
    let maxOdo = null;
    v.tires.forEach(t => t.measurements.forEach(m => {
      if (m.odometer != null && (maxOdo === null || m.odometer > maxOdo)) maxOdo = m.odometer;
    }));
    if (maxOdo !== null && maxOdo > v.installOdo) {
      const diffKm = maxOdo - v.installOdo;
      usageLabel = diffKm.toLocaleString('id-ID') + ' km (ODO pasang: ' + v.installOdo.toLocaleString('id-ID') + ' → cek terakhir: ' + maxOdo.toLocaleString('id-ID') + ')';
    }
  }

  // Header info
  const lines = [];
  lines.push('LAPORAN PENGECEKAN TERAKHIR - TYRETRACK');
  lines.push('========================================');
  lines.push('Tanggal Cetak,' + nowStr);
  lines.push('');
  lines.push('INFORMASI KENDARAAN');
  lines.push('Plat Nomor,' + v.plateNumber);
  lines.push('Merk / Model,' + v.make + ' ' + v.model);
  lines.push('Customer,' + v.customerName);
  lines.push('PIC / Kontak,' + (v.picNumber || '-'));
  lines.push('Tonase,' + v.tonnage + ' Ton');
  lines.push('Tanggal Pemasangan,' + (v.installDate || '-'));
  lines.push('Umur Pemakaian Ban,' + usageLabel);
  lines.push('');
  lines.push('DATA PENGECEKAN TERAKHIR PER POSISI BAN');
  lines.push('No,Posisi,Merk,Model,Tekanan (PSI),NSD/Alur (mm),Odometer (km),Status,Tanggal Cek,Keterangan');

  v.tires.filter(t => t.measurements && t.measurements.length > 0).forEach((t, i) => {
    const latest = t.measurements[t.measurements.length - 1];
    const status = t.removed ? 'Dilepas' : statusLabel(t.status);
    const tanggal = latest ? new Date(latest.timestamp).toLocaleDateString('id-ID') : '-';
    const keterangan = latest?.notes ? '"' + latest.notes.replace(/"/g, '""') + '"' : '-';
    lines.push([
      i + 1,
      '"' + t.position + '"',
      t.brand || '-',
      t.model || '-',
      latest?.pressure ?? '-',
      latest?.treadDepth ?? '-',
      latest?.odometer != null ? latest.odometer : '-',
      status,
      tanggal,
      keterangan
    ].join(','));
  });

  lines.push('');
  lines.push('RINGKASAN');
  const tiresWithData = v.tires.filter(t => t.measurements && t.measurements.length > 0);
  const kritis    = tiresWithData.filter(t => t.status === 'critical' && !t.removed).length;
  const peringatan = tiresWithData.filter(t => t.status === 'warning'  && !t.removed).length;
  const baik      = tiresWithData.filter(t => t.status === 'good'      && !t.removed).length;
  const dilepas   = tiresWithData.filter(t => t.removed).length;
  lines.push('Kondisi Kritis,' + kritis);
  lines.push('Kondisi Peringatan,' + peringatan);
  lines.push('Kondisi Baik,' + baik);
  lines.push('Ban Dilepas,' + dilepas);
  lines.push('Total Ban Termonitor,' + tiresWithData.length);
  lines.push('');
  lines.push('Digenerate oleh TyreTrack - ' + now.toLocaleString('id-ID'));

  const csvContent = '\uFEFF' + lines.join('\r\n'); // BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'LaporanBan_' + v.plateNumber.replace(/\s/g,'_') + '_' + now.toISOString().slice(0,10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ====== NAVIGATION ======
function navigate(page) {
  if (currentPage === 'monitoring' && page !== 'monitoring') { monitoringView = 'list'; }
  if (currentPage === 'vehicles' && page !== 'vehicles') { vehiclesView = 'list'; vehiclesDetailId = null; vehiclesSelectedTireId = null; }
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');
  closeSidebar();
  render();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  const ov = document.getElementById('sidebar-overlay');
  ov.style.display = 'block';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').style.display = 'none';
}

// ====== RENDER ======
function render() {
  const content = document.getElementById('content');
  if (currentPage === 'dashboard') content.innerHTML = renderDashboard();
  else if (currentPage === 'vehicles') content.innerHTML = renderVehicles();
  else if (currentPage === 'monitoring') content.innerHTML = renderMonitoring();
  else if (currentPage === 'alerts') content.innerHTML = renderAlerts();
  else if (currentPage === 'claims') content.innerHTML = renderClaims();
  else if (currentPage === 'duty') content.innerHTML = renderDuty();
  else if (currentPage === 'closing') content.innerHTML = renderClosing();
  else if (currentPage === 'settings') content.innerHTML = renderSettings();
  else if (currentPage === 'profile') content.innerHTML = renderProfile();
  else if (currentPage === 'users') content.innerHTML = renderUsers();
  else if (currentPage === 'customer') content.innerHTML = renderCustomer();
  else if (currentPage === 'laporan') content.innerHTML = renderLaporan();
  else if (currentPage === 'kpi') content.innerHTML = renderKPI();
  updateAlertBadge();
  if (currentPage === 'monitoring' && monitoringView === 'detail') renderChart();
  if (currentPage === 'dashboard') setTimeout(renderDashboardCharts, 0);
}

function updateAlertBadge() {
  let count = 0;

  if (currentUser && (currentUser.role === 'sales' || currentUser.role === 'sales_counter')) {
    // Sales: hitung notifikasi belum dibaca milik user ini
    count = SALES_NOTIFICATIONS
      ? SALES_NOTIFICATIONS.filter(n => n.submittedBy === currentUser.id && !n.read).length
      : 0;
  } else {
    // Non-sales: ban kritis/peringatan + kendaraan overdue
    vehicles.forEach(v => v.tires.forEach(t => {
      if (!t.measurements || t.measurements.length === 0) return;
      if (t.status === 'critical' || t.status === 'warning') count++;
    }));
    const MS_45_DAYS = 45 * 24 * 60 * 60 * 1000;
    const now = new Date();
    [...vehicles, ...trialVehicles].forEach(v => {
      const lastCheck = getLastCheckDate(v);
      if (lastCheck) {
        if ((now - lastCheck) > MS_45_DAYS) count++;
      } else {
        // Belum pernah dicek — hanya hitung jika kendaraan sudah >45 hari terdaftar
        const installMs = v.installDate ? (now - new Date(v.installDate)) : Infinity;
        if (installMs > MS_45_DAYS) count++;
      }
    });
    // Admin/supervisor: tambah pengajuan klaim pending
    if (currentUser && (currentUser.role === 'administrator' || currentUser.role === 'supervisor')) {
      const pendingClaims = CLAIMS ? CLAIMS.filter(c => c.needsApproval && c.status === 'Pending').length : 0;
      count += pendingClaims;
    }
  }

  const badge = document.getElementById('alert-badge');
  if (count > 0) { badge.style.display = 'inline-block'; badge.textContent = count; }
  else { badge.style.display = 'none'; }
}

// ====== DASHBOARD ======
function getStats() {
  let critical=0, warning=0, healthy=0;
  vehicles.forEach(v => v.tires.forEach(t => {
    if (!t.measurements || t.measurements.length === 0) return;
    if (t.status==='critical') critical++;
    else if (t.status==='warning') warning++;
    else healthy++;
  }));
  return { critical, warning, healthy, total: vehicles.length };
}

function filteredVehicles() {
  if (!searchQuery) return vehicles;
  return vehicles.filter(v => v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) || v.make.toLowerCase().includes(searchQuery.toLowerCase()));
}

function renderDashboard() {
  const now = new Date();
  const MS_45_DAYS = 45 * 24 * 60 * 60 * 1000;
  const allV = [...vehicles, ...trialVehicles];

  // ── User yang punya data (inputBy) ───────────────────────────────────────
  // Kumpulkan username unik dari kendaraan
  const activeUsernames = [...new Set(allV.map(v => v.inputBy).filter(Boolean))];

  // Buat peta username → user object
  const userMap = {};
  appUsers.forEach(u => { userMap[u.username] = u; });

  // Hitung statistik per user
  const SALES_COMPANIES = [
    { name: 'Pakita Jaya',       color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', short: 'PJ'  },
    { name: 'Coca Jaya Agung',   color: '#059669', bg: '#d1fae5', border: '#6ee7b7', short: 'CJA' },
    { name: 'Denvio Jaya Abadi', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', short: 'DJA' },
  ];

  const userStats = activeUsernames.map(username => {
    const u      = userMap[username];
    const myV    = allV.filter(v => v.inputBy === username);
    const myBan  = myV.reduce((s, v) => s + v.tires.filter(t => t.measurements && t.measurements.length > 0).length, 0);
    const myCust = new Set(myV.map(v => v.customerName)).size;
    // Breakdown per sales company
    const salesBreakdown = SALES_COMPANIES.map(sc => {
      const scV    = myV.filter(v => v.salesCompany === sc.name);
      const scBan  = scV.reduce((s, v) => s + v.tires.filter(t => t.measurements && t.measurements.length > 0).length, 0);
      const scCust = new Set(scV.map(v => v.customerName)).size;
      return { ...sc, totalKendaraan: scV.length, totalBan: scBan, totalCustomer: scCust };
    });
    return { u, username, vehicles: myV, totalBan: myBan, totalKendaraan: myV.length, totalCustomer: myCust, salesBreakdown };
  });

  // ── Kendaraan overdue >45 hari ────────────────────────────────────────────
  function getLastCheckDate(v) {
    let latest = null;
    v.tires.forEach(t => t.measurements.forEach(m => {
      const d = new Date(m.timestamp);
      if (!latest || d > latest) latest = d;
    }));
    return latest;
  }

  const overdueList = allV
    .map(v => ({ v, lastCheck: getLastCheckDate(v) }))
    .filter(({ v, lastCheck }) => {
      // Jika ada lastCheck, cukup cek apakah sudah >45 hari sejak lastCheck
      if (lastCheck) return (now - lastCheck) > MS_45_DAYS;
      // Jika belum pernah dicek, hanya anggap overdue jika kendaraan sudah terdaftar >45 hari
      const installMs = v.installDate ? (now - new Date(v.installDate)) : Infinity;
      return installMs > MS_45_DAYS;
    })
    .sort((a, b) => {
      if (!a.lastCheck) return -1;
      if (!b.lastCheck) return 1;
      return a.lastCheck - b.lastCheck;
    });

  function daysSince(date) {
    if (!date) return null;
    return Math.floor((now - date) / (24 * 60 * 60 * 1000));
  }

  function overdueColor(days) {
    if (days === null || days > 90) return { bg:'var(--rose-light)', border:'#fecdd3', text:'#be123c', dot:'var(--rose)' };
    if (days > 60) return { bg:'var(--amber-light)', border:'#fde68a', text:'#92400e', dot:'var(--amber)' };
    return { bg:'#fef9f0', border:'#fed7aa', text:'#9a3412', dot:'#f97316' };
  }

  // ── Role label helper ─────────────────────────────────────────────────────
  const roleLabel = { administrator:'Administrator', supervisor:'Supervisor', technical_support:'Technical Support', sales:'Sales', sales_counter:'Sales Counter', viewer:'Viewer' };
  const roleColor = { administrator:'#5b21b6', supervisor:'#1e40af', technical_support:'#0e7490', sales:'#c2410c', viewer:'#6b7280' };
  const roleBg    = { administrator:'#ede9fe', supervisor:'var(--blue-light)', technical_support:'#ecfeff', sales:'#fff7ed', viewer:'#f3f4f6' };

  // ── Render user cards ─────────────────────────────────────────────────────
  const userCardsHTML = userStats.length === 0
    ? `<div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:40px;text-align:center;color:var(--muted);">
        <div style="font-size:14px;">Belum ada user yang menginput data kendaraan.</div>
       </div>`
    : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;">
        ${userStats.map(({ u, username, totalBan, totalKendaraan, totalCustomer, vehicles: myV, salesBreakdown }) => {
          const name    = u ? u.name   : username;
          const role    = u ? u.role   : 'technical_support';
          const avatar  = u ? u.avatar : '?';
          const color   = u ? u.avatarColor : '#6b7280';
          const lastV   = myV[myV.length - 1];
          const lastCheck = lastV ? getLastCheckDate(lastV) : null;
          const lastCheckStr = lastCheck
            ? lastCheck.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
            : '—';

          return `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;transition:box-shadow .15s;"
               onmouseover="this.style.boxShadow='0 6px 24px rgba(0,0,0,0.09)'" onmouseout="this.style.boxShadow='none'">
            <!-- Header user -->
            <div style="padding:18px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
              <div style="width:42px;height:42px;border-radius:13px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:17px;font-family:'Syne',sans-serif;flex-shrink:0;">${avatar}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
                <div style="margin-top:3px;">
                  <span style="font-size:10px;font-weight:700;background:${roleBg[role]};color:${roleColor[role]};padding:2px 8px;border-radius:20px;">${roleLabel[role] || role}</span>
                </div>
              </div>
              <!-- Total ringkas -->
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:18px;font-family:'DM Mono',monospace;font-weight:500;color:#1d4ed8;">${totalKendaraan} <span style="font-size:10px;color:var(--muted);font-family:'DM Sans',sans-serif;font-weight:700;">unit</span></div>
                <div style="font-size:10px;color:var(--muted);font-weight:600;">${totalBan} ban · ${totalCustomer} cust.</div>
              </div>
            </div>

            <!-- Sales company breakdown -->
            <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px;">
              <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:2px;">Perusahaan Sales</div>
              ${salesBreakdown.map(sc => `
              <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;background:${sc.bg};border:1px solid ${sc.border};">
                <div style="width:28px;height:28px;border-radius:8px;background:${sc.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <span style="font-size:8px;font-weight:900;color:white;letter-spacing:.02em;">${sc.short}</span>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12px;font-weight:700;color:${sc.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sc.name}</div>
                </div>
                <div style="display:flex;gap:12px;flex-shrink:0;">
                  <div style="text-align:center;">
                    <div style="font-size:15px;font-family:'DM Mono',monospace;font-weight:600;color:${sc.color};">${sc.totalBan}</div>
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:${sc.color};opacity:.7;">Ban</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-size:15px;font-family:'DM Mono',monospace;font-weight:600;color:${sc.color};">${sc.totalKendaraan}</div>
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:${sc.color};opacity:.7;">Unit</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-size:15px;font-family:'DM Mono',monospace;font-weight:600;color:${sc.color};">${sc.totalCustomer}</div>
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:${sc.color};opacity:.7;">Cust.</div>
                  </div>
                </div>
              </div>`).join('')}
            </div>

            <!-- Footer cek terakhir -->
            <div style="padding:10px 20px;background:#f9fafb;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style="font-size:11px;color:var(--muted);">Input terakhir: <strong style="color:var(--text);">${lastCheckStr}</strong></span>
            </div>
          </div>`;
        }).join('')}
      </div>`;

  // ── Overdue section ───────────────────────────────────────────────────────
  const overdueSection = `
  <div style="margin-top:32px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:4px;height:28px;background:var(--amber);border-radius:4px;"></div>
        <div>
          <div style="font-size:16px;font-weight:800;font-family:'Syne',sans-serif;">Belum Diupdate
            <span style="font-size:13px;font-weight:700;background:${overdueList.length > 0 ? 'var(--amber-light)' : 'var(--green-light)'};color:${overdueList.length > 0 ? '#92400e' : '#065f46'};border:1px solid ${overdueList.length > 0 ? '#fde68a' : '#a7f3d0'};padding:2px 10px;border-radius:20px;margin-left:6px;">${overdueList.length} unit</span>
          </div>
          <div style="font-size:12px;color:var(--muted);">Kendaraan yang belum dicek lebih dari 45 hari</div>
        </div>
      </div>
    </div>

    ${overdueList.length === 0 ? `
    <div style="background:var(--green-light);border:1px solid #a7f3d0;border-radius:18px;padding:32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:10px;">✅</div>
      <div style="font-size:15px;font-weight:700;color:#065f46;margin-bottom:4px;">Semua kendaraan sudah diupdate</div>
      <div style="font-size:13px;color:#059669;">Tidak ada kendaraan yang melewati batas 45 hari pengecekan.</div>
    </div>` : `
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${overdueList.map(({ v, lastCheck }) => {
        const days    = daysSince(lastCheck);
        const col     = overdueColor(days);
        const daysStr = days === null ? 'Belum pernah dicek' : days + ' hari lalu';
        const daysLbl = days === null ? '∞' : days + 'h';
        const critCount = v.tires.filter(t => t.measurements && t.measurements.length > 0 && t.status === 'critical').length;
        const warnCount = v.tires.filter(t => t.measurements && t.measurements.length > 0 && t.status === 'warning').length;
        const category  = trialVehicles.find(x => x.id === v.id) ? 'Trial' : 'Monitoring';
        const catColor  = category === 'Trial' ? '#1e40af' : '#065f46';
        const catBg     = category === 'Trial' ? 'var(--blue-light)' : 'var(--green-light)';
        const inputUser = v.inputBy ? (appUsers.find(u => u.username === v.inputBy) || null) : null;
        const inputName = inputUser ? inputUser.name : (v.inputBy || '—');
        return `
        <div style="background:var(--surface);border:1.5px solid ${col.border};border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:16px;transition:box-shadow .15s;cursor:pointer;"
             onclick="selectVehicle('${v.id}');navigate('dashboard')"
             onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="width:52px;height:52px;border-radius:14px;background:${col.bg};border:1.5px solid ${col.border};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
            <div style="font-size:15px;font-weight:800;font-family:'DM Mono',monospace;color:${col.text};line-height:1;">${daysLbl}</div>
            <div style="font-size:9px;font-weight:700;color:${col.text};opacity:.7;text-transform:uppercase;letter-spacing:.04em;">telat</div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px;">
              <span style="font-family:'DM Mono',monospace;font-size:15px;font-weight:700;">${v.plateNumber}</span>
              <span style="font-size:10px;font-weight:700;background:${catBg};color:${catColor};padding:2px 8px;border-radius:20px;">${category}</span>
              ${critCount > 0 ? `<span style="font-size:10px;font-weight:700;background:var(--rose-light);color:#be123c;padding:2px 8px;border-radius:20px;border:1px solid #fecdd3;">⚠ ${critCount} kritis</span>` : ''}
              ${warnCount > 0 ? `<span style="font-size:10px;font-weight:700;background:var(--amber-light);color:#92400e;padding:2px 8px;border-radius:20px;border:1px solid #fde68a;">⚡ ${warnCount} peringatan</span>` : ''}
            </div>
            <div style="font-size:13px;color:var(--muted);">${v.make} ${v.model} · <strong style="color:var(--text);">${v.customerName}</strong></div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <span style="display:flex;align-items:center;gap:4px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Cek terakhir: ${lastCheck ? lastCheck.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '—'}
              </span>
              <span style="display:flex;align-items:center;gap:4px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${inputName}
              </span>
            </div>
          </div>
          <button onclick="event.stopPropagation();selectVehicle('${v.id}');navigate('monitoring')" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:var(--amber-light);border:1.5px solid #fde68a;border-radius:11px;font-size:12px;font-weight:700;cursor:pointer;color:#92400e;font-family:'DM Sans',sans-serif;white-space:nowrap;transition:all .15s;flex-shrink:0;" onmouseover="this.style.background='#fde68a'" onmouseout="this.style.background='var(--amber-light)'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Update Sekarang
          </button>
        </div>`;
      }).join('')}
    </div>`}
  </div>`;

  // ── Chart data: perkembangan input monitoring & trial per user ──────────────
  // Ambil semua tanggal installDate dari vehicles & trialVehicles, lalu kelompokkan per bulan
  function buildGrowthChartData() {
    // Kumpulkan semua entri dengan tanggal dan user
    const monEntries = vehicles.map(v => ({ date: v.installDate, user: v.inputBy || '—', type: 'monitoring' }));
    const trialEntries = trialVehicles.map(v => ({ date: v.installDate, user: v.inputBy || '—', type: 'trial' }));
    const allEntries = [...monEntries, ...trialEntries].filter(e => e.date);

    if (allEntries.length === 0) return null;

    // Temukan range bulan
    const dates = allEntries.map(e => new Date(e.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date();

    // Build label bulan
    const months = [];
    const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cur <= maxDate) {
      months.push(cur.toISOString().slice(0,7)); // "YYYY-MM"
      cur.setMonth(cur.getMonth() + 1);
    }

    // Hitung kumulatif per bulan untuk monitoring & trial total
    function countUpTo(entries, month) {
      return entries.filter(e => e.date.slice(0,7) <= month).length;
    }

    const monCumulative = months.map(m => countUpTo(monEntries.filter(e=>e.date), m));
    const trialCumulative = months.map(m => countUpTo(trialEntries.filter(e=>e.date), m));

    // Per user: hitung kumulatif input (monitoring + trial)
    const userInputMap = {};
    allEntries.forEach(e => {
      if (!userInputMap[e.user]) userInputMap[e.user] = [];
      userInputMap[e.user].push(e.date);
    });

    // Hanya ambil user yang punya data
    const userKeys = Object.keys(userInputMap).slice(0, 5); // max 5 users
    const userColors = ['#059669','#2563eb','#d97706','#7c3aed','#db2777'];
    const userDatasets = userKeys.map((uname, i) => {
      const userObj = appUsers.find(u => u.username === uname);
      const label = userObj ? userObj.name.split(' ')[0] : uname;
      const cumData = months.map(m => userInputMap[uname].filter(d => d.slice(0,7) <= m).length);
      return { label, data: cumData, color: userColors[i % userColors.length], username: uname };
    });

    const monthLabels = months.map(m => {
      const [y, mo] = m.split('-');
      return new Date(+y, +mo-1, 1).toLocaleDateString('id-ID',{month:'short', year:'2-digit'});
    });

    return { months, monthLabels, monCumulative, trialCumulative, userDatasets };
  }

  const chartData = buildGrowthChartData();

  const growthChartSection = chartData ? `
  <div style="margin-top:40px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:4px;height:28px;background:var(--blue);border-radius:4px;"></div>
      <div>
        <div style="font-size:16px;font-weight:800;font-family:'Syne',sans-serif;">Perkembangan Input Kendaraan</div>
        <div style="font-size:12px;color:var(--muted);">Kumulatif data Monitoring &amp; Trial yang diinput oleh setiap user</div>
      </div>
    </div>

    <!-- Twin chart cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">

      <!-- Chart 1: Monitoring vs Trial total -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:20px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px;">Total Kumulatif</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:16px;">Monitoring vs Trial per bulan</div>
        <div style="display:flex;gap:14px;margin-bottom:14px;flex-wrap:wrap;">
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#059669;">
            <span style="width:24px;height:3px;background:#059669;border-radius:2px;display:inline-block;"></span>Monitoring
          </span>
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#2563eb;">
            <span style="width:24px;height:3px;background:#2563eb;border-radius:2px;display:inline-block;"></span>Trial
          </span>
        </div>
        <div style="height:200px;position:relative;">
          <canvas id="dash-chart-total"></canvas>
        </div>
      </div>

      <!-- Chart 2: Per user -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:20px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px;">Input per User</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:16px;">Kumulatif kendaraan yang diinput setiap user</div>
        <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
          ${chartData.userDatasets.map(ds => `
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${ds.color};">
            <span style="width:20px;height:3px;background:${ds.color};border-radius:2px;display:inline-block;"></span>${ds.label}
          </span>`).join('')}
        </div>
        <div style="height:200px;position:relative;">
          <canvas id="dash-chart-user"></canvas>
        </div>
      </div>
    </div>

    <!-- Bar chart: input per user per kategori -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:20px;margin-top:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-size:13px;font-weight:700;margin-bottom:2px;">Distribusi Input per User</div>
          <div style="font-size:11px;color:var(--muted);">Jumlah kendaraan Monitoring vs Trial yang diinput masing-masing user</div>
        </div>
        <div style="display:flex;gap:12px;">
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#059669;">
            <span style="width:12px;height:12px;background:#059669;border-radius:3px;display:inline-block;"></span>Monitoring
          </span>
          <span style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#2563eb;">
            <span style="width:12px;height:12px;background:#2563eb;border-radius:3px;display:inline-block;"></span>Trial
          </span>
        </div>
      </div>
      <div style="height:180px;position:relative;">
        <canvas id="dash-chart-bar"></canvas>
      </div>
    </div>
  </div>` : '';

  return `
  <div style="max-width:960px;">
    <div style="margin-bottom:24px;">
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px;">Selamat datang 👋</div>
      <div style="font-size:14px;color:var(--muted);margin-top:4px;">
        Ringkasan aktivitas input per user — ${now.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}.
      </div>
    </div>

    <!-- Section label -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <div style="width:4px;height:24px;background:var(--green);border-radius:4px;"></div>
      <div style="font-size:15px;font-weight:800;font-family:'Syne',sans-serif;">Ringkasan per User</div>
    </div>

    ${userCardsHTML}
    ${overdueSection}
    ${growthChartSection}
  </div>`;
}

// ── Render chart setelah DOM siap ─────────────────────────────────────────
let _dashChartTotal = null;
let _dashChartUser  = null;
let _dashChartBar   = null;

function renderDashboardCharts() {
  if (currentPage !== 'dashboard') return;

  const allV = [...vehicles, ...trialVehicles];
  const monEntries = vehicles.map(v => ({ date: v.installDate, user: v.inputBy || '—' })).filter(e=>e.date);
  const trialEntries = trialVehicles.map(v => ({ date: v.installDate, user: v.inputBy || '—' })).filter(e=>e.date);
  const allEntries = [...monEntries, ...trialEntries];

  if (allEntries.length === 0) return;

  const dates = allEntries.map(e => new Date(e.date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date();
  const months = [];
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cur <= maxDate) {
    months.push(cur.toISOString().slice(0,7));
    cur.setMonth(cur.getMonth() + 1);
  }

  const monthLabels = months.map(m => {
    const [y, mo] = m.split('-');
    return new Date(+y, +mo-1, 1).toLocaleDateString('id-ID',{month:'short',year:'2-digit'});
  });

  function countCumulative(entries, months) {
    return months.map(m => entries.filter(e => e.date.slice(0,7) <= m).length);
  }

  const userInputMap = {};
  allEntries.forEach(e => {
    if (!userInputMap[e.user]) userInputMap[e.user] = [];
    userInputMap[e.user].push(e.date);
  });
  const userKeys = Object.keys(userInputMap).slice(0,5);
  const userColors = ['#059669','#2563eb','#d97706','#7c3aed','#db2777'];

  const chartDefaults = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} unit` } } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font:{ size:10 }, stepSize:1 } },
      x: { grid: { display: false }, ticks: { font:{ size:10 } } }
    }
  };

  // Chart 1: total monitoring vs trial
  const ctx1 = document.getElementById('dash-chart-total');
  if (ctx1) {
    if (_dashChartTotal) { _dashChartTotal.destroy(); _dashChartTotal = null; }
    _dashChartTotal = new Chart(ctx1.getContext('2d'), {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [
          { label: 'Monitoring', data: countCumulative(monEntries, months), borderColor:'#059669', backgroundColor:'rgba(5,150,105,0.08)', borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#059669', tension:0.4, fill:true },
          { label: 'Trial',      data: countCumulative(trialEntries, months), borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.08)', borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#2563eb', tension:0.4, fill:true }
        ]
      },
      options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} unit` } } } }
    });
  }

  // Chart 2: per user
  const ctx2 = document.getElementById('dash-chart-user');
  if (ctx2) {
    if (_dashChartUser) { _dashChartUser.destroy(); _dashChartUser = null; }
    _dashChartUser = new Chart(ctx2.getContext('2d'), {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: userKeys.map((uname, i) => {
          const userObj = appUsers.find(u => u.username === uname);
          const label = userObj ? userObj.name.split(' ')[0] : uname;
          return {
            label,
            data: months.map(m => userInputMap[uname].filter(d => d.slice(0,7) <= m).length),
            borderColor: userColors[i], backgroundColor: userColors[i] + '18',
            borderWidth:2.5, pointRadius:4, pointBackgroundColor: userColors[i], tension:0.4, fill:false
          };
        })
      },
      options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} unit` } } } }
    });
  }

  // Chart 3: bar per user Monitoring vs Trial
  const ctx3 = document.getElementById('dash-chart-bar');
  if (ctx3) {
    if (_dashChartBar) { _dashChartBar.destroy(); _dashChartBar = null; }
    const barLabels = userKeys.map(uname => {
      const u = appUsers.find(u => u.username === uname);
      return u ? u.name.split(' ')[0] : uname;
    });
    _dashChartBar = new Chart(ctx3.getContext('2d'), {
      type: 'bar',
      data: {
        labels: barLabels,
        datasets: [
          { label: 'Monitoring', data: userKeys.map(u => vehicles.filter(v => v.inputBy===u).length), backgroundColor:'#059669', borderRadius:6, borderSkipped:false },
          { label: 'Trial',      data: userKeys.map(u => trialVehicles.filter(v => v.inputBy===u).length), backgroundColor:'#2563eb', borderRadius:6, borderSkipped:false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} unit` } } },
        scales: {
          y: { beginAtZero: true, grid: { color:'rgba(0,0,0,0.04)' }, ticks: { font:{size:10}, stepSize:1 } },
          x: { grid: { display:false }, ticks: { font:{size:11} } }
        }
      }
    });
  }
}


function renderTireCard(t) {
  // Jika tidak ada data pengukuran sama sekali, tidak ditampilkan
  if (!t.measurements || t.measurements.length === 0) return '';

  const latest = t.measurements[t.measurements.length - 1];
  const pDanger = latest && latest.pressure < 28;
  const tDanger = latest && latest.treadDepth < 3;
  const isRemoved = t.removed;
  return `
  <div class="tire-card" style="${isRemoved ? 'opacity:0.55;border:1.5px dashed #fecdd3;' : ''}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
      <div>
        <div class="tire-pos">${t.position}</div>
        <div class="tire-brand">${t.brand || '—'} ${t.model || ''}</div>
      </div>
      ${isRemoved
        ? `<span class="badge critical" style="background:#fecdd3;color:#9f1239;border-color:#fca5a5;font-size:10px;">✓ Dilepas</span>`
        : `<span class="badge ${t.status}">${statusLabel(t.status)}</span>`}
    </div>
    ${t.photo ? `<img src="${t.photo}" style="width:100%;height:90px;object-fit:cover;border-radius:10px;margin-bottom:10px;border:1px solid var(--border);" alt="Foto ban ${t.position}" />` : ''}
    <div class="tire-metrics">
      <div>
        <div class="metric-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>Tekanan</div>
        <div class="metric-value ${pDanger?'danger':''}">${latest?.pressure ?? '--'}<span class="metric-unit"> PSI</span></div>
      </div>
      <div>
        <div class="metric-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>Alur</div>
        <div class="metric-value ${tDanger?'danger':''}">${latest?.treadDepth ?? '--'}<span class="metric-unit"> mm</span></div>
      </div>
      <div>
        <div class="metric-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><polyline points="12 12 15 14"/></svg>Odometer</div>
        <div class="metric-value" style="font-size:13px;">${latest?.odometer != null ? (latest.odometer).toLocaleString('id-ID') : '--'}<span class="metric-unit"> km</span></div>
      </div>
    </div>
    ${latest?.notes ? `<div style="margin-top:10px;padding:7px 10px;background:#f9fafb;border-radius:8px;font-size:11px;color:var(--muted);border-left:3px solid var(--green);line-height:1.5;">${latest.notes}</div>` : ''}
    <div style="display:flex;gap:6px;margin-top:14px;">
      <button onclick="openHistoryModal('${t.vehicleId || ''}','${t.id}')" style="flex:1;padding:7px;background:#f3f4f6;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Histori
      </button>
      <button onclick="openMeasureModal('${t.id}')" style="flex:1;padding:7px;background:var(--green-light);border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;color:var(--green);font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px;" onmouseover="this.style.background='#a7f3d0'" onmouseout="this.style.background='var(--green-light)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Update
      </button>
    </div>
  </div>`;
}

function renderChart() {
  if (!selectedVehicleId) return;
  const allV = [...vehicles, ...trialVehicles];
  const v = allV.find(v => v.id === selectedVehicleId);
  if (!v || !document.getElementById('pressure-chart')) return;
  if (pressureChart) { pressureChart.destroy(); pressureChart = null; }
  // Gunakan ban pertama yang punya data pengukuran
  const firstWithData = v.tires.find(t => t.measurements && t.measurements.length > 0);
  if (!firstWithData) return;
  const data = firstWithData.measurements;
  if (data.length === 0) return;
  const ctx = document.getElementById('pressure-chart').getContext('2d');
  pressureChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(m => new Date(m.timestamp).toLocaleDateString('id-ID',{day:'numeric',month:'short'})),
      datasets: [{ label: 'Tekanan (PSI)', data: data.map(m=>m.pressure), borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.08)', borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#059669', tension: 0.3, fill: true }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } } }
  });
}

// ====== VEHICLES PAGE ======
function renderVehicles() {
  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (vehiclesView === 'detail' && vehiclesDetailId) {
    const allV = [...vehicles, ...trialVehicles];
    const v = allV.find(x => x.id === vehiclesDetailId);
    if (!v) { vehiclesView = 'list'; vehiclesDetailId = null; }
    else return renderVehiclesDetail(v);
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  const fv = filteredVehicles();
  return `
  <div>
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:14px;">
      <div>
        <div class="page-title">Daftar Kendaraan</div>
        <div class="page-sub">Klik kartu untuk melihat detail & riwayat pengecekan.</div>
      </div>
      ${currentUser.role !== 'viewer' ? `<div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn" onclick="openSubmissionModal('monitoring')" style="background:var(--green-light);color:#065f46;border:1px solid #a7f3d0;font-weight:700;gap:7px;" onmouseover="this.style.background='#a7f3d0'" onmouseout="this.style.background='var(--green-light)'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Ajukan Monitoring
        </button>
        <button class="btn" onclick="openSubmissionModal('trial')" style="background:var(--blue-light);color:#1e40af;border:1px solid #bfdbfe;font-weight:700;gap:7px;" onmouseover="this.style.background='#bfdbfe'" onmouseout="this.style.background='var(--blue-light)'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
          Ajukan Trial
        </button>
      </div>` : ''}
    </div>
    ${fv.length === 0
      ? `<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg><p>Belum ada kendaraan terdaftar.</p></div>`
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
      ${fv.map(v => {
        const tiresWithData = v.tires.filter(t => t.measurements && t.measurements.length > 0);
        const bad = tiresWithData.filter(t => t.status !== 'good').length;
        const isInTrial = trialVehicles.some(x => x.id === v.id);
        return `<div class="card" style="cursor:pointer;overflow:hidden;transition:box-shadow .15s,transform .15s;"
          onclick="vehiclesView='detail';vehiclesDetailId='${v.id}';vehiclesSelectedTireId=null;render()"
          onmouseover="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)';this.style.transform='translateY(-2px)'"
          onmouseout="this.style.boxShadow='none';this.style.transform='translateY(0)'">
          ${v.photoUnit
            ? `<img src="${v.photoUnit}" style="width:100%;height:120px;object-fit:cover;display:block;" alt="Unit" />`
            : `<div style="height:80px;background:linear-gradient(135deg,${isInTrial ? '#dbeafe,#ede9fe' : 'var(--green-light),var(--blue-light)'});display:flex;align-items:center;justify-content:center;position:relative;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${isInTrial ? '#2563eb' : '#059669'}" stroke-width="1.5" opacity="0.5"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                <span style="position:absolute;top:8px;right:10px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;background:${isInTrial ? '#dbeafe' : 'var(--green-light)'};color:${isInTrial ? '#1e40af' : '#065f46'};padding:2px 7px;border-radius:20px;border:1px solid ${isInTrial ? '#bfdbfe' : '#a7f3d0'};">${isInTrial ? 'Trial' : 'Monitoring'}</span>
               </div>`}
          <div style="padding:18px 20px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
              <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.5px;">${v.plateNumber}</div>
              <span style="font-size:11px;font-weight:700;color:var(--muted);background:#f3f4f6;padding:3px 8px;border-radius:8px;">${v.tonnage} Ton</span>
            </div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:4px;">${v.make} ${v.model}</div>
            <div style="font-size:12px;color:var(--text);font-weight:600;margin-bottom:${v.picNumber || v.installDate ? '8px' : '14px'}">${v.customerName}</div>
            ${v.picNumber ? `<div style="font-size:11px;color:var(--muted);margin-bottom:2px;">📞 <strong style="color:var(--text);">${v.picNumber}</strong></div>` : ''}
            ${v.installDate ? `<div style="font-size:11px;color:var(--muted);margin-bottom:10px;">📅 Pasang: <strong style="color:var(--text);">${v.installDate}</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border);">
              <div style="display:flex;">
                ${tiresWithData.slice(0,6).map((t,i) => `<div style="width:20px;height:20px;border-radius:50%;border:2px solid white;background:${t.status==='critical'?'#e11d48':t.status==='warning'?'#d97706':'#059669'};margin-left:${i>0?'-5px':'0'};display:flex;align-items:center;justify-content:center;font-size:7px;color:white;font-weight:700;">${i+1}</div>`).join('')}
                ${tiresWithData.length === 0 ? '<span style="font-size:11px;color:var(--muted);font-style:italic;">Belum ada data</span>' : ''}
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                ${tiresWithData.length === 0
                  ? `<span style="font-size:11px;font-weight:700;color:var(--muted);">Belum ada monitoring</span>`
                  : bad > 0
                  ? `<span style="font-size:11px;font-weight:700;color:var(--rose);">${bad} perlu perhatian</span>`
                  : `<span style="font-size:11px;font-weight:700;color:var(--green);">Semua aman</span>`}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`}
  </div>`;
}

function renderVehiclesDetail(v) {
  const isInTrial = trialVehicles.some(x => x.id === v.id);
  const activeTires = v.tires.filter(t => !t.removed);
  // Hanya ban yang sudah ada data pengukuran
  const monitoredTires = activeTires.filter(t => t.measurements && t.measurements.length > 0);

  // Default: pilih ban pertama yang ada data
  if (!vehiclesSelectedTireId && monitoredTires.length > 0) {
    vehiclesSelectedTireId = monitoredTires[0].id;
  }
  const selectedTire = monitoredTires.find(t => t.id === vehiclesSelectedTireId) || monitoredTires[0];

  // Status helpers
  const statusStyle = s => s === 'critical'
    ? 'background:var(--rose-light);color:#9f1239;border-color:#fecdd3;'
    : s === 'warning'
    ? 'background:var(--amber-light);color:#78350f;border-color:#fde68a;'
    : 'background:var(--green-light);color:#065f46;border-color:#a7f3d0;';
  const statusLabel = s => s === 'critical' ? 'Kritis' : s === 'warning' ? 'Peringatan' : 'Baik';

  // Riwayat ban terpilih — diurutkan terbaru dulu
  const history = selectedTire
    ? [...selectedTire.measurements].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  const fmt = ts => new Date(ts).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
  const fmtTime = ts => new Date(ts).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

  // Ban summary cards — hanya ban yang ada data
  const tireSummary = monitoredTires.length === 0
    ? `<div style="padding:20px;color:var(--muted);font-size:13px;font-style:italic;">Belum ada data pengecekan ban untuk kendaraan ini.</div>`
    : monitoredTires.map(t => {
    const latest = t.measurements[t.measurements.length - 1];
    const isSelected = t.id === vehiclesSelectedTireId;
    return `<div onclick="vehiclesSelectedTireId='${t.id}';render()"
      style="padding:10px 12px;border-radius:14px;border:2px solid ${isSelected ? (t.status==='critical'?'#e11d48':t.status==='warning'?'#d97706':'#059669') : 'var(--border)'};background:${isSelected ? (t.status==='critical'?'var(--rose-light)':t.status==='warning'?'var(--amber-light)':'var(--green-light)') : 'var(--surface)'};cursor:pointer;transition:all .15s;min-width:90px;">
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:3px;">${t.position}</div>
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px;">${t.brand}</div>
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:1px 7px;border-radius:20px;border:1px solid;${statusStyle(t.status)}">${statusLabel(t.status)}</span>
      </div>
      ${latest ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;">${latest.pressure} PSI · ${latest.treadDepth}mm</div>` : ''}
    </div>`;
  }).join('');

  // History rows
  const historyRows = history.length === 0
    ? `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--muted);font-size:13px;">Belum ada data pengecekan untuk ban ini.</td></tr>`
    : history.map((m, idx) => {
        const prevM = history[idx + 1];
        const pDiff = prevM ? m.pressure - prevM.pressure : null;
        const nDiff = prevM ? m.treadDepth - prevM.treadDepth : null;
        const pColor = pDiff === null ? '' : pDiff < 0 ? 'color:#e11d48;' : pDiff > 0 ? 'color:#059669;' : 'color:var(--muted);';
        const nColor = nDiff === null ? '' : nDiff < 0 ? 'color:#e11d48;' : nDiff > 0 ? 'color:#059669;' : 'color:var(--muted);';
        const pArrow = pDiff === null ? '' : pDiff < 0 ? '↓' : pDiff > 0 ? '↑' : '→';
        const nArrow = nDiff === null ? '' : nDiff < 0 ? '↓' : nDiff > 0 ? '↑' : '→';
        const ps = getTireStatus(m.pressure, m.treadDepth);
        return `<tr style="transition:background .1s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
          <td style="padding:10px 14px;border-bottom:1px solid var(--border);white-space:nowrap;">
            <div style="font-size:13px;font-weight:700;color:var(--text);">${fmt(m.timestamp)}</div>
            <div style="font-size:11px;color:var(--muted);">${fmtTime(m.timestamp)}</div>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid var(--border);text-align:center;">
            <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;${m.pressure < 26 ? 'color:#e11d48;' : m.pressure < 28 ? 'color:#d97706;' : ''}">${m.pressure}</div>
            <div style="font-size:9px;color:var(--muted);">PSI</div>
            ${pArrow ? `<div style="font-size:10px;font-weight:700;${pColor}">${pArrow} ${Math.abs(pDiff).toFixed(1)}</div>` : ''}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid var(--border);text-align:center;">
            <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;${m.treadDepth < 2 ? 'color:#e11d48;' : m.treadDepth < 3 ? 'color:#d97706;' : ''}">${m.treadDepth}</div>
            <div style="font-size:9px;color:var(--muted);">mm NSD</div>
            ${nArrow ? `<div style="font-size:10px;font-weight:700;${nColor}">${nArrow} ${Math.abs(nDiff).toFixed(1)}</div>` : ''}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid var(--border);text-align:center;">
            ${m.odometer ? `<div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;">${m.odometer.toLocaleString('id-ID')}</div><div style="font-size:9px;color:var(--muted);">km</div>` : '<span style="color:var(--muted);font-size:12px;">—</span>'}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid var(--border);text-align:center;">
            <span style="display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;border:1px solid;${statusStyle(ps)}">${statusLabel(ps)}</span>
            ${m.notes ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${m.notes}">📝 ${m.notes}</div>` : ''}
          </td>
        </tr>`;
      }).join('');

  return `
  <div style="max-width:960px;margin:0 auto;">
    <!-- Back + Header -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;flex-wrap:wrap;">
      <button onclick="vehiclesView='list';vehiclesDetailId=null;vehiclesSelectedTireId=null;render()"
        style="display:inline-flex;align-items:center;gap:7px;padding:9px 16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;transition:all .15s;"
        onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='var(--surface)'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Kembali ke Daftar Kendaraan
      </button>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${v.plateNumber}</div>
          <span style="font-size:10px;font-weight:800;text-transform:uppercase;padding:3px 10px;border-radius:20px;background:${isInTrial ? '#dbeafe' : 'var(--green-light)'};color:${isInTrial ? '#1e40af' : '#065f46'};border:1px solid ${isInTrial ? '#bfdbfe' : '#a7f3d0'};">${isInTrial ? 'Trial' : 'Monitoring'}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px;">${v.make} ${v.model} · ${v.customerName}</div>
      </div>
      ${currentUser.role !== 'viewer' ? `<button onclick="selectVehicle('${v.id}');navigate('monitoring')" class="btn btn-primary" style="flex-shrink:0;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Input Pengecekan
      </button>` : ''}
    </div>

    <!-- Info strip -->
    <div class="card" style="padding:16px 20px;margin-bottom:20px;">
      <div style="display:flex;flex-wrap:wrap;gap:20px;">
        ${v.picNumber ? `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:3px;">PIC / Telepon</div><div style="font-size:13px;font-weight:700;">📞 ${v.picNumber}</div></div>` : ''}
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:3px;">Tonase</div><div style="font-size:13px;font-weight:700;">${v.tonnage} Ton</div></div>
        ${v.installDate ? `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:3px;">Tgl Pemasangan</div><div style="font-size:13px;font-weight:700;">📅 ${v.installDate}</div></div>` : ''}
        ${v.installOdo ? `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:3px;">Odometer Pasang</div><div style="font-size:13px;font-weight:700;font-family:'DM Mono',monospace;">${v.installOdo.toLocaleString('id-ID')} km</div></div>` : ''}
        ${v.salesCompany ? `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:3px;">Sales</div><div style="font-size:13px;font-weight:700;">💼 ${v.salesCompany}</div></div>` : ''}
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:3px;">Jumlah Ban</div><div style="font-size:13px;font-weight:700;">${activeTires.length} posisi · <span style="color:var(--green);">${monitoredTires.length} termonitor</span></div></div>
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:3px;">Kondisi</div>
          <div style="font-size:13px;font-weight:700;color:${monitoredTires.length === 0 ? 'var(--muted)' : monitoredTires.some(t=>t.status==='critical')?'#e11d48':monitoredTires.some(t=>t.status==='warning')?'#d97706':'#059669'};">
            ${monitoredTires.length === 0 ? '— Belum ada data' : monitoredTires.filter(t=>t.status==='critical').length > 0 ? `⚠ ${monitoredTires.filter(t=>t.status==='critical').length} kritis` : monitoredTires.filter(t=>t.status==='warning').length > 0 ? `⚡ ${monitoredTires.filter(t=>t.status==='warning').length} peringatan` : '✓ Semua baik'}
          </div>
        </div>
      </div>
    </div>

    <!-- Ban selector chips (scrollable) -->
    <div style="margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:8px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Pilih Ban untuk Lihat Riwayat Pengecekan
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${tireSummary}
      </div>
    </div>

    <!-- History table -->
    <div class="card" style="overflow:hidden;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:14px;font-weight:700;">
            Riwayat Pengecekan
            ${selectedTire ? `— <span style="color:var(--green);">${selectedTire.position}</span>` : ''}
          </div>
          ${selectedTire ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${selectedTire.brand} ${selectedTire.model} · Pasang: ${selectedTire.installDate || '—'}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <!-- Dropdown pilihan ban -->
          <div style="position:relative;">
            <select onchange="vehiclesSelectedTireId=this.value;render()"
              style="appearance:none;-webkit-appearance:none;padding:9px 36px 9px 14px;border-radius:12px;border:1px solid var(--border);background:var(--surface);font-size:13px;font-family:'DM Sans',sans-serif;font-weight:600;color:var(--text);cursor:pointer;outline:none;min-width:180px;">
              ${monitoredTires.map(t => `<option value="${t.id}" ${t.id === vehiclesSelectedTireId ? 'selected' : ''}>${t.position} — ${t.brand}</option>`).join('')}
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <span style="font-size:12px;font-weight:700;background:var(--green-light);color:#065f46;padding:4px 12px;border-radius:20px;border:1px solid #a7f3d0;">${history.length} catatan</span>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:10px 14px;background:#f9fafb;border-bottom:2px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);white-space:nowrap;">Tanggal</th>
              <th style="text-align:center;padding:10px 14px;background:#f9fafb;border-bottom:2px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);">Tekanan</th>
              <th style="text-align:center;padding:10px 14px;background:#f9fafb;border-bottom:2px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);">Alur (NSD)</th>
              <th style="text-align:center;padding:10px 14px;background:#f9fafb;border-bottom:2px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);">Odometer</th>
              <th style="text-align:center;padding:10px 14px;background:#f9fafb;border-bottom:2px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);">Status</th>
            </tr>
          </thead>
          <tbody>
            ${historyRows}
          </tbody>
        </table>
      </div>
      ${history.length === 0 ? '' : `
      <div style="padding:12px 20px;background:#f9fafb;border-top:1px solid var(--border);font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Panah ↑↓ menunjukkan perubahan dari pengecekan sebelumnya. Data terbaru ditampilkan di atas.
      </div>`}
    </div>
  </div>`;
}

// ====== MONITORING & TRIAL PAGE ======
function renderMonitoring() {
  // Detail view — pass through regardless of category
  if (monitoringView === 'detail' && selectedVehicleId) {
    const allV = [...vehicles, ...trialVehicles];
    const v = allV.find(x => x.id === selectedVehicleId);
    if (v) return renderMonitoringDetail(v);
  }
  monitoringView = 'list';

  // ── Warna & style helpers ─────────────────────────────────────────────────
  const CAT = {
    ban:    { color:'var(--green)', bg:'var(--green-light)', border:'#a7f3d0', label:'BAN',    icon:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>' },
    pelumas:{ color:'#7c3aed',     bg:'#ede9fe',             border:'#c4b5fd', label:'PELUMAS', icon:'<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>' },
  };
  const isBan    = monitoringCategory === 'ban';
  const cat      = CAT[monitoringCategory];
  const isMonTab = monitoringTab === 'monitoring';

  // ── Aktif list (hanya relevan saat kategori BAN) ──────────────────────────
  const activeList = isMonTab ? vehicles : trialVehicles;

  // Stats untuk BAN tab aktif
  const allTires = [];
  activeList.forEach(v => v.tires.forEach(t => {
    if (!t.measurements || t.measurements.length === 0) return;
    allTires.push({ v, t, latest: t.measurements[t.measurements.length - 1] });
  }));
  const totalBan   = allTires.length;
  const kritis     = allTires.filter(x => x.t.status === 'critical').length;
  const peringatan = allTires.filter(x => x.t.status === 'warning').length;
  const bagus      = allTires.filter(x => x.t.status === 'good').length;
  const pctBagus   = totalBan ? Math.round(bagus / totalBan * 100) : 0;

  const rows = activeList.map(v => {
    const tiresData = v.tires
      .filter(t => t.measurements && t.measurements.length > 0)
      .map(t => ({ t, latest: t.measurements[t.measurements.length - 1] }));
    const critical  = tiresData.filter(x => x.t.status === 'critical').length;
    const warning   = tiresData.filter(x => x.t.status === 'warning').length;
    const avgPsi = tiresData.length ? (tiresData.reduce((s, x) => s + (x.latest?.pressure ?? 0), 0) / tiresData.length).toFixed(1) : '-';
    const avgNsd = tiresData.length ? (tiresData.reduce((s, x) => s + (x.latest?.treadDepth ?? 0), 0) / tiresData.length).toFixed(1) : '-';
    const overallStatus = critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'good';
    return { v, tiresData, critical, warning, avgPsi, avgNsd, overallStatus };
  });

  // ── Kategori besar switcher ───────────────────────────────────────────────
  const categoryBar = `
  <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;">
    ${Object.entries(CAT).map(([key, c]) => `
    <button onclick="monitoringCategory='${key}';render()" style="display:inline-flex;align-items:center;gap:10px;padding:14px 24px;border-radius:18px;border:2px solid ${monitoringCategory===key ? c.color : 'var(--border)'};background:${monitoringCategory===key ? c.bg : 'var(--surface)'};cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;flex:0 0 auto;${monitoringCategory===key?'box-shadow:0 4px 16px rgba(0,0,0,0.08);':''}">
      <div style="width:38px;height:38px;border-radius:12px;background:${monitoringCategory===key ? c.color : '#f3f4f6'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${monitoringCategory===key ? 'white' : '#9ca3af'}" stroke-width="2">${c.icon}</svg>
      </div>
      <div style="text-align:left;">
        <div style="font-size:14px;font-weight:800;letter-spacing:.04em;color:${monitoringCategory===key ? c.color : 'var(--muted)'};font-family:'Syne',sans-serif;">${c.label}</div>
        <div style="font-size:11px;color:${monitoringCategory===key ? c.color : 'var(--muted)'};opacity:.8;margin-top:1px;">${key==='ban' ? (vehicles.length+trialVehicles.length)+' unit terdaftar' : (pelumasRecords.length+pelumasTrialRecords.length)+' catatan'}</div>
      </div>
      ${monitoringCategory===key ? `<div style="margin-left:auto;width:8px;height:8px;border-radius:50%;background:${c.color};flex-shrink:0;"></div>` : ''}
    </button>`).join('')}
  </div>`;

  // ── Sub-tab (monitoring / trial) — hanya tampil saat BAN ─────────────────
  const subTabBar = isBan ? `
  <div style="display:flex;gap:0;margin-bottom:24px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:5px;width:fit-content;">
    <button onclick="monitoringTab='monitoring';render()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;${isMonTab ? 'background:var(--green);color:white;box-shadow:0 4px 12px rgba(5,150,105,0.3);' : 'background:transparent;color:var(--muted);'}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Monitoring
      <span style="background:${isMonTab?'rgba(255,255,255,0.25)':'#f3f4f6'};color:${isMonTab?'white':'var(--muted)'};font-size:11px;padding:1px 7px;border-radius:20px;font-weight:700;">${vehicles.length}</span>
    </button>
    <button onclick="monitoringTab='trial';render()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;${!isMonTab ? 'background:#2563eb;color:white;box-shadow:0 4px 12px rgba(37,99,235,0.3);' : 'background:transparent;color:var(--muted);'}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
      Trial
      <span style="background:${!isMonTab?'rgba(255,255,255,0.25)':'#f3f4f6'};color:${!isMonTab?'white':'var(--muted)'};font-size:11px;padding:1px 7px;border-radius:20px;font-weight:700;">${trialVehicles.length}</span>
    </button>
  </div>` : '';

  // ── Konten BAN (monitoring/trial) ─────────────────────────────────────────
  const banContent = `
  <div> <!-- Sub label + add button -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:4px;height:28px;background:${isMonTab?'var(--green)':'#2563eb'};border-radius:4px;"></div>
        <div>
          <div style="font-size:16px;font-weight:800;font-family:'Syne',sans-serif;">Ban ${isMonTab ? 'Monitoring' : 'Trial'}</div>
          <div style="font-size:12px;color:var(--muted);">${isMonTab ? 'Armada aktif dalam pemantauan rutin ban' : 'Kendaraan dalam program uji coba ban baru'}</div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="openAddVehicleModal('${isMonTab ? 'monitoring' : 'trial'}')" style="${!isMonTab ? 'background:#2563eb;box-shadow:0 4px 12px rgba(37,99,235,0.3);' : ''}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Kendaraan
      </button>
    </div>

    ${activeList.length === 0 ? `
    <div class="empty-state" style="min-height:320px;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        ${isMonTab ? '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' : '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>'}
      </svg>
      <p style="margin-bottom:16px;">Belum ada kendaraan dalam kategori ${isMonTab ? 'Monitoring' : 'Trial'}.</p>
      <button class="btn btn-primary" onclick="openAddVehicleModal('${isMonTab ? 'monitoring' : 'trial'}')" style="${!isMonTab ? 'background:#2563eb;' : ''}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Kendaraan
      </button>
    </div>` : `

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:24px;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Ban</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;">${totalBan}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px;">${activeList.length} kendaraan</div>
      </div>
      <div style="background:var(--green-light);border:1px solid #a7f3d0;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#065f46;margin-bottom:6px;">Kondisi Baik</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#065f46;">${bagus}</div>
        <div style="font-size:11px;color:#059669;margin-top:3px;">${pctBagus}% dari total</div>
      </div>
      <div style="background:var(--amber-light);border:1px solid #fde68a;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#78350f;margin-bottom:6px;">Peringatan</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#b45309;">${peringatan}</div>
      </div>
      <div style="background:var(--rose-light);border:1px solid #fecdd3;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9f1239;margin-bottom:6px;">Kritis</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:var(--rose);">${kritis}</div>
      </div>
    </div>

    <!-- Health bar -->
    ${totalBan > 0 ? `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px 22px;margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:13px;font-weight:700;">Kesehatan Keseluruhan</span>
        <span style="font-size:20px;font-family:'DM Mono',monospace;font-weight:500;color:${pctBagus>=80?'var(--green)':pctBagus>=60?'var(--amber)':'var(--rose)'};">${pctBagus}%</span>
      </div>
      <div style="height:8px;background:#f3f4f6;border-radius:99px;overflow:hidden;display:flex;gap:2px;">
        <div style="width:${Math.round(bagus/totalBan*100)}%;background:var(--green);border-radius:99px;"></div>
        <div style="width:${Math.round(peringatan/totalBan*100)}%;background:var(--amber);border-radius:99px;"></div>
        <div style="width:${Math.round(kritis/totalBan*100)}%;background:var(--rose);border-radius:99px;"></div>
      </div>
    </div>` : ''}

    <!-- Vehicle table -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;">
      <div style="padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <span style="font-weight:700;font-size:14px;">Daftar Kendaraan – ${isMonTab ? 'Monitoring' : 'Trial'}</span>
        <span style="font-size:12px;color:var(--muted);">${activeList.length} unit</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="text-align:left;padding:11px 20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap;">Plat / Unit</th>
              <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Customer</th>
              <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Perusahaan Sales</th>
              <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">PIC</th>
              <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Status Ban</th>
              <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Avg PSI</th>
              <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Avg NSD</th>
              <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Kondisi</th>
              <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Detail Ban</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
            <tr style="border-bottom:1px solid var(--border);transition:background .12s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
              <td style="padding:13px 20px;">
                <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;">${row.v.plateNumber}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px;">${row.v.make} ${row.v.model} • ${row.v.tonnage}T</div>
              </td>
              <td style="padding:13px 14px;">
                <div style="font-size:13px;font-weight:500;">${row.v.customerName}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:1px;">Pasang: ${row.v.installDate}</div>
              </td>
              <td style="padding:13px 14px;">
                ${row.v.salesCompany
                  ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#fff7ed;color:#92400e;border:1px solid #fed7aa;">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      ${row.v.salesCompany}
                    </span>`
                  : '<span style="font-size:11px;color:var(--muted);">—</span>'}
              </td>
              <td style="padding:13px 14px;"><div style="font-size:12px;color:var(--muted);">${row.v.picNumber || '—'}</div></td>
              <td style="padding:13px 14px;text-align:center;">
                <div style="display:flex;align-items:center;justify-content:center;gap:3px;flex-wrap:wrap;margin-bottom:4px;">
                  ${row.tiresData.length === 0 ? '<span style="font-size:11px;color:var(--muted);font-style:italic;">—</span>' : row.tiresData.map(x => `<div title="${x.t.position}: ${statusLabel(x.t.status)}" style="width:12px;height:12px;border-radius:3px;background:${x.t.removed?'#d1d5db':x.t.status==='critical'?'#e11d48':x.t.status==='warning'?'#d97706':'#10b981'};"></div>`).join('')}
                </div>
                <div style="font-size:10px;color:var(--muted);">${row.tiresData.length === 0 ? 'Belum ada data' : row.critical>0?`${row.critical} kritis`:row.warning>0?`${row.warning} peringatan`:'Semua baik'}</div>
              </td>
              <td style="padding:13px 14px;text-align:center;">
                <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:500;">${row.avgPsi}</div>
                <div style="font-size:10px;color:var(--muted);">PSI</div>
              </td>
              <td style="padding:13px 14px;text-align:center;">
                <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:500;${parseFloat(row.avgNsd)<3?'color:var(--rose)':parseFloat(row.avgNsd)<5?'color:var(--amber)':''}">${row.avgNsd}</div>
                <div style="font-size:10px;color:var(--muted);">mm</div>
              </td>
              <td style="padding:13px 14px;text-align:center;">
                ${row.tiresData.length === 0
                  ? `<span class="badge" style="background:#f3f4f6;color:var(--muted);border-color:#e5e7eb;">Belum dicek</span>`
                  : `<span class="badge ${row.overallStatus}">${statusLabel(row.overallStatus)}</span>`}
              </td>
              <td style="padding:13px 14px;text-align:center;">
                <button class="btn btn-primary" style="padding:7px 14px;font-size:12px;${!isMonTab?'background:#2563eb;box-shadow:0 4px 12px rgba(37,99,235,0.3);':''}" onclick="openMonitoringDetail('${row.v.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Detail Ban
                </button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`}
  </div>`;

  // ── Konten PELUMAS (fungsional) ────────────────────────────────────────────
  const isPelumasMon = pelumasTab === 'monitoring';
  const activeRecs   = isPelumasMon ? pelumasRecords : pelumasTrialRecords;

  // Stats
  const totalRecs   = activeRecs.length;
  const sudahGanti  = activeRecs.filter(r => r.status === 'selesai').length;
  const jadwalDekat = activeRecs.filter(r => {
    if (!r.nextServiceDate) return false;
    const diff = (new Date(r.nextServiceDate) - new Date()) / (1000*60*60*24);
    return diff >= 0 && diff <= 14;
  }).length;
  const terlambat   = activeRecs.filter(r => {
    if (!r.nextServiceDate) return false;
    return new Date(r.nextServiceDate) < new Date() && r.status !== 'selesai';
  }).length;

  function oilStatusBadge(r) {
    if (r.status === 'selesai') return `<span class="badge good">✓ Selesai</span>`;
    if (!r.nextServiceDate) return `<span class="badge" style="background:#f3f4f6;color:var(--muted);border-color:#e5e7eb;">—</span>`;
    const diff = (new Date(r.nextServiceDate) - new Date()) / (1000*60*60*24);
    if (diff < 0) return `<span class="badge critical">⚠ Terlambat</span>`;
    if (diff <= 14) return `<span class="badge warning">⏰ Segera</span>`;
    return `<span class="badge good">✓ Terjadwal</span>`;
  }

  const pelumasSubTab = `
  <div style="display:flex;gap:0;margin-bottom:24px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:5px;width:fit-content;">
    <button onclick="pelumasTab='monitoring';render()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;${isPelumasMon ? 'background:#7c3aed;color:white;box-shadow:0 4px 12px rgba(124,58,237,0.3);' : 'background:transparent;color:var(--muted);'}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Monitoring
      <span style="background:${isPelumasMon?'rgba(255,255,255,0.25)':'#f3f4f6'};color:${isPelumasMon?'white':'var(--muted)'};font-size:11px;padding:1px 7px;border-radius:20px;font-weight:700;">${pelumasRecords.length}</span>
    </button>
    <button onclick="pelumasTab='trial';render()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;${!isPelumasMon ? 'background:#7c3aed;color:white;box-shadow:0 4px 12px rgba(124,58,237,0.3);' : 'background:transparent;color:var(--muted);'}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
      Trial Pelumas
      <span style="background:${!isPelumasMon?'rgba(255,255,255,0.25)':'#f3f4f6'};color:${!isPelumasMon?'white':'var(--muted)'};font-size:11px;padding:1px 7px;border-radius:20px;font-weight:700;">${pelumasTrialRecords.length}</span>
    </button>
  </div>`;

  const pelumasStatsBar = totalRecs > 0 ? `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px;">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Catatan</div>
      <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;">${totalRecs}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:3px;">kendaraan tercatat</div>
    </div>
    <div style="background:var(--green-light);border:1px solid #a7f3d0;border-radius:16px;padding:16px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#065f46;margin-bottom:6px;">Sudah Ganti</div>
      <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#065f46;">${sudahGanti}</div>
    </div>
    <div style="background:var(--amber-light);border:1px solid #fde68a;border-radius:16px;padding:16px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#78350f;margin-bottom:6px;">Jadwal Dekat</div>
      <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#b45309;">${jadwalDekat}</div>
      <div style="font-size:11px;color:#d97706;margin-top:3px;">dalam 14 hari</div>
    </div>
    <div style="background:var(--rose-light);border:1px solid #fecdd3;border-radius:16px;padding:16px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9f1239;margin-bottom:6px;">Terlambat</div>
      <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:var(--rose);">${terlambat}</div>
    </div>
  </div>` : '';

  const pelumasTableOrEmpty = totalRecs === 0 ? `
  <div style="background:var(--surface);border:2px dashed #c4b5fd;border-radius:20px;padding:60px 40px;text-align:center;">
    <div style="width:72px;height:72px;border-radius:20px;background:#ede9fe;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
    </div>
    <div style="font-size:18px;font-weight:800;font-family:'Syne',sans-serif;color:#7c3aed;margin-bottom:8px;">Belum ada data ${isPelumasMon ? 'monitoring' : 'trial'} pelumas</div>
    <div style="font-size:14px;color:var(--muted);max-width:360px;margin:0 auto 24px;line-height:1.6;">Tambahkan data pelumas kendaraan untuk mulai memantau jadwal penggantian oli dan kondisi pelumas armada.</div>
    <button class="btn" style="background:#7c3aed;color:white;box-shadow:0 4px 12px rgba(124,58,237,0.3);" onclick="openAddPelumasModal('${isPelumasMon?'monitoring':'trial'}')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Tambah Data Pelumas
    </button>
  </div>` : `
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;">
    <div style="padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <span style="font-weight:700;font-size:14px;">Catatan Pelumas – ${isPelumasMon ? 'Monitoring' : 'Trial'}</span>
      <span style="font-size:12px;color:var(--muted);">${totalRecs} kendaraan</span>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left;padding:11px 20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Plat / Unit</th>
            <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Jenis Pelumas</th>
            <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Penggantian Terakhir</th>
            <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Jadwal Berikutnya</th>
            <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Odometer Ganti</th>
            <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Status</th>
            <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${activeRecs.map(r => `
          <tr style="border-bottom:1px solid var(--border);transition:background .12s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
            <td style="padding:13px 20px;">
              <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;">${r.plateNumber}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px;">${r.customerName}</div>
            </td>
            <td style="padding:13px 14px;">
              <div style="font-size:13px;font-weight:600;">${r.oilBrand} ${r.oilType}</div>
              <div style="font-size:11px;color:var(--muted);">SAE ${r.viscosity || '—'}</div>
            </td>
            <td style="padding:13px 14px;">
              <div style="font-size:13px;">${r.lastServiceDate ? new Date(r.lastServiceDate).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div>
            </td>
            <td style="padding:13px 14px;text-align:center;">
              <div style="font-size:13px;font-weight:600;color:${!r.nextServiceDate?'var(--muted)':new Date(r.nextServiceDate)<new Date()?'var(--rose)':(new Date(r.nextServiceDate)-new Date())<14*86400000?'var(--amber)':'var(--text)'};">${r.nextServiceDate ? new Date(r.nextServiceDate).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div>
            </td>
            <td style="padding:13px 14px;text-align:center;">
              <div style="font-family:'DM Mono',monospace;font-size:13px;">${r.odometer ? r.odometer.toLocaleString('id-ID') + ' km' : '—'}</div>
            </td>
            <td style="padding:13px 14px;text-align:center;">${oilStatusBadge(r)}</td>
            <td style="padding:13px 14px;text-align:center;">
              <button style="padding:6px 12px;background:#ede9fe;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;color:#7c3aed;font-family:'DM Sans',sans-serif;" onclick="deletePelumasRecord('${r.id}','${isPelumasMon?'monitoring':'trial'}')" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#ede9fe'">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                Hapus
              </button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  const pelumasContent = `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:4px;height:28px;background:#7c3aed;border-radius:4px;"></div>
        <div>
          <div style="font-size:16px;font-weight:800;font-family:'Syne',sans-serif;">${isPelumasMon ? 'Monitoring Pelumas' : 'Trial Pelumas'}</div>
          <div style="font-size:12px;color:var(--muted);">${isPelumasMon ? 'Pantau penggantian dan jadwal servis oli armada' : 'Uji coba merk & jenis pelumas baru pada armada'}</div>
        </div>
      </div>
      <button class="btn" style="background:#7c3aed;color:white;box-shadow:0 4px 12px rgba(124,58,237,0.3);" onclick="openAddPelumasModal('${isPelumasMon?'monitoring':'trial'}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Data Pelumas
      </button>
    </div>
    ${pelumasSubTab}
    ${pelumasStatsBar}
    ${pelumasTableOrEmpty}
  </div>`;

  return `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:14px;">
      <div>
        <div class="page-title">Monitoring & Trial</div>
        <div class="page-sub">Pantau kondisi armada — pilih kategori produk di bawah.</div>
      </div>
      <div style="font-size:12px;color:var(--muted);background:var(--surface);border:1px solid var(--border);padding:8px 16px;border-radius:12px;align-self:flex-start;">
        🕒 ${new Date().toLocaleTimeString('id-ID')}
      </div>
    </div>

    ${categoryBar}
    ${subTabBar}
    ${isBan ? banContent : pelumasContent}
  </div>`;
}


function openMonitoringDetail(vehicleId) {
  selectedVehicleId = vehicleId;
  monitoringView = 'detail';
  render();
}

function renderMonitoringDetail(v) {
  // Hanya ban yang sudah ada data pengukuran
  const monitoredTires = v.tires.filter(t => !t.removed && t.measurements && t.measurements.length > 0);
  const hasData = monitoredTires.length > 0;
  return `
  <div>
    <!-- Back button + header -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;flex-wrap:wrap;">
      <button onclick="monitoringView='list';render()" style="display:inline-flex;align-items:center;gap:7px;padding:9px 16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;transition:all .15s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='var(--surface)'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Kembali ke Monitoring & Trial
      </button>
      <div>
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${v.plateNumber}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px;">${v.make} ${v.model} · ${v.customerName}</div>
      </div>
    </div>

    <!-- Vehicle info strip -->
    <div class="vehicle-hero" style="margin-bottom:20px;">
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${v.picNumber ? `<span class="meta-chip"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.46 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><strong>PIC:</strong> ${v.picNumber}</span>` : ''}
        ${v.salesCompany ? `<span class="meta-chip" style="background:#fff7ed;border-color:#fed7aa;color:#92400e;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><strong>Sales:</strong> ${v.salesCompany}</span>` : ''}
        <span class="meta-chip"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><strong>${v.tonnage} Ton</strong></span>
        ${v.installDate ? `<span class="meta-chip"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><strong>Pasang:</strong> ${v.installDate}</span>` : ''}
        <span class="meta-chip" style="background:${monitoredTires.length === 0 ? '#f3f4f6' : monitoredTires.some(t=>t.status==='critical')?'var(--rose-light)':monitoredTires.some(t=>t.status==='warning')?'var(--amber-light)':'var(--green-light)'};color:${monitoredTires.length === 0 ? 'var(--muted)' : monitoredTires.some(t=>t.status==='critical')?'#9f1239':monitoredTires.some(t=>t.status==='warning')?'#78350f':'#065f46'};">
          ${monitoredTires.length === 0 ? '— Belum ada data ban' : monitoredTires.filter(t=>t.status==='critical').length > 0 ? `⚠ ${monitoredTires.filter(t=>t.status==='critical').length} kritis` : monitoredTires.filter(t=>t.status==='warning').length > 0 ? `⚡ ${monitoredTires.filter(t=>t.status==='warning').length} peringatan` : '✓ Semua ban baik'}
        </span>
      </div>
    </div>

    <!-- Tire cards grid — hanya ban yang ada data -->
    ${monitoredTires.length === 0
      ? `<div class="card" style="padding:40px;text-align:center;color:var(--muted);">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;display:block;opacity:.4;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
           <div style="font-size:14px;font-weight:600;margin-bottom:4px;">Belum Ada Data Pengecekan</div>
           <div style="font-size:12px;">Lakukan input pengecekan ban untuk kendaraan ini.</div>
         </div>`
      : `<div class="tires-grid" style="margin-bottom:20px;">${monitoredTires.map(t => renderTireCard(t)).join('')}</div>`
    }

    ${hasData ? `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Riwayat Tekanan – ${monitoredTires[0].position}</span>
        <span style="font-size:11px;font-weight:700;color:var(--green);background:var(--green-light);padding:3px 10px;border-radius:20px;">Real-time</span>
      </div>
      <div style="padding:20px;">
        <div class="chart-wrap"><canvas id="pressure-chart"></canvas></div>
      </div>
    </div>` : ''}
  </div>`;
}



// ====== ALERTS PAGE ======
function getLastCheckDate(v) {
  let latest = null;
  v.tires.forEach(t => t.measurements.forEach(m => {
    const d = new Date(m.timestamp);
    if (!latest || d > latest) latest = d;
  }));
  return latest;
}

function renderAlerts() {
  // ── SALES: tampilkan halaman notifikasi khusus Sales ──────────────────────
  if (currentUser.role === 'sales' || currentUser.role === 'sales_counter') return renderAlertsSales();

  // ── NON-SALES: halaman peringatan standar ─────────────────────────────────
  const MS_45_DAYS = 45 * 24 * 60 * 60 * 1000;
  const now = new Date();

  // Ban kritis/peringatan — cek dari latest measurement (real-time)
  const tireAlerts = [];
  [...vehicles, ...trialVehicles].forEach(v => {
    v.tires.forEach(t => {
      if (t.removed) return;
      if (!t.measurements || t.measurements.length === 0) return;
      const latest = t.measurements[t.measurements.length - 1];
      const liveStatus = latest
        ? getTireStatus(latest.pressure, latest.treadDepth)
        : t.status;
      if (liveStatus === 'critical' || liveStatus === 'warning') {
        // Identifikasi penyebab spesifik
        const reasons = [];
        if (latest) {
          if (latest.pressure < 26) reasons.push({ type: 'pressure', severity: 'critical', label: 'Tekanan sangat rendah', val: latest.pressure + ' PSI' });
          else if (latest.pressure < 28) reasons.push({ type: 'pressure', severity: 'warning', label: 'Tekanan rendah', val: latest.pressure + ' PSI' });
          else if (latest.pressure > 120) reasons.push({ type: 'pressure', severity: 'warning', label: 'Tekanan berlebih', val: latest.pressure + ' PSI' });
          if (latest.treadDepth < 2) reasons.push({ type: 'tread', severity: 'critical', label: 'Alur ban kritis', val: latest.treadDepth + ' mm' });
          else if (latest.treadDepth < 3) reasons.push({ type: 'tread', severity: 'warning', label: 'Alur ban tipis', val: latest.treadDepth + ' mm' });
        }
        tireAlerts.push({ v, t, latest, liveStatus, reasons });
      }
    });
  });

  // Kendaraan overdue update >45 hari (gabungan monitoring + trial)
  const allV = [...vehicles, ...trialVehicles];
  const overdueAlerts = allV.map(v => {
    const lastCheck = getLastCheckDate(v);
    if (lastCheck) {
      const diffMs = now - lastCheck;
      return { v, lastCheck, diffDays: Math.floor(diffMs / (1000 * 60 * 60 * 24)) };
    }
    // Belum pernah dicek — overdue hanya jika sudah terdaftar >45 hari
    const installMs = v.installDate ? (now - new Date(v.installDate)) : 0;
    const diffDays = Math.floor(installMs / (1000 * 60 * 60 * 24));
    return { v, lastCheck: null, diffDays };
  }).filter(x => x.diffDays > 45).sort((a,b) => b.diffDays - a.diffDays);

  const totalAlerts = tireAlerts.length + overdueAlerts.length;

  // ── Section: Ban kritis/peringatan ─────────────────────────────────────────
  const tireSectionHTML = `
  <div style="margin-bottom:28px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <div style="width:4px;height:22px;background:var(--rose);border-radius:4px;"></div>
      <div style="font-size:14px;font-weight:800;font-family:'Syne',sans-serif;">Kondisi Ban</div>
      <span style="font-size:11px;font-weight:700;background:var(--rose-light);color:#9f1239;padding:2px 10px;border-radius:20px;border:1px solid #fecdd3;">${tireAlerts.length} ban</span>
    </div>
    ${tireAlerts.length === 0
      ? `<div style="background:var(--surface);border:1.5px dashed #d1fae5;border-radius:18px;padding:28px;text-align:center;color:var(--muted);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5" style="margin-bottom:8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div style="font-size:13px;font-weight:600;color:#065f46;">Semua ban dalam kondisi baik</div>
         </div>`
      : tireAlerts.map(({v, t, latest, liveStatus, reasons}) => {
          const isInTrialV = trialVehicles.some(x => x.id === v.id);
          return `<div class="alert-card ${liveStatus}" style="margin-bottom:12px;">
            <div class="alert-icon ${liveStatus}">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
                <span style="font-family:'DM Mono',monospace;font-weight:700;font-size:14px;">${v.plateNumber}</span>
                <span style="color:var(--muted);">•</span>
                <span style="font-size:13px;color:var(--muted);">${v.customerName}</span>
                <span style="font-size:10px;font-weight:700;background:${isInTrialV?'#dbeafe':'#f3f4f6'};color:${isInTrialV?'#1d4ed8':'var(--muted)'};padding:2px 8px;border-radius:20px;">${isInTrialV?'Trial':'Monitoring'}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span style="font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);">${t.position}</span>
                <span class="badge ${liveStatus}">${statusLabel(liveStatus)}</span>
                ${reasons.map(r => `<span style="font-size:11px;font-weight:700;background:${r.severity==='critical'?'var(--rose-light)':'var(--amber-light)'};color:${r.severity==='critical'?'#be123c':'#78350f'};padding:2px 9px;border-radius:20px;border:1px solid ${r.severity==='critical'?'#fecdd3':'#fde68a'};">⚠ ${r.label}: ${r.val}</span>`).join('')}
              </div>
            </div>
            <div class="alert-metrics">
              <div style="text-align:center;">
                <div class="alert-metric-label">Tekanan</div>
                <div class="alert-metric-val" style="${latest&&latest.pressure<26?'color:var(--rose)':latest&&latest.pressure<28?'color:var(--amber)':latest&&latest.pressure>120?'color:var(--amber)':''};">${latest?.pressure ?? '--'} <span style="font-size:11px;color:var(--muted);">PSI</span></div>
              </div>
              <div style="text-align:center;">
                <div class="alert-metric-label">Alur</div>
                <div class="alert-metric-val" style="${latest&&latest.treadDepth<2?'color:var(--rose)':latest&&latest.treadDepth<3?'color:var(--amber)':''};">${latest?.treadDepth ?? '--'} <span style="font-size:11px;color:var(--muted);">mm</span></div>
              </div>
            </div>
            <button class="btn btn-primary" onclick="selectVehicle('${v.id}');navigate('monitoring')" style="${isInTrialV?'background:#2563eb;box-shadow:0 4px 12px rgba(37,99,235,0.3);':''}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Periksa
            </button>
          </div>`;
        }).join('')}
  </div>`;

  // ── Section: Update telat ──────────────────────────────────────────────────
  const overdueSectionHTML = `
  <div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <div style="width:4px;height:22px;background:#ea580c;border-radius:4px;"></div>
      <div style="font-size:14px;font-weight:800;font-family:'Syne',sans-serif;">Update Terlambat</div>
      <span style="font-size:11px;font-weight:700;background:#fff7ed;color:#c2410c;padding:2px 10px;border-radius:20px;border:1px solid #fed7aa;">${overdueAlerts.length} kendaraan · batas 45 hari</span>
    </div>
    ${overdueAlerts.length === 0
      ? `<div style="background:var(--surface);border:1.5px dashed #d1fae5;border-radius:18px;padding:28px;text-align:center;color:var(--muted);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div style="font-size:13px;font-weight:600;color:#065f46;">Semua kendaraan update tepat waktu</div>
         </div>`
      : overdueAlerts.map(({ v, lastCheck, diffDays }) => {
          const isInTrial = trialVehicles.some(x => x.id === v.id);
          const lastStr = lastCheck
            ? lastCheck.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})
            : 'Belum pernah';
          return `
          <div class="alert-card warning" style="margin-bottom:12px;border-color:#fed7aa;background:rgba(255,247,237,0.5);">
            <div class="alert-icon" style="background:#fff7ed;color:#ea580c;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap;">
                <span style="font-family:'DM Mono',monospace;font-weight:700;font-size:14px;">${v.plateNumber}</span>
                <span style="font-size:10px;font-weight:700;background:${isInTrial?'#dbeafe':'#f3f4f6'};color:${isInTrial?'#1d4ed8':'var(--muted)'};padding:2px 8px;border-radius:20px;">${isInTrial?'Trial':'Monitoring'}</span>
              </div>
              <div style="font-size:12px;color:var(--muted);">${v.make} ${v.model} · <strong style="color:var(--text);">${v.customerName}</strong></div>
              <div style="font-size:11px;color:var(--muted);margin-top:4px;display:flex;align-items:center;gap:4px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Cek terakhir: ${lastStr}
              </div>
            </div>
            <div style="text-align:center;padding:0 20px;border-left:1px solid var(--border);">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#c2410c;margin-bottom:4px;">Telat</div>
              <div style="font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:#ea580c;line-height:1;">${diffDays}</div>
              <div style="font-size:11px;color:#c2410c;">hari</div>
            </div>
            <button class="btn" style="background:#fff7ed;color:#c2410c;border:1.5px solid #fed7aa;white-space:nowrap;" onclick="selectVehicle('${v.id}');navigate('monitoring')" onmouseover="this.style.background='#fed7aa'" onmouseout="this.style.background='#fff7ed'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Update Sekarang
            </button>
          </div>`;
        }).join('')}
  </div>`;

  const isAllClear = totalAlerts === 0;
  const isApprover = currentUser.role === 'administrator' || currentUser.role === 'supervisor';
  const pendingSubmissions = CLAIMS.filter(c => c.needsApproval && c.status === 'Pending');

  // Summary cards termasuk counter pengajuan pending
  const summaryCards = `
  <div style="display:flex;gap:10px;flex-wrap:wrap;">
    <div style="padding:10px 16px;background:var(--rose-light);border:1px solid #fecdd3;border-radius:14px;text-align:center;">
      <div style="font-size:10px;font-weight:700;color:var(--rose);text-transform:uppercase;">Ban Kritis</div>
      <div style="font-size:22px;font-weight:700;color:#9f1239;font-family:'DM Mono',monospace;">${tireAlerts.filter(a=>a.liveStatus==='critical').length}</div>
    </div>
    <div style="padding:10px 16px;background:var(--amber-light);border:1px solid #fde68a;border-radius:14px;text-align:center;">
      <div style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase;">Ban Peringatan</div>
      <div style="font-size:22px;font-weight:700;color:#78350f;font-family:'DM Mono',monospace;">${tireAlerts.filter(a=>a.liveStatus==='warning').length}</div>
    </div>
    <div style="padding:10px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;text-align:center;">
      <div style="font-size:10px;font-weight:700;color:#c2410c;text-transform:uppercase;">Update Telat</div>
      <div style="font-size:22px;font-weight:700;color:#c2410c;font-family:'DM Mono',monospace;">${overdueAlerts.length}</div>
    </div>
    ${isApprover && pendingSubmissions.length > 0 ? `<div style="padding:10px 16px;background:#fef3c7;border:2px solid #fde68a;border-radius:14px;text-align:center;">
      <div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;">Perlu Approval</div>
      <div style="font-size:22px;font-weight:700;color:#d97706;font-family:'DM Mono',monospace;">${pendingSubmissions.length}</div>
    </div>` : ''}
  </div>`;

  // Section: Pengajuan Klaim Menunggu Persetujuan (khusus admin/supervisor)
  const pendingClaimSectionHTML = isApprover && pendingSubmissions.length > 0 ? (() => {
    return '<div style="margin-bottom:28px;">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">' +
        '<div style="width:4px;height:22px;background:linear-gradient(180deg,#d97706,#f59e0b);border-radius:4px;"></div>' +
        '<div style="font-size:14px;font-weight:800;font-family:Syne,sans-serif;">Pengajuan Klaim — Menunggu Persetujuan</div>' +
        '<span style="font-size:11px;font-weight:700;background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:20px;border:1px solid #fde68a;">' + pendingSubmissions.length + ' pengajuan</span>' +
        '<span style="font-size:10px;font-weight:700;background:#ede9fe;color:#5b21b6;padding:2px 8px;border-radius:20px;border:1px solid #c4b5fd;">Admin / Supervisor</span>' +
      '</div>' +
      '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:10px 16px;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
        '<span style="font-size:12px;color:#92400e;">Pengajuan berikut dikirim oleh tim <strong>Sales</strong>. <strong>Setujui</strong> untuk melanjutkan ke proses klaim (In Progress), atau <strong>Tolak</strong> jika tidak memenuhi syarat.</span>' +
      '</div>' +
      pendingSubmissions.map(function(c) {
        var subTime = c.submittedAt ? new Date(c.submittedAt).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : c.date;
        var brandHTML = c.brand ? '<div style="font-size:11px;color:var(--muted);margin-bottom:2px;">&#128295; ' + c.brand + '</div>' : '';
        var notesHTML = c.notes ? '<div style="font-size:11px;color:var(--muted);font-style:italic;margin-bottom:2px;">&#128221; ' + c.notes + '</div>' : '';
        return '<div style="background:var(--surface);border:1.5px solid #fde68a;border-radius:18px;padding:20px 22px;margin-bottom:12px;display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;box-shadow:0 2px 12px rgba(217,119,6,0.08);">' +
          '<div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>' +
          '</div>' +
          '<div style="flex:1;min-width:200px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;">' +
              '<span style="font-family:DM Mono,monospace;font-weight:700;font-size:12px;color:#92400e;">' + c.ticket + '</span>' +
              '<span style="font-family:DM Mono,monospace;font-weight:700;font-size:14px;">' + c.plate + '</span>' +
              '<span style="font-size:10px;font-weight:700;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:20px;border:1px solid #fde68a;">Pending</span>' +
            '</div>' +
            '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px;">' + c.customer + '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:5px;">' +
              '<span style="font-size:11px;background:#f3f4f6;padding:2px 8px;border-radius:8px;color:var(--muted);">' + c.pos + '</span>' +
              '<span style="font-size:11px;color:var(--muted);">&middot;</span>' +
              '<span style="font-size:11px;color:var(--muted);">' + c.reason + '</span>' +
            '</div>' +
            brandHTML + notesHTML +
            '<div style="font-size:10px;color:var(--muted);display:flex;align-items:center;gap:4px;margin-top:5px;">' +
              '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' +
              'Diajukan oleh <strong style="color:var(--text);">' + (c.submittedBy || 'Sales') + '</strong> &middot; ' + subTime +
            '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;flex-shrink:0;">' +
            '<button onclick="approvePengajuanKlaim(&quot;' + c.id + '&quot;)" style="display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:#059669;color:white;box-shadow:0 3px 10px rgba(5,150,105,0.3);font-family:DM Sans,sans-serif;transition:all .15s;white-space:nowrap;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Setujui' +
            '</button>' +
            '<button onclick="tolakPengajuanKlaim(&quot;' + c.id + '&quot;)" style="display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1.5px solid #fecdd3;background:var(--rose-light);color:#9f1239;font-family:DM Sans,sans-serif;transition:all .15s;white-space:nowrap;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Tolak' +
            '</button>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  })() : ''

  return `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="page-title">Pemberitahuan Peringatan</div>
        <div class="page-sub">Ban kritis/peringatan, keterlambatan update, dan pengajuan klaim.</div>
      </div>
      ${summaryCards}
    </div>

    ${pendingClaimSectionHTML}

    ${isAllClear ? `
    <div class="empty-state" style="background:var(--surface);border-radius:24px;border:2px dashed #a7f3d0;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <p style="font-size:15px;font-weight:600;color:#065f46;margin-top:8px;">Semua Aman!</p>
      <p style="margin-top:4px;">Tidak ada peringatan ban maupun keterlambatan update.</p>
    </div>` : `
    ${tireSectionHTML}
    ${overdueSectionHTML}
    `}
  </div>`;
}

// ====== ALERTS: SALES VIEW ======
function markSalesNotifRead(id) {
  SALES_NOTIFICATIONS = SALES_NOTIFICATIONS.map(n => n.id === id ? { ...n, read: true } : n);
  const notif = SALES_NOTIFICATIONS.find(n => n.id === id);
  if (notif) supaUpsertNotif(notif);
  updateNotifCount();
  render();
}
function markAllSalesNotifRead() {
  SALES_NOTIFICATIONS = SALES_NOTIFICATIONS.map(n =>
    n.submittedBy === currentUser.id ? { ...n, read: true } : n
  );
  SALES_NOTIFICATIONS.filter(n => n.submittedBy === currentUser.id).forEach(n => supaUpsertNotif(n));
  updateNotifCount();
  render();
}

function renderAlertsSales() {
  const allMyNotifs = SALES_NOTIFICATIONS.filter(n => n.submittedBy === currentUser.id);
  const myNotifs = allMyNotifs.filter(n => !n.read);
  const unread   = myNotifs.length;

  const typeIcon = t => {
    if (t === 'duty')       return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    if (t === 'claim')      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    if (t === 'monitoring') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>';
  };

  const typeLabel = t => ({
    duty: 'Dinas Luar Kota', claim: 'Pengajuan Klaim',
    monitoring: 'Monitoring', trial: 'Trial',
  })[t] || t;

  const typeColor = t => ({
    duty:       { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
    claim:      { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    monitoring: { bg: 'var(--green-light)', color: '#065f46', border: '#a7f3d0' },
    trial:      { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  })[t] || { bg: '#f3f4f6', color: 'var(--muted)', border: 'var(--border)' };

  const statusBadge = s => {
    if (s === 'Approved') return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Disetujui</span>';
    if (s === 'Rejected') return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;background:var(--rose-light);color:#9f1239;border:1px solid #fecdd3;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Ditolak</span>';
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;">⏳ Menunggu</span>';
  };

  const fmtDate = d => new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

  const sorted = [...myNotifs].sort((a, b) => new Date(b.date) - new Date(a.date));

  const notifCards = sorted.length === 0
    ? `<div class="empty-state" style="background:var(--surface);border-radius:24px;border:2px dashed var(--border);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <p style="font-size:14px;font-weight:600;color:var(--muted);margin-top:8px;">Semua notifikasi telah dibaca ✓</p>
        <p style="margin-top:4px;font-size:12px;">Tidak ada notifikasi baru. Notifikasi baru akan muncul otomatis.</p>
       </div>`
    : sorted.map(n => {
        const tc = typeColor(n.type);
        const isDecided = n.status === 'Approved' || n.status === 'Rejected';
        return `<div onclick="markSalesNotifRead('${n.id}')" style="
          background:var(--surface);
          border:1.5px solid ${n.read ? 'var(--border)' : (n.status === 'Approved' ? '#a7f3d0' : n.status === 'Rejected' ? '#fecdd3' : '#fde68a')};
          border-radius:18px;padding:18px 20px;margin-bottom:12px;
          display:flex;align-items:flex-start;gap:16px;
          cursor:pointer;
          opacity:1;
          transition:all .15s;
          box-shadow:0 2px 12px rgba(0,0,0,0.06);
          position:relative;overflow:hidden;">
          ${!n.read ? `<div style="position:absolute;top:0;left:0;bottom:0;width:4px;background:${n.status === 'Approved' ? '#059669' : n.status === 'Rejected' ? '#e11d48' : '#d97706'};border-radius:4px 0 0 4px;"></div>` : ''}
          <div style="margin-left:${!n.read ? '4px' : '0'};width:44px;height:44px;border-radius:14px;background:${tc.bg};border:1px solid ${tc.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${tc.color};">
            ${typeIcon(n.type)}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;">
              <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;padding:2px 8px;border-radius:20px;background:${tc.bg};color:${tc.color};border:1px solid ${tc.border};">${typeLabel(n.type)}</span>
              ${statusBadge(n.status)}
              ${!n.read ? '<span style="width:8px;height:8px;border-radius:50%;background:#e11d48;flex-shrink:0;display:inline-block;"></span>' : ''}
            </div>
            <div style="font-size:14px;font-weight:${n.read ? '600' : '800'};color:var(--text);margin-bottom:4px;">${n.title}</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">${n.desc}</div>
            ${isDecided && n.note ? `<div style="font-size:12px;padding:8px 12px;background:${n.status === 'Approved' ? 'var(--green-light)' : 'var(--rose-light)'};border-radius:10px;color:${n.status === 'Approved' ? '#065f46' : '#9f1239'};border:1px solid ${n.status === 'Approved' ? '#a7f3d0' : '#fecdd3'};display:flex;align-items:flex-start;gap:7px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Catatan: ${n.note}</span>
            </div>` : (n.status === 'Pending' ? `<div style="font-size:12px;color:var(--muted);font-style:italic;">⏳ ${n.note}</div>` : '')}
            <div style="font-size:11px;color:var(--muted);margin-top:8px;display:flex;align-items:center;gap:4px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${fmtDate(n.date)}

            </div>
          </div>
        </div>`;
      }).join('');

  // Summary chips
  const approvedCount  = allMyNotifs.filter(n => n.status === 'Approved').length;
  const rejectedCount  = allMyNotifs.filter(n => n.status === 'Rejected').length;
  const pendingCount   = allMyNotifs.filter(n => n.status === 'Pending').length;

  return `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="page-title">Notifikasi Saya</div>
        <div class="page-sub">Status pengajuan dinas, klaim, monitoring, dan trial yang Anda ajukan.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${approvedCount > 0 ? `<div style="padding:8px 14px;background:var(--green-light);border:1px solid #a7f3d0;border-radius:14px;text-align:center;">
            <div style="font-size:9px;font-weight:800;text-transform:uppercase;color:#065f46;">Disetujui</div>
            <div style="font-size:20px;font-weight:800;color:#059669;font-family:'DM Mono',monospace;">${approvedCount}</div>
          </div>` : ''}
          ${rejectedCount > 0 ? `<div style="padding:8px 14px;background:var(--rose-light);border:1px solid #fecdd3;border-radius:14px;text-align:center;">
            <div style="font-size:9px;font-weight:800;text-transform:uppercase;color:#9f1239;">Ditolak</div>
            <div style="font-size:20px;font-weight:800;color:#e11d48;font-family:'DM Mono',monospace;">${rejectedCount}</div>
          </div>` : ''}
          ${pendingCount > 0 ? `<div style="padding:8px 14px;background:#fef3c7;border:1px solid #fde68a;border-radius:14px;text-align:center;">
            <div style="font-size:9px;font-weight:800;text-transform:uppercase;color:#92400e;">Menunggu</div>
            <div style="font-size:20px;font-weight:800;color:#d97706;font-family:'DM Mono',monospace;">${pendingCount}</div>
          </div>` : ''}
        </div>
        ${unread > 0 ? `<button onclick="markAllSalesNotifRead()" style="display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-family:'DM Sans',sans-serif;transition:all .15s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='var(--surface)'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Tandai Semua Dibaca
        </button>` : ''}
      </div>
    </div>

    ${unread > 0 ? `<div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;margin-bottom:20px;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span style="font-size:12px;font-weight:700;color:#92400e;">Anda memiliki <strong>${unread}</strong> notifikasi belum dibaca — klik kartu untuk menandai sudah dibaca.</span>
    </div>` : ''}

    ${notifCards}
  </div>`;
}

// ====== CURRENT USER ======
let currentUser = { username: 'taseklusive1', name: 'Administrator 1', role: 'administrator', avatar: 'A', avatarColor: '#7c3aed' };

function canEditClaim() {
  return currentUser.role === 'administrator' || currentUser.role === 'supervisor';
}
function isViewerOnly() {
  return currentUser.role === 'viewer';
}

// ====== CLAIMS ======
// ====== CLAIMS DATA ======
let CLAIMS = [
];

let claimActiveTab    = 'proses'; // 'proses' | 'hasil'
let claimProcessQuery = '';
let claimResultQuery  = '';

function claimStatusStyle(s) {
  if (s==='Pending')     return 'background:#fef3c7;color:#92400e;border-color:#fde68a;';
  if (s==='In Progress') return 'background:#dbeafe;color:#1e3a8a;border-color:#bfdbfe;';
  if (s==='Approved')    return 'background:#d1fae5;color:#064e3b;border-color:#a7f3d0;';
  return 'background:var(--rose-light);color:#9f1239;border-color:#fecdd3;';
}

function renderClaims() {
  const roleLabel = { administrator:'Administrator', supervisor:'Supervisor', technical_support:'Technical Support', sales:'Sales', sales_counter:'Sales Counter', viewer:'Viewer' };
  const now      = new Date();
  const MS_7DAYS = 7 * 24 * 60 * 60 * 1000;
  const canEdit  = canEditClaim();

  const prosesData  = CLAIMS.filter(c => c.status === 'Pending' || c.status === 'In Progress');
  const hasilData   = CLAIMS.filter(c => c.status === 'Approved' || c.status === 'Rejected');
  const hasilRecent = hasilData.filter(c => c.resolvedDate && (now - new Date(c.resolvedDate)) <= MS_7DAYS);

  const qProses = claimProcessQuery.toLowerCase();
  const filteredProses = qProses
    ? prosesData.filter(c => c.ticket.toLowerCase().includes(qProses) || c.plate.toLowerCase().includes(qProses) || c.customer.toLowerCase().includes(qProses) || c.reason.toLowerCase().includes(qProses))
    : prosesData;
  const filteredHasil = claimResultQuery.trim()
    ? hasilData.filter(c => c.ticket.toLowerCase().includes(claimResultQuery.toLowerCase()) || c.plate.toLowerCase().includes(claimResultQuery.toLowerCase()) || c.customer.toLowerCase().includes(claimResultQuery.toLowerCase()))
    : hasilRecent;

  const tabStyle = (active) => active
    ? 'background:var(--green);color:white;border-color:var(--green);box-shadow:0 4px 12px rgba(5,150,105,0.3);'
    : 'background:var(--surface);color:var(--muted);border-color:var(--border);';

  // ── Stats bar ─────────────────────────────────────────────────────────────
  const statsBar = `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:12px;margin-bottom:24px;">
    <div class="card" style="padding:16px;"><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Total Klaim</div><div style="font-size:24px;font-family:'DM Mono',monospace;font-weight:500;">${CLAIMS.length}</div></div>
    <div class="card" style="padding:16px;"><div style="font-size:10px;font-weight:700;color:#b45309;text-transform:uppercase;margin-bottom:4px;">Pending</div><div style="font-size:24px;font-family:'DM Mono',monospace;font-weight:500;">${CLAIMS.filter(c=>c.status==='Pending').length}</div></div>
    <div class="card" style="padding:16px;"><div style="font-size:10px;font-weight:700;color:var(--blue);text-transform:uppercase;margin-bottom:4px;">Diproses</div><div style="font-size:24px;font-family:'DM Mono',monospace;font-weight:500;">${CLAIMS.filter(c=>c.status==='In Progress').length}</div></div>
    <div class="card" style="padding:16px;"><div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;margin-bottom:4px;">Disetujui</div><div style="font-size:24px;font-family:'DM Mono',monospace;font-weight:500;">${CLAIMS.filter(c=>c.status==='Approved').length}</div></div>
    <div class="card" style="padding:16px;"><div style="font-size:10px;font-weight:700;color:var(--rose);text-transform:uppercase;margin-bottom:4px;">Ditolak</div><div style="font-size:24px;font-family:'DM Mono',monospace;font-weight:500;">${CLAIMS.filter(c=>c.status==='Rejected').length}</div></div>
  </div>`;

  // ── Tab switcher ──────────────────────────────────────────────────────────
  const tabBar = `
  <div style="display:flex;gap:0;margin-bottom:24px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:5px;width:fit-content;">
    <button onclick="claimActiveTab='proses';render()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;${tabStyle(claimActiveTab==='proses')}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
      Proses Klaim
      <span style="background:${claimActiveTab==='proses'?'rgba(255,255,255,0.25)':'#f3f4f6'};color:${claimActiveTab==='proses'?'white':'var(--muted)'};font-size:11px;padding:1px 7px;border-radius:20px;font-weight:700;">${prosesData.length}</span>
    </button>
    <button onclick="claimActiveTab='hasil';render()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;${tabStyle(claimActiveTab==='hasil')}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      Hasil Klaim
      <span style="background:${claimActiveTab==='hasil'?'rgba(255,255,255,0.25)':'#f3f4f6'};color:${claimActiveTab==='hasil'?'white':'var(--muted)'};font-size:11px;padding:1px 7px;border-radius:20px;font-weight:700;">${hasilData.length}</span>
    </button>
  </div>`;

  // ── Status pill options (for dropdown) ────────────────────────────────────
  const statusOptions = [
    { val:'Pending',     label:'Pending',      dot:'#d97706', dotBg:'#fef3c7' },
    { val:'In Progress', label:'In Progress',   dot:'#1d4ed8', dotBg:'#dbeafe' },
    { val:'Approved',    label:'Approved ✓',    dot:'#059669', dotBg:'#d1fae5' },
    { val:'Rejected',    label:'Rejected ✕',    dot:'#e11d48', dotBg:'var(--rose-light)' },
  ];

  // ── Row: Proses Klaim ─────────────────────────────────────────────────────
  function rowProses(c) {
    const statusDropdown = canEdit ? `
    <div class="claim-status-dropdown" id="dd-wrap-${c.id}">
      <button onclick="toggleClaimDropdown('${c.id}')" style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--text);white-space:nowrap;transition:all .15s;" onmouseover="this.style.borderColor='var(--green)'" onmouseout="this.style.borderColor='var(--border)'">
        <span class="badge" style="${claimStatusStyle(c.status)}border-width:1px;border-style:solid;padding:2px 8px;">${c.status}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="claim-status-menu" id="dd-menu-${c.id}">
        ${statusOptions.map(o => o.val === c.status ? '' : `
        <button class="claim-status-option" onclick="handleClaimStatusChange('${c.id}','${o.val}')">
          <span style="width:10px;height:10px;border-radius:50%;background:${o.dot};display:inline-block;flex-shrink:0;"></span>
          ${o.label}
        </button>`).join('')}
      </div>
    </div>` : `<span class="badge" style="${claimStatusStyle(c.status)}border-width:1px;border-style:solid;">${c.status}</span>`;

    return `
    <div class="claim-row" style="align-items:flex-start;">
      <div style="width:42px;height:42px;background:#f3f4f6;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap;">
          <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--muted);">${c.ticket}</span>
          <span style="font-weight:700;">${c.plate}</span>
          <span style="color:var(--muted);">•</span>
          <span style="font-size:13px;color:var(--muted);">${c.customer}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);">${c.pos} — ${c.reason}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px;display:flex;align-items:center;gap:4px;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Diajukan: ${c.date}
        </div>
      </div>
      <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        ${statusDropdown}
        ${canEdit ? `<span style="font-size:10px;color:var(--muted);">Diubah oleh ${currentUser.name}</span>` : ''}
      </div>
    </div>`;
  }

  // ── Row: Hasil Klaim ──────────────────────────────────────────────────────
  function rowHasil(c) {
    const approved = c.status === 'Approved';
    const iconBg   = approved ? 'var(--green-light)' : 'var(--rose-light)';
    const iconCol  = approved ? 'var(--green)'       : 'var(--rose)';
    const borderC  = approved ? '#a7f3d0'            : '#fecdd3';
    return `
    <div class="claim-row" style="border-color:${borderC};">
      <div style="width:42px;height:42px;background:${iconBg};border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${iconCol};">
        ${approved
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap;">
          <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--muted);">${c.ticket}</span>
          <span style="font-weight:700;">${c.plate}</span>
          <span style="color:var(--muted);">•</span>
          <span style="font-size:13px;color:var(--muted);">${c.customer}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);">${c.pos} — ${c.reason}</div>
        ${c.resolvedNote ? `<div style="margin-top:6px;font-size:12px;color:${approved?'#065f46':'#9f1239'};background:${iconBg};border:1px solid ${borderC};padding:7px 10px;border-radius:9px;line-height:1.5;">${c.resolvedNote}</div>` : ''}
        <div style="font-size:11px;color:var(--muted);margin-top:5px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="display:flex;align-items:center;gap:4px;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Diajukan: ${c.date}
          </span>
          <span style="display:flex;align-items:center;gap:4px;font-weight:700;color:${approved?'#065f46':'#9f1239'};">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Hasil: ${c.resolvedDate}
          </span>
          ${c.resolvedBy ? `<span style="display:flex;align-items:center;gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${c.resolvedBy}</span>` : ''}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <span class="badge" style="${claimStatusStyle(c.status)}border-width:1px;border-style:solid;">${c.status}</span>
      </div>
    </div>`;
  }

  // ── Tab content: Proses ───────────────────────────────────────────────────
  const prosesContent = `
  <div>
    ${canEdit ? `<div style="padding:10px 14px;background:var(--green-light);border:1px solid #a7f3d0;border-radius:12px;font-size:12px;color:#065f46;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      Anda login sebagai <strong>${currentUser.name}</strong> (${roleLabel[currentUser.role]}) — dapat mengubah status klaim.
    </div>` : `<div style="padding:10px 14px;background:var(--amber-light);border:1px solid #fde68a;border-radius:12px;font-size:12px;color:#92400e;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Login sebagai <strong>${currentUser.name}</strong> (${roleLabel[currentUser.role]}) — hanya bisa melihat data klaim.
    </div>`}
    <div style="position:relative;margin-bottom:20px;max-width:440px;">
      <span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#9ca3af;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </span>
      <input type="text" placeholder="Cari nomor tiket, plat, customer, atau alasan klaim..."
        value="${claimProcessQuery}" oninput="claimProcessQuery=this.value;render()"
        style="width:100%;padding:10px 14px 10px 40px;background:#f3f4f6;border:none;border-radius:12px;font-size:13px;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;"
        onfocus="this.style.boxShadow='0 0 0 2px var(--green)'" onblur="this.style.boxShadow='none'" />
    </div>
    ${filteredProses.length === 0
      ? `<div class="empty-state" style="padding:60px 20px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p style="margin-top:12px;">${claimProcessQuery ? 'Tidak ada hasil pencarian.' : 'Tidak ada klaim yang sedang diproses.'}</p></div>`
      : filteredProses.map(rowProses).join('')}
  </div>`;

  // ── Tab content: Hasil ────────────────────────────────────────────────────
  const hasilContent = `
  <div>
    <div style="position:relative;margin-bottom:20px;max-width:440px;">
      <span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#9ca3af;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </span>
      <input type="text" placeholder="Cari tiket, plat, atau customer untuk melihat hasil lama..."
        value="${claimResultQuery}" oninput="claimResultQuery=this.value;render()"
        style="width:100%;padding:10px 14px 10px 40px;background:#f3f4f6;border:none;border-radius:12px;font-size:13px;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;"
        onfocus="this.style.boxShadow='0 0 0 2px var(--green)'" onblur="this.style.boxShadow='none'" />
    </div>
    ${claimResultQuery.trim()
      ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 14px;background:var(--blue-light);border:1px solid #bfdbfe;border-radius:12px;font-size:12px;color:#1e40af;font-weight:600;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Menampilkan semua hasil yang cocok dengan "<strong>${claimResultQuery}</strong>" — ${filteredHasil.length} ditemukan
          <button onclick="claimResultQuery='';render()" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#1e40af;font-weight:700;font-size:12px;font-family:'DM Sans',sans-serif;">✕ Reset</button>
        </div>
        ${filteredHasil.length === 0 ? `<div class="empty-state" style="padding:60px 20px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p style="margin-top:12px;">Tidak ada hasil klaim yang cocok.</p></div>` : filteredHasil.map(rowHasil).join('')}`
      : `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 14px;background:var(--amber-light);border:1px solid #fde68a;border-radius:12px;font-size:12px;color:#92400e;font-weight:600;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Menampilkan hasil klaim <strong>7 hari terakhir</strong>. Gunakan pencarian di atas untuk melihat hasil yang lebih lama.
        </div>
        ${hasilRecent.length === 0 ? `<div class="empty-state" style="padding:60px 20px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg><p style="margin-top:12px;">Belum ada hasil klaim dalam 7 hari terakhir.</p></div>` : hasilRecent.map(rowHasil).join('')}`}
  </div>`;

  return `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="page-title">Proses Klaim Ban</div>
        <div class="page-sub">Kelola pengajuan klaim dan lihat hasil keputusan.</div>
      </div>
      ${(currentUser.role === 'sales' || currentUser.role === 'sales_counter')
        ? `<button class="btn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;box-shadow:0 4px 12px rgba(217,119,6,0.3);" onclick="openPengajuanKlaimModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Pengajuan Klaim
          </button>`
        : currentUser.role === 'viewer' ? ''
        : `<button class="btn btn-primary" onclick="alert('Fitur buat klaim baru akan segera hadir!')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Buat Klaim Baru
          </button>`
      }
    </div>
    ${statsBar}
    ${tabBar}
    ${claimActiveTab === 'proses' ? prosesContent : hasilContent}
  </div>`;
}


// ====== CLAIM STATUS MANAGEMENT ======
let _resolveClaimId  = null;
let _resolveNewStatus = null;

// Tutup semua dropdown claim yang terbuka
function closeAllClaimDropdowns() {
  document.querySelectorAll('.claim-status-menu.open').forEach(m => m.classList.remove('open'));
}

// Toggle dropdown status per baris klaim
function toggleClaimDropdown(claimId) {
  const menu = document.getElementById('dd-menu-' + claimId);
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  closeAllClaimDropdowns();
  if (!isOpen) {
    menu.classList.add('open');
    // Tutup saat klik di luar
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        const wrap = document.getElementById('dd-wrap-' + claimId);
        if (wrap && !wrap.contains(e.target)) {
          menu.classList.remove('open');
          document.removeEventListener('click', handler);
        }
      });
    }, 0);
  }
}

// Dipanggil saat user memilih status baru dari dropdown
function handleClaimStatusChange(claimId, newStatus) {
  closeAllClaimDropdowns();
  if (!canEditClaim()) return;

  const claim = CLAIMS.find(c => c.id === claimId);
  if (!claim) return;

  _resolveClaimId   = claimId;
  _resolveNewStatus = newStatus;

  const isFinal = newStatus === 'Approved' || newStatus === 'Rejected';

  // Isi info modal
  document.getElementById('resolve-claim-info').innerHTML =
    '<strong>' + claim.ticket + '</strong> &nbsp;·&nbsp; ' + claim.plate + '<br>' +
    '<span style="color:var(--muted);">' + claim.customer + ' — ' + claim.pos + '</span><br>' +
    '<span style="color:var(--muted);">' + claim.reason + '</span>';

  // Badge status baru
  const badgeStyles = {
    'Pending':     'background:#fef3c7;color:#92400e;border-color:#fde68a;',
    'In Progress': 'background:#dbeafe;color:#1e3a8a;border-color:#bfdbfe;',
    'Approved':    'background:#d1fae5;color:#064e3b;border-color:#a7f3d0;',
    'Rejected':    'background:var(--rose-light);color:#9f1239;border-color:#fecdd3;',
  };
  const badge = document.getElementById('resolve-status-badge');
  badge.textContent = newStatus;
  badge.style.cssText += badgeStyles[newStatus] || '';

  // Judul & hint
  document.getElementById('resolve-modal-title').textContent =
    isFinal ? (newStatus === 'Approved' ? '✅ Setujui Klaim' : '❌ Tolak Klaim') : 'Ubah Status Klaim';
  document.getElementById('resolve-modal-sub').textContent =
    'Oleh: ' + currentUser.name + ' (' + currentUser.role + ')';

  const noteRequired = document.getElementById('resolve-note-required');
  const noteHint     = document.getElementById('resolve-note-hint');
  noteRequired.style.display = isFinal ? 'inline' : 'none';
  noteHint.textContent = isFinal
    ? 'Wajib diisi — catatan akan tampil di halaman Hasil Klaim.'
    : 'Opsional — catatan perubahan status ke ' + newStatus + '.';

  // Warna tombol konfirmasi sesuai status
  const confirmBtn = document.getElementById('resolve-confirm-btn');
  if (newStatus === 'Approved')    { confirmBtn.style.background = '#059669'; confirmBtn.textContent = 'Setujui Klaim'; }
  else if (newStatus === 'Rejected') { confirmBtn.style.background = '#e11d48'; confirmBtn.textContent = 'Tolak Klaim'; }
  else if (newStatus === 'In Progress') { confirmBtn.style.background = '#2563eb'; confirmBtn.textContent = 'Konfirmasi'; }
  else { confirmBtn.style.background = '#b45309'; confirmBtn.textContent = 'Konfirmasi'; }

  // Reset textarea
  document.getElementById('resolve-note-input').value = '';

  // Buka modal
  document.getElementById('resolve-modal-overlay').classList.add('open');
}

function closeResolveModal() {
  document.getElementById('resolve-modal-overlay').classList.remove('open');
  _resolveClaimId   = null;
  _resolveNewStatus = null;
}

function confirmClaimStatusChange() {
  if (!_resolveClaimId || !_resolveNewStatus) return;

  const claim    = CLAIMS.find(c => c.id === _resolveClaimId);
  if (!claim) return;

  const note     = (document.getElementById('resolve-note-input').value || '').trim();
  const isFinal  = _resolveNewStatus === 'Approved' || _resolveNewStatus === 'Rejected';

  // Validasi catatan wajib untuk hasil final
  if (isFinal && !note) {
    const ta = document.getElementById('resolve-note-input');
    ta.style.boxShadow = '0 0 0 2px var(--rose)';
    ta.focus();
    setTimeout(() => { ta.style.boxShadow = ''; }, 2000);
    return;
  }

  // Tanggal hari ini format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Update data claim
  let _uc = null;
  CLAIMS = CLAIMS.map(c => {
    if (c.id !== _resolveClaimId) return c;
    _uc = { ...c, status: _resolveNewStatus, needsApproval: false,
      resolvedDate: isFinal ? today : c.resolvedDate,
      resolvedNote: note || c.resolvedNote,
      resolvedBy: isFinal ? currentUser.name : c.resolvedBy };
    return _uc;
  });
  if (_uc) supaUpsertClaim(_uc);
  if (isFinal && _uc && _uc.submittedBy) {
    const notif = { id: 'SN-' + Date.now(), type: 'claim', status: _resolveNewStatus,
      title: _resolveNewStatus === 'Approved' ? 'Pengajuan Klaim Disetujui' : 'Pengajuan Klaim Ditolak',
      desc: (_uc.ticket||'') + ' · ' + _uc.plate + ' — ' + _uc.customer,
      note: note || (_resolveNewStatus === 'Approved' ? 'Klaim disetujui oleh ' + currentUser.name + '.' : 'Ditolak oleh ' + currentUser.name + '.'),
      submittedBy: _uc.submittedBy, date: today, read: false };
    SALES_NOTIFICATIONS.unshift(notif); supaUpsertNotif(notif);
  }
  closeResolveModal();
  if (isFinal) { claimActiveTab = 'hasil'; claimResultQuery = ''; }
  render();
}

// ====== PENGAJUAN KLAIM (SALES) ======
function openPengajuanKlaimModal() {
  document.getElementById('pk-plate').value = '';
  document.getElementById('pk-customer').value = '';
  document.getElementById('pk-pos').value = '';
  document.getElementById('pk-reason').value = '';
  document.getElementById('pk-brand').value = '';
  document.getElementById('pk-notes').value = '';
  document.getElementById('modal-pengajuan-klaim').classList.add('open');
}
function closePengajuanKlaimModal() {
  document.getElementById('modal-pengajuan-klaim').classList.remove('open');
}
function submitPengajuanKlaim() {
  var plate    = document.getElementById('pk-plate').value.trim();
  var customer = document.getElementById('pk-customer').value.trim();
  var pos      = document.getElementById('pk-pos').value;
  var reason   = document.getElementById('pk-reason').value;
  if (!plate || !customer || !pos || !reason) {
    alert('Harap isi Nomor Plat, Customer, Posisi Ban, dan Jenis Kerusakan.');
    return;
  }
  var now = new Date();
  var today = now.toISOString().split('T')[0];
  var year = now.getFullYear();
  // Generate ticket number
  var num = String(CLAIMS.length + 1).padStart(3, '0');
  var ticket = 'CLM-' + year + '-' + num + '-SALES';
  var newClaim = {
    id: 'S' + Date.now(),
    ticket: ticket,
    customer: customer,
    plate: plate.toUpperCase(),
    pos: pos,
    reason: reason,
    brand: document.getElementById('pk-brand').value.trim(),
    notes: document.getElementById('pk-notes').value.trim(),
    status: 'Pending',
    date: today,
    resolvedDate: null,
    resolvedNote: '',
    submittedBySales: true,
    submittedBy: currentUser.id,
    submittedByName: currentUser.name,
    submittedAt: now.toISOString(),
    needsApproval: true
  };
  CLAIMS.unshift(newClaim);
  supaUpsertClaim(newClaim);
  closePengajuanKlaimModal();
  render();
  // Toast
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#d97706,#b45309);color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(217,119,6,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;white-space:nowrap;';
  toast.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg> Pengajuan klaim berhasil dikirim — menunggu persetujuan';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity='0'; setTimeout(function(){toast.remove();},400); }, 3000);
}

// ====== APPROVE / TOLAK PENGAJUAN DARI ALERTS ======
function approvePengajuanKlaim(claimId) {
  if (!canEditClaim()) return;
  const claim = CLAIMS.find(c => c.id === claimId);
  const updatedClaim = Object.assign({}, claim, { status: 'In Progress', needsApproval: false, approvedBy: currentUser.name, approvedAt: new Date().toISOString() });
  CLAIMS = CLAIMS.map(function(c) { return c.id !== claimId ? c : updatedClaim; });
  supaUpsertClaim(updatedClaim);
  if (claim && claim.submittedBy) {
    const notif = { id: 'SN-' + Date.now(), type: 'claim', status: 'Approved',
      title: 'Pengajuan Klaim Disetujui',
      desc: (claim.ticket || '') + ' · ' + claim.plate + ' — ' + claim.customer,
      note: 'Klaim disetujui oleh ' + currentUser.name + '. Status klaim: In Progress.',
      submittedBy: claim.submittedBy, date: new Date().toISOString().split('T')[0], read: false };
    SALES_NOTIFICATIONS.unshift(notif); supaUpsertNotif(notif);
  }
  render();
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(5,150,105,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;white-space:nowrap;';
  toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Pengajuan disetujui — klaim masuk status In Progress';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity='0'; setTimeout(function(){toast.remove();},400); }, 2800);
}

function tolakPengajuanKlaim(claimId) {
  if (!canEditClaim()) return;
  var alasan = prompt('Masukkan alasan penolakan:');
  if (alasan === null) return;
  const claim = CLAIMS.find(c => c.id === claimId);
  const updatedClaim = Object.assign({}, claim, { status: 'Rejected', needsApproval: false, resolvedDate: new Date().toISOString().split('T')[0], resolvedNote: alasan || 'Ditolak oleh ' + currentUser.name, resolvedBy: currentUser.name });
  CLAIMS = CLAIMS.map(function(c) { return c.id !== claimId ? c : updatedClaim; });
  supaUpsertClaim(updatedClaim);
  if (claim && claim.submittedBy) {
    const notif = { id: 'SN-' + Date.now(), type: 'claim', status: 'Rejected',
      title: 'Pengajuan Klaim Ditolak',
      desc: (claim.ticket || '') + ' · ' + claim.plate + ' — ' + claim.customer,
      note: alasan || 'Ditolak oleh ' + currentUser.name + '.',
      submittedBy: claim.submittedBy, date: new Date().toISOString().split('T')[0], read: false };
    SALES_NOTIFICATIONS.unshift(notif); supaUpsertNotif(notif);
  }
  render();
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#e11d48;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(225,29,72,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;white-space:nowrap;';
  toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Pengajuan klaim ditolak';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity='0'; setTimeout(function(){toast.remove();},400); }, 2800);
}

// ====== DUTY ======
const DUTIES = [
];

// ====== SALES NOTIFICATIONS ======
// Notifikasi khusus Sales: hasil keputusan pengajuan dinas, klaim, monitoring/trial
// type: 'duty' | 'claim' | 'monitoring' | 'trial'
// status: 'Approved' | 'Rejected'
// read: false = belum dibaca (bold), true = sudah dibaca
let SALES_NOTIFICATIONS = [
];
function dutyStatusStyle(s) {
  if (s==='Planned') return 'background:#dbeafe;color:#1e3a8a;border-color:#bfdbfe;';
  if (s==='In Progress') return 'background:#fef3c7;color:#92400e;border-color:#fde68a;';
  if (s==='Completed') return 'background:#d1fae5;color:#064e3b;border-color:#a7f3d0;';
  return 'background:var(--rose-light);color:#9f1239;border-color:#fecdd3;';
}
function renderDuty() {
  return `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div><div class="page-title">Dinas Luar Kota</div><div class="page-sub">Manajemen penugasan Technical Support ke luar area operasional.</div></div>
      ${(currentUser.role === 'sales' || currentUser.role === 'sales_counter') ? `<button class="btn" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;box-shadow:0 4px 12px rgba(37,99,235,0.3);" onclick="openPengajuanDinasModal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Pengajuan Dinas Luar Kota</button>` : currentUser.role !== 'viewer' ? `<button class="btn" style="background:#2563eb;color:white;box-shadow:0 4px 12px rgba(37,99,235,0.3);" onclick="alert('Fitur tambah penugasan akan segera hadir!')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Tambah Penugasan</button>` : ''}
    </div>
    ${DUTIES.map(d => `
    <div class="claim-row" style="margin-bottom:12px;">
      <div style="width:44px;height:44px;background:#f0f9ff;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#2563eb;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;margin-bottom:2px;">${d.tech}</div>
        <div style="font-size:13px;color:var(--muted);">${d.dest} • ${d.start} s/d ${d.end}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px;">${d.purpose}</div>
      </div>
      <span class="badge" style="${dutyStatusStyle(d.status)}border-width:1px;border-style:solid;flex-shrink:0;">${d.status}</span>
    </div>`).join('')}
  </div>`;
}

// ====== CLOSING ======
function renderClosing() {
  const hist = [
    { period:'Januari 2026', date:'31 Jan 2026', user:'Admin', total:128 },
    { period:'Desember 2025', date:'31 Des 2025', user:'Admin', total:156 },
    { period:'November 2025', date:'30 Nov 2025', user:'Supervisor', total:110 },
  ];

  const closedSection = closedTires.length === 0 ? `
    <div class="empty-state" style="padding:40px 20px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      <p style="margin-top:12px;">Belum ada ban yang dilepas pada periode ini.</p>
    </div>` : closedTires.map(c => `
    <div class="closing-history-row" style="margin-bottom:10px;border:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;">
        <div style="width:44px;height:44px;background:var(--green-light);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--green);flex-shrink:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px;">
            <span style="font-family:'DM Mono',monospace;font-weight:700;font-size:13px;">${c.plateNumber}</span>
            <span style="color:var(--muted);">•</span>
            <span style="font-size:13px;font-weight:600;">${c.position}</span>
            <span style="font-size:12px;color:var(--muted);">${c.brand} ${c.model}</span>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:2px;">${c.customerName} · Dilepas: ${formatDate(c.closedAt)}</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;">
            <span style="font-size:11px;background:#f3f4f6;padding:3px 8px;border-radius:8px;font-family:'DM Mono',monospace;">${c.pressure} PSI</span>
            <span style="font-size:11px;background:#f3f4f6;padding:3px 8px;border-radius:8px;font-family:'DM Mono',monospace;">${c.treadDepth} mm NSD</span>
            ${c.odometer != null ? `<span style="font-size:11px;background:#f3f4f6;padding:3px 8px;border-radius:8px;font-family:'DM Mono',monospace;">${c.odometer.toLocaleString('id-ID')} km</span>` : ''}
          </div>
          ${c.notes ? `<div style="margin-top:7px;font-size:11px;color:var(--muted);background:#f9fafb;padding:6px 10px;border-radius:8px;border-left:3px solid var(--green);">${c.notes}</div>` : ''}
        </div>
      </div>
      <span class="badge good" style="flex-shrink:0;margin-left:12px;">Selesai</span>
    </div>`).join('');

  return `
  <div style="max-width:900px;margin:0 auto;">
    <div class="page-header"><div class="page-title">Closing Data</div><div class="page-sub">Riwayat penutupan data periode bulanan.</div></div>
    <div class="card" style="margin-bottom:24px;">
      <div style="padding:24px;border-bottom:1px solid var(--border);background:#f9fafb;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;background:var(--green-light);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--green);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <span style="font-weight:700;">Periode Aktif</span>
        </div>
        ${currentUser.role !== 'viewer' ? `<button class="btn btn-primary" onclick="alert('Closing data berhasil!')">Lakukan Closing</button>` : ''}
      </div>
      <div style="padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <span style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;">Bulan Berjalan</span>
          <span style="font-weight:700;font-size:16px;">Februari 2026</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div style="padding:14px;background:#f9fafb;border-radius:14px;border:1px solid var(--border);"><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Total Transaksi</div><div style="font-size:22px;font-family:'DM Mono',monospace;">142</div></div>
          <div style="padding:14px;background:#f9fafb;border-radius:14px;border:1px solid var(--border);"><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Ban Dilepas</div><div style="font-size:22px;font-family:'DM Mono',monospace;">${closedTires.length}</div></div>
          <div style="padding:14px;background:#f9fafb;border-radius:14px;border:1px solid var(--border);"><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Status</div><span class="badge" style="background:var(--blue-light);color:#1e3a8a;border-color:#bfdbfe;border:1px solid;">Open</span></div>
        </div>
      </div>
    </div>

    <!-- Ban Dilepas Sesi Ini -->
    <div style="font-size:16px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      Ban Dilepas – Periode Ini
      ${closedTires.length > 0 ? `<span style="background:var(--green);color:white;font-size:11px;padding:2px 8px;border-radius:20px;">${closedTires.length}</span>` : ''}
    </div>
    ${closedSection}

    <!-- Riwayat Closing Bulanan -->
    <div style="font-size:16px;font-weight:700;margin:24px 0 14px;display:flex;align-items:center;gap:8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Riwayat Closing
    </div>
    ${hist.map(h => `
    <div class="closing-history-row">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:44px;height:44px;background:#f3f4f6;border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--muted);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div>
          <div style="font-weight:700;">${h.period}</div>
          <div style="font-size:12px;color:var(--muted);">Closed on ${h.date} by ${h.user}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="text-align:right;"><div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;">Total Data</div><div style="font-weight:700;">${h.total} Records</div></div>
        <button style="padding:8px;background:none;border:none;cursor:pointer;color:var(--muted);border-radius:10px;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'" onclick="alert('Download laporan ${h.period}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>
    </div>`).join('')}
  </div>`;
}



// ====== CUSTOMER ======
let customerSearch = '';
let customerView = 'list';
let customerDetailId = null;

function renderCustomer() {
  const allVehicles = [...vehicles, ...trialVehicles];
  const customerMap = {};
  allVehicles.forEach(v => {
    const key = v.customerName ? v.customerName.trim().toLowerCase() : '';
    if (!key) return;
    if (!customerMap[key]) {
      customerMap[key] = {
        id: key,
        name: v.customerName,
        vehicles: [],
        phone: v.picNumber || '',
        salesCompany: v.salesCompany || '',
      };
    }
    customerMap[key].vehicles.push(v);
    if (!customerMap[key].phone && v.picNumber) customerMap[key].phone = v.picNumber;
    if (!customerMap[key].salesCompany && v.salesCompany) customerMap[key].salesCompany = v.salesCompany;
  });

  const customers = Object.values(customerMap).filter(cu =>
    !customerSearch || cu.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  if (customerView === 'detail' && customerDetailId) {
    const cu = customerMap[customerDetailId];
    if (!cu) { customerView = 'list'; customerDetailId = null; }
    else return renderCustomerDetail(cu);
  }

  const cards = customers.map(cu => {
    const totalTires  = cu.vehicles.reduce((s,v) => s + v.tires.filter(t => !t.removed && t.measurements && t.measurements.length > 0).length, 0);
    const criticalCnt = cu.vehicles.reduce((s,v) => s + v.tires.filter(t => t.measurements && t.measurements.length > 0 && t.status === 'critical').length, 0);
    const warningCnt  = cu.vehicles.reduce((s,v) => s + v.tires.filter(t => t.measurements && t.measurements.length > 0 && t.status === 'warning').length, 0);
    const statusColor = criticalCnt > 0 ? '#e11d48' : warningCnt > 0 ? '#d97706' : '#059669';
    const statusText  = criticalCnt > 0 ? criticalCnt + ' kritis' : warningCnt > 0 ? warningCnt + ' peringatan' : 'Semua baik';
    const initials    = cu.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    return `<div class="card" style="cursor:pointer;transition:box-shadow .15s,transform .15s;overflow:hidden;"
      onclick="customerView='detail';customerDetailId='${cu.id}';render()"
      onmouseover="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)';this.style.transform='translateY(-2px)'"
      onmouseout="this.style.boxShadow='none';this.style.transform='translateY(0)'">
      <div style="padding:20px;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
          <div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,var(--green),#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:16px;font-family:'Syne',sans-serif;flex-shrink:0;">${initials}</div>
          <div style="min-width:0;">
            <div style="font-weight:800;font-size:15px;font-family:'Syne',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cu.name}</div>
            ${cu.phone ? `<div style="font-size:12px;color:var(--muted);margin-top:2px;">📞 ${cu.phone}</div>` : ''}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
          <div style="padding:10px;background:#f9fafb;border-radius:10px;text-align:center;">
            <div style="font-size:20px;font-family:'DM Mono',monospace;font-weight:600;">${cu.vehicles.length}</div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px;">Kendaraan</div>
          </div>
          <div style="padding:10px;background:#f9fafb;border-radius:10px;text-align:center;">
            <div style="font-size:20px;font-family:'DM Mono',monospace;font-weight:600;">${totalTires}</div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px;">Total Ban</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border);">
          <span style="font-size:12px;font-weight:700;color:${statusColor};">${statusText}</span>
          ${cu.salesCompany ? `<span style="font-size:11px;color:var(--muted);background:#f3f4f6;padding:2px 8px;border-radius:8px;">💼 ${cu.salesCompany}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  const emptyState = `<div class="empty-state"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><p>Tidak ada customer ditemukan.</p></div>`;

  return `
  <div>
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:14px;">
      <div>
        <div class="page-title">Customer</div>
        <div class="page-sub">Daftar pelanggan berdasarkan data kendaraan terdaftar.</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div class="search-wrap" style="max-width:260px;">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Cari customer..." value="${customerSearch}" oninput="customerSearch=this.value;render()" />
        </div>
        <div style="font-size:13px;font-weight:700;color:var(--muted);background:var(--surface);border:1px solid var(--border);padding:8px 14px;border-radius:12px;">${customers.length} customer</div>
      </div>
    </div>
    ${customers.length === 0 ? emptyState : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">${cards}</div>`}
  </div>`;
}

function renderCustomerDetail(cu) {
  const fmt = ts => new Date(ts).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });

  const statCards = [
    { label:'Kendaraan',  val: cu.vehicles.length, color:'var(--green)', bg:'var(--green-light)' },
    { label:'Total Ban',  val: cu.vehicles.reduce((s,v) => s + v.tires.filter(t => !t.removed && t.measurements && t.measurements.length > 0).length, 0), color:'#1e40af', bg:'var(--blue-light)' },
    { label:'Kritis',     val: cu.vehicles.reduce((s,v) => s + v.tires.filter(t => t.measurements && t.measurements.length > 0 && t.status === 'critical').length, 0), color:'#9f1239', bg:'var(--rose-light)' },
    { label:'Peringatan', val: cu.vehicles.reduce((s,v) => s + v.tires.filter(t => t.measurements && t.measurements.length > 0 && t.status === 'warning').length, 0), color:'#92400e', bg:'var(--amber-light)' },
  ].map(s => `<div class="card" style="padding:16px;background:${s.bg};"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${s.color};opacity:0.7;margin-bottom:4px;">${s.label}</div><div style="font-size:26px;font-family:'DM Mono',monospace;font-weight:500;color:${s.color};">${s.val}</div></div>`).join('');

  const vehicleRows = cu.vehicles.map(v => {
    const isInTrial  = trialVehicles.some(x => x.id === v.id);
    const activeTires = v.tires.filter(t => !t.removed && t.measurements && t.measurements.length > 0);
    const bad = activeTires.filter(t => t.status !== 'good').length;
    const allMeasurements = activeTires.flatMap(t => t.measurements).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    const lastCheck = allMeasurements[0];
    const badColor = activeTires.some(t => t.status === 'critical') ? '#e11d48' : '#d97706';
    return `<div class="card" style="padding:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;cursor:pointer;transition:box-shadow .15s;"
      onclick="vehiclesView='detail';vehiclesDetailId='${v.id}';vehiclesSelectedTireId=null;navigate('vehicles')"
      onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
      <div style="width:48px;height:48px;border-radius:14px;background:${isInTrial ? 'var(--blue-light)' : 'var(--green-light)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${isInTrial ? '#1e40af' : '#059669'}" stroke-width="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px;">
          <span style="font-family:'DM Mono',monospace;font-weight:700;font-size:15px;">${v.plateNumber}</span>
          <span style="font-size:10px;font-weight:800;text-transform:uppercase;padding:2px 8px;border-radius:20px;background:${isInTrial ? 'var(--blue-light)' : 'var(--green-light)'};color:${isInTrial ? '#1e40af' : '#065f46'};border:1px solid ${isInTrial ? '#bfdbfe' : '#a7f3d0'};">${isInTrial ? 'Trial' : 'Monitoring'}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);">${v.make} ${v.model} · ${v.tonnage} Ton</div>
        ${lastCheck ? `<div style="font-size:11px;color:var(--muted);margin-top:3px;">Cek terakhir: ${fmt(lastCheck.timestamp)}</div>` : ''}
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:12px;font-weight:700;color:${bad > 0 ? badColor : '#059669'};">${bad > 0 ? bad + ' perlu perhatian' : 'Semua baik'}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${activeTires.length} ban termonitor</div>
      </div>
    </div>`;
  }).join('');

  return `
  <div style="max-width:960px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;flex-wrap:wrap;">
      <button onclick="customerView='list';customerDetailId=null;render()"
        style="display:inline-flex;align-items:center;gap:7px;padding:9px 16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;transition:all .15s;"
        onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='var(--surface)'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Kembali ke Daftar Customer
      </button>
      <div style="flex:1;">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;">${cu.name}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px;">${cu.phone ? '📞 ' + cu.phone : ''}${cu.salesCompany ? ' · 💼 ' + cu.salesCompany : ''}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:24px;">${statCards}</div>
    <div style="font-size:14px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
      Kendaraan Terdaftar
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">${vehicleRows}</div>
  </div>`;
}


// ====== USER MANAGEMENT ======
function renderUsers() {
  const roleColors = { administrator:'#7c3aed', supervisor:'#2563eb', technical_support:'#0e7490', sales:'#c2410c', sales_counter:'#9d174d', viewer:'#6b7280' };
  const roleLabels = { administrator:'Administrator', supervisor:'Supervisor', technical_support:'Technical Support', sales:'Sales', sales_counter:'Sales Counter', viewer:'Viewer' };

  const stats = {
    total: appUsers.length,
    active: appUsers.filter(u=>u.status==='active').length,
    admin: appUsers.filter(u=>u.role==='administrator').length,
  };

  return `
  <div style="max-width:960px;margin:0 auto;">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="page-title">Manajemen User</div>
        <div class="page-sub">Kelola pengguna sistem dan hak akses berdasarkan role.</div>
      </div>
      <button class="btn btn-primary" onclick="openAddUserModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah User
      </button>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px;">
      <div class="card" style="padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Total User</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;">${stats.total}</div>
      </div>
      <div class="card" style="padding:16px;background:var(--green-light);border-color:#a7f3d0;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#065f46;margin-bottom:4px;">Aktif</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#065f46;">${stats.active}</div>
      </div>
      <div class="card" style="padding:16px;background:#ede9fe;border-color:#c4b5fd;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#5b21b6;margin-bottom:4px;">Administrator</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#5b21b6;">${stats.admin}</div>
      </div>
    </div>

    <!-- Role Cards -->
    <div style="margin-bottom:24px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Konfigurasi Role & Hak Akses
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;">
        ${Object.keys(rolePerms).map(rk => {
          const perms = rolePerms[rk];
          const menuCount = Object.values(perms.menus).filter(Boolean).length;
          const actionCount = Object.values(perms.actions).filter(Boolean).length;
          const userCount = appUsers.filter(u=>u.role===rk).length;
          const chip = rk === 'administrator' ? 'administrator' : rk === 'supervisor' ? 'supervisor' : rk === 'technical_support' ? 'technical_support' : rk === 'sales' ? 'sales' : rk === 'sales_counter' ? 'sales_counter' : 'viewer';
          const colors = { administrator:'#ede9fe,#c4b5fd,#5b21b6', supervisor:'#dbeafe,#bfdbfe,#1e40af', technical_support:'#ecfeff,#a5f3fc,#0e7490', sales:'#fff7ed,#fed7aa,#c2410c', sales_counter:'#fdf2f8,#f9a8d4,#9d174d', viewer:'#f3f4f6,#e5e7eb,#6b7280' };
          const [bg,border,text] = colors[rk].split(',');
          return `
          <div class="card" style="padding:18px;background:${bg};border-color:${border};">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span class="role-chip ${chip}">${roleLabels[rk]}</span>
              <span style="font-size:11px;font-weight:700;color:${text};background:rgba(255,255,255,0.5);padding:2px 8px;border-radius:20px;">${userCount} user</span>
            </div>
            <div style="font-size:12px;color:${text};margin-bottom:12px;">
              <div style="margin-bottom:3px;">📋 ${menuCount} menu aktif</div>
              <div>⚡ ${actionCount} aksi diizinkan</div>
            </div>
            <button class="btn btn-secondary" style="width:100%;justify-content:center;font-size:12px;padding:7px 12px;" onclick="openRoleModal('${rk}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Edit Hak Akses
            </button>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- User List -->
    <div style="font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Daftar Pengguna
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${appUsers.map(u => `
      <div class="user-card">
        <div class="user-avatar-lg" style="background:${u.avatarColor};">${u.avatar}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px;">
            <span style="font-weight:700;font-size:14px;">${u.name}</span>
            <span class="role-chip ${u.role}">${roleLabels[u.role]}</span>
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);">
              <span class="status-dot ${u.status}"></span>
              ${u.status === 'active' ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <div style="font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:12px;">
            <span>@${u.username}</span>
            <span>${u.email}</span>
            ${u.phone ? `<span>📞 ${u.phone}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button onclick="openEditUserModal('${u.id}')" style="padding:8px;background:var(--blue-light);border:none;border-radius:10px;cursor:pointer;color:#1e40af;transition:all .15s;" title="Edit User" onmouseover="this.style.background='#bfdbfe'" onmouseout="this.style.background='var(--blue-light)'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          ${u.role !== 'administrator' ? `
          <button onclick="toggleUserStatus('${u.id}')" style="padding:8px;background:${u.status==='active'?'var(--amber-light)':'var(--green-light)'};border:none;border-radius:10px;cursor:pointer;color:${u.status==='active'?'#92400e':'#065f46'};transition:all .15s;" title="${u.status==='active'?'Nonaktifkan':'Aktifkan'} User">
            ${u.status==='active'
              ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
              : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`}
          </button>
          <button onclick="deleteUser('${u.id}')" style="padding:8px;background:var(--rose-light);border:none;border-radius:10px;cursor:pointer;color:#9f1239;transition:all .15s;" title="Hapus User" onmouseover="this.style.background='#fecdd3'" onmouseout="this.style.background='var(--rose-light)'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>` : `<div style="padding:8px;width:35px;"></div>`}
        </div>
      </div>`).join('')}
    </div>

    <!-- Permission Legend (Interactive) -->
    <div class="card" style="padding:20px;margin-top:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);">Legenda Hak Akses per Role</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px;display:flex;align-items:center;gap:5px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Klik sel untuk mengubah izin secara langsung. Kolom Administrator tidak dapat diubah.
          </div>
        </div>
        <button onclick="resetAllRolePerms()" class="btn btn-secondary" style="font-size:11px;padding:6px 14px;gap:5px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.79"/></svg>
          Reset Default
        </button>
      </div>
      <div style="overflow-x:auto;margin-top:12px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;" id="perm-legend-table">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 12px;background:#f9fafb;border:1px solid var(--border);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);">Menu / Aksi</th>
              ${Object.keys(rolePerms).map(rk=>{
                const roleColorMap = { administrator:'#7c3aed', supervisor:'#2563eb', technical_support:'#0e7490', sales:'#c2410c', sales_counter:'#9d174d', viewer:'#6b7280' };
                const c = roleColorMap[rk]||'#6b7280';
                return `<th style="text-align:center;padding:8px 12px;background:#f9fafb;border:1px solid var(--border);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:${c};white-space:nowrap;font-weight:800;">${roleLabels[rk]}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="${Object.keys(rolePerms).length+1}" style="padding:5px 12px;background:linear-gradient(90deg,var(--green-light),transparent);border:1px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#065f46;">📋 Akses Menu</td></tr>
            ${ALL_MENUS.map(m=>`
            <tr>
              <td style="padding:8px 12px;border:1px solid var(--border);font-weight:600;">${m.icon} ${m.label}</td>
              ${Object.keys(rolePerms).map(rk=>{
                const isAdmin = rk === 'administrator';
                const allowed = rolePerms[rk].menus[m.key];
                const onclick = isAdmin ? '' : `onclick="toggleLegendPerm('menu','${m.key}','${rk}',this)"`;
                const cursor = isAdmin ? 'default' : 'pointer';
                const title = isAdmin ? 'Administrator selalu memiliki akses penuh' : (allowed ? 'Klik untuk cabut akses ini' : 'Klik untuk beri akses ini');
                return `<td style="padding:6px 12px;border:1px solid var(--border);text-align:center;cursor:${cursor};transition:background .15s;user-select:none;" ${onclick} title="${title}" class="perm-legend-cell ${isAdmin?'admin-locked':''}">
                  ${isAdmin
                    ? `<span style="color:#059669;font-size:16px;font-weight:700;">✓</span>`
                    : allowed
                      ? `<span class="perm-badge-on" data-key="${m.key}" data-role="${rk}" data-type="menu" style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#d1fae5;border-radius:50%;border:1.5px solid #6ee7b7;transition:all .2s;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>`
                      : `<span class="perm-badge-off" data-key="${m.key}" data-role="${rk}" data-type="menu" style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#f3f4f6;border-radius:50%;border:1.5px solid #e5e7eb;transition:all .2s;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg></span>`
                  }
                </td>`;
              }).join('')}
            </tr>`).join('')}
            <tr><td colspan="${Object.keys(rolePerms).length+1}" style="padding:5px 12px;background:linear-gradient(90deg,rgba(245,158,11,0.12),transparent);border:1px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#92400e;">⚡ Izin Aksi</td></tr>
            ${ALL_ACTIONS.map(a=>`
            <tr>
              <td style="padding:8px 12px;border:1px solid var(--border);color:var(--muted);">⚡ ${a.label}</td>
              ${Object.keys(rolePerms).map(rk=>{
                const isAdmin = rk === 'administrator';
                const allowed = rolePerms[rk].actions[a.key];
                const onclick = isAdmin ? '' : `onclick="toggleLegendPerm('action','${a.key}','${rk}',this)"`;
                const cursor = isAdmin ? 'default' : 'pointer';
                const title = isAdmin ? 'Administrator selalu memiliki akses penuh' : (allowed ? 'Klik untuk cabut izin ini' : 'Klik untuk beri izin ini');
                return `<td style="padding:6px 12px;border:1px solid var(--border);text-align:center;cursor:${cursor};transition:background .15s;user-select:none;" ${onclick} title="${title}" class="perm-legend-cell ${isAdmin?'admin-locked':''}">
                  ${isAdmin
                    ? `<span style="color:#059669;font-size:16px;font-weight:700;">✓</span>`
                    : allowed
                      ? `<span class="perm-badge-on" data-key="${a.key}" data-role="${rk}" data-type="action" style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#d1fae5;border-radius:50%;border:1.5px solid #6ee7b7;transition:all .2s;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>`
                      : `<span class="perm-badge-off" data-key="${a.key}" data-role="${rk}" data-type="action" style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#f3f4f6;border-radius:50%;border:1.5px solid #e5e7eb;transition:all .2s;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg></span>`
                  }
                </td>`;
              }).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:16px;font-size:11px;color:var(--muted);">
        <span style="display:inline-flex;align-items:center;gap:5px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#d1fae5;border-radius:50%;border:1.5px solid #6ee7b7;"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span> Akses diizinkan</span>
        <span style="display:inline-flex;align-items:center;gap:5px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#f3f4f6;border-radius:50%;border:1.5px solid #e5e7eb;"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg></span> Tidak diizinkan</span>
        <span style="display:inline-flex;align-items:center;gap:5px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Terkunci (Admin)</span>
      </div>
    </div>
  </div>`;
}

// ====== SUBMISSION MODAL FUNCTIONS ======
let activeSubmissionTab = 'monitoring';

function openSubmissionModal(tab) {
  activeSubmissionTab = tab || 'monitoring';
  const fields = ['sub-m-company','sub-m-pic-name','sub-m-phone','sub-m-email','sub-m-units','sub-m-city','sub-m-notes',
   'sub-t-company','sub-t-pic-name','sub-t-phone','sub-t-email','sub-t-plate','sub-t-vehicle-model',
   'sub-t-tire-brand','sub-t-tire-model','sub-t-notes','sub-m-freq','sub-t-route'];
  fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('.sub-freq-btn,.sub-route-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('submission-success').classList.remove('show');
  document.getElementById('submission-form-state').style.display = '';
  document.getElementById('submission-footer').style.display = '';
  switchSubmissionTab(activeSubmissionTab);
  document.getElementById('modal-submission').classList.add('open');
}

function closeSubmissionModal() {
  document.getElementById('modal-submission').classList.remove('open');
}

function switchSubmissionTab(tab) {
  activeSubmissionTab = tab;
  document.querySelectorAll('.submission-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.submission-form-page').forEach(p => p.classList.remove('active'));
  document.getElementById('sub-tab-' + tab).classList.add('active');
  document.getElementById('subform-' + tab).classList.add('active');
}

function selectFreq(btn) {
  document.querySelectorAll('.sub-freq-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('sub-m-freq').value = btn.dataset.val;
}

function selectRoute(btn) {
  document.querySelectorAll('.sub-route-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('sub-t-route').value = btn.dataset.val;
}

function submitSubmission() {
  if (activeSubmissionTab === 'monitoring') {
    const company = document.getElementById('sub-m-company').value.trim();
    const pic = document.getElementById('sub-m-pic-name').value.trim();
    const phone = document.getElementById('sub-m-phone').value.trim();
    if (!company || !pic || !phone) { alert('Harap isi Nama Perusahaan, Nama PIC, dan No. Telepon.'); return; }
    document.getElementById('submission-result-badge').innerHTML = '<span class="submission-badge">✅ Monitoring — ' + company + '</span>';
    document.getElementById('submission-result-info').textContent = 'PIC: ' + pic + ' | ' + phone;
    // Simpan pengajuan monitoring ke notifikasi Sales (status Pending — akan diupdate admin)
    if (currentUser.role === 'sales' || currentUser.role === 'sales_counter') {
      SALES_NOTIFICATIONS.unshift({
        id: 'SN-' + Date.now(), type: 'monitoring', status: 'Pending',
        title: 'Pengajuan Monitoring Dikirim',
        desc: company + ' — PIC: ' + pic,
        note: 'Menunggu persetujuan dari Administrator / Supervisor.',
        submittedBy: currentUser.id,
        date: new Date().toISOString().split('T')[0], read: false,
      });
    }
  } else {
    const company = document.getElementById('sub-t-company').value.trim();
    const pic = document.getElementById('sub-t-pic-name').value.trim();
    const phone = document.getElementById('sub-t-phone').value.trim();
    if (!company || !pic || !phone) { alert('Harap isi Nama Perusahaan, Nama PIC, dan No. Telepon.'); return; }
    document.getElementById('submission-result-badge').innerHTML = '<span class="submission-badge trial">🧪 Trial — ' + company + '</span>';
    document.getElementById('submission-result-info').textContent = 'PIC: ' + pic + ' | ' + phone;
    // Simpan pengajuan trial ke notifikasi Sales
    if (currentUser.role === 'sales' || currentUser.role === 'sales_counter') {
      SALES_NOTIFICATIONS.unshift({
        id: 'SN-' + Date.now(), type: 'trial', status: 'Pending',
        title: 'Pengajuan Trial Dikirim',
        desc: company + ' — PIC: ' + pic,
        note: 'Menunggu persetujuan dari Administrator / Supervisor.',
        submittedBy: currentUser.id,
        date: new Date().toISOString().split('T')[0], read: false,
      });
    }
  }
  document.getElementById('submission-form-state').style.display = 'none';
  document.getElementById('submission-footer').style.display = 'none';
  document.getElementById('submission-success').classList.add('show');
  updateAlertBadge();
}

// ====== USER MODAL FUNCTIONS ======
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
    const hasData  = psiRaw !== '' || nsdRaw !== '' || brandRaw !== '' || !!tirePhoots[i];
    // Posisi tidak diisi — simpan tanpa measurements (tidak ditampilkan di monitoring)
    if (!hasData) {
      return { id: randId(), position: pos, brand: '', model: '', installDate: new Date().toISOString().split('T')[0], photo: null, status: 'good', measurements: [] };
    }
    const pressure = parseFloat(psiRaw) || 32;
    const tread    = parseFloat(nsdRaw) || 8;
    const status   = getTireStatus(pressure, tread);
    return {
      id: randId(),
      position: pos,
      brand: brandRaw,
      model: modelRaw,
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
    picNumber: document.getElementById('f-pic').value || '',
    tonnage: parseFloat(document.getElementById('f-tonnage').value) || 0,
    installDate: document.getElementById('f-installdate').value || new Date().toISOString().split('T')[0],
    installOdo: parseInt(document.getElementById('f-odo').value) || null,
    photoOdo: tempPhotoOdo || null,
    photoUnit: tempPhotoUnit || null,
    inputBy: currentUser ? currentUser.username : '',
    tires
  };
  if (addVehicleTarget === 'trial') {
    trialVehicles.push(v);
  } else {
    vehicles.push(v);
    selectedVehicleId = v.id;
  }
  closeAddVehicleModal();
  // Stay on monitoring page, set correct tab
  monitoringView = 'list';
  monitoringTab = addVehicleTarget;
  navigate('monitoring');
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

  if (closedEntry) closedTires.unshift(closedEntry);
  closeMeasureModal();
  render();
}

// ====== HISTORY MODAL ======
function openHistoryModal(vehicleId, tireId) {
  const { tire } = findTireById(tireId);
  if (!tire) return;
  const sorted = [...tire.measurements].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp));
  document.getElementById('history-pos').textContent = `${tire.position} • ${tire.brand} ${tire.model}`;
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
        </div>
      </div>`).join('')}
    </div>`;
  document.getElementById('modal-history').classList.add('open');
}
function closeHistoryModal() {
  document.getElementById('modal-history').classList.remove('open');
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

vehicles = [];

selectedVehicleId = null;

// ====== LAPORAN HARIAN PER USER ======
let laporanDate = new Date().toISOString().split('T')[0];
let laporanSelectedUser = null; // null = current user (or all if admin/supervisor)
let laporanModalType = 'rencana'; // 'rencana' | 'realisasi'
let laporanEditId = null;

function isAdminSupervisor() {
  return currentUser.role === 'administrator' || currentUser.role === 'supervisor';
}

function getLaporanForUser(username, date) {
  return laporanHarian.filter(l => l.username === username && l.date === date);
}

function getLaporanEntry(username, date, type) {
  return laporanHarian.find(l => l.username === username && l.date === date && l.type === type) || null;
}

function renderLaporan() {
  const todayStr = new Date().toISOString().split('T')[0];
  const selDate  = new Date(laporanDate + 'T00:00:00');
  const selDateStr = selDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const isToday = laporanDate === todayStr;

  // Siapa saja yang ditampilkan
  const canSeeAll = isAdminSupervisor();
  const viewUsers = canSeeAll
    ? appUsers.filter(u => u.status === 'active')
    : appUsers.filter(u => u.username === currentUser.username);

  // User filter (admin/supervisor bisa pilih user)
  const filterUser = canSeeAll ? (laporanSelectedUser || 'all') : currentUser.username;

  const displayUsers = filterUser === 'all'
    ? viewUsers
    : viewUsers.filter(u => u.username === filterUser);

  const statusColor = { administrator:'#7c3aed', supervisor:'#2563eb', technical_support:'#0e7490', sales:'#c2410c', viewer:'#6b7280' };
  const statusLabel2 = { administrator:'Admin', supervisor:'Supervisor', technical_support:'Tech Support', sales:'Sales', viewer:'Viewer' };

  // ── Header & controls ────────────────────────────────────────────────────
  const headerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:14px;">
    <div>
      <div class="page-title">Laporan Harian</div>
      <div class="page-sub">Rencana & realisasi kerja harian${canSeeAll ? ' seluruh user' : ' Anda'}.</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <input type="date" value="${laporanDate}" onchange="laporanDate=this.value;render()"
        style="padding:9px 14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text);outline:none;cursor:pointer;"
        max="${todayStr}" />
      ${canSeeAll ? `
      <select onchange="laporanSelectedUser=this.value==='all'?null:this.value;render()"
        style="padding:9px 14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text);outline:none;cursor:pointer;">
        <option value="all" ${filterUser==='all'?'selected':''}>Semua User</option>
        ${viewUsers.map(u => `<option value="${u.username}" ${filterUser===u.username?'selected':''}>${u.name}</option>`).join('')}
      </select>` : ''}
    </div>
  </div>

  <!-- Tanggal label -->
  <div style="background:var(--green-light);border:1px solid #a7f3d0;border-radius:14px;padding:12px 18px;margin-bottom:24px;display:flex;align-items:center;gap:10px;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    <span style="font-size:13px;font-weight:700;color:#065f46;">${selDateStr}</span>
    ${isToday ? '<span style="font-size:11px;font-weight:700;background:#059669;color:white;padding:2px 10px;border-radius:20px;margin-left:4px;">Hari Ini</span>' : ''}
  </div>`;

  // ── Ringkasan (hanya admin/supervisor, lihat semua) ──────────────────────
  const summaryHTML = canSeeAll && filterUser === 'all' ? (() => {
    const totalUsers = viewUsers.length;
    const sudahRencana = viewUsers.filter(u => getLaporanEntry(u.username, laporanDate, 'rencana')).length;
    const sudahRealisasi = viewUsers.filter(u => getLaporanEntry(u.username, laporanDate, 'realisasi')).length;
    const belumSama = viewUsers.filter(u => !getLaporanEntry(u.username, laporanDate, 'rencana') && !getLaporanEntry(u.username, laporanDate, 'realisasi')).length;
    return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:28px;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total User Aktif</div>
        <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;">${totalUsers}</div>
      </div>
      <div style="background:var(--blue-light);border:1px solid #bfdbfe;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin-bottom:6px;">Sudah Isi Rencana</div>
        <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;color:#1d4ed8;">${sudahRencana}</div>
        <div style="font-size:11px;color:#2563eb;margin-top:3px;">${totalUsers ? Math.round(sudahRencana/totalUsers*100) : 0}% dari total</div>
      </div>
      <div style="background:var(--green-light);border:1px solid #a7f3d0;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#065f46;margin-bottom:6px;">Sudah Realisasi</div>
        <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;color:#059669;">${sudahRealisasi}</div>
        <div style="font-size:11px;color:#059669;margin-top:3px;">${totalUsers ? Math.round(sudahRealisasi/totalUsers*100) : 0}% dari total</div>
      </div>
      <div style="background:var(--rose-light);border:1px solid #fecdd3;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9f1239;margin-bottom:6px;">Belum Isi Sama Sekali</div>
        <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;color:var(--rose);">${belumSama}</div>
      </div>
    </div>`;
  })() : '';

  // ── Kartu per user ───────────────────────────────────────────────────────
  const isSelf = u => u.username === currentUser.username;
  const canEdit = u => isSelf(u) && isToday;

  const userCardsHTML = displayUsers.map(u => {
    const rencana   = getLaporanEntry(u.username, laporanDate, 'rencana');
    const realisasi = getLaporanEntry(u.username, laporanDate, 'realisasi');
    const col = statusColor[u.role] || '#6b7280';
    const roleLbl = statusLabel2[u.role] || u.role;

    function entryBlock(entry, type) {
      const label    = type === 'rencana' ? '🌅 Rencana Kerja' : '🌇 Realisasi Kerja';
      const subLabel = type === 'rencana' ? 'Diisi pagi hari' : 'Diisi sore hari';
      const bgCol    = type === 'rencana' ? '#eff6ff' : '#f0fdf4';
      const brdCol   = type === 'rencana' ? '#bfdbfe' : '#bbf7d0';
      const txtCol   = type === 'rencana' ? '#1d4ed8' : '#065f46';
      const editLabel = entry ? 'Edit' : 'Isi Sekarang';

      return `
      <div style="background:${bgCol};border:1.5px solid ${brdCol};border-radius:14px;padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-size:13px;font-weight:800;color:${txtCol};">${label}</div>
            <div style="font-size:11px;color:${txtCol};opacity:.7;">${subLabel}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${entry
              ? `<span style="font-size:10px;font-weight:700;background:${type==='rencana'?'#2563eb':'#059669'};color:white;padding:2px 10px;border-radius:20px;">✓ Terisi</span>`
              : `<span style="font-size:10px;font-weight:700;background:#f3f4f6;color:var(--muted);padding:2px 10px;border-radius:20px;">— Kosong</span>`}
            ${canEdit(u) ? `
            <button onclick="openLaporanModal('${u.username}','${type}','${entry?.id||''}')"
              style="padding:5px 12px;background:${type==='rencana'?'#2563eb':'#059669'};color:white;border:none;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;"
              onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
              ${editLabel}
            </button>` : ''}
          </div>
        </div>
        ${entry ? `
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${entry.items.map((item, i) => `
          <div style="display:flex;align-items:flex-start;gap:8px;background:white;border-radius:10px;padding:10px 12px;border:1px solid ${brdCol};">
            <div style="width:20px;height:20px;border-radius:6px;background:${type==='rencana'?'#2563eb':'#059669'};color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:var(--text);">${item.kegiatan}</div>
              ${item.lokasi ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;display:flex;align-items:center;gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${item.lokasi}</div>` : ''}
              ${item.keterangan ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;font-style:italic;">${item.keterangan}</div>` : ''}
              ${type==='realisasi' ? `
              <div style="margin-top:5px;">
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${item.status==='selesai'?'#d1fae5':item.status==='sebagian'?'#fef3c7':'#ffe4e6'};color:${item.status==='selesai'?'#065f46':item.status==='sebagian'?'#78350f':'#9f1239'};">${item.status==='selesai'?'✓ Selesai':item.status==='sebagian'?'⚡ Sebagian':'✗ Tidak Selesai'}</span>
              </div>` : ''}
            </div>
          </div>`).join('')}
        </div>
        ${entry.catatan ? `<div style="margin-top:10px;padding:9px 12px;background:white;border-left:3px solid ${type==='rencana'?'#2563eb':'#059669'};border-radius:0 8px 8px 0;font-size:12px;color:var(--muted);line-height:1.5;">${entry.catatan}</div>` : ''}
        <div style="margin-top:8px;font-size:10px;color:${txtCol};opacity:.6;">Diperbarui: ${new Date(entry.updatedAt).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div>
        ` : `
        <div style="padding:16px;text-align:center;color:${txtCol};opacity:.5;">
          <div style="font-size:12px;">${canEdit(u) ? 'Belum diisi. Klik tombol di atas untuk mengisi.' : 'Belum ada data.'}</div>
        </div>`}
      </div>`;
    }

    return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:20px;">
      <!-- User header -->
      <div style="padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        <div style="width:42px;height:42px;border-radius:50%;background:${u.avatarColor};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;flex-shrink:0;">${u.avatar}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-weight:700;font-size:14px;">${u.name}</span>
            ${isSelf(u) ? '<span style="font-size:10px;font-weight:700;background:var(--green-light);color:#065f46;padding:2px 8px;border-radius:20px;border:1px solid #a7f3d0;">Anda</span>' : ''}
            <span style="font-size:10px;font-weight:700;background:${col}22;color:${col};padding:2px 8px;border-radius:20px;">${roleLbl}</span>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">@${u.username}</div>
        </div>
        <div style="display:flex;gap:8px;">
          ${rencana ? '<span style="font-size:11px;font-weight:700;background:#eff6ff;color:#1d4ed8;padding:4px 12px;border-radius:20px;border:1px solid #bfdbfe;">🌅 Rencana ✓</span>' : '<span style="font-size:11px;font-weight:700;background:#f3f4f6;color:var(--muted);padding:4px 12px;border-radius:20px;">🌅 Rencana —</span>'}
          ${realisasi ? '<span style="font-size:11px;font-weight:700;background:#f0fdf4;color:#065f46;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0;">🌇 Realisasi ✓</span>' : '<span style="font-size:11px;font-weight:700;background:#f3f4f6;color:var(--muted);padding:4px 12px;border-radius:20px;">🌇 Realisasi —</span>'}
        </div>
      </div>
      <!-- Content: rencana + realisasi -->
      <div style="padding:18px 22px;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${entryBlock(rencana, 'rencana')}
        ${entryBlock(realisasi, 'realisasi')}
      </div>
    </div>`;
  }).join('');

  return `
  <div style="max-width:1000px;">
    ${headerHTML}
    ${summaryHTML}
    ${displayUsers.length === 0
      ? `<div style="background:var(--surface);border:2px dashed var(--border);border-radius:20px;padding:60px;text-align:center;color:var(--muted);">Tidak ada user untuk ditampilkan.</div>`
      : userCardsHTML}
  </div>`;
}

// ====== LAPORAN MODAL ======
let laporanModalItems = []; // { kegiatan, lokasi, keterangan, status }

function openLaporanModal(username, type, editId) {
  laporanModalType = type;
  laporanEditId = editId || null;

  const existing = editId ? laporanHarian.find(l => l.id === editId) : null;
  laporanModalItems = existing ? JSON.parse(JSON.stringify(existing.items)) : [{ kegiatan:'', lokasi:'', keterangan:'', status:'selesai' }];

  // Build modal
  const modal = document.getElementById('modal-laporan');
  const title = type === 'rencana' ? '🌅 Isi Rencana Kerja' : '🌇 Isi Realisasi Kerja';
  const col    = type === 'rencana' ? '#2563eb' : '#059669';
  const colBg  = type === 'rencana' ? '#eff6ff' : '#f0fdf4';
  const colBrd = type === 'rencana' ? '#bfdbfe' : '#a7f3d0';

  document.getElementById('laporan-modal-title').textContent = title;
  document.getElementById('laporan-modal-save-btn').style.background = col;
  document.getElementById('laporan-modal-save-btn').style.boxShadow = `0 4px 12px ${col}44`;
  document.getElementById('laporan-modal-catatan').value = existing?.catatan || '';
  document.getElementById('laporan-modal-username').value = username;
  document.getElementById('laporan-modal-type-hint').textContent = type === 'rencana'
    ? 'Tuliskan rencana kegiatan hari ini di pagi hari sebelum bekerja.'
    : 'Tuliskan realisasi kegiatan hari ini di sore hari setelah bekerja.';
  document.getElementById('laporan-modal-type-hint').style.color = col;

  renderLaporanModalItems(col, colBg, colBrd, type);
  modal.classList.add('open');
}

function renderLaporanModalItems(col, colBg, colBrd, type) {
  const isRealisasi = (type || laporanModalType) === 'realisasi';
  const col2  = col  || (laporanModalType === 'rencana' ? '#2563eb' : '#059669');
  const colBg2  = colBg  || (laporanModalType === 'rencana' ? '#eff6ff' : '#f0fdf4');
  const colBrd2 = colBrd || (laporanModalType === 'rencana' ? '#bfdbfe' : '#a7f3d0');

  document.getElementById('laporan-items-container').innerHTML = laporanModalItems.map((item, i) => `
  <div style="background:${colBg2};border:1.5px solid ${colBrd2};border-radius:14px;padding:14px;margin-bottom:10px;position:relative;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <div style="width:22px;height:22px;border-radius:7px;background:${col2};color:white;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
      <span style="font-size:12px;font-weight:700;color:${col2};">Kegiatan ${i+1}</span>
      ${laporanModalItems.length > 1 ? `<button onclick="removeLaporanItem(${i})" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#9ca3af;padding:2px;" title="Hapus">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>` : ''}
    </div>
    <div class="form-group" style="margin-bottom:8px;">
      <label class="form-label">Kegiatan *</label>
      <input class="form-input" type="text" placeholder="Deskripsikan kegiatan yang dilakukan..." value="${item.kegiatan}"
        oninput="laporanModalItems[${i}].kegiatan=this.value" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:${isRealisasi?'8px':'0'};">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Lokasi / Area</label>
        <input class="form-input" type="text" placeholder="Pool Jakarta Utara..." value="${item.lokasi||''}"
          oninput="laporanModalItems[${i}].lokasi=this.value" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Keterangan</label>
        <input class="form-input" type="text" placeholder="Tambahan info..." value="${item.keterangan||''}"
          oninput="laporanModalItems[${i}].keterangan=this.value" />
      </div>
    </div>
    ${isRealisasi ? `
    <div class="form-group" style="margin-bottom:0;margin-top:8px;">
      <label class="form-label">Status Realisasi</label>
      <div style="display:flex;gap:8px;">
        ${[['selesai','✓ Selesai','#059669','#d1fae5','#a7f3d0'],['sebagian','⚡ Sebagian','#d97706','#fef3c7','#fde68a'],['tidak','✗ Tidak Selesai','#e11d48','#ffe4e6','#fecdd3']].map(([val,lbl,tc,bg,brd]) => `
        <label style="flex:1;display:flex;align-items:center;gap:6px;padding:7px 10px;background:${item.status===val?bg:'var(--surface)'};border:1.5px solid ${item.status===val?brd:'var(--border)'};border-radius:10px;cursor:pointer;font-size:11px;font-weight:700;color:${item.status===val?tc:'var(--muted)'};transition:all .15s;">
          <input type="radio" name="status-${i}" value="${val}" ${item.status===val?'checked':''} onchange="laporanModalItems[${i}].status='${val}';renderLaporanModalItems()" style="display:none;" />
          ${lbl}
        </label>`).join('')}
      </div>
    </div>` : ''}
  </div>`).join('');
}

function addLaporanItem() {
  laporanModalItems.push({ kegiatan:'', lokasi:'', keterangan:'', status:'selesai' });
  renderLaporanModalItems();
}

function removeLaporanItem(i) {
  laporanModalItems.splice(i, 1);
  renderLaporanModalItems();
}

function saveLaporan() {
  const username = document.getElementById('laporan-modal-username').value;
  const catatan  = document.getElementById('laporan-modal-catatan').value.trim();
  const items    = laporanModalItems.filter(item => item.kegiatan.trim());

  if (items.length === 0) { alert('Harap isi minimal satu kegiatan.'); return; }

  const now = new Date().toISOString();
  if (laporanEditId) {
    laporanHarian = laporanHarian.map(l => l.id === laporanEditId
      ? { ...l, items, catatan, updatedAt: now }
      : l);
  } else {
    laporanHarian.push({
      id: randId(),
      username,
      date: laporanDate,
      type: laporanModalType,
      items,
      catatan,
      createdAt: now,
      updatedAt: now,
    });
  }

  document.getElementById('modal-laporan').classList.remove('open');
  laporanEditId = null;
  laporanModalItems = [];
  render();

  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:white;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(5,150,105,.4);transition:opacity .3s;';
  toast.textContent = '✓ Laporan berhasil disimpan';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; setTimeout(()=>toast.remove(),400); }, 2200);
}

// ====== KEY PERFORMANCE INDICATOR ======
let kpiSelectedUser = null; // null = all users

function renderKPI() {
  const roleColors = { administrator:'#7c3aed', supervisor:'#2563eb', technical_support:'#0e7490', sales:'#c2410c', sales_counter:'#9d174d', viewer:'#6b7280' };
  const roleLabels = { administrator:'Administrator', supervisor:'Supervisor', technical_support:'Technical Support', sales:'Sales', sales_counter:'Sales Counter', viewer:'Viewer' };
  const roleIcons  = { administrator:'#ede9fe', supervisor:'#dbeafe', technical_support:'#ecfeff', sales:'#fff7ed', sales_counter:'#fdf2f8', viewer:'#f3f4f6' };

  // ── Hitung KPI per user ──────────────────────────────────────────────────
  function getKPIForUser(user) {
    const uname = user.username;
    // Kendaraan yang di-input oleh user
    const allVehicles = [...vehicles, ...trialVehicles];
    const userVehicles = allVehicles.filter(v => v.inputBy === uname);

    // Ban yang dikelola (hanya yang ada data pengukuran)
    const userTires = [];
    userVehicles.forEach(v => v.tires.forEach(t => {
      if (t.measurements && t.measurements.length > 0) userTires.push({ v, t });
    }));
    const totalBan = userTires.length;
    const banKritis = userTires.filter(x => x.t.status === 'critical').length;
    const banWarning = userTires.filter(x => x.t.status === 'warning').length;
    const banBagus = userTires.filter(x => x.t.status === 'good').length;
    const tireHealth = totalBan ? Math.round((banBagus / totalBan) * 100) : 0;

    // Pengukuran / pengecekan
    let totalChecks = 0;
    userTires.forEach(x => { totalChecks += x.t.measurements.length; });

    // Laporan harian
    const userLaporan = laporanHarian.filter(l => l.username === uname);
    const rencanaCount = userLaporan.filter(l => l.type === 'rencana').length;
    const realisasiCount = userLaporan.filter(l => l.type === 'realisasi').length;
    const completionRate = rencanaCount ? Math.round((realisasiCount / rencanaCount) * 100) : 0;

    // Closing data terkait
    const userClosed = closedTires.filter(c => {
      const v = userVehicles.find(v => v.id === c.vehicleId);
      return !!v;
    }).length;

    // Klaim terkait
    const userClaimPlates = userVehicles.map(v => v.plateNumber);
    const userClaims = CLAIMS.filter(c => userClaimPlates.includes(c.plate));
    const approvedClaims = userClaims.filter(c => c.status === 'Approved').length;

    return {
      totalVehicles: userVehicles.length,
      totalBan, banKritis, banWarning, banBagus, tireHealth,
      totalChecks, rencanaCount, realisasiCount, completionRate,
      userClosed, totalClaims: userClaims.length, approvedClaims,
    };
  }

  // Daftar users yang relevan untuk KPI (semua yang punya aktivitas atau technical_support/sales/supervisor)
  const relevantUsers = appUsers.filter(u => u.status === 'active' && (u.role === 'technical_support' || u.role === 'sales' || u.role === 'sales_counter' || u.role === 'supervisor' || u.role === 'administrator'));

  // Filter jika selectedUser
  const displayUsers = kpiSelectedUser ? relevantUsers.filter(u => u.id === kpiSelectedUser) : relevantUsers;

  // ── Summary global ───────────────────────────────────────────────────────
  const allVehicles = [...vehicles, ...trialVehicles];
  const allTiresFlat = [];
  allVehicles.forEach(v => v.tires.forEach(t => { if (t.measurements && t.measurements.length > 0) allTiresFlat.push(t); }));
  const globalKritis = allTiresFlat.filter(t => t.status === 'critical').length;
  const globalWarning = allTiresFlat.filter(t => t.status === 'warning').length;
  const globalHealth = allTiresFlat.length ? Math.round((allTiresFlat.filter(t=>t.status==='good').length / allTiresFlat.length) * 100) : 0;

  // ── User filter bar ──────────────────────────────────────────────────────
  const filterBar = `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;align-items:center;">
    <span style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">Filter User:</span>
    <button onclick="kpiSelectedUser=null;render()" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid ${!kpiSelectedUser?'var(--green)':'var(--border)'};background:${!kpiSelectedUser?'var(--green-light)':'var(--surface)'};color:${!kpiSelectedUser?'var(--green)':'var(--muted)'};font-family:'DM Sans',sans-serif;transition:all .15s;">
      👥 Semua User
    </button>
    ${relevantUsers.map(u => `
    <button onclick="kpiSelectedUser='${u.id}';render()" style="display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid ${kpiSelectedUser===u.id?roleColors[u.role]:'var(--border)'};background:${kpiSelectedUser===u.id?roleIcons[u.role]:'var(--surface)'};color:${kpiSelectedUser===u.id?roleColors[u.role]:'var(--muted)'};font-family:'DM Sans',sans-serif;transition:all .15s;">
      <span style="width:22px;height:22px;border-radius:50%;background:${u.avatarColor};color:white;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0;">${u.avatar}</span>
      ${u.name.split(' ')[0]}
    </button>`).join('')}
  </div>`;

  // ── Global summary cards ─────────────────────────────────────────────────
  const summaryCards = `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:28px;">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Kendaraan</div>
      <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;">${allVehicles.length}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">Monitoring + Trial</div>
    </div>
    <div style="background:var(--green-light);border:1px solid #a7f3d0;border-radius:16px;padding:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#065f46;margin-bottom:6px;">Kesehatan Ban</div>
      <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;color:#065f46;">${globalHealth}%</div>
      <div style="font-size:11px;color:#065f46;margin-top:2px;">Kondisi keseluruhan</div>
    </div>
    <div style="background:var(--rose-light);border:1px solid #fecdd3;border-radius:16px;padding:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9f1239;margin-bottom:6px;">Ban Kritis</div>
      <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;color:var(--rose);">${globalKritis}</div>
      <div style="font-size:11px;color:#9f1239;margin-top:2px;">Perlu tindakan segera</div>
    </div>
    <div style="background:var(--amber-light);border:1px solid #fde68a;border-radius:16px;padding:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#92400e;margin-bottom:6px;">Ban Peringatan</div>
      <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;color:var(--amber);">${globalWarning}</div>
      <div style="font-size:11px;color:#92400e;margin-top:2px;">Perlu perhatian</div>
    </div>
    <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:16px;padding:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#5b21b6;margin-bottom:6px;">Aktif User</div>
      <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;color:#7c3aed;">${relevantUsers.length}</div>
      <div style="font-size:11px;color:#5b21b6;margin-top:2px;">Tech Support & Sales</div>
    </div>
    <div style="background:var(--blue-light);border:1px solid #bfdbfe;border-radius:16px;padding:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#1e40af;margin-bottom:6px;">Total Laporan</div>
      <div style="font-size:30px;font-family:'DM Mono',monospace;font-weight:500;color:#2563eb;">${laporanHarian.length}</div>
      <div style="font-size:11px;color:#1e40af;margin-top:2px;">Rencana & Realisasi</div>
    </div>
  </div>`;

  // ── KPI cards per user ───────────────────────────────────────────────────
  function kpiCard(user) {
    const kpi = getKPIForUser(user);
    const rColor = roleColors[user.role];
    const rIcon  = roleIcons[user.role];

    const healthColor = kpi.tireHealth >= 80 ? 'var(--green)' : kpi.tireHealth >= 60 ? 'var(--amber)' : 'var(--rose)';
    const compColor   = kpi.completionRate >= 80 ? 'var(--green)' : kpi.completionRate >= 50 ? 'var(--amber)' : 'var(--rose)';

    return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);transition:box-shadow .15s;" onmouseover="this.style.boxShadow='0 6px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
      <!-- Card Header -->
      <div style="padding:18px 20px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
        <div style="width:44px;height:44px;border-radius:50%;background:${user.avatarColor};color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0;">${user.avatar}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:800;font-family:'Syne',sans-serif;">${user.name}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${rIcon};color:${rColor};border:1px solid ${rColor}22;">${roleLabels[user.role]}</span>
            <span style="font-size:11px;color:var(--muted);">@${user.username}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">Health Score</div>
          <div style="font-size:22px;font-family:'DM Mono',monospace;font-weight:500;color:${healthColor};">${kpi.tireHealth}%</div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div style="padding:16px 20px;">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
          <!-- Kendaraan -->
          <div style="background:#f9fafb;border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Kendaraan</div>
            <div style="font-size:22px;font-family:'DM Mono',monospace;font-weight:500;">${kpi.totalVehicles}</div>
            <div style="font-size:10px;color:var(--muted);">unit dikelola</div>
          </div>
          <!-- Total Ban -->
          <div style="background:#f9fafb;border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Total Ban</div>
            <div style="font-size:22px;font-family:'DM Mono',monospace;font-weight:500;">${kpi.totalBan}</div>
            <div style="font-size:10px;color:var(--muted);">unit ban</div>
          </div>
          <!-- Pengecekan -->
          <div style="background:#f9fafb;border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Pengecekan</div>
            <div style="font-size:22px;font-family:'DM Mono',monospace;font-weight:500;">${kpi.totalChecks}</div>
            <div style="font-size:10px;color:var(--muted);">total checks</div>
          </div>
        </div>

        <!-- Kondisi Ban Bar -->
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--muted);">Kondisi Ban</span>
            <div style="display:flex;gap:8px;font-size:10px;font-weight:700;">
              <span style="color:var(--green);">✓ ${kpi.banBagus} bagus</span>
              <span style="color:var(--amber);">⚠ ${kpi.banWarning} warn</span>
              <span style="color:var(--rose);">✕ ${kpi.banKritis} kritis</span>
            </div>
          </div>
          <div style="height:7px;background:#f3f4f6;border-radius:99px;overflow:hidden;display:flex;gap:2px;">
            ${kpi.totalBan > 0 ? `
            <div style="width:${Math.round(kpi.banBagus/kpi.totalBan*100)}%;background:var(--green);border-radius:99px;transition:width .4s;"></div>
            <div style="width:${Math.round(kpi.banWarning/kpi.totalBan*100)}%;background:var(--amber);border-radius:99px;transition:width .4s;"></div>
            <div style="width:${Math.round(kpi.banKritis/kpi.totalBan*100)}%;background:var(--rose);border-radius:99px;transition:width .4s;"></div>
            ` : `<div style="width:100%;background:#e5e7eb;border-radius:99px;"></div>`}
          </div>
        </div>

        <!-- Laporan & Claim -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
          <div style="background:var(--blue-light);border-radius:12px;padding:12px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#1e40af;margin-bottom:6px;">Laporan Harian</div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
              <div>
                <div style="font-size:11px;color:#1e40af;">Rencana: <strong>${kpi.rencanaCount}</strong></div>
                <div style="font-size:11px;color:#1e40af;">Realisasi: <strong>${kpi.realisasiCount}</strong></div>
              </div>
              <div style="font-size:20px;font-family:'DM Mono',monospace;font-weight:500;color:${compColor};">${kpi.completionRate}%</div>
            </div>
            <div style="height:4px;background:rgba(37,99,235,.15);border-radius:99px;overflow:hidden;margin-top:6px;">
              <div style="width:${kpi.completionRate}%;background:${compColor};border-radius:99px;transition:width .4s;height:100%;"></div>
            </div>
          </div>
          <div style="background:#f9fafb;border-radius:12px;padding:12px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Klaim Ban</div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
              <div>
                <div style="font-size:11px;color:var(--muted);">Total: <strong>${kpi.totalClaims}</strong></div>
                <div style="font-size:11px;color:#059669;">Approved: <strong>${kpi.approvedClaims}</strong></div>
              </div>
              <div style="font-size:20px;font-family:'DM Mono',monospace;font-weight:500;color:${rColor};">${kpi.userClosed}</div>
            </div>
            <div style="font-size:10px;color:var(--muted);margin-top:4px;">ban di-closing</div>
          </div>
        </div>

        <!-- Closing count -->
        ${kpi.banKritis > 0 ? `
        <div style="padding:8px 12px;background:var(--rose-light);border:1px solid #fecdd3;border-radius:10px;font-size:12px;color:#9f1239;font-weight:600;display:flex;align-items:center;gap:7px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ${kpi.banKritis} ban kritis membutuhkan tindakan segera
        </div>` : kpi.banWarning > 0 ? `
        <div style="padding:8px 12px;background:var(--amber-light);border:1px solid #fde68a;border-radius:10px;font-size:12px;color:#92400e;font-weight:600;display:flex;align-items:center;gap:7px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ${kpi.banWarning} ban dalam status peringatan
        </div>` : `
        <div style="padding:8px 12px;background:var(--green-light);border:1px solid #a7f3d0;border-radius:10px;font-size:12px;color:#065f46;font-weight:600;display:flex;align-items:center;gap:7px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Semua ban dalam kondisi baik
        </div>`}
      </div>
    </div>`;
  }

  // ── Render by role group ─────────────────────────────────────────────────
  const roleGroups = ['supervisor', 'technical_support', 'sales', 'sales_counter'];
  let userCards = '';

  if (kpiSelectedUser) {
    // Show single user
    userCards = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:20px;">${displayUsers.map(kpiCard).join('')}</div>`;
  } else {
    // Group by role
    roleGroups.forEach(role => {
      const groupUsers = relevantUsers.filter(u => u.role === role);
      if (groupUsers.length === 0) return;
      userCards += `
      <div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="width:36px;height:36px;border-radius:10px;background:${roleIcons[role]};display:flex;align-items:center;justify-content:center;">
            ${role === 'supervisor'
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${roleColors[role]}" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`
              : role === 'sales'
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${roleColors[role]}" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
              : role === 'sales_counter'
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${roleColors[role]}" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${roleColors[role]}" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`}
          </div>
          <div>
            <div style="font-size:15px;font-weight:800;font-family:'Syne',sans-serif;">${roleLabels[role]}</div>
            <div style="font-size:12px;color:var(--muted);">${groupUsers.length} orang aktif</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;">
          ${groupUsers.map(kpiCard).join('')}
        </div>
      </div>`;
    });

    // Also show admins if no filter
    const adminUsers = relevantUsers.filter(u => u.role === 'administrator');
    if (adminUsers.length > 0) {
      userCards += `
      <div style="margin-bottom:28px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#ede9fe;display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style="font-size:15px;font-weight:800;font-family:'Syne',sans-serif;">Administrator</div>
            <div style="font-size:12px;color:var(--muted);">${adminUsers.length} orang aktif</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;">
          ${adminUsers.map(kpiCard).join('')}
        </div>
      </div>`;
    }
  }

  return `
  <div style="max-width:1200px;margin:0 auto;">
    <!-- Page Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="page-title">Key Performance Indicator</div>
        <div class="page-sub">Pantau performa setiap user berdasarkan aktivitas, kondisi ban, dan laporan harian.</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--green-light);border:1px solid #a7f3d0;border-radius:12px;font-size:12px;color:#065f46;font-weight:600;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Update real-time
      </div>
    </div>

    <!-- Global Summary -->
    ${summaryCards}

    <!-- Filter Bar -->
    ${filterBar}

    <!-- Divider -->
    <div style="height:1px;background:var(--border);margin-bottom:24px;"></div>

    <!-- KPI Cards by User -->
    ${userCards.trim() ? userCards : `<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p style="margin-top:16px;">Tidak ada user aktif untuk ditampilkan.</p></div>`}
  </div>`;
}

// ====== INIT ======
render();
