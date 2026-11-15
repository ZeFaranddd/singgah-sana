export type TipeKos = 'putra' | 'putri' | 'campur';
export type StatusVerifikasi = 'pending' | 'approved' | 'rejected';

/** Bentuk dokumen Kos dari backend saat ini (lihat backend/src/models/Kos.js). */
export type Kos = {
  _id: string;
  nama: string;
  deskripsi: string;
  alamat: string;
  area_kampus: string;
  koordinat: { latitude: number; longitude: number };
  foto: string[];
  harga_per_bulan: number;
  tipe: TipeKos;
  fasilitas: string[];
  luas_kamar: string;
  peraturan: string[];
  jumlah_kamar_total: number;
  jumlah_kamar_tersedia: number;
  status_verifikasi: StatusVerifikasi;
  catatan_verifikasi: string;
  diverifikasi_pada: string | null;
  pemilik_id: string;
  createdAt: string;
  updatedAt: string;
};

/** Data yang dikirim saat membuat/mengubah kos. Angka sudah dalam bentuk number. */
export type KosInput = {
  nama: string;
  deskripsi: string;
  alamat: string;
  area_kampus: string;
  latitude: number;
  longitude: number;
  harga_per_bulan: number;
  tipe: TipeKos;
  fasilitas: string[];
  luas_kamar: string;
  peraturan: string[];
  jumlah_kamar_total: number;
  jumlah_kamar_tersedia: number;
};
