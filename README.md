# Singgah-sana: Portal Kos-Kosan Terverifikasi

> Tugas Akhir Pengembangan Aplikasi Web (PAW) — Departemen Teknik Elektro dan Teknologi Informasi, Fakultas Teknik, Universitas Gadjah Mada (2026/2027)

Satu proyek utuh: **backend** REST API (Express + MongoDB) dan **frontend** (React + Vite + Tailwind) yang sudah terhubung. Di mode produksi, backend menyajikan hasil build frontend, jadi seluruh aplikasi berjalan dari satu alamat (`http://localhost:5000`).

**Anggota kelompok:** Farand Hafiz, Stella Florencia Doulim, Faiz Gymnastiar Wibawa, Aurelia Mutiah Raudyatuzzahra.

---

## 1. Menjalankan

Prasyarat: **Node.js 18+** dan **MongoDB** (lokal di `127.0.0.1:27017` atau URI MongoDB Atlas).

```bash
npm run install:all     # pasang dependensi backend + frontend
npm run setup           # buat backend/.env dengan JWT_SECRET acak (tidak menimpa .env yang ada)
npm run seed            # isi data contoh (menghapus data lama di database tersebut)
npm run build           # build frontend ke frontend/dist
npm start               # jalankan server -> http://localhost:5000
```

Bila memakai Atlas / port lain, ubah `MONGO_URI` / `PORT` di `backend/.env`. Build frontend harus ada **sebelum** `npm start` agar halaman web ikut disajikan.

### Mode pengembangan (hot reload)

```bash
npm run dev:backend     # terminal 1 -> API di :5000
npm run dev:frontend    # terminal 2 -> web di http://localhost:5173 (proxy /api & /uploads ke :5000)
```

Pada mode ini halaman Masuk menampilkan tombol isi-otomatis untuk akun seeder.

### Akun dari seeder

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | `admin@gmail.com` | `AdminPassword123!` |
| Pemilik | `pemilik1@gmail.com` / `pemilik2@gmail.com` | `PemilikPassword123!` |
| Pencari | `pencari1@gmail.com` / `pencari2@gmail.com` | `PencariPassword123!` |

> Ganti semua kata sandi ini bila aplikasi dipasang di server yang bisa diakses publik.

---

## 2. Peta fitur per peran

Setiap menu di antarmuka terhubung ke endpoint nyata dan database.

**Publik**
- **Beranda**: pencarian (lokasi/tipe/anggaran), kos pilihan, area favorit (dihitung dari data), rekomendasi sesuai preferensi.
- **Jelajah kos**: filter kata kunci, tipe, area, rentang harga, fasilitas, ketersediaan kamar, urutan, paginasi. Semua filter tersimpan di URL.
- **Detail kos**: galeri, ketersediaan, fasilitas, aturan, peta lokasi (OpenStreetMap), WhatsApp pemilik, tanya pemilik, jadwalkan survei, favorit, laporkan kos.
- **Masuk / Daftar** dengan JWT; sesi dipulihkan dari token.

**Pencari**: Ringkasan · Favorit · Pesan (balasan pemilik) · Notifikasi · Profil · Keamanan (ganti sandi) · Preferensi.

**Pemilik**: Ringkasan · Kos saya (status verifikasi, ubah cepat jumlah kamar tersedia, ubah, hapus) · Tambah/ubah kos (wizard 6 langkah + unggah foto) · Pesan (balas pertanyaan) · Notifikasi · Profil · Keamanan.

**Admin**: Ringkasan · Peninjauan (setujui/tolak dengan catatan) · Semua kos (cari, filter, turunkan, hapus, ekspor CSV) · Pengguna · Laporan (proses/selesai/tolak, turunkan kos) · Aktivitas (riwayat audit) · Notifikasi · Akun.

Akses dibatasi per peran di dua lapis: guard di frontend dan RBAC di backend.

---

## 3. Yang ditambahkan pada backend

Backend asli (auth, kos, favorit, inquiry, admin) dipertahankan. Untuk melengkapi menu di desain, ditambahkan:

| Endpoint | Peran | Fungsi |
|---|---|---|
| `PUT /api/auth/password` | semua | ganti kata sandi |
| `PUT /api/auth/profile` | semua | kini juga menyimpan `preferensi` |
| `GET /api/kos/meta/area` | publik | ringkasan per area kampus |
| `PUT /api/kos/:id` | pemilik/admin | kini menerima foto (multipart), `foto_urls` = foto lama yang dipertahankan; memeriksa kuota ≤ total |
| `GET /api/notifikasi`, `/jumlah` | semua | daftar & jumlah belum dibaca |
| `PATCH /api/notifikasi/:id/baca`, `/baca-semua` · `DELETE /api/notifikasi/:id` | semua | kelola notifikasi |
| `POST /api/laporan`, `GET /api/laporan/my` | pencari | laporan pengguna atas kos |
| `GET /api/admin/laporan` · `PATCH /api/admin/laporan/:id` | admin | tinjau & tangani laporan |
| `GET /api/admin/aktivitas` | admin | riwayat aktivitas |
| `GET /api/admin/stats` | admin | kini memuat ringkasan `laporan` |

Notifikasi dibuat otomatis: pertanyaan baru → pemilik; balasan → pencari; kos diajukan/diubah/laporan baru → admin; kos disetujui/ditolak → pemilik; laporan ditangani → pelapor.

Model baru: `Notifikasi`, `Laporan`, `Aktivitas`; `User` mendapat field `preferensi`. Seeder juga memakai foto bawaan frontend sehingga data contoh tampil tanpa internet.

---

## 4. Struktur

```
singgah-sana/
├── backend/            Express API, model Mongoose, tes Jest, seeder
├── frontend/           React + Vite + Tailwind (src/lib: API, auth, router; src/pages per peran)
├── docs/  postman/     laporan Milestone 1 dan koleksi Postman (belum memuat endpoint baru)
├── scripts/setup-env.js
└── package.json        skrip gabungan
```

Pengujian backend: `npm test` (Jest + mongodb-memory-server). Berkas `backend/tests/fitur.lanjutan.test.js` mencakup fitur baru.

---

## 5. Catatan

- Sesi bersifat stateless (JWT 7 hari). Token lama tetap berlaku sampai kedaluwarsa walau kata sandi diganti.
- "Jadwalkan survei" dikirim sebagai pesan (inquiry) berisi tanggal dan jam; satu pencari hanya boleh punya satu pesan yang menunggu balasan per kos (aturan backend asli).
- Foto unggahan disimpan di `backend/uploads` (disk lokal). Untuk hosting yang disknya tidak persisten, pindahkan ke penyimpanan objek.
- Font Inter dan Sora dimuat dari Google Fonts; tanpa internet tampilan memakai font sistem.
