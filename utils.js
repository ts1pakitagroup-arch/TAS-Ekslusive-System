
function randId() { return Math.random().toString(36).substr(2,9); }

// Find a tire (and its vehicle) across both monitoring + trial lists
function findTireById(tireId) {
  let tire = null, vehicle = null;
  [...vehicles, ...trialVehicles].forEach(v => v.tires.forEach(t => {
    if (t.id === tireId) { tire = t; vehicle = v; }
  }));
  return { tire, vehicle };
}
// Update tire in the correct list
function updateTireInLists(tireId, updaterFn) {
  vehicles = vehicles.map(v => ({ ...v, tires: v.tires.map(t => t.id === tireId ? updaterFn(t) : t) }));
  trialVehicles = trialVehicles.map(v => ({ ...v, tires: v.tires.map(t => t.id === tireId ? updaterFn(t) : t) }));
}

function getTireStatus(pressure, tread) {
  // Kritis: tread sangat rendah, atau tekanan sangat rendah (bocor)
  if (tread < 2 || pressure < 26) return 'critical';
  // Peringatan: tread rendah, tekanan rendah, atau tekanan berlebih
  // Untuk truk besar (80-115 PSI) dan kendaraan ringan (28-38 PSI)
  // Tekanan berlebih: >120 PSI untuk truk, >40 PSI untuk kendaraan ringan
  const overInflated = pressure > 120;
  if (tread < 3 || pressure < 28 || overInflated) return 'warning';
  return 'good';
}

function statusLabel(s) {
  if (s === 'good') return 'Bagus';
  if (s === 'warning') return 'Peringatan';
  return 'Kritis';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

