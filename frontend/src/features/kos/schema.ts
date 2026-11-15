import { z } from 'zod';
import type { Kos, KosInput } from './types';

// Aturan mengikuti backend/src/models/Kos.js dan kontrak v1.2 (bagian 3: 0 <= tersedia <= total).
const angkaBulat = (label: string, min: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .regex(/^\d+$/, `${label} harus berupa angka bulat`)
    .refine((value) => Number(value) >= min, `${label} minimal ${min.toLocaleString('id-ID')}`);

const koordinat = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi. Pilih titik pada peta.`)
    .refine((value) => !Number.isNaN(Number(value)), `${label} harus berupa angka`)
    .refine((value) => Number(value) >= min && Number(value) <= max, `${label} harus di antara ${min} dan ${max}`);

export const kosFormSchema = z
  .object({
    // Langkah 1 · Informasi
    nama: z.string().trim().min(3, 'Nama kos minimal 3 karakter').max(120, 'Nama kos maksimal 120 karakter'),
    tipe: z.enum(['putra', 'putri', 'campur'], { error: 'Pilih jenis kos' }),
    area_kampus: z.string().trim().min(2, 'Area kampus wajib diisi').max(80, 'Area kampus maksimal 80 karakter'),
    deskripsi: z.string().trim().min(20, 'Deskripsi minimal 20 karakter').max(2000, 'Deskripsi maksimal 2.000 karakter'),
    // Langkah 2 · Lokasi
    alamat: z.string().trim().min(10, 'Alamat lengkap minimal 10 karakter').max(300, 'Alamat maksimal 300 karakter'),
    latitude: koordinat('Latitude', -90, 90),
    longitude: koordinat('Longitude', -180, 180),
    // Langkah 3 · Foto (berkas dikelola di luar form; URL disimpan di sini)
    foto_urls: z.array(z.url({ protocol: /^https$/, error: 'Gunakan URL foto yang diawali https://' })).max(5, 'Maksimal 5 foto'),
    // Langkah 4 · Fasilitas & aturan
    fasilitas: z.array(z.string().trim().min(1).max(50)).min(1, 'Pilih minimal satu fasilitas').max(20, 'Maksimal 20 fasilitas'),
    peraturan: z.array(z.string().trim().min(1).max(100)).max(15, 'Maksimal 15 aturan'),
    // Langkah 5 · Kamar & harga
    harga_per_bulan: angkaBulat('Harga per bulan', 100000),
    luas_kamar: z.string().trim().max(30, 'Ukuran kamar maksimal 30 karakter'),
    jumlah_kamar_total: angkaBulat('Jumlah kamar total', 1),
    jumlah_kamar_tersedia: angkaBulat('Kamar tersedia', 0),
  })
  .refine((data) => Number(data.jumlah_kamar_tersedia) <= Number(data.jumlah_kamar_total), {
    path: ['jumlah_kamar_tersedia'],
    message: 'Kamar tersedia tidak boleh melebihi jumlah kamar total',
  });

export type KosFormValues = z.input<typeof kosFormSchema>;
export type KosFormOutput = z.output<typeof kosFormSchema>;

/** Field yang divalidasi pada tiap langkah sebelum boleh lanjut. */
export const STEP_FIELDS: (keyof KosFormValues)[][] = [
  ['nama', 'tipe', 'area_kampus', 'deskripsi'],
  ['alamat', 'latitude', 'longitude'],
  ['foto_urls'],
  ['fasilitas', 'peraturan'],
  ['harga_per_bulan', 'luas_kamar', 'jumlah_kamar_total', 'jumlah_kamar_tersedia'],
  [],
];

export const EMPTY_KOS_FORM: KosFormValues = {
  nama: '',
  // '' agar <select> menampilkan pilihan kosong; skema menolak nilai ini sampai pengguna memilih.
  tipe: '' as unknown as KosFormValues['tipe'],
  area_kampus: '',
  deskripsi: '',
  alamat: '',
  latitude: '',
  longitude: '',
  foto_urls: [],
  fasilitas: [],
  peraturan: [],
  harga_per_bulan: '',
  luas_kamar: '',
  jumlah_kamar_total: '',
  jumlah_kamar_tersedia: '',
};

/** Nilai form (string) -> data API (number). Dipanggil setelah validasi lolos. */
export function toKosInput(values: KosFormValues): KosInput {
  return {
    nama: values.nama.trim(),
    tipe: values.tipe,
    area_kampus: values.area_kampus.trim(),
    deskripsi: values.deskripsi.trim(),
    alamat: values.alamat.trim(),
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    fasilitas: values.fasilitas,
    peraturan: values.peraturan,
    harga_per_bulan: Number(values.harga_per_bulan),
    luas_kamar: values.luas_kamar.trim(),
    jumlah_kamar_total: Number(values.jumlah_kamar_total),
    jumlah_kamar_tersedia: Number(values.jumlah_kamar_tersedia),
  };
}

/** Data kos dari backend -> nilai awal form edit. */
export function fromKos(kos: Kos): KosFormValues {
  return {
    nama: kos.nama,
    tipe: kos.tipe,
    area_kampus: kos.area_kampus,
    deskripsi: kos.deskripsi,
    alamat: kos.alamat,
    latitude: String(kos.koordinat.latitude),
    longitude: String(kos.koordinat.longitude),
    foto_urls: [],
    fasilitas: kos.fasilitas,
    peraturan: kos.peraturan,
    harga_per_bulan: String(kos.harga_per_bulan),
    luas_kamar: kos.luas_kamar,
    jumlah_kamar_total: String(kos.jumlah_kamar_total),
    jumlah_kamar_tersedia: String(kos.jumlah_kamar_tersedia),
  };
}

/** Skema form ketersediaan (halaman "Ketersediaan kamar"). */
export function ketersediaanSchema(total: number) {
  return z.object({
    jumlah_kamar_tersedia: z
      .string()
      .trim()
      .min(1, 'Kamar tersedia wajib diisi')
      .regex(/^\d+$/, 'Kamar tersedia harus berupa angka bulat')
      .refine((value) => Number(value) <= total, `Kamar tersedia tidak boleh melebihi ${total} kamar`),
  });
}
