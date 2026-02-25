function canEditClaim() {
  return currentUser.role === 'administrator' || currentUser.role === 'supervisor';
}
function isViewerOnly() {
  return currentUser.role === 'viewer';
}

// CLAIMS, TECH_NOTIFICATIONS, USER_NOTIFICATIONS dideklarasikan di core/state.js

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
        ${c.processDone ? `<span style="font-size:10px;font-weight:700;color:var(--green);display:flex;align-items:center;gap:3px;margin-top:2px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Diproses: ${c.processedBy}</span>` : ''}
        ${canEdit && c.processDone && c.processPhotos && c.processPhotos.length > 0 ? `<button onclick="openClaimPhotoViewer('${c.id}')" style="font-size:11px;font-weight:700;color:var(--blue);background:var(--blue-light);border:1px solid #bfdbfe;border-radius:8px;padding:4px 10px;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif;margin-top:2px;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Lihat ${c.processPhotos.length} Foto
        </button>` : ''}
        ${canEdit && !c.processDone ? `<span style="font-size:10px;color:var(--muted);">Diubah oleh ${currentUser.name}</span>` : ''}
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
      ${(currentUser.role === 'administrator' || currentUser.role === 'supervisor' || currentUser.role === 'sales' || currentUser.role === 'sales_counter')
        ? `<button class="btn btn-primary" onclick="openBuatKlaimModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${(currentUser.role === 'sales' || currentUser.role === 'sales_counter') ? 'Pengajuan Klaim' : 'Buat Klaim Baru'}
          </button>`
        : ''
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
    // ✅ Persisten — penerima menerima notif walau sedang offline
    if (typeof pushNotifToUser === 'function') pushNotifToUser(_uc.submittedBy, notif);
  }
  closeResolveModal();
  if (isFinal) { claimActiveTab = 'hasil'; claimResultQuery = ''; }
  render();
}

// ====== BUAT KLAIM BARU (ADMIN / SUPERVISOR) ======
// TECH_NOTIFICATIONS dan USER_NOTIFICATIONS dideklarasikan di core/state.js
let _activeProcessClaimId = null;  // klaim yang sedang dibuka di modal proses
let _processClaimPhotos = [];      // foto-foto proses (max 20)

function openBuatKlaimModal() {
  if (currentUser.role !== 'administrator' && currentUser.role !== 'supervisor' && currentUser.role !== 'sales' && currentUser.role !== 'sales_counter') return;
  
  // Update teks modal berdasarkan role
  const isSales = currentUser.role === 'sales' || currentUser.role === 'sales_counter';
  const titleEl = document.getElementById('modal-klaim-title');
  const subtitleEl = document.getElementById('modal-klaim-subtitle');
  const infoEl = document.getElementById('modal-klaim-info');
  const btnTextEl = document.getElementById('btn-submit-klaim-text');
  
  if (isSales) {
    if (titleEl) titleEl.textContent = 'Pengajuan Klaim';
    if (subtitleEl) subtitleEl.textContent = 'Pengajuan akan dikirim ke Administrator/Supervisor untuk disetujui.';
    if (infoEl) {
      infoEl.style.background = '#fef3c7';
      infoEl.style.borderColor = '#fde68a';
      infoEl.style.color = '#92400e';
      infoEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Pengajuan Anda akan masuk status Pending dan menunggu persetujuan Administrator/Supervisor.';
    }
    if (btnTextEl) btnTextEl.textContent = 'Kirim Pengajuan Klaim';
  } else {
    if (titleEl) titleEl.textContent = 'Buat Klaim Baru';
    if (subtitleEl) subtitleEl.textContent = 'Klaim akan langsung berstatus Pending dan dikirim ke Technical Support.';
    if (infoEl) {
      infoEl.style.background = 'var(--blue-light)';
      infoEl.style.borderColor = '#bfdbfe';
      infoEl.style.color = '#1e40af';
      infoEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Setelah dibuat, notifikasi otomatis dikirim ke semua Technical Support untuk diproses.';
    }
    if (btnTextEl) btnTextEl.textContent = 'Buat Klaim & Kirim Notifikasi';
  }
  
  // Reset form
  ['bk-plate','bk-customer','bk-pos','bk-reason','bk-brand','bk-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('modal-buat-klaim').classList.add('open');
}

function closeBuatKlaimModal() {
  document.getElementById('modal-buat-klaim').classList.remove('open');
}

function submitBuatKlaim() {
  const plate    = document.getElementById('bk-plate').value.trim();
  const customer = document.getElementById('bk-customer').value.trim();
  const pos      = document.getElementById('bk-pos').value;
  const reason   = document.getElementById('bk-reason').value;
  if (!plate || !customer || !pos || !reason) {
    alert('Harap isi Nomor Plat, Customer, Posisi Ban, dan Jenis Kerusakan.');
    return;
  }
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  const num   = String(CLAIMS.length + 1).padStart(3, '0');
  const ticket = 'CLM-' + now.getFullYear() + '-' + num;

  // Cek apakah dari sales/sales_counter
  const isSalesSubmission = currentUser.role === 'sales' || currentUser.role === 'sales_counter';

  const newClaim = {
    id: 'C' + Date.now(),
    ticket,
    customer,
    plate: plate.toUpperCase(),
    pos,
    reason,
    brand: document.getElementById('bk-brand').value.trim(),
    notes: document.getElementById('bk-notes').value.trim(),
    status: 'Pending',
    date: today,
    resolvedDate: null,
    resolvedNote: '',
    resolvedBy: null,
    createdBy: currentUser.name,
    createdByRole: currentUser.role,
    takenBy: null,
    takenByName: null,
    takenAt: null,
    needsApproval: isSalesSubmission, // true untuk sales, false untuk admin/supervisor
    submittedBy: isSalesSubmission ? currentUser.id : null, // track siapa yang submit
    approvedBy: null,
    approvedAt: null
  };

  CLAIMS.unshift(newClaim);
  supaUpsertClaim(newClaim);

  // Hanya kirim notifikasi ke tech support jika dari admin/supervisor
  if (!isSalesSubmission) {
    sendTechNotification(newClaim);
  }

  closeBuatKlaimModal();
  render();

  const toast = document.createElement('div');
  if (isSalesSubmission) {
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#d97706;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(217,119,6,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;white-space:nowrap;';
    toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Pengajuan klaim terkirim — menunggu persetujuan Admin/Supervisor';
  } else {
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#059669,#065f46);color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(5,150,105,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;white-space:nowrap;';
    toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Klaim dibuat — notifikasi dikirim ke Technical Support';
  }
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
}

function sendTechNotification(claim) {
  // Legacy: simpan ke tech_notifications (saat online)
  const legacyNotif = {
    id: 'TN-' + Date.now(),
    claimId: claim.id,
    ticket: claim.ticket,
    plate: claim.plate,
    customer: claim.customer,
    pos: claim.pos,
    reason: claim.reason,
    createdBy: claim.createdBy,
    createdByRole: claim.createdByRole,
    date: claim.date,
    takenBy: null,
    takenByName: null,
    takenAt: null,
    read: false
  };
  TECH_NOTIFICATIONS.unshift(legacyNotif);
  supaUpsertTechNotif(legacyNotif);

  // ✅ BARU: kirim persisten ke SETIAP technical support (terima walau sedang offline)
  if (typeof pushNotifToAllTechSupport === 'function') {
    pushNotifToAllTechSupport({
      type:    'claim_task',
      title:   '🔧 Tugas Klaim Baru: ' + (claim.plate || ''),
      desc:    (claim.ticket || '') + ' · ' + (claim.plate || '') + ' — ' + (claim.customer || ''),
      note:    (claim.pos || '') + ' · ' + (claim.reason || ''),
      claimId: claim.id,
      date:    claim.date || new Date().toISOString().split('T')[0],
    });
  }
}

function takeClaim(claimId) {
  // Hanya technical support yang bisa ambil
  if (currentUser.role !== 'technical_support') return;

  const claim = CLAIMS.find(c => c.id === claimId);
  if (!claim) return;
  if (claim.takenBy) {
    alert('Klaim ini sudah diambil oleh ' + claim.takenByName + '.');
    return;
  }

  const now = new Date();
  const updatedClaim = {
    ...claim,
    status: 'In Progress',
    takenBy: currentUser.id,
    takenByName: currentUser.name,
    takenAt: now.toISOString()
  };
  CLAIMS = CLAIMS.map(c => c.id === claimId ? updatedClaim : c);
  supaUpsertClaim(updatedClaim);

  // Update semua tech notifikasi untuk klaim ini → tampilkan "Diambil oleh"
  TECH_NOTIFICATIONS = TECH_NOTIFICATIONS.map(n => {
    if (n.claimId !== claimId) return n;
    const updated = { ...n, takenBy: currentUser.id, takenByName: currentUser.name, takenAt: now.toISOString(), read: true };
    supaUpsertTechNotif(updated);
    return updated;
  });

  render();

  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(37,99,235,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;white-space:nowrap;';
  toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> Klaim berhasil diambil — menjadi tanggung jawab Anda';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
}

// ====== PROSES KLAIM (TECHNICAL SUPPORT) ======
function openProcessClaimModal(claimId) {
  if (currentUser.role !== 'technical_support') return;
  const claim = CLAIMS.find(c => c.id === claimId);
  if (!claim) return;
  if (claim.takenBy !== currentUser.id) {
    alert('Klaim ini bukan tugas Anda.');
    return;
  }
  _activeProcessClaimId = claimId;
  // Load existing photos if any
  _processClaimPhotos = claim.processPhotos ? [...claim.processPhotos] : [];
  renderProcessClaimModal();
  document.getElementById('modal-process-claim').classList.add('open');
}

function closeProcessClaimModal() {
  document.getElementById('modal-process-claim').classList.remove('open');
  _activeProcessClaimId = null;
  _processClaimPhotos = [];
}

function renderProcessClaimModal() {
  const claim = CLAIMS.find(c => c.id === _activeProcessClaimId);
  if (!claim) return;

  // Update header info
  const infoEl = document.getElementById('pc-claim-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <span style="font-family:'DM Mono',monospace;font-size:11px;font-weight:500;color:var(--muted);">${claim.ticket}</span>
      <span style="font-weight:800;margin-left:6px;">${claim.plate}</span>
      <span style="color:var(--muted);margin:0 6px;">•</span>
      <span style="font-size:13px;color:var(--muted);">${claim.customer}</span>
      <span style="color:var(--muted);margin:0 6px;">•</span>
      <span style="font-size:13px;">${claim.pos} — ${claim.reason}</span>`;
  }

  // Update photo count
  const countEl = document.getElementById('pc-photo-count');
  if (countEl) countEl.textContent = _processClaimPhotos.length + '/20 foto';

  // Render photo grid
  const gridEl = document.getElementById('pc-photo-grid');
  if (!gridEl) return;

  let gridHTML = '';
  _processClaimPhotos.forEach((src, i) => {
    gridHTML += `
      <div style="position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;background:#f3f4f6;">
        <img src="${src}" style="width:100%;height:100%;object-fit:cover;" />
        <button onclick="removeProcessPhoto(${i})" style="position:absolute;top:5px;right:5px;width:22px;height:22px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;line-height:1;" title="Hapus foto">✕</button>
        <div style="position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,0.5);color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;">${i+1}</div>
      </div>`;
  });

  // Tambah tombol upload jika belum 20 foto
  if (_processClaimPhotos.length < 20) {
    gridHTML += `
      <label style="aspect-ratio:1;border:2px dashed var(--border);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;gap:6px;transition:border-color .15s,background .15s;background:var(--surface);" onmouseover="this.style.borderColor='var(--green)';this.style.background='var(--green-light)'" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface)'">
        <input type="file" accept="image/*" multiple style="display:none;" onchange="handleProcessPhoto(event)" />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        <span style="font-size:11px;font-weight:600;color:var(--muted);">Tambah Foto</span>
      </label>`;
  }

  gridEl.innerHTML = gridHTML;

  // Update save button state
  const saveBtn = document.getElementById('pc-save-btn');
  if (saveBtn) {
    const hasPhotos = _processClaimPhotos.length > 0;
    saveBtn.disabled = !hasPhotos;
    saveBtn.style.opacity = hasPhotos ? '1' : '0.5';
    saveBtn.style.cursor = hasPhotos ? 'pointer' : 'not-allowed';
  }
}

function handleProcessPhoto(event) {
  const files = Array.from(event.target.files);
  const remaining = 20 - _processClaimPhotos.length;
  const toProcess = files.slice(0, remaining);

  if (files.length > remaining) {
    alert('Maksimal 20 foto. Hanya ' + remaining + ' foto pertama yang akan ditambahkan.');
  }

  let loaded = 0;
  toProcess.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      _processClaimPhotos.push(e.target.result);
      loaded++;
      if (loaded === toProcess.length) renderProcessClaimModal();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

function removeProcessPhoto(index) {
  _processClaimPhotos.splice(index, 1);
  renderProcessClaimModal();
}

function submitProcessClaim() {
  if (!_activeProcessClaimId) return;
  if (_processClaimPhotos.length === 0) {
    alert('Upload minimal 1 foto proses sebelum menyimpan.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const notesEl = document.getElementById('pc-notes');
  const updatedClaim = {
    ...CLAIMS.find(c => c.id === _activeProcessClaimId),
    processPhotos: [..._processClaimPhotos],
    processNotes: notesEl ? notesEl.value.trim() : '',
    processDone: true,
    processedBy: currentUser.name,
    processedAt: new Date().toISOString(),
    processedDate: today,
    // Status tetap In Progress, menunggu keputusan admin/supervisor
    status: 'In Progress'
  };

  CLAIMS = CLAIMS.map(c => c.id === _activeProcessClaimId ? updatedClaim : c);
  supaUpsertClaim(updatedClaim);

  // Update badge (notifikasi hilang dari tampilan TS karena processDone=true)
  updateAlertBadge();

  closeProcessClaimModal();
  render();

  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#059669,#047857);color:white;padding:14px 24px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(5,150,105,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;max-width:90vw;';
  toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> ${_processClaimPhotos.length} foto berhasil disimpan — menunggu keputusan Administrator/Supervisor`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
}

// ====== PENGAJUAN KLAIM (SALES) ======
function openClaimPhotoViewer(claimId) {
  const claim = CLAIMS.find(c => c.id === claimId);
  if (!claim || !claim.processPhotos || !claim.processPhotos.length) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:99999;display:flex;flex-direction:column;overflow:hidden;';

  const header = `
    <div style="padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.1);">
      <div>
        <div style="color:white;font-weight:800;font-size:16px;font-family:'Syne',sans-serif;">Foto Proses — ${claim.ticket}</div>
        <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:2px;">${claim.plate} · ${claim.customer} · Diproses oleh ${claim.processedBy} · ${claim.processedDate}</div>
      </div>
      <button onclick="this.closest('[style*="position:fixed"]').remove()" style="width:36px;height:36px;background:rgba(255,255,255,0.1);border:none;border-radius:10px;cursor:pointer;color:white;font-size:18px;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>`;

  const grid = `
    <div style="flex:1;overflow-y:auto;padding:20px 24px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
        ${claim.processPhotos.map((src,i) => `
          <div style="position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1;cursor:pointer;" onclick="openPhotoLightbox('${claimId}',${i})">
            <img src="${src}" style="width:100%;height:100%;object-fit:cover;" />
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.6));padding:8px;color:white;font-size:11px;font-weight:700;">Foto ${i+1}</div>
          </div>`).join('')}
      </div>
    </div>`;

  overlay.innerHTML = header + grid;
  document.body.appendChild(overlay);
}

let _lightboxClaimId = null;
let _lightboxIndex   = 0;
function openPhotoLightbox(claimId, index) {
  _lightboxClaimId = claimId;
  _lightboxIndex   = index;
  renderLightbox();
}

function renderLightbox() {
  let lb = document.getElementById('_photo_lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = '_photo_lightbox';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.97);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
    document.body.appendChild(lb);
  }
  const claim = CLAIMS.find(c => c.id === _lightboxClaimId);
  if (!claim || !claim.processPhotos) return;
  const total = claim.processPhotos.length;
  const src   = claim.processPhotos[_lightboxIndex];
  lb.innerHTML = `
    <div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;">${_lightboxIndex+1} / ${total}</div>
    <button onclick="document.getElementById('_photo_lightbox').remove()" style="position:absolute;top:14px;right:18px;width:36px;height:36px;background:rgba(255,255,255,0.1);border:none;border-radius:10px;cursor:pointer;color:white;font-size:18px;">✕</button>
    ${_lightboxIndex > 0 ? `<button onclick="_lightboxIndex--;renderLightbox()" style="position:absolute;left:18px;top:50%;transform:translateY(-50%);width:44px;height:44px;background:rgba(255,255,255,0.12);border:none;border-radius:50%;cursor:pointer;color:white;font-size:22px;display:flex;align-items:center;justify-content:center;">‹</button>` : ''}
    ${_lightboxIndex < total-1 ? `<button onclick="_lightboxIndex++;renderLightbox()" style="position:absolute;right:18px;top:50%;transform:translateY(-50%);width:44px;height:44px;background:rgba(255,255,255,0.12);border:none;border-radius:50%;cursor:pointer;color:white;font-size:22px;display:flex;align-items:center;justify-content:center;">›</button>` : ''}
    <img src="${src}" style="max-width:90vw;max-height:85vh;object-fit:contain;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.8);" />`;
}

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
  // Status tetap Pending, tapi needsApproval jadi false dan kirim notif ke tech support
  const updatedClaim = Object.assign({}, claim, { 
    needsApproval: false, 
    approvedBy: currentUser.name, 
    approvedAt: new Date().toISOString() 
  });
  CLAIMS = CLAIMS.map(function(c) { return c.id !== claimId ? c : updatedClaim; });
  supaUpsertClaim(updatedClaim);
  
  // Kirim notifikasi ke sales yang submit (legacy + persisten)
  if (claim && claim.submittedBy) {
    const notif = { id: 'SN-' + Date.now(), type: 'claim', status: 'Approved',
      title: 'Pengajuan Klaim Disetujui',
      desc: (claim.ticket || '') + ' · ' + claim.plate + ' — ' + claim.customer,
      note: 'Klaim disetujui oleh ' + currentUser.name + '. Menunggu Technical Support mengambil tugas.',
      submittedBy: claim.submittedBy, date: new Date().toISOString().split('T')[0], read: false };
    SALES_NOTIFICATIONS.unshift(notif); supaUpsertNotif(notif);
    // ✅ Persisten — sales menerima notif walau sedang offline
    if (typeof pushNotifToUser === 'function') pushNotifToUser(claim.submittedBy, notif);
  }
  
  // Kirim notifikasi ke semua technical support
  sendTechNotification(updatedClaim);
  
  render();
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(5,150,105,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;white-space:nowrap;';
  toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Pengajuan disetujui — notifikasi dikirim ke Technical Support';
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
    // ✅ Persisten — sales menerima notif walau sedang offline
    if (typeof pushNotifToUser === 'function') pushNotifToUser(claim.submittedBy, notif);
  }
  render();
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#e11d48;color:white;padding:12px 22px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(225,29,72,0.4);display:flex;align-items:center;gap:10px;transition:opacity .3s;white-space:nowrap;';
  toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Pengajuan klaim ditolak';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity='0'; setTimeout(function(){toast.remove();},400); }, 2800);
}

// ====== DUTY ======
// DUTIES dideklarasikan di core/state.js (const DUTIES = [])
// SALES_NOTIFICATIONS dideklarasikan di core/state.js

