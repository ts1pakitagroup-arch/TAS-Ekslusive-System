# TyreTrack – Sistem Monitoring Ban

Aplikasi web monitoring ban kendaraan berbasis Supabase.

## Struktur File

| File | Keterangan |
|------|------------|
| `index.html` | Struktur HTML utama |
| `styles.css` | Semua styling & tema dark/light |
| `main.js` | Data, state, dan semua fungsi render UI |
| `pelumas.js` | Fungsi monitoring pelumas |
| `database.js` | Auth sistem & koneksi Supabase |
| `pengajuan_dinas.js` | Modal pengajuan dinas luar kota |
| `autologin.js` | Auto-login via URL query params |

## Deploy ke GitHub Pages

1. Upload semua file ke repository GitHub
2. Buka **Settings → Pages**
3. Pilih branch `main`, folder `/ (root)`
4. Klik **Save** — site aktif dalam beberapa menit

## Database

Menggunakan **Supabase** — pastikan koneksi internet aktif saat menggunakan aplikasi.
