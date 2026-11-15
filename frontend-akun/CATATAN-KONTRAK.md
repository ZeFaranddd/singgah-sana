# Singgah Sana FE bag 4: catatan terhadap Kontrak v1.1

Hasil optimasi dari Figma Make (Vite, satu file `App.tsx` 1.249 baris) ke **Next.js 16 App Router + React 19 + TypeScript strict + Tailwind 4**.

## Status verifikasi (jujur)
| Dicek | Hasil |
|---|---|
| Alur dan perilaku UI (login, validasi, guard, favorit+undo, pesan, laporan, profil+guard belum disimpan, hapus akun, 3 skenario API, open redirect) | Lulus di browser (Playwright) lewat harness yang meniru `next/navigation` dan `next/link` |
| Overflow horizontal pada 375 / 768 / 1440 px | Tidak ada; tidak ada error konsol |
| Mock tidak ikut bundle bila `NEXT_PUBLIC_API_MOCK` bukan `true` | Terbukti (chunk mock tidak ada) |
| Tipe | Lolos dengan shim tipe sementara (lihat catatan) |
| **`next build`, `next dev`, ESLint, tipe React asli** | **BELUM dijalankan.** Jaringan sandbox mati, jadi Next 16.4.6 / React 19.3.0 tidak bisa dipasang. Kombinasi versi di `package.json` masih kandidat (Kontrak bagian 3, K3). |

Langkah pertama di mesin tim: `npm install` (buat `package-lock.json`, lalu commit), lalu `npm run check` (typecheck, lint, build). Perbaiki temuan kecil bila ada, baru kunci versi.

## Pemetaan ke Kontrak
| Kontrak | Penerapan |
|---|---|
| Bagian 4 struktur | `src/features/{auth,account,kos,favorit,inquiry,report}`, `components/{ui,layout}`, `lib/{api,validation,hooks}`. Server vs Client Components: layout dan page = server (memuat `metadata`), fitur interaktif = `"use client"`. |
| Bagian 6 design system | Satu sumber token: `styles/tokens.css` (`@theme` Tailwind + variabel CSS). Satu pustaka komponen di `components/ui`. Ikon satu keluarga (nama = Lucide). Font via `next/font` (bukan URL font Figma). Logo = rumah tanpa tulisan. Gambar foto 180-300 KB diubah ke WebP 34-67 KB. |
| Bagian 6 state halaman | Loading (skeleton/spinner), data, kosong, tanpa hasil filter, gagal + Coba lagi, sesi berakhir (401 → `/masuk?sesi=berakhir`), akun dibatasi (403), proses menyimpan. |
| Bagian 7 keamanan | Token tidak disimpan di JS/localStorage; request memakai `credentials: "include"` (cookie HttpOnly bila K4 disetujui). Peran tidak dikirim saat daftar. Redirect `next` hanya jalur internal. Guard klien hanya UX; backend tetap memutuskan izin. |
| Bagian 10 API | `lib/api/client.ts`: amplop `{success,message,data,pagination}` / `{success:false,code,errors}`. Awalan `NEXT_PUBLIC_API_PREFIX` default `/api` (kondisi sekarang), bukan `/api/v1`. Path endpoint ada di `features/*/api.ts` dan berstatus **usulan (K8)**. |
| Bagian 10 mock | Hanya di `lib/api/mock`, skema sama, 6 skenario (normal, kosong, 500, lambat, 401, 403), bukan fallback produksi; build produksi menolak flag mock. |
| Bagian 13 | Validasi klien (`lib/validation`, keluaran sama dengan `errors` server) + pemetaan error server ke field. Favorit idempoten (PUT). Lint terpisah dari build (`npm run lint`). |
| Aksesibilitas | Label `for`/`id`, `aria-invalid/describedby`, dialog fokus-terkunci + Esc + fokus kembali, `role=switch`, `aria-current`, `aria-live`, skip link, fokus pindah ke konten saat ganti halaman, kontras teks sekunder 6.3:1, `prefers-reduced-motion`. |

## Perubahan perilaku dari frame Figma (disengaja)
- 50 frame ditutup menjadi alur nyata: dialog dan toast menggantikan frame terpisah, "login gagal" jadi respons API, dst. Pemetaan frame → rute:
  11 `/masuk` · 12 `/daftar` · 13 `/verifikasi-email` · 14 `/lupa-sandi` · 15 `/reset-sandi?token=` · 16 `/lupa-sandi/terkirim` · 17 `/reset-sandi/berhasil` · 18 `/verifikasi-email/berhasil` dan `/konfirmasi?token=` · 19 `/tautan-kedaluwarsa` · 20-24 `/akun`, `/akun/{profil,keamanan,notifikasi,preferensi}` · 25-28 dialog di Keamanan · 29 dialog Keluar · 30 dialog Foto · 31 dialog perubahan belum disimpan · 32 `/akun-dihapus` · 33/34/50/164 `/favorit` (semua state) · 35/36/43/161/162 `/pesan` · 37/160 dialog Tanya pemilik · 39-42/49 toast/notice · 44 galat login · 45 menu akun · 46 state umum · 148-150/163 dialog Laporkan · 159 `/dibatasi`.
- Bug mapping ikon Figma Make diperbaiki (mis. ikon "pesan" sebelumnya gambar hati, ikon "kedaluwarsa" gambar hati penuh).
- Tombol Ruang pemilik hanya untuk peran pemilik/admin.
- Navigasi mobile: sebelumnya Favorit/Pesan tak terjangkau di <1000 px; sekarang lewat menu akun. Pesan mobile: daftar ⇄ percakapan dengan tombol kembali.
- Favorit: filter dan urutan dikirim ke backend (backend sumber keputusan), ada "Muat lebih banyak".
- Dev panel (pengganti "Frame acuan") hanya saat `next dev` + mock.

## Keputusan yang masih terbuka (tidak diisi diam-diam)
- **K3** versi paket belum terkunci (lihat atas). **K4** autentikasi: klien netral, siap cookie sesi; CSRF belum diterapkan.
- **K5** Laporan = moderasi lanjutan: tetap ada tapi di balik `features.report` (`lib/config.ts`).
- **K7** inquiry saat kos penuh: `features.inquiryWhenFull`. Inquiry tersimpan (bukan tautan kontak langsung) diasumsikan; ubah bila diputuskan lain.
- **K8** awalan dan path endpoint, bentuk pagination (di `pagination` pada amplop). **K9** batas unggahan (2 MB avatar, 5 MB lampiran) = usulan di `limits`. **K10** host foto: `<img>` dipakai dulu, ganti `next/image` setelah `remotePatterns` ditetapkan; CSP penuh menunggu keputusan layanan.
- Zod + React Hook Form + Lucide direkomendasikan Kontrak tetapi belum dipasang (tak dapat diuji). `lib/validation` berbentuk sama dengan error server sehingga bisa diganti per form.
- `/` hanya placeholder pengalihan; akan digantikan halaman Jelajah bagian lain. Rute eksternal (`/kos/:id`, `/pemilik`, `/privasi`, dll.) ada di `externalPaths`.

## Menjalankan
```
npm install
cp .env.example .env.local   # atau pakai .env.development (mock aktif)
npm run dev                   # mock aktif; akun uji nadia@example.com / Password1
npm run check                 # typecheck + lint + build
```
