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
// ====== NAVIGATION ======
function navigate(page) {
  // Cek izin akses menu untuk non-administrator
  if (currentUser && currentUser.role !== 'administrator') {
    const perms = rolePerms[currentUser.role];
    if (perms && perms.menus && perms.menus[page] === 0) {
      // Tidak punya akses - redirect ke halaman pertama yang diizinkan
      const firstAllowed = ['dashboard','vehicles','customer','monitoring','alerts','claims',
        'duty','closing','laporan','settings','kpi','users']
        .find(m => perms.menus[m] !== 0);
      page = firstAllowed || 'dashboard';
    }
  }
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
  // Terapkan pembatasan menu ke sidebar setiap render
  if (typeof applyRolePermsToNav === 'function') applyRolePermsToNav();
  if (currentPage === 'monitoring' && monitoringView === 'detail') renderChart();
  if (currentPage === 'dashboard') setTimeout(renderDashboardCharts, 0);
}

function updateAlertBadge() {
  let count = 0;

  // Notifikasi universal (user_notifications) — semua role
  const _unreadUN = (typeof USER_NOTIFICATIONS !== 'undefined' && currentUser)
    ? USER_NOTIFICATIONS.filter(n => n.userId === currentUser.id && !n.read).length : 0;

  if (currentUser && (currentUser.role === 'sales' || currentUser.role === 'sales_counter')) {
    const legacyUnread = SALES_NOTIFICATIONS
      ? SALES_NOTIFICATIONS.filter(n => n.submittedBy === currentUser.id && !n.read).length : 0;
    count = _unreadUN + legacyUnread;
  } else if (currentUser && currentUser.role === 'technical_support') {
    const techTaskCount = typeof TECH_NOTIFICATIONS !== 'undefined'
      ? TECH_NOTIFICATIONS.filter(n => {
          const claim = CLAIMS.find(c => c.id === n.claimId);
          return !(claim && claim.processDone) && (!n.takenBy || n.takenBy === currentUser.id);
        }).length : 0;
    count = _unreadUN + techTaskCount;
  } else {
    count += _unreadUN;
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
  const allV = [...vehicles, ...trialVehicles];
  let filtered = currentUser 
    ? allV.filter(v => v.createdBy === currentUser.id)
    : allV;
  
  if (!searchQuery) return filtered;
  const q = searchQuery.toLowerCase();
  return filtered.filter(v => {
    // Plat kendaraan
    if (v.plateNumber && v.plateNumber.toLowerCase().includes(q)) return true;
    // Nama perusahaan customer
    if (v.customerName && v.customerName.toLowerCase().includes(q)) return true;
    // Nama perusahaan sales
    if (v.salesCompany && v.salesCompany.toLowerCase().includes(q)) return true;
    // Nama sales
    if (v.salesName && v.salesName.toLowerCase().includes(q)) return true;
    // Nama technical support (user yang menginput)
    if (v.createdBy) {
      const creator = (typeof appUsers !== 'undefined' ? appUsers : []).find(u => u.id === v.createdBy);
      if (creator && creator.name && creator.name.toLowerCase().includes(q)) return true;
      if (creator && creator.username && creator.username.toLowerCase().includes(q)) return true;
    }
    // Make/model kendaraan
    if (v.make && v.make.toLowerCase().includes(q)) return true;
    return false;
  });
}

