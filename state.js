// ============================================================
// TYRETRACK — CORE STATE (core/state.js)
// Semua variabel global dideklarasikan di sini.
// File ini HARUS dimuat sebelum semua module lainnya.
// ============================================================

// ====== AUTH ======
let currentUser = null;

// ====== NAVIGATION ======
let currentPage = 'dashboard';
let searchQuery = '';

// ====== VEHICLES ======
let vehicles      = [];
let trialVehicles = [];

// ====== MONITORING VIEW STATE ======
let monitoringView     = 'list';   // 'list' | 'detail'
let monitoringCategory = 'ban';    // 'ban' | 'banOtr' | 'pelumas' | 'aki'
let monitoringTab      = 'monitoring'; // 'monitoring' | 'trial'
let selectedVehicleId  = null;

// ====== VEHICLES VIEW STATE ======
let vehiclesView           = 'list';
let vehiclesDetailId       = null;
let vehiclesSelectedTireId = null;

// ====== PELUMAS ======
let pelumasRecords            = [];
let pelumasTrialRecords       = [];
let pelumasTab                = 'monitoring'; // 'monitoring' | 'trial'
let activePelumasModalTarget  = 'monitoring';

// ====== BAN OTR ======
let banOtrRecords      = [];
let banOtrTrialRecords = [];

// ====== AKI ======
let akiRecords      = [];
let akiTrialRecords = [];

// ====== CLOSING & DUTY ======
let closedTires    = [];   // ban yang dilepas (tampil di renderClosing)
let closingHistory = [];   // alias untuk Supabase sync
let DUTIES         = [];   // dinas luar kota (renderDuty)
let dutyTrips      = [];   // alias untuk Supabase sync

// ====== CLAIMS ======
let CLAIMS = [];
let alerts = [];
let claims = [];           // alias untuk Supabase sync

// ====== NOTIFICATIONS ======
let SALES_NOTIFICATIONS = [];
let TECH_NOTIFICATIONS  = [];
let USER_NOTIFICATIONS  = [];

// ====== USERS ======
let appUsers           = [];
let activeEditUserId   = null;
let userStatusDraft    = 'active';
let activeEditRoleKey  = null;    // FIX: variabel ini dipakai settings.js tapi belum dideklarasikan

// ====== USER MANAGEMENT PAGE TAB ======
let userMgmtTab = 'users'; // 'users' | 'access'

// ====== LAPORAN HARIAN ======
let laporanHarian = [];

// ====== PHOTO UPLOAD TEMP ======
let tempPhotoOdo  = null;
let tempPhotoUnit = null;

// ====== ROLE PERMISSIONS ======
const ALL_MENUS = [
  { key: 'dashboard',  label: 'Beranda',              icon: '🏠' },
  { key: 'vehicles',   label: 'Kendaraan',             icon: '🚛' },
  { key: 'customer',   label: 'Customer',              icon: '👤' },
  { key: 'monitoring', label: 'Monitoring & Trial',    icon: '📊' },
  { key: 'alerts',     label: 'Peringatan',            icon: '🔔' },
  { key: 'claims',     label: 'Claim Proses',          icon: '📋' },
  { key: 'duty',       label: 'Dinas Luar Kota',       icon: '📍' },
  { key: 'closing',    label: 'Closing Data',          icon: '✅' },
  { key: 'laporan',    label: 'Laporan Harian',        icon: '📄' },
  { key: 'settings',   label: 'Pengaturan',            icon: '⚙️' },
  { key: 'kpi',        label: 'KPI',                   icon: '📈' },
  { key: 'users',      label: 'Manajemen User',        icon: '👥' },
];

const ALL_ACTIONS = [
  { key: 'add_vehicle',    label: 'Tambah Kendaraan' },
  { key: 'edit_vehicle',   label: 'Edit Kendaraan' },
  { key: 'delete_vehicle', label: 'Hapus Kendaraan' },
  { key: 'add_measure',    label: 'Input Pengukuran Ban' },
  { key: 'manage_claims',  label: 'Kelola Klaim' },
  { key: 'manage_users',   label: 'Kelola User' },
  { key: 'manage_duty',    label: 'Kelola Dinas' },
  { key: 'export_data',    label: 'Export Data' },
  { key: 'submit_claim',   label: 'Ajukan Klaim' },
  { key: 'submit_duty',    label: 'Ajukan Dinas' },
];

// Default permissions per role
const DEFAULT_ROLE_PERMS = {
  administrator: {
    menus:   { dashboard:1, vehicles:1, customer:1, monitoring:1, alerts:1, claims:1, duty:1, closing:1, laporan:1, settings:1, kpi:1, users:1 },
    actions: { add_vehicle:1, edit_vehicle:1, delete_vehicle:1, add_measure:1, manage_claims:1, manage_users:1, manage_duty:1, export_data:1, submit_claim:1, submit_duty:1 },
  },
  supervisor: {
    menus:   { dashboard:1, vehicles:1, customer:1, monitoring:1, alerts:1, claims:1, duty:1, closing:1, laporan:1, settings:1, kpi:1, users:0 },
    actions: { add_vehicle:1, edit_vehicle:1, delete_vehicle:1, add_measure:1, manage_claims:1, manage_users:0, manage_duty:1, export_data:1, submit_claim:1, submit_duty:1 },
  },
  technical_support: {
    menus:   { dashboard:1, vehicles:1, customer:1, monitoring:1, alerts:1, claims:1, duty:1, closing:1, laporan:1, settings:0, kpi:0, users:0 },
    actions: { add_vehicle:1, edit_vehicle:1, delete_vehicle:0, add_measure:1, manage_claims:1, manage_users:0, manage_duty:0, export_data:1, submit_claim:0, submit_duty:1 },
  },
  sales: {
    menus:   { dashboard:0, vehicles:0, customer:1, monitoring:0, alerts:1, claims:1, duty:1, closing:0, laporan:1, settings:0, kpi:0, users:0 },
    actions: { add_vehicle:0, edit_vehicle:0, delete_vehicle:0, add_measure:0, manage_claims:0, manage_users:0, manage_duty:0, export_data:0, submit_claim:1, submit_duty:1 },
  },
  sales_counter: {
    menus:   { dashboard:0, vehicles:0, customer:1, monitoring:0, alerts:1, claims:1, duty:1, closing:0, laporan:1, settings:0, kpi:0, users:0 },
    actions: { add_vehicle:0, edit_vehicle:0, delete_vehicle:0, add_measure:0, manage_claims:0, manage_users:0, manage_duty:0, export_data:0, submit_claim:1, submit_duty:1 },
  },
  viewer: {
    menus:   { dashboard:0, vehicles:1, customer:0, monitoring:1, alerts:0, claims:0, duty:0, closing:0, laporan:0, settings:0, kpi:0, users:0 },
    actions: { add_vehicle:0, edit_vehicle:0, delete_vehicle:0, add_measure:0, manage_claims:0, manage_users:0, manage_duty:0, export_data:0, submit_claim:0, submit_duty:0 },
  },
};

// Diisi oleh loadRolePerms() di database.js; default ke copy dari DEFAULT_ROLE_PERMS
let rolePerms = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMS));

// ====== HELPER: CEK IZIN AKSI ======
function canDoAction(actionKey) {
  if (!currentUser) return false;
  if (currentUser.role === 'administrator') return true;
  const perms = rolePerms[currentUser.role];
  if (!perms) return false;
  return !!perms.actions[actionKey];
}
function canAccessMenu(menuKey) {
  if (!currentUser) return false;
  if (currentUser.role === 'administrator') return true;
  const perms = rolePerms[currentUser.role];
  if (!perms) return false;
  return perms.menus[menuKey] !== 0;
}

// ====== CHART INSTANCES ======
let pressureChart = null;

// ====== ALIAS FUNCTIONS ======
// updateNotifCount = alias dari updateAlertBadge (dipanggil di monitoring.js)
function updateNotifCount() {
  if (typeof updateAlertBadge === 'function') updateAlertBadge();
}
