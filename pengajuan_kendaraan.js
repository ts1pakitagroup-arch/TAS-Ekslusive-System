// ============================================================
// TYRETRACK — PENGAJUAN KENDARAAN (auth/pengajuan_kendaraan.js)
// Fungsi untuk modal pengajuan monitoring & trial (oleh Sales/Sales Counter)
// ============================================================

let _activeSubmissionTab = 'monitoring'; // 'monitoring' | 'trial'

function openSubmissionModal(tab) {
  _activeSubmissionTab = tab || 'monitoring';

  // Reset form monitoring
  ['sub-m-company','sub-m-pic-name','sub-m-phone','sub-m-email',
   'sub-m-units','sub-m-city','sub-m-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const mFleet = document.getElementById('sub-m-fleet-type');
  if (mFleet) mFleet.selectedIndex = 0;
  const mFreq = document.getElementById('sub-m-freq');
  if (mFreq) mFreq.value = '';
  document.querySelectorAll('.sub-freq-btn').forEach(b => b.classList.remove('active'));

  // Reset form trial
  ['sub-t-company','sub-t-pic-name','sub-t-phone','sub-t-email',
   'sub-t-plate','sub-t-vehicle-model','sub-t-tire-brand','sub-t-tire-model','sub-t-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const tDuration = document.getElementById('sub-t-duration');
  if (tDuration) tDuration.selectedIndex = 0;
  const tRoute = document.getElementById('sub-t-route');
  if (tRoute) tRoute.value = '';
  document.querySelectorAll('.sub-route-btn').forEach(b => b.classList.remove('active'));

  // Sembunyikan success, tampilkan form
  const successEl = document.getElementById('submission-success');
  const formEl    = document.getElementById('submission-form-state');
  const footerEl  = document.getElementById('submission-footer');
  if (successEl) successEl.style.display = 'none';
  if (formEl)    formEl.style.display    = '';
  if (footerEl)  footerEl.style.display  = '';

  // Aktifkan tab yang diminta
  switchSubmissionTab(_activeSubmissionTab);

  document.getElementById('modal-submission').classList.add('open');
}

function closeSubmissionModal() {
  document.getElementById('modal-submission').classList.remove('open');
}

function switchSubmissionTab(tab) {
  _activeSubmissionTab = tab;

  document.getElementById('sub-tab-monitoring').classList.toggle('active', tab === 'monitoring');
  document.getElementById('sub-tab-trial').classList.toggle('active', tab === 'trial');
  document.getElementById('subform-monitoring').classList.toggle('active', tab === 'monitoring');
  document.getElementById('subform-trial').classList.toggle('active', tab === 'trial');
}

function selectFreq(btn, tabType) {
  document.querySelectorAll('.sub-freq-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const hiddenId = tabType === 'monitoring' ? 'sub-m-freq' : 'sub-m-freq';
  const hidden = document.getElementById(hiddenId);
  if (hidden) hidden.value = btn.dataset.val;
}

function selectRoute(btn) {
  document.querySelectorAll('.sub-route-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const hidden = document.getElementById('sub-t-route');
  if (hidden) hidden.value = btn.dataset.val;
}

function submitSubmission() {
  const tab = _activeSubmissionTab;
  const submitBtn = document.getElementById('sub-submit-btn');

  if (tab === 'monitoring') {
    const company   = (document.getElementById('sub-m-company').value   || '').trim();
    const picName   = (document.getElementById('sub-m-pic-name').value  || '').trim();
    const phone     = (document.getElementById('sub-m-phone').value     || '').trim();
    const email     = (document.getElementById('sub-m-email').value     || '').trim();
    const units     = (document.getElementById('sub-m-units').value     || '').trim();
    const city      = (document.getElementById('sub-m-city').value      || '').trim();
    const freq      = (document.getElementById('sub-m-freq').value      || '').trim();
    const fleetType = (document.getElementById('sub-m-fleet-type').value|| '').trim();
    const notes     = (document.getElementById('sub-m-notes').value     || '').trim();

    if (!company || !picName || !phone) {
      alert('Harap isi minimal: Nama Perusahaan, Nama PIC, dan No. Telepon.');
      return;
    }

    const submitter = currentUser ? currentUser.name : 'Sales';
    const detail = `${company} | PIC: ${picName} | ${phone}${units ? ' | ' + units + ' unit' : ''}${city ? ' | ' + city : ''}${fleetType ? ' | ' + fleetType : ''}${freq ? ' | Frekuensi: ' + freq : ''}`;

    if (typeof pushNotifToAdminSupervisor === 'function') {
      pushNotifToAdminSupervisor({
        type:   'monitoring',
        status: 'Pending',
        title:  '📋 Pengajuan Monitoring Baru',
        desc:   detail,
        note:   notes ? 'Catatan: ' + notes : '',
        submittedBy: currentUser ? currentUser.name : submitter,
        submittedAt: new Date().toISOString(),
      });
    }

    if (currentUser && typeof pushNotifToUser === 'function') {
      pushNotifToUser(currentUser.id, {
        type:   'monitoring',
        status: 'Pending',
        title:  '✅ Pengajuan Monitoring Terkirim',
        desc:   company + ' — ' + (units || '?') + ' unit',
        note:   'Menunggu tindak lanjut dari Tim Technical.',
      });
    }

    _showSubmissionSuccess('monitoring', company, units);

  } else {
    // Trial
    const company    = (document.getElementById('sub-t-company').value      || '').trim();
    const picName    = (document.getElementById('sub-t-pic-name').value     || '').trim();
    const phone      = (document.getElementById('sub-t-phone').value        || '').trim();
    const email      = (document.getElementById('sub-t-email').value        || '').trim();
    const plate      = (document.getElementById('sub-t-plate').value        || '').trim();
    const model      = (document.getElementById('sub-t-vehicle-model').value|| '').trim();
    const tireBrand  = (document.getElementById('sub-t-tire-brand').value   || '').trim();
    const tireModel  = (document.getElementById('sub-t-tire-model').value   || '').trim();
    const duration   = (document.getElementById('sub-t-duration').value     || '').trim();
    const route      = (document.getElementById('sub-t-route').value        || '').trim();
    const notes      = (document.getElementById('sub-t-notes').value        || '').trim();

    if (!company || !picName || !phone) {
      alert('Harap isi minimal: Nama Perusahaan, Nama PIC, dan No. Telepon.');
      return;
    }

    const detail = `${company} | PIC: ${picName} | ${phone}${plate ? ' | Plat: ' + plate.toUpperCase() : ''}${model ? ' | ' + model : ''}${tireBrand ? ' | Ban: ' + tireBrand + (tireModel ? ' ' + tireModel : '') : ''}${duration ? ' | Durasi: ' + duration : ''}${route ? ' | Rute: ' + route : ''}`;

    if (typeof pushNotifToAdminSupervisor === 'function') {
      pushNotifToAdminSupervisor({
        type:   'trial',
        status: 'Pending',
        title:  '🔬 Pengajuan Trial Ban Baru',
        desc:   detail,
        note:   notes ? 'Catatan: ' + notes : '',
        submittedBy: currentUser ? currentUser.name : 'Sales',
        submittedAt: new Date().toISOString(),
      });
    }

    if (currentUser && typeof pushNotifToUser === 'function') {
      pushNotifToUser(currentUser.id, {
        type:   'trial',
        status: 'Pending',
        title:  '✅ Pengajuan Trial Terkirim',
        desc:   company + (plate ? ' — ' + plate.toUpperCase() : '') + (tireBrand ? ' — ' + tireBrand : ''),
        note:   'Menunggu tindak lanjut dari Tim Technical.',
      });
    }

    _showSubmissionSuccess('trial', company, null);
  }
}

function _showSubmissionSuccess(type, company, units) {
  // Sembunyikan form, tampilkan success state
  const formEl   = document.getElementById('submission-form-state');
  const footerEl = document.getElementById('submission-footer');
  const successEl= document.getElementById('submission-success');
  if (formEl)    formEl.style.display    = 'none';
  if (footerEl)  footerEl.style.display  = 'none';
  if (successEl) successEl.style.display = '';

  const badge = document.getElementById('submission-result-badge');
  const info  = document.getElementById('submission-result-info');
  if (badge) {
    const color  = type === 'monitoring' ? '#059669' : '#2563eb';
    const bg     = type === 'monitoring' ? '#d1fae5' : '#dbeafe';
    const border = type === 'monitoring' ? '#a7f3d0' : '#bfdbfe';
    const label  = type === 'monitoring' ? 'Monitoring' : 'Trial';
    badge.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;background:${bg};border:1px solid ${border};color:${color};font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;">
      ${type === 'monitoring'
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>'}
      Program ${label}
    </span>`;
  }
  if (info) {
    const unitsStr = units ? ` · ${units} unit` : '';
    info.textContent = company + unitsStr + ' · ' + new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'});
  }

  // Auto-close setelah 3 detik
  setTimeout(() => {
    const m = document.getElementById('modal-submission');
    if (m && m.classList.contains('open')) closeSubmissionModal();
  }, 3000);
}
