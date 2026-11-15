import { api } from "../../lib/api/client";
import type { KategoriLaporan, LaporanHasil } from "../../lib/api/types";

export const reportApi = {
  create: (kosId: string, b: { kategori: KategoriLaporan; keterangan: string; lampiran?: File | null }) => {
    const f = new FormData();
    f.append("kategori", b.kategori);
    f.append("keterangan", b.keterangan);
    if (b.lampiran) f.append("lampiran", b.lampiran);
    return api.post<LaporanHasil>(`/kos/${encodeURIComponent(kosId)}/reports`, f).then((r) => r.data);
  },
};
