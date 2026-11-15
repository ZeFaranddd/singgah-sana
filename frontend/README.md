# SinggahSana — Frontend

Next.js 16 (App Router) + TypeScript + Tailwind 4. Talks to the Express backend in `../backend`.

## Menjalankan

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                  # http://localhost:3000
```

Backend harus jalan di `:5000` (`cd ../backend && npm run dev`).

> Windows: kalau path folder mengandung `&`, `npm run` bisa gagal di cmd.exe.
> Jalankan langsung: `node node_modules/next/dist/bin/next dev`, atau pindahkan repo ke path tanpa `&`.

Cek kualitas sebelum push: `npm run typecheck && npm run lint && npm run build`.

## Struktur

```
src/
  app/                 routes (App Router)
  components/ui/       komponen dasar: Button, Card, Badge, Field, Dialog, Toast, State
  components/layout/   logo, footer, page header, PemilikShell
  features/<domain>/   api.ts (panggilan backend), schema.ts (zod), hooks.ts, types.ts, components/
  lib/api/             apiRequest + ApiError (Bearer token, error per field, 401 -> sesi habis)
```

Logika (api/schema/hooks) dipisah dari UI (components). Semua panggilan backend lewat `apiRequest`.

## Pembagian route

| Area | Route | Pemilik |
| --- | --- | --- |
| Beranda & detail kos publik | `/`, `/kos/[id]` | Orang 1 |
| Masuk, daftar, akun | `/masuk`, `/daftar`, `/akun` | Orang 2 |
| Ruang pemilik (FE03) | `/pemilik`, `/pemilik/kos`, `/pemilik/kos/baru`, `/pemilik/kos/[id]`, `.../edit`, `.../ketersediaan`, `/pemilik/pesan` | Orang 3 |
| Admin (FE04) | `/admin/...` | Orang 4 |

## Sesi login (penting untuk Orang 2)

Sesi disimpan di `localStorage` key `singgahsana.session` sebagai `{ token, user }`.
Pakai helper di `src/features/auth/session.ts` (`saveSession`, `clearSession`, `getToken`) dan hook `useSession()` —
jangan bikin key baru, supaya semua halaman membaca sesi yang sama.
Setelah login sebagai pemilik, arahkan ke `/pemilik`.

`DevLoginForm` di ruang pemilik hanya muncul di mode development, sebagai pengganti sementara sampai `/masuk` jadi.
