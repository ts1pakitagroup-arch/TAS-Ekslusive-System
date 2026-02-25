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
    ban:    { color:'var(--green)', bg:'var(--green-light)', border:'#a7f3d0', label:'BAN',     icon:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>' },
    banOtr: { color:'#0e7490',     bg:'#ecfeff',            border:'#a5f3fc', label:'BAN OTR', icon:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>' },
    pelumas:{ color:'#7c3aed',     bg:'#ede9fe',            border:'#c4b5fd', label:'PELUMAS',  icon:'<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>' },
    aki:    { color:'#d97706',     bg:'#fffbeb',            border:'#fde68a', label:'AKI',      icon:'<rect x="5" y="7" width="14" height="12" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/>' },
  };
  const isBan     = monitoringCategory === 'ban';
  const isBanOtr  = monitoringCategory === 'banOtr';
  const isPelumas = monitoringCategory === 'pelumas';
  const isAki     = monitoringCategory === 'aki';
  const cat       = CAT[monitoringCategory] || CAT.ban;
  const isMonTab  = monitoringTab === 'monitoring';

  // ── Aktif list (hanya relevan saat kategori BAN) ──────────────────────────
  // Filter data berdasarkan user yang login
  const allVehiclesList = isMonTab ? vehicles : trialVehicles;
  const activeList = currentUser 
    ? allVehiclesList.filter(v => v.createdBy === currentUser.id)
    : allVehiclesList;

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
        <div style="font-size:11px;color:${monitoringCategory===key ? c.color : 'var(--muted)'};opacity:.8;margin-top:1px;">${
          key==='ban' ? ((currentUser ? vehicles.filter(v => v.createdBy === currentUser.id).length + trialVehicles.filter(v => v.createdBy === currentUser.id).length : vehicles.length + trialVehicles.length))+' unit terdaftar'
          : key==='banOtr' ? ((currentUser ? (typeof banOtrRecords!=='undefined'?banOtrRecords.filter(r=>r.createdBy===currentUser.id).length:0)+(typeof banOtrTrialRecords!=='undefined'?banOtrTrialRecords.filter(r=>r.createdBy===currentUser.id).length:0) : (typeof banOtrRecords!=='undefined'?banOtrRecords.length:0)+(typeof banOtrTrialRecords!=='undefined'?banOtrTrialRecords.length:0)))+' catatan'
          : key==='pelumas' ? ((currentUser ? pelumasRecords.filter(r => r.createdBy === currentUser.id).length + pelumasTrialRecords.filter(r => r.createdBy === currentUser.id).length : pelumasRecords.length + pelumasTrialRecords.length))+' catatan'
          : key==='aki' ? ((currentUser ? (typeof akiRecords!=='undefined'?akiRecords.filter(r=>r.createdBy===currentUser.id).length:0)+(typeof akiTrialRecords!=='undefined'?akiTrialRecords.filter(r=>r.createdBy===currentUser.id).length:0) : (typeof akiRecords!=='undefined'?akiRecords.length:0)+(typeof akiTrialRecords!=='undefined'?akiTrialRecords.length:0)))+' catatan'
          : '0 catatan'
        }</div>
      </div>
      ${monitoringCategory===key ? `<div style="margin-left:auto;width:8px;height:8px;border-radius:50%;background:${c.color};flex-shrink:0;"></div>` : ''}
    </button>`).join('')}
  </div>`;

  // ── Sub-tab (monitoring / trial) — tampil untuk semua kategori ─────────────
  function makeSubTab(color, monCount, trialCount) {
    return `
  <div style="display:flex;gap:0;margin-bottom:24px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:5px;width:fit-content;">
    <button onclick="monitoringTab='monitoring';render()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;${isMonTab ? 'background:'+color+';color:white;box-shadow:0 4px 16px rgba(0,0,0,0.15);' : 'background:transparent;color:var(--muted);'}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Monitoring
      <span style="background:${isMonTab?'rgba(255,255,255,0.25)':'#f3f4f6'};color:${isMonTab?'white':'var(--muted)'};font-size:11px;padding:1px 7px;border-radius:20px;font-weight:700;">${monCount}</span>
    </button>
    <button onclick="monitoringTab='trial';render()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;${!isMonTab ? 'background:#2563eb;color:white;box-shadow:0 4px 16px rgba(37,99,235,0.3);' : 'background:transparent;color:var(--muted);'}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
      Trial
      <span style="background:${!isMonTab?'rgba(255,255,255,0.25)':'#f3f4f6'};color:${!isMonTab?'white':'var(--muted)'};font-size:11px;padding:1px 7px;border-radius:20px;font-weight:700;">${trialCount}</span>
    </button>
  </div>`;
  }

  const banMonCount    = currentUser ? vehicles.filter(v=>v.createdBy===currentUser.id).length : vehicles.length;
  const banTrialCount  = currentUser ? trialVehicles.filter(v=>v.createdBy===currentUser.id).length : trialVehicles.length;
  const subTabBar = makeSubTab(isBan ? 'var(--green)' : isBanOtr ? '#0e7490' : isPelumas ? '#7c3aed' : '#d97706',
    isBan ? banMonCount : isBanOtr ? (typeof banOtrRecords!=='undefined'?banOtrRecords.length:0) : isPelumas ? pelumasRecords.length : (typeof akiRecords!=='undefined'?akiRecords.length:0),
    isBan ? banTrialCount : isBanOtr ? (typeof banOtrTrialRecords!=='undefined'?banOtrTrialRecords.length:0) : isPelumas ? pelumasTrialRecords.length : (typeof akiTrialRecords!=='undefined'?akiTrialRecords.length:0)
  );

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
      ${canDoAction('add_vehicle') ? `<button class="btn btn-primary" onclick="openAddVehicleModal('${isMonTab ? 'monitoring' : 'trial'}')" style="${!isMonTab ? 'background:#2563eb;box-shadow:0 4px 12px rgba(37,99,235,0.3);' : ''}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Kendaraan
      </button>` : ''}
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
  // Filter data berdasarkan user yang login
  const allRecs = isPelumasMon ? pelumasRecords : pelumasTrialRecords;
  const activeRecs = currentUser 
    ? allRecs.filter(r => r.createdBy === currentUser.id)
    : allRecs;

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
    ${subTabBar}
    ${pelumasStatsBar}
    ${pelumasTableOrEmpty}
  </div>`;

    // ── Konten BAN OTR ─────────────────────────────────────────────────────────
  const banOtrRecs      = typeof banOtrRecords      !== 'undefined' ? banOtrRecords      : [];
  const banOtrTrialRecs = typeof banOtrTrialRecords !== 'undefined' ? banOtrTrialRecords : [];
  const activeBanOtrRecs = isMonTab
    ? (currentUser ? banOtrRecs.filter(r => r.createdBy === currentUser.id) : banOtrRecs)
    : (currentUser ? banOtrTrialRecs.filter(r => r.createdBy === currentUser.id) : banOtrTrialRecs);

  const totalBanOtr   = activeBanOtrRecs.length;
  const banOtrExpired = activeBanOtrRecs.filter(r => r.nextServiceDate && new Date(r.nextServiceDate) < new Date() && r.status !== 'selesai').length;
  const banOtrSoon    = activeBanOtrRecs.filter(r => { if (!r.nextServiceDate) return false; const d=(new Date(r.nextServiceDate)-new Date())/86400000; return d>=0&&d<=14; }).length;
  const banOtrDone    = activeBanOtrRecs.filter(r => r.status === 'selesai').length;

  function banOtrStatusBadge(r) {
    if (r.status==='selesai') return '<span class="badge good">✓ Selesai</span>';
    if (!r.nextServiceDate) return '<span class="badge" style="background:#f3f4f6;color:var(--muted);border-color:#e5e7eb;">—</span>';
    const diff = (new Date(r.nextServiceDate) - new Date()) / 86400000;
    if (diff < 0)  return '<span class="badge critical">⚠ Terlambat</span>';
    if (diff <= 14) return '<span class="badge warning">⏰ Segera</span>';
    return '<span class="badge good">✓ Terjadwal</span>';
  }

  const banOtrContent = `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:4px;height:28px;background:#0e7490;border-radius:4px;"></div>
        <div>
          <div style="font-size:16px;font-weight:800;font-family:'Syne',sans-serif;">${isMonTab ? 'Monitoring Ban OTR' : 'Trial Ban OTR'}</div>
          <div style="font-size:12px;color:var(--muted);">${isMonTab ? 'Pantau kondisi ban Off The Road pada armada aktif' : 'Uji coba ban OTR baru pada armada'}</div>
        </div>
      </div>
      <button class="btn" style="background:#0e7490;color:white;box-shadow:0 4px 12px rgba(14,116,144,0.3);" onclick="openAddBanOtrModal('${isMonTab?'monitoring':'trial'}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Data Ban OTR
      </button>
    </div>
    ${subTabBar}
    ${totalBanOtr > 0 ? `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Catatan</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;">${totalBanOtr}</div>
      </div>
      <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#164e63;margin-bottom:6px;">Sudah Ganti</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#0e7490;">${banOtrDone}</div>
      </div>
      <div style="background:var(--amber-light);border:1px solid #fde68a;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#78350f;margin-bottom:6px;">Jadwal Dekat</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#b45309;">${banOtrSoon}</div>
      </div>
      <div style="background:var(--rose-light);border:1px solid #fecdd3;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9f1239;margin-bottom:6px;">Terlambat</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:var(--rose);">${banOtrExpired}</div>
      </div>
    </div>` : ''}
    ${totalBanOtr === 0
      ? `<div style="background:var(--surface);border:2px dashed #a5f3fc;border-radius:20px;padding:60px 40px;text-align:center;">
          <div style="width:72px;height:72px;border-radius:20px;background:#ecfeff;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0e7490" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div style="font-size:18px;font-weight:800;font-family:'Syne',sans-serif;color:#0e7490;margin-bottom:8px;">Belum ada data ${isMonTab?'monitoring':'trial'} Ban OTR</div>
          <div style="font-size:14px;color:var(--muted);max-width:360px;margin:0 auto 24px;line-height:1.6;">Tambahkan data Ban OTR untuk memantau jadwal penggantian ban off-the-road armada.</div>
          <button class="btn" style="background:#0e7490;color:white;box-shadow:0 4px 12px rgba(14,116,144,0.3);" onclick="openAddBanOtrModal('${isMonTab?'monitoring':'trial'}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tambah Data Ban OTR
          </button>
        </div>`
      : `<div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;">
          <div style="padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-weight:700;font-size:14px;">Catatan Ban OTR – ${isMonTab ? 'Monitoring' : 'Trial'}</span>
            <span style="font-size:12px;color:var(--muted);">${totalBanOtr} catatan</span>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="text-align:left;padding:11px 20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Plat / Unit</th>
                  <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Merk / Ukuran</th>
                  <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Pasang Terakhir</th>
                  <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Jadwal Berikut</th>
                  <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Odometer</th>
                  <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Status</th>
                  <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${activeBanOtrRecs.map(r => `
                <tr style="border-bottom:1px solid var(--border);transition:background .12s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                  <td style="padding:13px 20px;">
                    <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;">${r.plateNumber}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:2px;">${r.customerName}</div>
                  </td>
                  <td style="padding:13px 14px;">
                    <div style="font-size:13px;font-weight:600;">${r.brand} ${r.type||''}</div>
                    <div style="font-size:11px;color:var(--muted);">Ukuran: ${r.size||'—'}</div>
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
                  <td style="padding:13px 14px;text-align:center;">${banOtrStatusBadge(r)}</td>
                  <td style="padding:13px 14px;text-align:center;">
                    <button style="padding:6px 12px;background:#ecfeff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;color:#0e7490;font-family:'DM Sans',sans-serif;" onclick="deleteBanOtrRecord('${r.id}','${isMonTab?'monitoring':'trial'}')" onmouseover="this.style.background='#a5f3fc'" onmouseout="this.style.background='#ecfeff'">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      Hapus
                    </button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`}
  </div>`;

  // ── Konten AKI ─────────────────────────────────────────────────────────────
  const akiRecs_      = typeof akiRecords      !== 'undefined' ? akiRecords      : [];
  const akiTrialRecs_ = typeof akiTrialRecords !== 'undefined' ? akiTrialRecords : [];
  const activeAkiRecs = isMonTab
    ? (currentUser ? akiRecs_.filter(r => r.createdBy === currentUser.id) : akiRecs_)
    : (currentUser ? akiTrialRecs_.filter(r => r.createdBy === currentUser.id) : akiTrialRecs_);

  const totalAki   = activeAkiRecs.length;
  const akiExpired = activeAkiRecs.filter(r => r.nextServiceDate && new Date(r.nextServiceDate) < new Date() && r.status !== 'selesai').length;
  const akiSoon    = activeAkiRecs.filter(r => { if (!r.nextServiceDate) return false; const d=(new Date(r.nextServiceDate)-new Date())/86400000; return d>=0&&d<=14; }).length;
  const akiDone    = activeAkiRecs.filter(r => r.status === 'selesai').length;

  function akiStatusBadge(r) {
    if (r.status==='selesai') return '<span class="badge good">✓ Selesai</span>';
    if (!r.nextServiceDate) return '<span class="badge" style="background:#f3f4f6;color:var(--muted);border-color:#e5e7eb;">—</span>';
    const diff = (new Date(r.nextServiceDate) - new Date()) / 86400000;
    if (diff < 0)  return '<span class="badge critical">⚠ Terlambat</span>';
    if (diff <= 14) return '<span class="badge warning">⏰ Segera</span>';
    return '<span class="badge good">✓ Terjadwal</span>';
  }

  const akiContent = `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:4px;height:28px;background:#d97706;border-radius:4px;"></div>
        <div>
          <div style="font-size:16px;font-weight:800;font-family:'Syne',sans-serif;">${isMonTab ? 'Monitoring Aki' : 'Trial Aki'}</div>
          <div style="font-size:12px;color:var(--muted);">${isMonTab ? 'Pantau kondisi dan jadwal penggantian aki armada' : 'Uji coba merk aki baru pada armada'}</div>
        </div>
      </div>
      <button class="btn" style="background:#d97706;color:white;box-shadow:0 4px 12px rgba(217,119,6,0.3);" onclick="openAddAkiModal('${isMonTab?'monitoring':'trial'}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Data Aki
      </button>
    </div>
    ${subTabBar}
    ${totalAki > 0 ? `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Total Catatan</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;">${totalAki}</div>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#78350f;margin-bottom:6px;">Sudah Ganti</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#d97706;">${akiDone}</div>
      </div>
      <div style="background:var(--amber-light);border:1px solid #fde68a;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#78350f;margin-bottom:6px;">Jadwal Dekat</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:#b45309;">${akiSoon}</div>
      </div>
      <div style="background:var(--rose-light);border:1px solid #fecdd3;border-radius:16px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9f1239;margin-bottom:6px;">Terlambat</div>
        <div style="font-size:28px;font-family:'DM Mono',monospace;font-weight:500;color:var(--rose);">${akiExpired}</div>
      </div>
    </div>` : ''}
    ${totalAki === 0
      ? `<div style="background:var(--surface);border:2px dashed #fde68a;border-radius:20px;padding:60px 40px;text-align:center;">
          <div style="width:72px;height:72px;border-radius:20px;background:#fffbeb;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.5"><rect x="5" y="7" width="14" height="12" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/></svg>
          </div>
          <div style="font-size:18px;font-weight:800;font-family:'Syne',sans-serif;color:#d97706;margin-bottom:8px;">Belum ada data ${isMonTab?'monitoring':'trial'} aki</div>
          <div style="font-size:14px;color:var(--muted);max-width:360px;margin:0 auto 24px;line-height:1.6;">Tambahkan data aki kendaraan untuk memantau kondisi dan jadwal penggantian.</div>
          <button class="btn" style="background:#d97706;color:white;box-shadow:0 4px 12px rgba(217,119,6,0.3);" onclick="openAddAkiModal('${isMonTab?'monitoring':'trial'}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tambah Data Aki
          </button>
        </div>`
      : `<div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;">
          <div style="padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-weight:700;font-size:14px;">Catatan Aki – ${isMonTab ? 'Monitoring' : 'Trial'}</span>
            <span style="font-size:12px;color:var(--muted);">${totalAki} catatan</span>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="text-align:left;padding:11px 20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Plat / Unit</th>
                  <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Merk / Kapasitas</th>
                  <th style="text-align:left;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Ganti Terakhir</th>
                  <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Jadwal Berikut</th>
                  <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Voltase</th>
                  <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Status</th>
                  <th style="text-align:center;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${activeAkiRecs.map(r => `
                <tr style="border-bottom:1px solid var(--border);transition:background .12s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                  <td style="padding:13px 20px;">
                    <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;">${r.plateNumber}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:2px;">${r.customerName}</div>
                  </td>
                  <td style="padding:13px 14px;">
                    <div style="font-size:13px;font-weight:600;">${r.brand}</div>
                    <div style="font-size:11px;color:var(--muted);">Kapasitas: ${r.capacity||'—'} Ah</div>
                  </td>
                  <td style="padding:13px 14px;">
                    <div style="font-size:13px;">${r.lastServiceDate ? new Date(r.lastServiceDate).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div>
                  </td>
                  <td style="padding:13px 14px;text-align:center;">
                    <div style="font-size:13px;font-weight:600;color:${!r.nextServiceDate?'var(--muted)':new Date(r.nextServiceDate)<new Date()?'var(--rose)':(new Date(r.nextServiceDate)-new Date())<14*86400000?'var(--amber)':'var(--text)'};">${r.nextServiceDate ? new Date(r.nextServiceDate).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div>
                  </td>
                  <td style="padding:13px 14px;text-align:center;">
                    <div style="font-family:'DM Mono',monospace;font-size:13px;">${r.voltage ? r.voltage + ' V' : '—'}</div>
                  </td>
                  <td style="padding:13px 14px;text-align:center;">${akiStatusBadge(r)}</td>
                  <td style="padding:13px 14px;text-align:center;">
                    <button style="padding:6px 12px;background:#fffbeb;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;color:#d97706;font-family:'DM Sans',sans-serif;" onclick="deleteAkiRecord('${r.id}','${isMonTab?'monitoring':'trial'}')" onmouseover="this.style.background='#fde68a'" onmouseout="this.style.background='#fffbeb'">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      Hapus
                    </button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`}
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
    ${isBan ? banContent : isBanOtr ? banOtrContent : isAki ? akiContent : pelumasContent}
  </div>`;
}

function openMonitoringDetail(vehicleId) {
  selectedVehicleId = vehicleId;
  monitoringView = 'detail';
  render();
}

function renderMonitoringDetail(v) {
  const isInTrial = trialVehicles.some(x => x.id === v.id);
  const monitoredTires = v.tires.filter(t => !t.removed && t.measurements && t.measurements.length > 0);
  const hasData = monitoredTires.length > 0;

  if (!window._monDetailTireId || !monitoredTires.find(t => t.id === window._monDetailTireId)) {
    window._monDetailTireId = monitoredTires.length > 0 ? monitoredTires[0].id : null;
  }
  const selectedTire = monitoredTires.find(t => t.id === window._monDetailTireId) || monitoredTires[0];
  const history = selectedTire
    ? [...selectedTire.measurements].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  const fmt = ts => new Date(ts).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
  const fmtTime = ts => new Date(ts).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  const statusStyle = s => s === 'critical'
    ? 'background:var(--rose-light);color:#9f1239;border-color:#fecdd3;'
    : s === 'warning'
    ? 'background:var(--amber-light);color:#78350f;border-color:#fde68a;'
    : 'background:var(--green-light);color:#065f46;border-color:#a7f3d0;';
  const statusLbl = s => s === 'critical' ? 'Kritis' : s === 'warning' ? 'Peringatan' : 'Baik';
  const canEditMeasure = currentUser && (currentUser.role === 'administrator' || currentUser.role === 'supervisor' || currentUser.role === 'technical_support');
  const canEditVehicle = typeof canDoAction === 'function' ? canDoAction('edit_vehicle') : (currentUser.role === 'administrator' || currentUser.role === 'supervisor' || currentUser.role === 'technical_support');
  const canDeleteVehicle = typeof canDoAction === 'function' ? canDoAction('delete_vehicle') : (currentUser.role === 'administrator' || currentUser.role === 'supervisor');

  const historyRows = !selectedTire || history.length === 0
    ? `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted);font-size:13px;">Belum ada data pengecekan untuk ban ini.</td></tr>`
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
            <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;${m.pressure<26?'color:#e11d48;':m.pressure<28?'color:#d97706;':''}">${m.pressure}</div>
            <div style="font-size:9px;color:var(--muted);">PSI</div>
            ${pArrow ? `<div style="font-size:10px;font-weight:700;${pColor}">${pArrow} ${Math.abs(pDiff).toFixed(1)}</div>` : ''}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid var(--border);text-align:center;">
            <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;${m.treadDepth<2?'color:#e11d48;':m.treadDepth<3?'color:#d97706;':''}">${m.treadDepth}</div>
            <div style="font-size:9px;color:var(--muted);">mm NSD</div>
            ${nArrow ? `<div style="font-size:10px;font-weight:700;${nColor}">${nArrow} ${Math.abs(nDiff).toFixed(1)}</div>` : ''}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid var(--border);text-align:center;">
            ${m.odometer ? `<div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;">${m.odometer.toLocaleString('id-ID')}</div><div style="font-size:9px;color:var(--muted);">km</div>` : '<span style="color:var(--muted);font-size:12px;">—</span>'}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid var(--border);text-align:center;">
            <span style="display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;border:1px solid;${statusStyle(ps)}">${statusLbl(ps)}</span>
            ${m.notes ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${m.notes}">📝 ${m.notes}</div>` : ''}
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border);text-align:center;white-space:nowrap;">
            <div style="display:flex;gap:4px;justify-content:center;">
              <button onclick="downloadSingleHistoryPDF('${v.id}','${selectedTire.id}','${m.id}')"
                style="padding:4px 8px;background:#ede9fe;color:#7c3aed;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;"
                title="Download PDF" onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#ede9fe'">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              ${canEditMeasure ? `
              <button onclick="openEditMeasureModal('${v.id}','${selectedTire.id}','${m.id}')"
                style="padding:4px 8px;background:#fef3c7;color:#92400e;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;"
                title="Edit" onmouseover="this.style.background='#fde68a'" onmouseout="this.style.background='#fef3c7'">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onclick="deleteMeasurement('${v.id}','${selectedTire.id}','${m.id}')"
                style="padding:4px 8px;background:#fef2f2;color:#dc2626;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;"
                title="Hapus" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>` : ''}
            </div>
          </td>
        </tr>`;
      }).join('');

  return `
  <div>
    <!-- Back button + header -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;flex-wrap:wrap;">
      <button onclick="monitoringView='list';window._monDetailTireId=null;render()" style="display:inline-flex;align-items:center;gap:7px;padding:9px 16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;color:var(--muted);font-family:'DM Sans',sans-serif;transition:all .15s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='var(--surface)'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Kembali ke Monitoring & Trial
      </button>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${v.plateNumber}</div>
          <span style="font-size:10px;font-weight:800;text-transform:uppercase;padding:3px 10px;border-radius:20px;background:${isInTrial?'#dbeafe':'var(--green-light)'};color:${isInTrial?'#1e40af':'#065f46'};border:1px solid ${isInTrial?'#bfdbfe':'#a7f3d0'};">${isInTrial?'Trial':'Monitoring'}</span>
        </div>
        <div style="font-size:13px;color:var(--muted);margin-top:2px;">${v.make} ${v.model} · ${v.customerName}</div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;">
        ${canEditVehicle && (!v.createdBy || v.createdBy === currentUser.id) ? `<button onclick="openEditVehicleModal('${v.id}')" class="btn" style="background:#f59e0b;color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>` : ''}
        ${canDeleteVehicle ? `<button onclick="confirmDeleteVehicle('${v.id}')" class="btn" style="background:#dc2626;color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Hapus
        </button>` : ''}
        ${selectedTire && history.length > 0 ? `<button onclick="downloadVehicleHistoryPDF('${v.id}','${selectedTire ? selectedTire.id : ''}')" class="btn" style="background:#7c3aed;color:white;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          PDF Semua
        </button>` : ''}
      </div>
    </div>

    <!-- Vehicle info strip -->
    <div class="vehicle-hero" style="margin-bottom:20px;">
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${v.picNumber ? `<span class="meta-chip"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.46 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><strong>PIC:</strong> ${v.picNumber}</span>` : ''}
        ${v.salesCompany ? `<span class="meta-chip" style="background:#fff7ed;border-color:#fed7aa;color:#92400e;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><strong>Sales:</strong> ${v.salesCompany}</span>` : ''}
        <span class="meta-chip"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><strong>${v.tonnage} Ton</strong></span>
        ${v.installDate ? `<span class="meta-chip"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><strong>Pasang:</strong> ${v.installDate}</span>` : ''}
        <span class="meta-chip" style="background:${monitoredTires.length===0?'#f3f4f6':monitoredTires.some(t=>t.status==='critical')?'var(--rose-light)':monitoredTires.some(t=>t.status==='warning')?'var(--amber-light)':'var(--green-light)'};color:${monitoredTires.length===0?'var(--muted)':monitoredTires.some(t=>t.status==='critical')?'#9f1239':monitoredTires.some(t=>t.status==='warning')?'#78350f':'#065f46'};">
          ${monitoredTires.length===0?'— Belum ada data ban':monitoredTires.filter(t=>t.status==='critical').length>0?`⚠ ${monitoredTires.filter(t=>t.status==='critical').length} kritis`:monitoredTires.filter(t=>t.status==='warning').length>0?`⚡ ${monitoredTires.filter(t=>t.status==='warning').length} peringatan`:'✓ Semua ban baik'}
        </span>
      </div>
    </div>

    <!-- Tire cards grid -->
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

    <!-- TABEL RIWAYAT PENGECEKAN -->
    ${hasData && selectedTire ? `
    <div class="card" style="overflow:hidden;margin-top:20px;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:14px;font-weight:700;">Riwayat Pengecekan — <span style="color:var(--green);">${selectedTire.position}</span></div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${selectedTire.brand} ${selectedTire.model} · Pasang: ${selectedTire.installDate||'—'}${selectedTire.price?` · Harga: Rp ${selectedTire.price.toLocaleString('id-ID')}`:''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="position:relative;">
            <select onchange="window._monDetailTireId=this.value;render()"
              style="appearance:none;-webkit-appearance:none;padding:9px 36px 9px 14px;border-radius:12px;border:1px solid var(--border);background:var(--surface);font-size:13px;font-family:'DM Sans',sans-serif;font-weight:600;color:var(--text);cursor:pointer;outline:none;min-width:180px;">
              ${monitoredTires.map(t => `<option value="${t.id}" ${t.id === selectedTire.id ? 'selected' : ''}>${t.position} — ${t.brand}</option>`).join('')}
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
              <th style="text-align:center;padding:10px 14px;background:#f9fafb;border-bottom:2px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);">Aksi</th>
            </tr>
          </thead>
          <tbody>${historyRows}</tbody>
        </table>
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

  // ── TECHNICAL SUPPORT: tampilkan notifikasi klaim ─────────────────────────
  if (currentUser.role === 'technical_support') return renderAlertsTechSupport();

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

function renderAlertsTechSupport() {
  // Filter notifikasi: sembunyikan yang sudah diambil oleh tech support lain
  const myNotifs = TECH_NOTIFICATIONS.filter(n => {
    const claim = CLAIMS.find(c => c.id === n.claimId);
    
    // Sembunyikan jika sudah selesai diproses (punya foto & done)
    if (claim && claim.processPhotos && claim.processPhotos.length > 0 && claim.processDone) {
      return false;
    }
    
    // Jika klaim sudah diambil oleh orang lain, sembunyikan
    if (n.takenBy && n.takenBy !== currentUser.id) {
      return false;
    }
    
    return true;
  });
  const unread = myNotifs.filter(n => !n.takenBy && !n.read).length;

  const notifCards = myNotifs.length === 0
    ? `<div class="empty-state" style="padding:60px 20px;">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <p style="margin-top:14px;font-weight:600;">Semua klaim telah diproses.</p>
        <p style="margin-top:4px;font-size:12px;color:var(--muted);">Notifikasi klaim baru akan muncul di sini saat Administrator/Supervisor membuat klaim baru.</p>
      </div>`
    : myNotifs.map(n => {
        const isTaken   = !!n.takenBy;
        const isMine    = isTaken && n.takenBy === currentUser.id;
        const takenTime = n.takenAt ? new Date(n.takenAt).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
        const claim     = CLAIMS.find(c => c.id === n.claimId);
        const photoCount = claim && claim.processPhotos ? claim.processPhotos.length : 0;

        return `
        <div style="background:var(--surface);border:1.5px solid ${isMine ? '#a7f3d0' : isTaken ? '#e5e7eb' : '#bfdbfe'};border-radius:16px;padding:18px 20px;margin-bottom:12px;transition:box-shadow .15s,transform .15s;" onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="display:flex;align-items:flex-start;gap:14px;">
            <div style="width:42px;height:42px;border-radius:12px;background:${isMine ? 'var(--green-light)' : isTaken ? '#f3f4f6' : 'var(--blue-light)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isMine ? 'var(--green)' : isTaken ? '#9ca3af' : 'var(--blue)'}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--muted);">${n.ticket}</span>
                <span style="font-weight:800;font-size:14px;">${n.plate}</span>
                <span style="color:var(--muted);">•</span>
                <span style="font-size:13px;color:var(--muted);">${n.customer}</span>
              </div>
              <div style="font-size:13px;color:var(--text);margin-bottom:4px;">${n.pos} — <strong>${n.reason}</strong></div>
              <div style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <span>📅 ${n.date}</span>
                <span>👤 Dibuat oleh <strong>${n.createdBy}</strong></span>
                ${photoCount > 0 ? `<span style="color:var(--green);font-weight:700;">📷 ${photoCount}/20 foto</span>` : ''}
              </div>
              ${isTaken ? `
              <div style="margin-top:10px;padding:8px 12px;border-radius:10px;background:${isMine ? 'var(--green-light)' : '#f3f4f6'};border:1px solid ${isMine ? '#a7f3d0' : '#e5e7eb'};font-size:12px;font-weight:700;color:${isMine ? '#065f46' : 'var(--muted)'};display:flex;align-items:center;gap:6px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Diambil oleh <strong style="margin-left:3px;">${n.takenByName}</strong>${isMine ? ' (Anda)' : ''} &nbsp;·&nbsp; ${takenTime}
              </div>` : ''}
            </div>
            <div style="flex-shrink:0;display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
              ${!isTaken
                ? `<button onclick="takeClaim('${n.claimId}')" style="display:inline-flex;align-items:center;gap:7px;padding:10px 18px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 3px 10px rgba(37,99,235,0.3);transition:all .15s;white-space:nowrap;" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 16px rgba(37,99,235,0.4)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 3px 10px rgba(37,99,235,0.3)'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Ambil
                  </button>`
                : isMine
                  ? `<button onclick="openProcessClaimModal('${n.claimId}')" style="display:inline-flex;align-items:center;gap:7px;padding:10px 18px;background:linear-gradient(135deg,#059669,#047857);color:white;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 3px 10px rgba(5,150,105,0.3);transition:all .15s;white-space:nowrap;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Proses & Upload Foto
                    </button>`
                  : `<span style="font-size:11px;font-weight:700;padding:5px 11px;border-radius:20px;background:#f3f4f6;color:var(--muted);border:1px solid #e5e7eb;">Sudah Diambil</span>`
              }
            </div>
          </div>
        </div>`;
      }).join('');

  return `
  <div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="page-title">Notifikasi Klaim</div>
        <div class="page-sub">Klaim yang perlu ditangani oleh Technical Support.</div>
      </div>
      ${unread > 0 ? `<div style="padding:8px 14px;background:var(--blue-light);border:1px solid #bfdbfe;border-radius:12px;font-size:12px;font-weight:700;color:#1e40af;display:flex;align-items:center;gap:6px;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        ${unread} klaim baru belum diambil
      </div>` : ''}
    </div>
    <div style="padding:10px 14px;background:var(--blue-light);border:1px solid #bfdbfe;border-radius:12px;font-size:12px;color:#1e40af;font-weight:600;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Ambil klaim → Upload foto proses (max 20) → Simpan → Notifikasi hilang & menunggu keputusan Admin/Supervisor.
    </div>
    ${notifCards}
  </div>`;
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

// currentUser dideklarasikan di core/state.js dan diisi oleh core/database.js


// ====== BAN OTR FUNCTIONS ======
function openAddBanOtrModal(target) {
  if (typeof banOtrRecords === 'undefined') window.banOtrRecords = [];
  if (typeof banOtrTrialRecords === 'undefined') window.banOtrTrialRecords = [];
  window._activeBanOtrTarget = target || 'monitoring';
  const today = new Date().toISOString().split('T')[0];
  const next  = new Date(); next.setMonth(next.getMonth() + 6);
  const modal = document.getElementById('modal-add-banotr');
  if (!modal) { _renderBanOtrModal(); setTimeout(() => openAddBanOtrModal(target), 50); return; }
  document.getElementById('banotr-plate').value = '';
  document.getElementById('banotr-customer').value = '';
  document.getElementById('banotr-brand').value = '';
  document.getElementById('banotr-type').value = '';
  document.getElementById('banotr-size').value = '';
  document.getElementById('banotr-odometer').value = '';
  document.getElementById('banotr-last-date').value = today;
  document.getElementById('banotr-next-date').value = next.toISOString().split('T')[0];
  document.getElementById('banotr-status').value = 'terjadwal';
  document.getElementById('banotr-notes').value = '';
  modal.classList.add('open');
}
function closeAddBanOtrModal() {
  const m = document.getElementById('modal-add-banotr');
  if (m) m.classList.remove('open');
}
function submitAddBanOtr() {
  const plate    = document.getElementById('banotr-plate').value.trim();
  const customer = document.getElementById('banotr-customer').value.trim();
  const brand    = document.getElementById('banotr-brand').value.trim();
  if (!plate || !customer || !brand) { alert('Harap isi Nomor Plat, Customer, dan Merk.'); return; }
  const rec = {
    id: randId(), plateNumber: plate.toUpperCase(), customerName: customer,
    brand, type: document.getElementById('banotr-type').value.trim(),
    size: document.getElementById('banotr-size').value.trim(),
    odometer: parseInt(document.getElementById('banotr-odometer').value) || null,
    lastServiceDate: document.getElementById('banotr-last-date').value || null,
    nextServiceDate: document.getElementById('banotr-next-date').value || null,
    status: document.getElementById('banotr-status').value,
    notes: document.getElementById('banotr-notes').value.trim(),
    createdAt: new Date().toISOString(), createdBy: currentUser ? currentUser.id : null,
  };
  if (window._activeBanOtrTarget === 'trial') {
    if (typeof banOtrTrialRecords === 'undefined') window.banOtrTrialRecords = [];
    banOtrTrialRecords.push(rec); monitoringTab = 'trial';
    supaUpsert('ban_otr_trial_records', rec.id, rec);
  } else {
    if (typeof banOtrRecords === 'undefined') window.banOtrRecords = [];
    banOtrRecords.push(rec); monitoringTab = 'monitoring';
    supaUpsert('ban_otr_records', rec.id, rec);
  }
  closeAddBanOtrModal();
  monitoringCategory = 'banOtr';
  render();
  _showToastMonitoring('✓ Data Ban OTR berhasil disimpan', '#0e7490');
}
function deleteBanOtrRecord(id, target) {
  if (!confirm('Hapus data Ban OTR ini?')) return;
  if (target === 'trial') { banOtrTrialRecords = banOtrTrialRecords.filter(r => r.id !== id); supaDelete('ban_otr_trial_records', id); }
  else { banOtrRecords = banOtrRecords.filter(r => r.id !== id); supaDelete('ban_otr_records', id); }
  render();
}

// ====== AKI FUNCTIONS ======
function openAddAkiModal(target) {
  if (typeof akiRecords === 'undefined') window.akiRecords = [];
  if (typeof akiTrialRecords === 'undefined') window.akiTrialRecords = [];
  window._activeAkiTarget = target || 'monitoring';
  const today = new Date().toISOString().split('T')[0];
  const next  = new Date(); next.setMonth(next.getMonth() + 12);
  const modal = document.getElementById('modal-add-aki');
  if (!modal) { render(); setTimeout(() => openAddAkiModal(target), 50); return; }
  document.getElementById('aki-plate').value = '';
  document.getElementById('aki-customer').value = '';
  document.getElementById('aki-brand').value = '';
  document.getElementById('aki-capacity').value = '';
  document.getElementById('aki-voltage').value = '';
  document.getElementById('aki-last-date').value = today;
  document.getElementById('aki-next-date').value = next.toISOString().split('T')[0];
  document.getElementById('aki-status').value = 'terjadwal';
  document.getElementById('aki-notes').value = '';
  modal.classList.add('open');
}
function closeAddAkiModal() {
  const m = document.getElementById('modal-add-aki');
  if (m) m.classList.remove('open');
}
function submitAddAki() {
  const plate    = document.getElementById('aki-plate').value.trim();
  const customer = document.getElementById('aki-customer').value.trim();
  const brand    = document.getElementById('aki-brand').value.trim();
  if (!plate || !customer || !brand) { alert('Harap isi Nomor Plat, Customer, dan Merk.'); return; }
  const rec = {
    id: randId(), plateNumber: plate.toUpperCase(), customerName: customer, brand,
    capacity: document.getElementById('aki-capacity').value.trim(),
    voltage:  document.getElementById('aki-voltage').value.trim(),
    lastServiceDate: document.getElementById('aki-last-date').value || null,
    nextServiceDate: document.getElementById('aki-next-date').value || null,
    status: document.getElementById('aki-status').value,
    notes: document.getElementById('aki-notes').value.trim(),
    createdAt: new Date().toISOString(), createdBy: currentUser ? currentUser.id : null,
  };
  if (window._activeAkiTarget === 'trial') {
    if (typeof akiTrialRecords === 'undefined') window.akiTrialRecords = [];
    akiTrialRecords.push(rec); monitoringTab = 'trial';
    supaUpsert('aki_trial_records', rec.id, rec);
  } else {
    if (typeof akiRecords === 'undefined') window.akiRecords = [];
    akiRecords.push(rec); monitoringTab = 'monitoring';
    supaUpsert('aki_records', rec.id, rec);
  }
  closeAddAkiModal();
  monitoringCategory = 'aki';
  render();
  _showToastMonitoring('✓ Data Aki berhasil disimpan', '#d97706');
}
function deleteAkiRecord(id, target) {
  if (!confirm('Hapus data Aki ini?')) return;
  if (target === 'trial') { akiTrialRecords = akiTrialRecords.filter(r => r.id !== id); supaDelete('aki_trial_records', id); }
  else { akiRecords = akiRecords.filter(r => r.id !== id); supaDelete('aki_records', id); }
  render();
}

function _showToastMonitoring(msg, color) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${color};color:white;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity .3s;white-space:nowrap;font-family:'DM Sans',sans-serif;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2200);
}
