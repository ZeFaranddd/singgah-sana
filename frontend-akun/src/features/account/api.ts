import { api } from "../../lib/api/client";
import type { Notifikasi, PreferensiNotifikasi, Ringkasan, User } from "../../lib/api/types";

export const accountApi = {
  summary: (signal?: AbortSignal) => api.get<Ringkasan>("/me/ringkasan", { signal }).then((r) => r.data),
  updateProfile: (b: { nama: string; telepon: string }) => api.patch<User>("/me/profile", b).then((r) => r.data),
  uploadPhoto: (file: File) => {
    const f = new FormData();
    f.append("foto", file);
    return api.post<User>("/me/photo", f).then((r) => r.data);
  },
  changePassword: (b: { passwordSaatIni: string; passwordBaru: string }) =>
    api.post<User>("/me/password", b).then((r) => r.data),
  changeEmail: (b: { emailBaru: string; password: string }) => api.post<{ emailBaru: string }>("/me/email", b).then((r) => r.data),
  deleteAccount: (b: { password: string }) => api.delete<null>("/me", b),
  notifications: (q: { status?: "belum-dibaca"; page?: number; limit?: number }, signal?: AbortSignal) =>
    api.get<Notifikasi[]>("/me/notifications", { query: q, signal }),
  markRead: (id: string) => api.post<null>(`/me/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => api.post<null>("/me/notifications/read-all"),
  preferences: (signal?: AbortSignal) => api.get<PreferensiNotifikasi>("/me/notification-preferences", { signal }).then((r) => r.data),
  savePreferences: (b: PreferensiNotifikasi) => api.put<PreferensiNotifikasi>("/me/notification-preferences", b).then((r) => r.data),
};
