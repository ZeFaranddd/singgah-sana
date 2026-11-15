import { api } from "../../lib/api/client";
import type { User } from "../../lib/api/types";

// Path endpoint = USUL AN (Kontrak K8). Satu tempat untuk diubah bila disepakati lain.
export const authApi = {
  me: (signal?: AbortSignal) => api.get<User>("/auth/me", { signal }).then((r) => r.data),
  login: (b: { email: string; password: string }) => api.post<User>("/auth/login", b).then((r) => r.data),
  // Peran TIDAK dikirim: admin tidak boleh diperoleh lewat registrasi publik.
  register: (b: { nama: string; email: string; telepon: string; password: string }) =>
    api.post<User>("/auth/register", b).then((r) => r.data),
  logout: () => api.post<null>("/auth/logout"),
  forgotPassword: (b: { email: string }) => api.post<null>("/auth/forgot-password", b),
  resetPassword: (b: { token: string; password: string }) => api.post<null>("/auth/reset-password", b),
  verifyEmail: (b: { token: string }) => api.post<User>("/auth/verify-email", b).then((r) => r.data),
  resendVerification: () => api.post<null>("/auth/resend-verification"),
};
