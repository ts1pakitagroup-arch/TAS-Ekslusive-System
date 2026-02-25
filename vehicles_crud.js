
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
        </div>
        <!-- Kondisi Ban Progress Bar -->
        <div style="height:7px;background:#f3f4f6;border-radius:99px;overflow:hidden;display:flex;gap:2px;">
          ${kpi.totalBan > 0 ? `
          <div style="width:${Math.round(kpi.banBagus/kpi.totalBan*100)}%;background:var(--green);border-radius:99px;transition:width .4s;"></div>
          <div style="width:${Math.round(kpi.banWarning/kpi.totalBan*100)}%;background:var(--amber);border-radius:99px;transition:width .4s;"></div>
          <div style="width:${Math.round(kpi.banKritis/kpi.totalBan*100)}%;background:var(--rose);border-radius:99px;transition:width .4s;"></div>
          ` : `<div style="width:100%;background:#e5e7eb;border-radius:99px;"></div>`}
        </div>
      </div>
    </div>
  </div>`;
}

  return `
  <div>
    <div class="page-header"><div class="page-title">Key Performance Indicator</div><div class="page-sub">Performa kerja per user Technical Support & Sales.</div></div>
    ${filterBar}
    ${summaryCards}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;">
      ${displayUsers.length === 0
        ? `<div style="background:var(--surface);border:2px dashed var(--border);border-radius:20px;padding:60px;text-align:center;color:var(--muted);">Belum ada data KPI.</div>`
        : displayUsers.map(u => kpiCard(u)).join('')}
    </div>
  </div>`;
}

