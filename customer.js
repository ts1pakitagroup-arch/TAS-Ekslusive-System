// ====== DATABASE CUSTOMER ======

// State
let customerList = [];
let customerView = 'list';       // 'list' | 'detail'
let activeCustomerId = null;
let customerSearch = '';
let customerEditMode = false;    // true = modal edit, false = modal tambah

// ── Helpers ──
function findCustomerById(id) {
  return customerList.find(c => c.id === id) || null;
}

function getCustomerVehicles(customerName) {
  const allV = [...(vehicles || []), ...(trialVehicles || [])];
  return allV.filter(v => (v.customerName || '').toLowerCase().trim() === customerName.toLowerCase().trim());
}

// ── Render Utama ──
function renderCustomer() {
  if (customerView === 'detail' && activeCustomerId) {
    return renderCustomerDetail(activeCustomerId);
  }
  return renderCustomerList();
}

// ── List ──
function renderCustomerList() {
  const filtered = customerList.filter(c => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (c.name || '').toLowerCase().includes(q)
      || (c.pic || '').toLowerCase().includes(q)
      || (c.phone || '').toLowerCase().includes(q)
      || (c.city || '').toLowerCase().includes(q)
      || (c.type || '').toLowerCase().includes(q);
  });

  const totalCustomers = customerList.length;
  const activeCustomers = customerList.filter(c => c.status === 'aktif').length;
  const totalVehiclesLinked = customerList.reduce((sum, c) => sum + getCustomerVehicles(c.name).length, 0);

  return `
    <div style="padding:20px;max-width:1000px;margin:0 auto;">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:800;color:var(--text);">🏢 Database Customer</h2>
          <p style="margin:4px 0 0;font-size:13px;color:var(--muted);">Kelola seluruh data customer terdaftar</p>
        </div>
        <button onclick="openCustomerModal(false)"
          style="background:#7c3aed;color:white;border:none;border-radius:12px;padding:10px 18px;
                 font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;
                 box-shadow:0 2px 10px rgba(124,58,237,.3);font-family:'DM Sans',sans-serif;"
          onmouseover="this.style.background='#6d28d9'" onmouseout="this.style.background='#7c3aed'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Tambah Customer
        </button>
      </div>

      <!-- Stat Cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
        <div style="background:var(--card);border-radius:14px;padding:16px 18px;border:1px solid var(--border);">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Total Customer</div>
          <div style="font-size:28px;font-weight:800;color:#7c3aed;margin-top:4px;">${totalCustomers}</div>
        </div>
        <div style="background:var(--card);border-radius:14px;padding:16px 18px;border:1px solid var(--border);">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Customer Aktif</div>
          <div style="font-size:28px;font-weight:800;color:#16a34a;margin-top:4px;">${activeCustomers}</div>
        </div>
        <div style="background:var(--card);border-radius:14px;padding:16px 18px;border:1px solid var(--border);">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Total Kendaraan</div>
          <div style="font-size:28px;font-weight:800;color:#2563eb;margin-top:4px;">${totalVehiclesLinked}</div>
        </div>
      </div>

      <!-- Search -->
      <div style="position:relative;margin-bottom:16px;">
        <svg style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#9ca3af;" width="16" height="16"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Cari nama, PIC, kota, atau jenis customer..."
          value="${customerSearch}"
          oninput="customerSearch=this.value;render()"
          style="width:100%;padding:10px 14px 10px 40px;border-radius:12px;border:1px solid var(--border);
                 background:var(--card);font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text);
                 box-sizing:border-box;outline:none;"
          onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
      </div>

      <!-- Table -->
      <div style="background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
        ${filtered.length === 0 ? `
          <div style="padding:48px 20px;text-align:center;">
            <div style="font-size:40px;margin-bottom:10px;">🏢</div>
            <div style="font-size:15px;font-weight:700;color:var(--text);">
              ${customerList.length === 0 ? 'Belum ada data customer' : 'Customer tidak ditemukan'}
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">
              ${customerList.length === 0 ? 'Klik tombol "Tambah Customer" untuk mulai menambahkan data' : 'Coba kata kunci lain'}
            </div>
          </div>
        ` : `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">#</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Nama Customer</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">PIC</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Telepon</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Kota</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Jenis</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Kendaraan</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Status</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map((c, i) => {
                  const vCount = getCustomerVehicles(c.name).length;
                  const isAktif = c.status !== 'nonaktif';
                  return `
                  <tr style="border-bottom:1px solid var(--border);transition:background .15s;cursor:pointer;"
                      onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''"
                      onclick="openCustomerDetail('${c.id}')">
                    <td style="padding:13px 16px;color:var(--muted);font-size:12px;">${i+1}</td>
                    <td style="padding:13px 16px;">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:34px;height:34px;border-radius:10px;background:${c.avatarColor || '#7c3aed'};
                                    color:white;display:flex;align-items:center;justify-content:center;
                                    font-size:13px;font-weight:800;flex-shrink:0;">
                          ${(c.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style="font-weight:700;color:var(--text);">${c.name || '-'}</div>
                          ${c.email ? `<div style="font-size:11px;color:var(--muted);">${c.email}</div>` : ''}
                        </div>
                      </div>
                    </td>
                    <td style="padding:13px 16px;color:var(--text);">${c.pic || '-'}</td>
                    <td style="padding:13px 16px;color:var(--text);">${c.phone || '-'}</td>
                    <td style="padding:13px 16px;color:var(--text);">${c.city || '-'}</td>
                    <td style="padding:13px 16px;">
                      <span style="background:#ede9fe;color:#7c3aed;border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;">
                        ${c.type || 'Umum'}
                      </span>
                    </td>
                    <td style="padding:13px 16px;text-align:center;">
                      <span style="background:#dbeafe;color:#2563eb;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700;">
                        ${vCount}
                      </span>
                    </td>
                    <td style="padding:13px 16px;text-align:center;">
                      <span style="background:${isAktif ? '#dcfce7' : '#f3f4f6'};
                                   color:${isAktif ? '#16a34a' : '#6b7280'};
                                   border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;">
                        ${isAktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style="padding:13px 16px;text-align:center;" onclick="event.stopPropagation()">
                      <div style="display:flex;gap:6px;justify-content:center;">
                        <button onclick="openCustomerModal(true,'${c.id}')"
                          title="Edit"
                          style="background:#ede9fe;color:#7c3aed;border:none;border-radius:8px;padding:6px 10px;
                                 cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;"
                          onmouseover="this.style.background='#ddd6fe'" onmouseout="this.style.background='#ede9fe'">
                          ✏️ Edit
                        </button>
                        <button onclick="deleteCustomer('${c.id}')"
                          title="Hapus"
                          style="background:#fef2f2;color:#dc2626;border:none;border-radius:8px;padding:6px 10px;
                                 cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;"
                          onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="padding:12px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);">
            Menampilkan ${filtered.length} dari ${customerList.length} customer
          </div>
        `}
      </div>
    </div>
    ${renderCustomerModal()}`;
}

// ── Detail Customer ──
function renderCustomerDetail(id) {
  const c = findCustomerById(id);
  if (!c) return '<div style="padding:20px">Customer tidak ditemukan.</div>';
  const cvehicles = getCustomerVehicles(c.name);

  return `
    <div style="padding:20px;max-width:800px;margin:0 auto;">

      <!-- Back -->
      <button onclick="closeCustomerDetail()"
        style="display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;
               color:var(--muted);font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;
               padding:6px 0;margin-bottom:18px;"
        onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Kembali ke Daftar Customer
      </button>

      <!-- Profile Card -->
      <div style="background:var(--card);border-radius:16px;border:1px solid var(--border);
                  padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06);">
        <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div style="width:56px;height:56px;border-radius:14px;background:${c.avatarColor || '#7c3aed'};
                      color:white;display:flex;align-items:center;justify-content:center;
                      font-size:22px;font-weight:800;flex-shrink:0;">
            ${(c.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div style="flex:1;min-width:200px;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <h3 style="margin:0;font-size:18px;font-weight:800;color:var(--text);">${c.name || '-'}</h3>
              <span style="background:${c.status === 'nonaktif' ? '#f3f4f6' : '#dcfce7'};
                           color:${c.status === 'nonaktif' ? '#6b7280' : '#16a34a'};
                           border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;">
                ${c.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
              </span>
              <span style="background:#ede9fe;color:#7c3aed;border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;">
                ${c.type || 'Umum'}
              </span>
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">${c.address || 'Alamat belum diisi'}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button onclick="openCustomerModal(true,'${c.id}')"
              style="background:#7c3aed;color:white;border:none;border-radius:10px;padding:8px 16px;
                     font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;"
              onmouseover="this.style.background='#6d28d9'" onmouseout="this.style.background='#7c3aed'">
              ✏️ Edit
            </button>
            <button onclick="deleteCustomer('${c.id}')"
              style="background:#fef2f2;color:#dc2626;border:none;border-radius:10px;padding:8px 16px;
                     font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;"
              onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
              🗑️ Hapus
            </button>
          </div>
        </div>
      </div>

      <!-- Info Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">

        <!-- Kontak -->
        <div style="background:var(--card);border-radius:14px;border:1px solid var(--border);padding:18px 20px;">
          <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px;">
            📞 Informasi Kontak
          </div>
          ${infoRow('PIC / Penanggung Jawab', c.pic || '-')}
          ${infoRow('No. Telepon', c.phone || '-')}
          ${infoRow('Email', c.email || '-')}
          ${infoRow('WhatsApp', c.whatsapp || '-')}
        </div>

        <!-- Lokasi & Lainnya -->
        <div style="background:var(--card);border-radius:14px;border:1px solid var(--border);padding:18px 20px;">
          <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px;">
            📍 Lokasi & Detail
          </div>
          ${infoRow('Kota', c.city || '-')}
          ${infoRow('Provinsi', c.province || '-')}
          ${infoRow('Terdaftar', c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}) : '-')}
          ${infoRow('Kendaraan Terdaftar', getCustomerVehicles(c.name).length + ' unit')}
        </div>
      </div>

      <!-- Catatan -->
      ${c.notes ? `
        <div style="background:var(--card);border-radius:14px;border:1px solid var(--border);padding:18px 20px;margin-bottom:16px;">
          <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">📝 Catatan</div>
          <div style="font-size:13px;color:var(--text);line-height:1.6;">${c.notes}</div>
        </div>` : ''}

      <!-- Kendaraan Terkait -->
      <div style="background:var(--card);border-radius:14px;border:1px solid var(--border);padding:18px 20px;">
        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px;">
          🚛 Kendaraan Terdaftar (${cvehicles.length} unit)
        </div>
        ${cvehicles.length === 0
          ? `<div style="font-size:13px;color:var(--muted);text-align:center;padding:16px 0;">Belum ada kendaraan terdaftar untuk customer ini</div>`
          : `<div style="display:flex;flex-direction:column;gap:8px;">
              ${cvehicles.map(v => {
                const critCount = (v.tires||[]).filter(t=>!t.removed&&t.status==='critical').length;
                const cat = trialVehicles.find(tv=>tv.id===v.id) ? 'Trial' : 'Monitoring';
                return `
                  <div style="display:flex;align-items:center;justify-content:space-between;
                              background:var(--bg);border-radius:10px;padding:10px 14px;gap:10px;flex-wrap:wrap;">
                    <div>
                      <div style="font-weight:700;font-size:13px;color:var(--text);">${v.plateNumber}</div>
                      <div style="font-size:11px;color:var(--muted);">${v.make||''} ${v.model||''}</div>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                      <span style="background:#dbeafe;color:#2563eb;border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;">${cat}</span>
                      ${critCount > 0 ? `<span style="background:#fef2f2;color:#dc2626;border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;">⚠️ ${critCount} Kritis</span>` : '<span style="background:#dcfce7;color:#16a34a;border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;">✓ Baik</span>'}
                    </div>
                  </div>`;
              }).join('')}
            </div>`}
      </div>
    </div>
    ${renderCustomerModal()}`;
}

function infoRow(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;
                padding:7px 0;border-bottom:1px solid var(--border);gap:10px;">
      <span style="font-size:12px;color:var(--muted);flex-shrink:0;">${label}</span>
      <span style="font-size:13px;font-weight:600;color:var(--text);text-align:right;">${value}</span>
    </div>`;
}

// ── Modal Tambah / Edit ──
function renderCustomerModal() {
  const AVATAR_COLORS = ['#7c3aed','#2563eb','#0ea5e9','#16a34a','#d97706','#dc2626','#db2777','#0891b2'];
  const colorOpts = AVATAR_COLORS.map(clr =>
    `<div onclick="document.getElementById('cm-avatarColor').value='${clr}';
                   document.querySelectorAll('.avatar-clr-opt').forEach(el=>el.style.outline='none');
                   this.style.outline='3px solid #7c3aed'"
         class="avatar-clr-opt"
         style="width:24px;height:24px;border-radius:50%;background:${clr};cursor:pointer;flex-shrink:0;"></div>`
  ).join('');

  return `
    <!-- Modal Customer -->
    <div id="modal-customer" style="display:none;position:fixed;inset:0;z-index:1000;
         background:rgba(0,0,0,.45);backdrop-filter:blur(4px);
         align-items:center;justify-content:center;padding:16px;">
      <div style="background:var(--card);border-radius:20px;width:100%;max-width:520px;
                  max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);">

        <!-- Modal Header -->
        <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border);
                    display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div id="cm-title" style="font-size:16px;font-weight:800;color:var(--text);">Tambah Customer Baru</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">Isi data customer dengan lengkap</div>
          </div>
          <button onclick="closeCustomerModal()"
            style="background:none;border:none;cursor:pointer;padding:6px;border-radius:10px;color:var(--muted);"
            onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
          <input type="hidden" id="cm-id" />
          <input type="hidden" id="cm-avatarColor" value="#7c3aed" />

          <!-- Warna Avatar -->
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:8px;">Warna Avatar</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">${colorOpts}</div>
          </div>

          <!-- Nama -->
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">
              Nama Customer / Perusahaan <span style="color:#dc2626;">*</span>
            </label>
            <input id="cm-name" type="text" placeholder="PT. Logistik Maju / CV. Angkasa"
              style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                     background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                     color:var(--text);box-sizing:border-box;outline:none;"
              onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
          </div>

          <!-- Jenis & Status -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">Jenis Customer</label>
              <select id="cm-type"
                style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                       background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                       color:var(--text);box-sizing:border-box;outline:none;cursor:pointer;"
                onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'">
                <option value="Umum">Umum</option>
                <option value="PT">PT (Perseroan Terbatas)</option>
                <option value="CV">CV (Commanditaire Vennootschap)</option>
                <option value="UD">UD (Usaha Dagang)</option>
                <option value="Koperasi">Koperasi</option>
                <option value="Perorangan">Perorangan</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">Status</label>
              <select id="cm-status"
                style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                       background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                       color:var(--text);box-sizing:border-box;outline:none;cursor:pointer;"
                onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'">
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <!-- PIC -->
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">PIC / Penanggung Jawab</label>
            <input id="cm-pic" type="text" placeholder="Nama penanggung jawab"
              style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                     background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                     color:var(--text);box-sizing:border-box;outline:none;"
              onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
          </div>

          <!-- Telepon & WhatsApp -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">No. Telepon</label>
              <input id="cm-phone" type="tel" placeholder="0812-xxxx-xxxx"
                style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                       background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                       color:var(--text);box-sizing:border-box;outline:none;"
                onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">No. WhatsApp</label>
              <input id="cm-whatsapp" type="tel" placeholder="0812-xxxx-xxxx"
                style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                       background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                       color:var(--text);box-sizing:border-box;outline:none;"
                onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
            </div>
          </div>

          <!-- Email -->
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">Email</label>
            <input id="cm-email" type="email" placeholder="email@perusahaan.com"
              style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                     background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                     color:var(--text);box-sizing:border-box;outline:none;"
              onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
          </div>

          <!-- Kota & Provinsi -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">Kota</label>
              <input id="cm-city" type="text" placeholder="Surabaya"
                style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                       background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                       color:var(--text);box-sizing:border-box;outline:none;"
                onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">Provinsi</label>
              <input id="cm-province" type="text" placeholder="Jawa Timur"
                style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                       background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                       color:var(--text);box-sizing:border-box;outline:none;"
                onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'" />
            </div>
          </div>

          <!-- Alamat -->
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">Alamat Lengkap</label>
            <textarea id="cm-address" placeholder="Jl. Contoh No. 1, Kel. Contoh, Kec. Contoh" rows="2"
              style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                     background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                     color:var(--text);box-sizing:border-box;outline:none;resize:vertical;min-height:60px;"
              onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'"></textarea>
          </div>

          <!-- Catatan -->
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">Catatan Tambahan</label>
            <textarea id="cm-notes" placeholder="Informasi tambahan tentang customer..." rows="2"
              style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border);
                     background:var(--bg);font-size:13px;font-family:'DM Sans',sans-serif;
                     color:var(--text);box-sizing:border-box;outline:none;resize:vertical;min-height:60px;"
              onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='var(--border)'"></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="closeCustomerModal()"
            style="padding:10px 20px;background:#f3f4f6;border:none;border-radius:12px;font-size:13px;
                   font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--text);"
            onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
            Batal
          </button>
          <button onclick="submitCustomerForm()"
            style="padding:10px 24px;background:#7c3aed;color:white;border:none;border-radius:12px;
                   font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;
                   box-shadow:0 2px 8px rgba(124,58,237,.3);"
            onmouseover="this.style.background='#6d28d9'" onmouseout="this.style.background='#7c3aed'">
            <span id="cm-submit-label">Simpan Customer</span>
          </button>
        </div>
      </div>
    </div>`;
}

// ── Open/Close Modal ──
function openCustomerModal(isEdit, customerId) {
  customerEditMode = !!isEdit;
  const modal = document.getElementById('modal-customer');
  if (!modal) { render(); setTimeout(() => openCustomerModal(isEdit, customerId), 50); return; }
  modal.style.display = 'flex';

  const AVATAR_COLORS = ['#7c3aed','#2563eb','#0ea5e9','#16a34a','#d97706','#dc2626','#db2777','#0891b2'];

  if (isEdit && customerId) {
    const c = findCustomerById(customerId);
    if (!c) return;
    document.getElementById('cm-title').textContent = 'Edit Data Customer';
    document.getElementById('cm-submit-label').textContent = 'Simpan Perubahan';
    document.getElementById('cm-id').value = c.id;
    document.getElementById('cm-name').value = c.name || '';
    document.getElementById('cm-type').value = c.type || 'Umum';
    document.getElementById('cm-status').value = c.status || 'aktif';
    document.getElementById('cm-pic').value = c.pic || '';
    document.getElementById('cm-phone').value = c.phone || '';
    document.getElementById('cm-whatsapp').value = c.whatsapp || '';
    document.getElementById('cm-email').value = c.email || '';
    document.getElementById('cm-city').value = c.city || '';
    document.getElementById('cm-province').value = c.province || '';
    document.getElementById('cm-address').value = c.address || '';
    document.getElementById('cm-notes').value = c.notes || '';
    document.getElementById('cm-avatarColor').value = c.avatarColor || '#7c3aed';
    // Highlight warna aktif
    document.querySelectorAll('.avatar-clr-opt').forEach((el, i) => {
      el.style.outline = AVATAR_COLORS[i] === (c.avatarColor || '#7c3aed') ? '3px solid #7c3aed' : 'none';
    });
  } else {
    document.getElementById('cm-title').textContent = 'Tambah Customer Baru';
    document.getElementById('cm-submit-label').textContent = 'Simpan Customer';
    document.getElementById('cm-id').value = '';
    document.getElementById('cm-name').value = '';
    document.getElementById('cm-type').value = 'Umum';
    document.getElementById('cm-status').value = 'aktif';
    document.getElementById('cm-pic').value = '';
    document.getElementById('cm-phone').value = '';
    document.getElementById('cm-whatsapp').value = '';
    document.getElementById('cm-email').value = '';
    document.getElementById('cm-city').value = '';
    document.getElementById('cm-province').value = '';
    document.getElementById('cm-address').value = '';
    document.getElementById('cm-notes').value = '';
    document.getElementById('cm-avatarColor').value = '#7c3aed';
    document.querySelectorAll('.avatar-clr-opt').forEach((el, i) => {
      el.style.outline = i === 0 ? '3px solid #7c3aed' : 'none';
    });
  }
}

function closeCustomerModal() {
  const modal = document.getElementById('modal-customer');
  if (modal) modal.style.display = 'none';
}

// ── Submit Form ──
function submitCustomerForm() {
  const name = document.getElementById('cm-name').value.trim();
  if (!name) {
    document.getElementById('cm-name').style.borderColor = '#dc2626';
    document.getElementById('cm-name').focus();
    return;
  }

  const id = document.getElementById('cm-id').value;
  const data = {
    name,
    type:       document.getElementById('cm-type').value,
    status:     document.getElementById('cm-status').value,
    pic:        document.getElementById('cm-pic').value.trim(),
    phone:      document.getElementById('cm-phone').value.trim(),
    whatsapp:   document.getElementById('cm-whatsapp').value.trim(),
    email:      document.getElementById('cm-email').value.trim(),
    city:       document.getElementById('cm-city').value.trim(),
    province:   document.getElementById('cm-province').value.trim(),
    address:    document.getElementById('cm-address').value.trim(),
    notes:      document.getElementById('cm-notes').value.trim(),
    avatarColor: document.getElementById('cm-avatarColor').value,
    updatedAt:  new Date().toISOString(),
  };

  if (id) {
    // Edit
    customerList = customerList.map(c => c.id === id ? { ...c, ...data } : c);
    showToast('✓ Data customer berhasil diperbarui', '#7c3aed');
  } else {
    // Tambah
    customerList.unshift({ id: randId(), ...data, createdAt: new Date().toISOString() });
    showToast('✓ Customer baru berhasil ditambahkan', '#16a34a');
  }

  closeCustomerModal();
  render();
}

// ── Delete ──
function deleteCustomer(id) {
  const c = findCustomerById(id);
  if (!c) return;
  const vCount = getCustomerVehicles(c.name).length;
  const msg = vCount > 0
    ? `Hapus customer "${c.name}"?\n\n⚠️ Customer ini memiliki ${vCount} kendaraan terdaftar. Data kendaraan tidak akan ikut terhapus.`
    : `Hapus customer "${c.name}"?`;
  if (!confirm(msg)) return;
  customerList = customerList.filter(x => x.id !== id);
  if (activeCustomerId === id) { customerView = 'list'; activeCustomerId = null; }
  showToast('🗑️ Customer berhasil dihapus', '#dc2626');
  render();
}

// ── Detail Navigation ──
function openCustomerDetail(id) {
  activeCustomerId = id;
  customerView = 'detail';
  render();
  window.scrollTo(0, 0);
}
function closeCustomerDetail() {
  customerView = 'list';
  activeCustomerId = null;
  render();
}

// ── Toast ──
function showToast(msg, color) {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:${color};color:white;padding:10px 20px;border-radius:12px;font-size:13px;
    font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity .3s;
    white-space:nowrap;font-family:'DM Sans',sans-serif;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2200);
}
