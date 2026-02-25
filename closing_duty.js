// ====== CLOSING DATA ======
function renderClosing() {
  const allClosed = typeof closedTires !== 'undefined' ? [...closedTires] : [];

  // Search filter
  if (!window._closingSearch) window._closingSearch = '';
  const filtered = allClosed.filter(c => {
    if (!window._closingSearch) return true;
    const q = window._closingSearch.toLowerCase();
    return (c.plateNumber||'').toLowerCase().includes(q)
      || (c.customerName||'').toLowerCase().includes(q)
      || (c.position||'').toLowerCase().includes(q)
      || (c.brand||'').toLowerCase().includes(q);
  });

  return `
  <div style="padding:20px;max-width:1000px;margin:0 auto;">

    <!-- Header -->
    <div style="margin-bottom:20px;">
      <h2 style="margin:0;font-size:20px;font-weight:800;color:var(--text);">✅ Closing Data</h2>
      <p style="margin:4px 0 0;font-size:13px;color:var(--muted);">Riwayat ban yang telah dilepas dari kendaraan</p>
    </div>

    <!-- Stat Cards -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:var(--card);border-radius:14px;padding:16px 18px;border:1px solid var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Total Ban Dilepas</div>
        <div style="font-size:28px;font-weight:800;color:#7c3aed;margin-top:4px;">${allClosed.length}</div>
      </div>
      <div style="background:var(--card);border-radius:14px;padding:16px 18px;border:1px solid var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Unit Kendaraan</div>
        <div style="font-size:28px;font-weight:800;color:#2563eb;margin-top:4px;">${new Set(allClosed.map(c=>c.vehicleId)).size}</div>
      </div>
      <div style="background:var(--card);border-radius:14px;padding:16px 18px;border:1px solid var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Bulan Ini</div>
        <div style="font-size:28px;font-weight:800;color:#16a34a;margin-top:4px;">${(() => {
          const now = new Date();
          return allClosed.filter(c => {
            const d = new Date(c.closedAt||0);
            return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
          }).length;
        })()}</div>
      </div>
    </div>

    <!-- Search -->
    <div style="position:relative;margin-bottom:16px;">
      <svg style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#9ca3af;" width="16" height="16"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" placeholder="Cari plat, customer, posisi, atau merk ban..."
        value="${window._closingSearch||''}"
        oninput="window._closingSearch=this.value;render()"
        style="width:100%;padding:10px 14px 10px 40px;border-radius:12px;border:1px solid var(--border);
               background:var(--card);font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text);
               box-sizing:border-box;outline:none;"
        onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
    </div>

    <!-- Table -->
    <div style="background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
      ${filtered.length === 0 ? `
        <div style="padding:48px 20px;text-align:center;">
          <div style="font-size:40px;margin-bottom:10px;">✅</div>
          <div style="font-size:15px;font-weight:700;color:var(--text);">
            ${allClosed.length === 0 ? 'Belum ada data closing' : 'Data tidak ditemukan'}
          </div>
          <div style="font-size:13px;color:var(--muted);margin-top:4px;">
            Data closing otomatis masuk saat ban ditandai "Dilepas" saat input pengukuran
          </div>
        </div>
      ` : `
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">#</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Plat / Customer</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Posisi Ban</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Merk / Model</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Tekanan</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Alur</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Odometer</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Tanggal Lepas</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((c, i) => `
                <tr style="border-bottom:1px solid var(--border);" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
                  <td style="padding:12px 16px;color:var(--muted);font-size:12px;">${i+1}</td>
                  <td style="padding:12px 16px;">
                    <div style="font-weight:700;color:var(--text);">${c.plateNumber||'-'}</div>
                    <div style="font-size:11px;color:var(--muted);">${c.customerName||'-'}</div>
                  </td>
                  <td style="padding:12px 16px;">
                    <span style="background:#ede9fe;color:#7c3aed;border-radius:8px;padding:3px 8px;font-size:12px;font-weight:600;">
                      ${c.position||'-'}
                    </span>
                  </td>
                  <td style="padding:12px 16px;">
                    <div style="font-weight:600;color:var(--text);">${c.brand||'-'}</div>
                    <div style="font-size:11px;color:var(--muted);">${c.model||'-'}</div>
                  </td>
                  <td style="padding:12px 16px;text-align:center;font-family:'DM Mono',monospace;font-size:13px;">${c.pressure != null ? c.pressure+' PSI' : '-'}</td>
                  <td style="padding:12px 16px;text-align:center;font-family:'DM Mono',monospace;font-size:13px;">${c.treadDepth != null ? c.treadDepth+' mm' : '-'}</td>
                  <td style="padding:12px 16px;text-align:center;font-family:'DM Mono',monospace;font-size:13px;">${c.odometer != null ? c.odometer.toLocaleString('id-ID')+' km' : '-'}</td>
                  <td style="padding:12px 16px;font-size:12px;color:var(--muted);white-space:nowrap;">
                    ${c.closedAt ? new Date(c.closedAt).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '-'}
                  </td>
                  <td style="padding:12px 16px;font-size:12px;color:var(--muted);max-width:180px;">
                    <span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                      ${c.notes||'-'}
                    </span>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="padding:12px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);">
          Menampilkan ${filtered.length} dari ${allClosed.length} data closing
        </div>
      `}
    </div>
  </div>`;
}

// ====== DINAS LUAR KOTA ======
function renderDuty() {
  const allDuties = typeof DUTIES !== 'undefined' ? DUTIES : [];
  if (!window._dutySearch) window._dutySearch = '';

  const filtered = allDuties.filter(d => {
    if (!window._dutySearch) return true;
    const q = window._dutySearch.toLowerCase();
    return (d.tech||'').toLowerCase().includes(q)
      || (d.dest||'').toLowerCase().includes(q)
      || (d.purpose||'').toLowerCase().includes(q)
      || (d.status||'').toLowerCase().includes(q);
  });

  function statusBadge(s) {
    const map = {
      'Planned':  { bg:'#dbeafe', color:'#1d4ed8', label:'Direncanakan' },
      'Ongoing':  { bg:'#fef9c3', color:'#854d0e', label:'Sedang Berjalan' },
      'On Going': { bg:'#fef9c3', color:'#854d0e', label:'Sedang Berjalan' },
      'Done':     { bg:'#dcfce7', color:'#15803d', label:'Selesai' },
      'Selesai':  { bg:'#dcfce7', color:'#15803d', label:'Selesai' },
      'Cancelled':{ bg:'#fee2e2', color:'#dc2626', label:'Dibatalkan' },
    };
    const m = map[s] || { bg:'#f3f4f6', color:'#6b7280', label: s||'-' };
    return `<span style="background:${m.bg};color:${m.color};border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;">${m.label}</span>`;
  }

  const totalPlanned  = allDuties.filter(d=>d.status==='Planned').length;
  const totalOngoing  = allDuties.filter(d=>d.status==='Ongoing'||d.status==='On Going').length;
  const totalDone     = allDuties.filter(d=>d.status==='Done'||d.status==='Selesai').length;

  // Check if user can submit (sales, technical_support, supervisor)
  const canSubmit = currentUser && ['sales','sales_counter','technical_support','supervisor','administrator'].includes(currentUser.role);

  return `
  <div style="padding:20px;max-width:1000px;margin:0 auto;">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      <div>
        <h2 style="margin:0;font-size:20px;font-weight:800;color:var(--text);">📍 Dinas Luar Kota</h2>
        <p style="margin:4px 0 0;font-size:13px;color:var(--muted);">Manajemen penugasan & perjalanan dinas</p>
      </div>
      ${canSubmit ? `
        <button onclick="openPengajuanDinasModal()"
          style="background:#2563eb;color:white;border:none;border-radius:12px;padding:10px 18px;
                 font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;
                 box-shadow:0 2px 10px rgba(37,99,235,.3);font-family:'DM Sans',sans-serif;"
          onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajukan Dinas
        </button>` : ''}
    </div>

    <!-- Stat Cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:var(--card);border-radius:14px;padding:16px 18px;border:1px solid var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Total</div>
        <div style="font-size:26px;font-weight:800;color:#7c3aed;margin-top:4px;">${allDuties.length}</div>
      </div>
      <div style="background:#dbeafe;border-radius:14px;padding:16px 18px;border:1px solid #bfdbfe;">
        <div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.05em;">Direncanakan</div>
        <div style="font-size:26px;font-weight:800;color:#1d4ed8;margin-top:4px;">${totalPlanned}</div>
      </div>
      <div style="background:#fef9c3;border-radius:14px;padding:16px 18px;border:1px solid #fde68a;">
        <div style="font-size:11px;font-weight:700;color:#854d0e;text-transform:uppercase;letter-spacing:.05em;">Berjalan</div>
        <div style="font-size:26px;font-weight:800;color:#a16207;margin-top:4px;">${totalOngoing}</div>
      </div>
      <div style="background:#dcfce7;border-radius:14px;padding:16px 18px;border:1px solid #bbf7d0;">
        <div style="font-size:11px;font-weight:700;color:#14532d;text-transform:uppercase;letter-spacing:.05em;">Selesai</div>
        <div style="font-size:26px;font-weight:800;color:#15803d;margin-top:4px;">${totalDone}</div>
      </div>
    </div>

    <!-- Search -->
    <div style="position:relative;margin-bottom:16px;">
      <svg style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#9ca3af;" width="16" height="16"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" placeholder="Cari nama, tujuan, keperluan..."
        value="${window._dutySearch||''}"
        oninput="window._dutySearch=this.value;render()"
        style="width:100%;padding:10px 14px 10px 40px;border-radius:12px;border:1px solid var(--border);
               background:var(--card);font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text);
               box-sizing:border-box;outline:none;"
        onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border)'" />
    </div>

    <!-- Table -->
    <div style="background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
      ${filtered.length === 0 ? `
        <div style="padding:48px 20px;text-align:center;">
          <div style="font-size:40px;margin-bottom:10px;">📍</div>
          <div style="font-size:15px;font-weight:700;color:var(--text);">
            ${allDuties.length === 0 ? 'Belum ada data dinas luar kota' : 'Data tidak ditemukan'}
          </div>
          <div style="font-size:13px;color:var(--muted);margin-top:4px;">
            ${allDuties.length === 0 && canSubmit ? 'Klik tombol "Ajukan Dinas" untuk membuat pengajuan' : ''}
          </div>
        </div>
      ` : `
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">#</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Nama</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Tujuan</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Tanggal</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Keperluan</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Status</th>
                ${currentUser && (currentUser.role==='administrator'||currentUser.role==='supervisor') ? `<th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Aksi</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${filtered.map((d, i) => `
                <tr style="border-bottom:1px solid var(--border);" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
                  <td style="padding:12px 16px;color:var(--muted);font-size:12px;">${i+1}</td>
                  <td style="padding:12px 16px;font-weight:700;color:var(--text);">${d.tech||'-'}</td>
                  <td style="padding:12px 16px;">
                    <div style="font-weight:600;color:var(--text);">${d.dest||'-'}</div>
                  </td>
                  <td style="padding:12px 16px;white-space:nowrap;">
                    <div style="font-size:12px;color:var(--text);">🛫 ${d.start||'-'}</div>
                    <div style="font-size:12px;color:var(--muted);">🛬 ${d.end||'-'}</div>
                  </td>
                  <td style="padding:12px 16px;font-size:12px;color:var(--muted);max-width:200px;">
                    <span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                      ${d.purpose||'-'}
                    </span>
                  </td>
                  <td style="padding:12px 16px;text-align:center;">${statusBadge(d.status)}</td>
                  ${currentUser && (currentUser.role==='administrator'||currentUser.role==='supervisor') ? `
                    <td style="padding:12px 16px;text-align:center;">
                      <select onchange="updateDutyStatus('${d.id}',this.value)"
                        style="padding:5px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);
                               font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--text);">
                        <option value="Planned"   ${d.status==='Planned'?'selected':''}>Direncanakan</option>
                        <option value="Ongoing"   ${d.status==='Ongoing'||d.status==='On Going'?'selected':''}>Sedang Berjalan</option>
                        <option value="Done"      ${d.status==='Done'||d.status==='Selesai'?'selected':''}>Selesai</option>
                        <option value="Cancelled" ${d.status==='Cancelled'?'selected':''}>Dibatalkan</option>
                      </select>
                    </td>` : ''}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="padding:12px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);">
          Menampilkan ${filtered.length} dari ${allDuties.length} data dinas
        </div>
      `}
    </div>
  </div>`;
}

function updateDutyStatus(id, newStatus) {
  const idx = DUTIES.findIndex(d => d.id === id);
  if (idx !== -1) {
    DUTIES[idx].status = newStatus;
    render();
  }
}

// ====== USERS MANAGEMENT ======

// ====== USERS MANAGEMENT ======
function renderUsers() {
  if (!currentUser || (currentUser.role !== 'administrator' && currentUser.role !== 'supervisor')) {
    return `
      <div style="padding:40px 20px;text-align:center;">
        <div style="font-size:40px;margin-bottom:12px;">🔒</div>
        <div style="font-size:16px;font-weight:700;color:var(--text);">Akses Terbatas</div>
        <div style="font-size:13px;color:var(--muted);margin-top:6px;">Halaman ini hanya dapat diakses oleh Administrator atau Supervisor.</div>
      </div>`;
  }

  if (!window._userSearch) window._userSearch = '';
  if (!window._userMgmtTab) window._userMgmtTab = 'users';

  const isAdmin = currentUser.role === 'administrator';

  const roleColors  = { administrator:'#7c3aed', supervisor:'#2563eb', technical_support:'#0e7490', sales:'#c2410c', sales_counter:'#9d174d', viewer:'#6b7280' };
  const roleLabels  = { administrator:'Administrator', supervisor:'Supervisor', technical_support:'Technical Support', sales:'Sales', sales_counter:'Sales Counter', viewer:'Viewer' };
  const roleBg      = { administrator:'#ede9fe', supervisor:'#dbeafe', technical_support:'#ecfeff', sales:'#fff7ed', sales_counter:'#fdf2f8', viewer:'#f3f4f6' };
  const roleIcons   = { administrator:'👑', supervisor:'🎯', technical_support:'🔧', sales:'💼', sales_counter:'🏪', viewer:'👁' };

  // ---- TAB BAR ----
  const tabBar = `
    <div style="display:flex;gap:0;background:var(--card);border-radius:14px;border:1px solid var(--border);overflow:hidden;margin-bottom:20px;">
      <button onclick="window._userMgmtTab='users';render()"
        style="flex:1;padding:12px 16px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;
               background:${window._userMgmtTab==='users'?'#7c3aed':'transparent'};
               color:${window._userMgmtTab==='users'?'white':'var(--muted)'};
               border-right:1px solid var(--border);transition:all .2s;">
        👥 Daftar User
      </button>
      <button onclick="window._userMgmtTab='access';render()"
        style="flex:1;padding:12px 16px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;
               background:${window._userMgmtTab==='access'?'#7c3aed':'transparent'};
               color:${window._userMgmtTab==='access'?'white':'var(--muted)'};
               transition:all .2s;">
        🛡️ Pembatasan Akses
      </button>
    </div>`;

  // =============================================
  // TAB: DAFTAR USER
  // =============================================
  if (window._userMgmtTab === 'users') {
    const filteredUsers = appUsers.filter(u => {
      if (!window._userSearch) return true;
      const q = window._userSearch.toLowerCase();
      return (u.name||'').toLowerCase().includes(q)
        || (u.username||'').toLowerCase().includes(q)
        || (u.email||'').toLowerCase().includes(q)
        || (roleLabels[u.role]||'').toLowerCase().includes(q);
    });

    const activeCount   = appUsers.filter(u => u.status === 'active').length;
    const inactiveCount = appUsers.filter(u => u.status !== 'active').length;

    return `
    <div style="padding:20px;max-width:1100px;margin:0 auto;">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:800;color:var(--text);">👥 Manajemen User</h2>
          <p style="margin:4px 0 0;font-size:13px;color:var(--muted);">Kelola akun dan hak akses pengguna sistem</p>
        </div>
        ${isAdmin ? `<button onclick="openAddUserModal()"
          style="background:#7c3aed;color:white;border:none;border-radius:12px;padding:10px 18px;
                 font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;
                 box-shadow:0 2px 10px rgba(124,58,237,.3);font-family:'DM Sans',sans-serif;"
          onmouseover="this.style.background='#6d28d9'" onmouseout="this.style.background='#7c3aed'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Tambah User
        </button>` : ''}
      </div>

      ${tabBar}

      <!-- Stat Cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
        <div style="background:var(--card);border-radius:14px;padding:16px 18px;border:1px solid var(--border);">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Total User</div>
          <div style="font-size:28px;font-weight:800;color:#7c3aed;margin-top:4px;">${appUsers.length}</div>
        </div>
        <div style="background:#dcfce7;border-radius:14px;padding:16px 18px;border:1px solid #bbf7d0;">
          <div style="font-size:11px;font-weight:700;color:#14532d;text-transform:uppercase;letter-spacing:.05em;">Aktif</div>
          <div style="font-size:28px;font-weight:800;color:#15803d;margin-top:4px;">${activeCount}</div>
        </div>
        <div style="background:#f3f4f6;border-radius:14px;padding:16px 18px;border:1px solid #e5e7eb;">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Nonaktif</div>
          <div style="font-size:28px;font-weight:800;color:#6b7280;margin-top:4px;">${inactiveCount}</div>
        </div>
      </div>

      <!-- Search -->
      <div style="position:relative;margin-bottom:16px;">
        <svg style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#9ca3af;" width="16" height="16"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Cari nama, username, email, atau role..."
          value="${window._userSearch||''}"
          oninput="window._userSearch=this.value;render()"
          style="width:100%;padding:10px 14px 10px 40px;border-radius:12px;border:1px solid var(--border);
                 background:var(--card);font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text);
                 box-sizing:border-box;outline:none;"
          onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
      </div>

      <!-- Table -->
      <div style="background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
        ${filteredUsers.length === 0 ? `
          <div style="padding:48px 20px;text-align:center;">
            <div style="font-size:40px;margin-bottom:10px;">👥</div>
            <div style="font-size:15px;font-weight:700;color:var(--text);">User tidak ditemukan</div>
          </div>
        ` : `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">#</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Nama</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Username / Email</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Role</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Status</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${filteredUsers.map((u, i) => {
                  const rColor = roleColors[u.role] || '#6b7280';
                  const rBg    = roleBg[u.role]    || '#f3f4f6';
                  const rLabel = roleLabels[u.role] || u.role;
                  const isActive = u.status === 'active';
                  return `
                    <tr style="border-bottom:1px solid var(--border);" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
                      <td style="padding:12px 16px;color:var(--muted);font-size:12px;">${i+1}</td>
                      <td style="padding:12px 16px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                          <div style="width:34px;height:34px;border-radius:10px;background:${u.avatarColor||rColor};
                                      color:white;display:flex;align-items:center;justify-content:center;
                                      font-size:13px;font-weight:800;flex-shrink:0;">
                            ${u.photoUrl ? `<img src="${u.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />` : (u.avatar||(u.name||'U').charAt(0).toUpperCase())}
                          </div>
                          <div>
                            <div style="font-weight:700;color:var(--text);">${u.name||'-'}</div>
                            ${u.phone ? `<div style="font-size:11px;color:var(--muted);">${u.phone}</div>` : ''}
                          </div>
                        </div>
                      </td>
                      <td style="padding:12px 16px;">
                        <div style="font-size:13px;color:var(--text);">${u.username||'-'}</div>
                        <div style="font-size:11px;color:var(--muted);">${u.email||'-'}</div>
                      </td>
                      <td style="padding:12px 16px;">
                        <span style="background:${rBg};color:${rColor};border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;">
                          ${roleIcons[u.role]||''} ${rLabel}
                        </span>
                      </td>
                      <td style="padding:12px 16px;text-align:center;">
                        <span style="background:${isActive?'#dcfce7':'#f3f4f6'};color:${isActive?'#15803d':'#6b7280'};
                                     border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;">
                          ${isActive?'● Aktif':'○ Nonaktif'}
                        </span>
                      </td>
                      <td style="padding:12px 16px;text-align:center;">
                        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
                          ${isAdmin ? `<button onclick="openEditUserModal('${u.id}')"
                            style="background:#ede9fe;color:#7c3aed;border:none;border-radius:8px;padding:6px 10px;
                                   cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;"
                            onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#ede9fe'">
                            ✏️ Edit
                          </button>` : ''}
                          ${isAdmin ? `<button onclick="toggleUserStatus('${u.id}')"
                            style="background:${isActive?'#fef9c3':'#dcfce7'};color:${isActive?'#854d0e':'#15803d'};
                                   border:none;border-radius:8px;padding:6px 10px;
                                   cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;"
                            onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
                            ${isActive?'⏸ Nonaktifkan':'▶ Aktifkan'}
                          </button>` : ''}
                          ${isAdmin && u.id !== (currentUser&&currentUser.id) ? `
                          <button onclick="deleteUser('${u.id}')"
                            style="background:#fef2f2;color:#dc2626;border:none;border-radius:8px;padding:6px 10px;
                                   cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;"
                            onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                            🗑️
                          </button>` : ''}
                        </div>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="padding:12px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);">
            Menampilkan ${filteredUsers.length} dari ${appUsers.length} user
          </div>
        `}
      </div>
    </div>`;
  }

  // =============================================
  // TAB: PEMBATASAN AKSES (ROLE PERMISSIONS)
  // =============================================
  const ROLE_KEYS = ['administrator','supervisor','technical_support','sales','sales_counter','viewer'];

  // Helper: render badge izin
  function permBadge(allowed, type, key, roleKey) {
    const isAdmin = roleKey === 'administrator';
    const clickable = !isAdmin;
    const clickHandler = clickable
      ? `onclick="toggleLegendPerm('${type}','${key}','${roleKey}',this)" style="cursor:pointer;"`
      : 'style="cursor:default;opacity:.6;"';
    return allowed
      ? `<td style="padding:8px;text-align:center;" title="${clickable?'Klik untuk cabut izin':'Selalu diizinkan (Admin)'}" ${clickHandler}>
          <span class="perm-badge-on" style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;background:#d1fae5;border-radius:50%;border:1.5px solid #6ee7b7;transition:all .2s;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        </td>`
      : `<td style="padding:8px;text-align:center;" title="${clickable?'Klik untuk beri izin':'Tidak diizinkan'}" ${clickHandler}>
          <span class="perm-badge-off" style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;background:#f3f4f6;border-radius:50%;border:1.5px solid #e5e7eb;transition:all .2s;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </span>
        </td>`;
  }

  // Render matrix header
  function matrixHeader() {
    return ROLE_KEYS.map(rk => `
      <th style="padding:10px 8px;text-align:center;min-width:90px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
          <span style="font-size:18px;">${roleIcons[rk]||'👤'}</span>
          <span style="font-size:10px;font-weight:700;color:${roleColors[rk]||'#6b7280'};white-space:nowrap;">${roleLabels[rk]}</span>
          ${rk !== 'administrator' && isAdmin ? `
            <button onclick="openRoleModal('${rk}')"
              style="margin-top:3px;padding:2px 8px;border:1.5px solid ${roleColors[rk]};border-radius:6px;
                     background:${roleBg[rk]};color:${roleColors[rk]};font-size:9px;font-weight:700;
                     cursor:pointer;font-family:'DM Sans',sans-serif;"
              onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
              ✏️ Edit
            </button>` : `<span style="font-size:9px;color:${roleColors[rk]};font-weight:600;margin-top:3px;">🔒 Full Akses</span>`}
        </div>
      </th>`).join('');
  }

  // Build full matrix HTML
  let matrixHtml = `
    <div style="padding:20px;max-width:1100px;margin:0 auto;">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:800;color:var(--text);">🛡️ Pembatasan Akses per Role</h2>
          <p style="margin:4px 0 0;font-size:13px;color:var(--muted);">Atur menu dan aksi yang dapat diakses oleh setiap role pengguna. Klik ikon untuk toggle izin secara langsung.</p>
        </div>
        ${isAdmin ? `<button onclick="resetAllRolePerms()"
          style="background:#fef3c7;color:#92400e;border:1.5px solid #fde68a;border-radius:12px;padding:9px 16px;
                 font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;"
          onmouseover="this.style.background='#fde68a'" onmouseout="this.style.background='#fef3c7'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Reset Default
        </button>` : ''}
      </div>

      ${tabBar}

      <!-- Info banner -->
      <div style="background:rgba(124,58,237,.07);border:1px solid #c4b5fd;border-radius:12px;padding:12px 16px;
                  font-size:12px;color:#5b21b6;display:flex;align-items:flex-start;gap:10px;margin-bottom:20px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top:1px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <strong>Cara Penggunaan:</strong> Klik ikon ✓/— pada sel untuk mengubah izin secara langsung.
          Atau klik tombol <strong>✏️ Edit</strong> di header kolom untuk edit lengkap per role.
          Perubahan akan langsung diterapkan dan disimpan ke database.
          ${!isAdmin ? '<br><span style="color:#7c3aed;">⚠️ Anda hanya dapat melihat matriks izin. Ubah izin hanya bisa dilakukan oleh Administrator.</span>' : ''}
        </div>
      </div>

      <!-- ===== MATRIX TABEL AKSES MENU ===== -->
      <div style="background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);margin-bottom:20px;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,#7c3aed08,transparent);">
          <div style="font-size:14px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:#ede9fe;border-radius:8px;font-size:14px;">📋</span>
            Matriks Akses Menu
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Halaman mana yang dapat dilihat dan diakses oleh setiap role</div>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;min-width:180px;">Menu / Halaman</th>
                ${matrixHeader()}
              </tr>
            </thead>
            <tbody>
              ${ALL_MENUS.map((m, idx) => `
                <tr style="border-bottom:1px solid var(--border);${idx%2===0?'background:var(--bg);':''}" onmouseover="this.style.background='rgba(124,58,237,.04)'" onmouseout="this.style.background='${idx%2===0?'var(--bg)':''}'"}>
                  <td style="padding:10px 16px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:16px;">${m.icon}</span>
                      <span style="font-weight:600;color:var(--text);">${m.label}</span>
                    </div>
                  </td>
                  ${ROLE_KEYS.map(rk => {
                    const allowed = rolePerms[rk] ? (rolePerms[rk].menus[m.key] !== 0) : false;
                    return permBadge(allowed, 'menu', m.key, rk);
                  }).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== MATRIX TABEL IZIN AKSI ===== -->
      <div style="background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);margin-bottom:20px;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,#0891b208,transparent);">
          <div style="font-size:14px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:#ecfeff;border-radius:8px;font-size:14px;">⚡</span>
            Matriks Izin Aksi
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Tindakan atau fitur mana yang dapat dilakukan oleh setiap role</div>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;min-width:180px;">Aksi / Fitur</th>
                ${matrixHeader()}
              </tr>
            </thead>
            <tbody>
              ${ALL_ACTIONS.map((a, idx) => `
                <tr style="border-bottom:1px solid var(--border);${idx%2===0?'background:var(--bg);':''}" onmouseover="this.style.background='rgba(8,145,178,.04)'" onmouseout="this.style.background='${idx%2===0?'var(--bg)':''}'">>
                  <td style="padding:10px 16px;">
                    <span style="font-weight:600;color:var(--text);">${a.label}</span>
                  </td>
                  ${ROLE_KEYS.map(rk => {
                    const allowed = rolePerms[rk] ? !!rolePerms[rk].actions[a.key] : false;
                    return permBadge(allowed, 'action', a.key, rk);
                  }).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== ROLE SUMMARY CARDS ===== -->
      <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <span>📊</span> Ringkasan Hak Akses per Role
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">
        ${ROLE_KEYS.map(rk => {
          const p = rolePerms[rk];
          const menuCount   = p ? Object.values(p.menus).filter(v => v !== 0).length : 0;
          const actionCount = p ? Object.values(p.actions).filter(Boolean).length : 0;
          const totalMenus  = ALL_MENUS.length;
          const totalActions = ALL_ACTIONS.length;
          const pct = Math.round(((menuCount + actionCount) / (totalMenus + totalActions)) * 100);
          return `
            <div style="background:var(--card);border-radius:14px;padding:16px;border:1px solid var(--border);
                        border-top:3px solid ${roleColors[rk]||'#6b7280'};">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:20px;">${roleIcons[rk]||'👤'}</span>
                  <div>
                    <div style="font-size:13px;font-weight:800;color:${roleColors[rk]||'#6b7280'};">${roleLabels[rk]}</div>
                    <div style="font-size:10px;color:var(--muted);">${appUsers.filter(u=>u.role===rk).length} user</div>
                  </div>
                </div>
                <div style="font-size:18px;font-weight:800;color:${roleColors[rk]||'#6b7280'};">${pct}%</div>
              </div>
              <div style="background:var(--bg);border-radius:6px;height:6px;overflow:hidden;margin-bottom:8px;">
                <div style="height:100%;width:${pct}%;background:${roleColors[rk]||'#6b7280'};border-radius:6px;transition:width .4s;"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);">
                <span>📋 ${menuCount}/${totalMenus} menu</span>
                <span>⚡ ${actionCount}/${totalActions} aksi</span>
              </div>
              ${rk !== 'administrator' && isAdmin ? `
                <button onclick="openRoleModal('${rk}')"
                  style="margin-top:10px;width:100%;padding:7px;border:1.5px solid ${roleColors[rk]};border-radius:9px;
                         background:${roleBg[rk]};color:${roleColors[rk]};font-size:11px;font-weight:700;
                         cursor:pointer;font-family:'DM Sans',sans-serif;"
                  onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
                  ✏️ Edit Hak Akses ${roleLabels[rk]}
                </button>` : ''}
            </div>`;
        }).join('')}
      </div>
    </div>`;

  return matrixHtml;
}
