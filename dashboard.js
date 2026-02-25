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
                <div style="font-size:10px;color:var(--muted);font-weight:600;">${totalCustomer} cust. · ${totalBan} ban</div>
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
                    <div style="font-size:15px;font-family:'DM Mono',monospace;font-weight:600;color:${sc.color};">${sc.totalCustomer}</div>
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:${sc.color};opacity:.7;">Cust.</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-size:15px;font-family:'DM Mono',monospace;font-weight:600;color:${sc.color};">${sc.totalKendaraan}</div>
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:${sc.color};opacity:.7;">Unit</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-size:15px;font-family:'DM Mono',monospace;font-weight:600;color:${sc.color};">${sc.totalBan}</div>
                    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:${sc.color};opacity:.7;">Ban</div>
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
        <div class="page-title">Kendaraan Trial &amp; Monitoring</div>
        <div class="page-sub">Klik kartu untuk melihat detail & riwayat pengecekan.</div>
      </div>
      ${(currentUser.role === 'sales' || currentUser.role === 'sales_counter') ? `<div style="display:flex;gap:10px;flex-wrap:wrap;">
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


// renderVehiclesDetail dipindah ke modules/vehicles_detail.js
