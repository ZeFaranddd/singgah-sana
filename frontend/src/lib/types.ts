export type Role = 'admin' | 'pemilik' | 'pencari'
export type TipeKos = 'putra' | 'putri' | 'campur'
export type StatusVerifikasi = 'pending' | 'approved' | 'rejected'

export interface Preferensi {
  area_kampus: string
  tipe: '' | TipeKos
  harga_maks: number | null
  fasilitas: string[]
}

export interface User {
  _id: string
  nama: string
  email: string
  nomor_telepon: string
  role: Role
  foto_profil?: string
  preferensi?: Preferensi
  createdAt?: string
}

export interface PemilikRingkas {
  _id: string
  nama: string
  nomor_telepon?: string
  email?: string
  foto_profil?: string
}

export interface Kos {
  _id: string
  nama: string
  deskripsi: string
  alamat: string
  area_kampus: string
  koordinat: { latitude: number; longitude: number }
  foto: string[]
  harga_per_bulan: number
  tipe: TipeKos
  fasilitas: string[]
  luas_kamar: string
  peraturan: string[]
  jumlah_kamar_total: number
  jumlah_kamar_tersedia: number
  status_verifikasi: StatusVerifikasi
  catatan_verifikasi?: string
  diverifikasi_pada?: string | null
  diverifikasi_oleh?: { _id: string; nama: string; email?: string } | null
  pemilik_id: PemilikRingkas | string
  createdAt: string
  updatedAt: string
}

export interface Favorit {
  _id: string
  user_id: string
  kos_id: Kos
  createdAt: string
}

export interface Inquiry {
  _id: string
  pesan: string
  balasan: string
  status: 'menunggu' | 'dibalas'
  createdAt: string
  updatedAt: string
  // Terisi (populate) berbeda tergantung endpoint
  kos_id: Pick<Kos, '_id' | 'nama' | 'alamat' | 'foto' | 'harga_per_bulan' | 'tipe'>
  pemilik_id?: { _id: string; nama: string; nomor_telepon?: string }
  pencari_id?: { _id: string; nama: string; nomor_telepon?: string; email?: string }
}

export type TipeNotifikasi =
  | 'pesan_baru'
  | 'balasan_pesan'
  | 'kos_menunggu'
  | 'kos_disetujui'
  | 'kos_ditolak'
  | 'laporan_baru'
  | 'laporan_ditangani'
  | 'info'

export interface Notifikasi {
  _id: string
  tipe: TipeNotifikasi
  judul: string
  isi: string
  tautan: string
  dibaca: boolean
  createdAt: string
}

export type AlasanLaporan =
  | 'informasi_tidak_akurat'
  | 'foto_tidak_sesuai'
  | 'dugaan_penipuan'
  | 'kamar_sudah_penuh'
  | 'lainnya'

export type StatusLaporan = 'terbuka' | 'diproses' | 'selesai' | 'ditolak'

export interface Laporan {
  _id: string
  kos_nama: string
  kos_id: { _id: string; nama: string; alamat: string; status_verifikasi: StatusVerifikasi; foto: string[] } | null
  pelapor_id: { _id: string; nama: string; email: string; nomor_telepon: string } | null
  alasan: AlasanLaporan
  deskripsi: string
  status: StatusLaporan
  catatan_admin: string
  ditangani_oleh?: { _id: string; nama: string } | null
  ditangani_pada?: string | null
  createdAt: string
}

export interface Aktivitas {
  _id: string
  aktor_nama: string
  aktor_role: string
  aksi: string
  target_tipe: string
  target_id: string | null
  target_label: string
  ringkasan: string
  createdAt: string
}

export interface AreaStat {
  area_kampus: string
  jumlah_kos: number
  kamar_tersedia: number
  harga_mulai: number
}

export interface AdminStats {
  kos: {
    totalKos: number
    approved: number
    pending: number
    rejected: number
    totalKamarTersedia: number
    totalKamarTotal: number
  }
  users: { totalUsers: number; admin: number; pemilik: number; pencari: number }
  laporan: { total: number; terbuka: number; diproses: number; selesai: number; ditolak: number }
}

export interface Pagination {
  totalData: number
  totalPages: number
  currentPage: number
  limit: number
}

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data: T
  count?: number
  pagination?: Pagination
  belum_dibaca?: number
}
