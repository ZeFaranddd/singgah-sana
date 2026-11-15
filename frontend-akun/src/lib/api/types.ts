/** Tipe kontrak request/response. Usulan sampai K8 disepakati; sumber tunggal untuk FE dan mock. */

export type Role = "pencari" | "pemilik" | "admin";
export type AccountStatus = "active" | "suspended";

export interface User {
  id: string;
  nama: string;
  email: string;
  emailTerverifikasi: boolean;
  telepon: string;
  role: Role;
  status: AccountStatus;
  fotoUrl: string | null;
  passwordDiperbaruiPada: string; // ISO
}

export interface Pagination {
  totalData: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  pagination?: Pagination;
}

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "ACCOUNT_SUSPENDED"
  | "EMAIL_NOT_VERIFIED"
  | "TOKEN_EXPIRED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface ApiFailure {
  success: false;
  message: string;
  code: ErrorCode;
  errors?: Record<string, string[]>;
}

export type KosTipe = "Putra" | "Putri" | "Campur";

export interface KosRingkas {
  id: string;
  nama: string;
  lokasi: string;
  tipe: KosTipe;
  hargaBulanan: number;
  fasilitas: string[];
  kamarTersedia: number;
  fotoUrl: string;
  terverifikasi: boolean;
  /** Keputusan tampil publik dihitung backend (approved + active + normal + akun pemilik active). */
  tampilPublik: boolean;
  pemilik: { id: string; nama: string };
}

export interface Favorit {
  id: string;
  tersimpanPada: string;
  kos: KosRingkas;
}

export type FavoritSort = "terbaru" | "harga-asc" | "harga-desc";

export interface Notifikasi {
  id: string;
  jenis: "pesan" | "email" | "kos";
  judul: string;
  isi: string;
  waktu: string;
  dibaca: boolean;
  tautan: string | null;
}

export interface PreferensiNotifikasi {
  pesanPemilik: boolean;
  pembaruanFavorit: boolean;
  kabarProduk: boolean;
}

export interface Ringkasan {
  jumlahFavorit: number;
  pesanBelumDibaca: number;
  notifikasiBaru: number;
  favoritTerbaru: Favorit[];
  balasanTerbaru: { percakapanId: string; dari: string; kos: string; waktu: string; cuplikan: string } | null;
}

export interface Percakapan {
  id: string;
  pemilik: { id: string; nama: string };
  kos: Pick<KosRingkas, "id" | "nama" | "hargaBulanan" | "kamarTersedia" | "fotoUrl">;
  cuplikan: string;
  waktu: string;
  belumDibaca: number;
}

export type PesanStatus = "terkirim" | "dibaca";
export interface Pesan {
  id: string;
  dari: "saya" | "pemilik";
  isi: string;
  waktu: string;
  status: PesanStatus;
}

export type KategoriLaporan = "harga" | "foto" | "alamat" | "ketersediaan" | "lainnya";
export interface LaporanHasil {
  id: string;
  nomor: string;
}
