import type { BadgeTone } from '@/components/ui/badge';
import type { Kos } from './types';

export type StatusKey = 'terbit' | 'ditinjau' | 'ditinjau_ulang' | 'perlu_revisi';

type StatusInfo = {
  key: StatusKey;
  label: string;
  tone: BadgeTone;
  /** Penjelasan singkat di bawah nama kos pada daftar. */
  hint: string;
};

// Pesan yang ditulis backend saat pemilik mengubah data penting kos yang sudah ditinjau.
const PENANDA_TINJAU_ULANG = 'menunggu verifikasi ulang';

/**
 * Satu-satunya tempat pemetaan status backend -> label UI.
 * Backend sekarang: pending/approved/rejected. Jika model status dipisah (kontrak v1.2, bagian 5),
 * cukup fungsi ini yang diubah.
 */
export function getKosStatus(kos: Pick<Kos, 'status_verifikasi' | 'catatan_verifikasi'>): StatusInfo {
  switch (kos.status_verifikasi) {
    case 'approved':
      return { key: 'terbit', label: 'Terbit', tone: 'success', hint: 'Tampil di pencarian publik' };
    case 'rejected':
      return {
        key: 'perlu_revisi',
        label: 'Perlu revisi',
        tone: 'danger',
        hint: kos.catatan_verifikasi || 'Perlu diperbaiki sebelum ditinjau ulang',
      };
    case 'pending':
    default:
      if (kos.catatan_verifikasi?.toLowerCase().includes(PENANDA_TINJAU_ULANG)) {
        return { key: 'ditinjau_ulang', label: 'Ditinjau ulang', tone: 'warning', hint: 'Perubahan menunggu peninjauan admin' };
      }
      return { key: 'ditinjau', label: 'Ditinjau', tone: 'neutral', hint: 'Menunggu peninjauan admin' };
  }
}

export function isPublic(kos: Pick<Kos, 'status_verifikasi'>): boolean {
  return kos.status_verifikasi === 'approved';
}
