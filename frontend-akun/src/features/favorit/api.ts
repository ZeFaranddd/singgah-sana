import { api } from "../../lib/api/client";
import type { Favorit, FavoritSort } from "../../lib/api/types";

export const favoritApi = {
  list: (q: { tersedia?: boolean; sort?: FavoritSort; page?: number; limit?: number }, signal?: AbortSignal) =>
    api.get<Favorit[]>("/favorites", { query: q, signal }),
  remove: (kosId: string) => api.delete<null>(`/favorites/${encodeURIComponent(kosId)}`),
  /** Idempoten di backend: menyimpan dua kali tidak membuat duplikat. Dipakai untuk "Batalkan". */
  add: (kosId: string) => api.put<null>(`/favorites/${encodeURIComponent(kosId)}`),
};
