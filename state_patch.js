// ====== STATE PATCH — Variabel yang tidak masuk ke state.js utama ======

// Posisi 12 ban pada kendaraan niaga (truk 10-roda + 2 serep)
const TIRE_POSITIONS = [
  'Dep Kiri (Steer)',
  'Dep Kanan (Steer)',
  'Tng Kiri Luar',
  'Tng Kiri Dalam',
  'Tng Kanan Dalam',
  'Tng Kanan Luar',
  'Blk Kiri Luar',
  'Blk Kiri Dalam',
  'Blk Kanan Dalam',
  'Blk Kanan Luar',
  'Serep 1',
  'Serep 2',
];

// Modal state variables
let activeMeasureTireId = null;
let editVehicleId       = null;
