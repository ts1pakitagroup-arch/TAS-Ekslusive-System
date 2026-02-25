function handlePhotoUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const wrapId = type === 'odo' ? 'upload-odo-wrap' : 'upload-unit-wrap';
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    if (type === 'odo') tempPhotoOdo = dataUrl;
    else tempPhotoUnit = dataUrl;
    wrap.classList.add('has-photo');
    // Hapus konten lama, tapi pertahankan input file
    const input = wrap.querySelector('input[type=file]');
    wrap.innerHTML = '';
    wrap.appendChild(input);
    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'photo-preview';
    wrap.appendChild(img);
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'photo-remove-btn';
    removeBtn.title = 'Hapus foto';
    removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    removeBtn.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); clearPhoto(type); };
    wrap.appendChild(removeBtn);
  };
  reader.readAsDataURL(file);
}

function clearPhoto(type) {
  const wrapId = type === 'odo' ? 'upload-odo-wrap' : 'upload-unit-wrap';
  const label = type === 'odo' ? 'Klik untuk upload foto odometer' : 'Klik untuk upload foto unit';
  if (type === 'odo') tempPhotoOdo = null;
  else tempPhotoUnit = null;
  const wrap = document.getElementById(wrapId);
  wrap.classList.remove('has-photo');
  wrap.innerHTML = `
    <input type="file" accept="image/*" onchange="handlePhotoUpload(event,'${type}')" />
    <svg class="photo-upload-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
    <div style="font-size:12px;font-weight:600;color:var(--muted);">${label}</div>
    <div style="font-size:11px;color:#9ca3af;margin-top:3px;">JPG, PNG maks. 5MB</div>`;
}

// Fungsi-fungsi ini sudah didefinisikan di core/utils.js — tidak perlu duplikasi

