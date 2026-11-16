/**
 * Konfigurasi bersama. Nilai yang statusnya "perlu kesepakatan" di Kontrak
 * dikumpulkan di sini supaya tidak tersebar dan mudah diganti satu tempat.
 */
// Hanya NEXT_PUBLIC_* yang masuk bundle browser. Jangan menaruh rahasia di sini.
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  // Backend sekarang memakai /api. /api/v1 hanya usulan (Kontrak bagian 10, K8).
  apiPrefix: process.env.NEXT_PUBLIC_API_PREFIX ?? "/api",
  useMock: process.env.NEXT_PUBLIC_API_MOCK === "true",
} as const;

if (process.env.NODE_ENV === "production" && config.useMock) {
  throw new Error("NEXT_PUBLIC_API_MOCK=true tidak boleh dipakai pada build produksi.");
}

/** Batas unggahan. Angka ini USULAN (K9), bukan batas dari spesifikasi; backend wajib memvalidasi ulang. */
export const limits = {
  avatarMaxBytes: 2 * 1024 * 1024,
  reportAttachmentMaxBytes: 5 * 1024 * 1024,
  imageTypes: ["image/jpeg", "image/png"] as readonly string[],
  messageMaxLength: 1000,
  reportDetailMin: 20,
  reportDetailMax: 1000,
  pageSize: 12, // contoh, bukan limit final (Kontrak bagian 10)
  resendCooldownSeconds: 60,
} as const;

/**
 * Cakupan yang belum disepakati (Kontrak K5/K7). Mati-hidupkan di sini,
 * bukan dengan menghapus kode.
 */
export const features = {
  /** Laporan pengguna = moderasi lanjutan (bagian 5). */
  report: false,
  /** Kontak/inquiry saat kamar penuh belum diputuskan (K7). */
  inquiryWhenFull: true,
  /** Layanan pemulihan kata sandi (lupa sandi / reset sandi) belum tersedia di backend */
  recovery: true,
  /** Layanan verifikasi email belum tersedia di backend */
  emailVerification: false,
  /** Layanan penghapusan akun mandiri belum tersedia di backend */
  accountDeletion: false,
} as const;

/** Rute milik bagian FE lain (jelajah, detail kos, ruang pemilik, halaman statis). */
export const externalPaths = {
  explore: "/jelajah",
  ownerSpace: "/pemilik",
  privacy: "/privasi",
  terms: "/ketentuan",
  help: "/bantuan",
  kosDetail: (id: string) => `/kos/${encodeURIComponent(id)}`,
} as const;
