export type StatusInquiry = 'menunggu' | 'dibalas';

/** Bentuk inquiry dari GET /api/inquiries/owner (kos_id & pencari_id sudah di-populate). */
export type OwnerInquiry = {
  _id: string;
  kos_id: { _id: string; nama: string; alamat: string };
  pencari_id: { _id: string; nama: string; nomor_telepon?: string; email?: string } | null;
  pemilik_id: string;
  pesan: string;
  balasan: string;
  status: StatusInquiry;
  createdAt: string;
  updatedAt: string;
};
