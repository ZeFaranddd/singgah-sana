import { api } from "../../lib/api/client";
import type { Percakapan, Pesan } from "../../lib/api/types";

export const inquiryApi = {
  list: (signal?: AbortSignal) => api.get<Percakapan[]>("/inquiries", { signal }).then((r) => r.data),
  messages: (id: string, signal?: AbortSignal) => api.get<Pesan[]>(`/inquiries/${encodeURIComponent(id)}/messages`, { signal }).then((r) => r.data),
  send: (id: string, isi: string) => api.post<Pesan>(`/inquiries/${encodeURIComponent(id)}/messages`, { isi }).then((r) => r.data),
  start: (kosId: string, isi: string) => api.post<{ percakapanId: string }>(`/kos/${encodeURIComponent(kosId)}/inquiries`, { isi }).then((r) => r.data),
};
