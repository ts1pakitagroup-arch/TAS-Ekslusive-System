function openPengajuanDinasModal() {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
  document.getElementById('pd-name').value = currentUser ? currentUser.name : '';
  document.getElementById('pd-dest').value = '';
  document.getElementById('pd-start').value = today;
  document.getElementById('pd-end').value = nextWeek;
  document.getElementById('pd-purpose').value = '';
  document.getElementById('pd-company').value = '';
  document.getElementById('pd-notes').value = '';
  document.getElementById('modal-pengajuan-dinas').classList.add('open');
}

function closePengajuanDinasModal() {
  document.getElementById('modal-pengajuan-dinas').classList.remove('open');
}

function submitPengajuanDinas() {
  const name    = document.getElementById('pd-name').value.trim();
  const dest    = document.getElementById('pd-dest').value.trim();
  const start   = document.getElementById('pd-start').value;
  const end     = document.getElementById('pd-end').value;
  const purpose = document.getElementById('pd-purpose').value.trim();

  if (!name || !dest || !start || !end || !purpose) {
    alert('Harap isi semua kolom wajib: Nama, Tujuan, Tanggal, dan Keperluan.');
    return;
  }
  if (end < start) {
    alert('Tanggal kembali tidak boleh sebelum tanggal berangkat.');
    return;
  }

  const fmt = d => {
    const [y,m,day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
  };

  // Tambahkan ke array DUTIES
  const newDuty = {
    id:      Math.random().toString(36).substr(2,9),
    tech:    name,
    dest:    dest,
    start:   fmt(start),
    end:     fmt(end),
    purpose: purpose + (document.getElementById('pd-company').value.trim() ? ' — ' + document.getElementById('pd-company').value.trim() : ''),
    status:  'Planned',
    submittedBy: currentUser ? currentUser.id : '',
    notes:   document.getElementById('pd-notes').value.trim(),
  };
  DUTIES.unshift(newDuty);

  closePengajuanDinasModal();
  render();

  // Toast sukses
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2563eb;color:white;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(37,99,235,0.4);transition:opacity .3s;display:flex;align-items:center;gap:8px;';
  toast.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Pengajuan dinas berhasil dikirim';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2500);
}