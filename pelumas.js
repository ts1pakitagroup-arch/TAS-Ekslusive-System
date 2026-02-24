// ====== PELUMAS FUNCTIONS ======
function openAddPelumasModal(target) {
  activePelumasModalTarget = target || 'monitoring';
  const lbl = document.getElementById('pelumas-modal-category-label');
  if (lbl) lbl.textContent = 'Kategori: ' + (activePelumasModalTarget === 'trial' ? 'Trial Pelumas' : 'Monitoring');
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('p-last-date').value = today;
  // Default next service: 3 bulan ke depan
  const next = new Date(); next.setMonth(next.getMonth() + 3);
  document.getElementById('p-next-date').value = next.toISOString().split('T')[0];
  document.getElementById('p-plate').value = '';
  document.getElementById('p-customer').value = '';
  document.getElementById('p-oil-brand').value = '';
  document.getElementById('p-oil-type').value = '';
  document.getElementById('p-viscosity').value = '';
  document.getElementById('p-volume').value = '';
  document.getElementById('p-odometer').value = '';
  document.getElementById('p-status').value = 'terjadwal';
  document.getElementById('p-notes').value = '';
  document.getElementById('modal-add-pelumas').classList.add('open');
}
function closeAddPelumasModal() {
  document.getElementById('modal-add-pelumas').classList.remove('open');
}
function submitAddPelumas() {
  const plate    = document.getElementById('p-plate').value.trim();
  const customer = document.getElementById('p-customer').value.trim();
  const brand    = document.getElementById('p-oil-brand').value.trim();
  const type     = document.getElementById('p-oil-type').value.trim();
  if (!plate || !customer || !brand || !type) {
    alert('Harap isi minimal: Nomor Plat, Customer, Merk, dan Jenis Pelumas.');
    return;
  }
  const rec = {
    id: randId(),
    plateNumber:     plate.toUpperCase(),
    customerName:    customer,
    oilBrand:        brand,
    oilType:         type,
    viscosity:       document.getElementById('p-viscosity').value,
    volume:          parseFloat(document.getElementById('p-volume').value) || null,
    lastServiceDate: document.getElementById('p-last-date').value || null,
    nextServiceDate: document.getElementById('p-next-date').value || null,
    odometer:        parseInt(document.getElementById('p-odometer').value) || null,
    status:          document.getElementById('p-status').value,
    notes:           document.getElementById('p-notes').value.trim(),
    createdAt:       new Date().toISOString(),
  };
  if (activePelumasModalTarget === 'trial') {
    pelumasTrialRecords.push(rec);
    pelumasTab = 'trial';
  } else {
    pelumasRecords.push(rec);
    pelumasTab = 'monitoring';
  }
  closeAddPelumasModal();
  monitoringCategory = 'pelumas';
  render();
  // Toast
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#7c3aed;color:white;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(124,58,237,0.4);transition:opacity .3s;';
  toast.textContent = '✓ Data pelumas berhasil disimpan';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; setTimeout(()=>toast.remove(),400); }, 2200);
}
function deletePelumasRecord(id, target) {
  if (!confirm('Hapus data pelumas ini?')) return;
  if (target === 'trial') {
    pelumasTrialRecords = pelumasTrialRecords.filter(r => r.id !== id);
  } else {
    pelumasRecords = pelumasRecords.filter(r => r.id !== id);
  }
  render();
}
