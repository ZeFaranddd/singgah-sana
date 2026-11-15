import { apiRequest } from '@/lib/api/client';
import type { ApiResult } from '@/lib/api/types';
import type { Kos, KosInput } from './types';

// Modul API ruang pemilik. Nama fungsi mengikuti operasi target kontrak v1.2 (Lampiran A),
// sedangkan isinya memanggil endpoint backend yang SUDAH ada. Saat backend pindah ke
// /pemilik/kos, hanya berkas ini yang berubah; halaman dan komponen tidak ikut berubah.

/** GET /api/kos/owner/my-kos  (target: GET /pemilik/kos) */
export async function listKosSaya(signal?: AbortSignal): Promise<Kos[]> {
  const result = await apiRequest<ApiResult<Kos[]>>('/kos/owner/my-kos', { signal });
  return result.data;
}

/** GET /api/kos/:id — pemilik boleh membuka kosnya sendiri walau belum terbit. */
export async function getKosSaya(id: string, signal?: AbortSignal): Promise<Kos> {
  const result = await apiRequest<ApiResult<Kos>>(`/kos/${encodeURIComponent(id)}`, { signal });
  return result.data;
}

type CreateKosOptions = {
  files?: File[];
  fotoUrls?: string[];
};

/**
 * POST /api/kos  (target: POST /pemilik/kos + /ajukan)
 * Dengan berkas foto -> multipart (field "foto", maks 5). Tanpa berkas -> JSON dengan foto_urls.
 */
export async function ajukanKos(input: KosInput, { files = [], fotoUrls = [] }: CreateKosOptions): Promise<ApiResult<Kos>> {
  if (files.length > 0) {
    const form = new FormData();
    for (const [key, value] of Object.entries(input)) {
      if (Array.isArray(value)) {
        for (const item of value) form.append(key, item);
      } else {
        form.append(key, String(value));
      }
    }
    for (const file of files) form.append('foto', file);
    return apiRequest<ApiResult<Kos>>('/kos', { method: 'POST', body: form });
  }
  return apiRequest<ApiResult<Kos>>('/kos', { method: 'POST', body: { ...input, foto_urls: fotoUrls } });
}

/**
 * PUT /api/kos/:id  (target: PATCH /pemilik/kos/:id atau resource perubahan)
 * Backend mengembalikan kos ke status "pending" bila data penting berubah.
 */
export async function ubahKos(id: string, input: Partial<KosInput>): Promise<ApiResult<Kos>> {
  return apiRequest<ApiResult<Kos>>(`/kos/${encodeURIComponent(id)}`, { method: 'PUT', body: input });
}

/** PUT /api/kos/:id hanya dengan stok  (target: PATCH /pemilik/kos/:id/ketersediaan). Tanpa tinjau ulang. */
export async function ubahKetersediaan(id: string, jumlahKamarTersedia: number): Promise<ApiResult<Kos>> {
  return apiRequest<ApiResult<Kos>>(`/kos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { jumlah_kamar_tersedia: jumlahKamarTersedia },
  });
}

/** DELETE /api/kos/:id */
export async function hapusKos(id: string): Promise<ApiResult<null>> {
  return apiRequest<ApiResult<null>>(`/kos/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
