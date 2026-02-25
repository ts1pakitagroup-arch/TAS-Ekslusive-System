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
        const canEditMeasure = currentUser && (currentUser.role === 'administrator' || currentUser.role === 'supervisor' || currentUser.role === 'technical_support');
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
      <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;">
        ${currentUser.role !== 'viewer' ? `<button onclick="selectVehicle('${v.id}');navigate('monitoring')" class="btn" style="background:var(--blue);color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Input Pengecekan
        </button>` : ''}
        ${((currentUser.role === 'administrator' || currentUser.role === 'supervisor' || currentUser.role === 'technical_support') && (!v.createdBy || v.createdBy === currentUser.id)) ? `<button onclick="openEditVehicleModal('${v.id}')" class="btn" style="background:#f59e0b;color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>` : ''}
        ${(currentUser.role === 'administrator' || currentUser.role === 'supervisor') ? `<button onclick="confirmDeleteVehicle('${v.id}')" class="btn" style="background:#dc2626;color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Hapus
        </button>` : ''}
      </div>
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
        ${selectedTire && history.length > 0 ? `<button onclick="downloadVehicleHistoryPDF('${v.id}', '${selectedTire.id}')" class="btn" style="background:#7c3aed;color:white;font-size:12px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download PDF
        </button>` : ''}
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
              <th style="text-align:center;padding:10px 14px;background:#f9fafb;border-bottom:2px solid var(--border);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${historyRows}
          </tbody>
        </table>
      </div>
`;
}
