import type {
  AdminStats,
  Aktivitas,
  ApiEnvelope,
  AreaStat,
  Favorit,
  Inquiry,
  Kos,
  Laporan,
  Notifikasi,
  Preferensi,
  StatusLaporan,
  StatusVerifikasi,
  User,
} from './types'

// Kosongkan untuk memakai alamat relatif (/api) — proxy Vite saat dev, server yang sama saat produksi.
const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '')

const TOKEN_KEY = 'singgah_sana_token'

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* penyimpanan tidak tersedia (mis. mode privat) */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* diabaikan */
    }
  },
}

export class ApiError extends Error {
  status: number
  data?: unknown
  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

let onSessionExpired: (() => void) | null = null
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn
}

type QueryValue = string | number | boolean | undefined | null
export type Query = Record<string, QueryValue>

const buildQuery = (query?: Query) => {
  if (!query) return ''
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return
    params.set(key, String(value))
  })
  const str = params.toString()
  return str ? `?${str}` : ''
}

interface RequestOptions {
  query?: Query
  body?: unknown
  auth?: boolean
}

const send = async (method: string, path: string, options: RequestOptions = {}): Promise<Response> => {
  const { query, body, auth = true } = options
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body // browser mengatur Content-Type multipart beserta boundary-nya
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  try {
    return await fetch(`${BASE}${path}${buildQuery(query)}`, { method, headers, body: payload })
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet atau pastikan backend berjalan.', 0)
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const res = await send(method, path, options)

  let json: (ApiEnvelope<T> & { message?: string }) | null = null
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (!res.ok || !json || json.success === false) {
    const message = json?.message || `Terjadi kesalahan pada server (kode ${res.status})`
    if (res.status === 401 && options.auth !== false && tokenStore.get()) {
      onSessionExpired?.()
    }
    throw new ApiError(message, res.status, json)
  }
  return json
}

const get = <T>(path: string, query?: Query, auth = true) => request<T>('GET', path, { query, auth })
const post = <T>(path: string, body?: unknown, auth = true) => request<T>('POST', path, { body, auth })
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, { body })
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body })
const del = <T>(path: string) => request<T>('DELETE', path)

export interface AuthPayload extends User {
  token: string
}

export interface KosQuery extends Query {
  q?: string
  tipe?: string
  area_kampus?: string
  harga_min?: number | string
  harga_max?: number | string
  fasilitas?: string
  kamar_tersedia?: boolean | string
  sort?: string
  page?: number
  limit?: number
}

export const api = {
  auth: {
    login: (email: string, password: string) => post<AuthPayload>('/api/auth/login', { email, password }, false),
    register: (body: { nama: string; email: string; password: string; nomor_telepon: string; role: string }) =>
      post<AuthPayload>('/api/auth/register', body, false),
    me: () => get<User>('/api/auth/me'),
    updateProfile: (body: { nama?: string; nomor_telepon?: string; preferensi?: Partial<Preferensi> }) =>
      put<User>('/api/auth/profile', body),
    changePassword: (password_lama: string, password_baru: string) =>
      put<{ token: string }>('/api/auth/password', { password_lama, password_baru }),
  },

  kos: {
    list: (query?: KosQuery) => get<Kos[]>('/api/kos', query, false),
    get: (id: string) => get<Kos>(`/api/kos/${id}`), // kirim token bila ada agar pemilik/admin bisa melihat kos non-publik
    areas: () => get<AreaStat[]>('/api/kos/meta/area', undefined, false),
    mine: () => get<Kos[]>('/api/kos/owner/my-kos'),
    create: (form: FormData) => post<Kos>('/api/kos', form),
    update: (id: string, body: FormData | Record<string, unknown>) => put<Kos>(`/api/kos/${id}`, body),
    remove: (id: string) => del<null>(`/api/kos/${id}`),
  },

  favorit: {
    list: () => get<Favorit[]>('/api/favorit'),
    add: (kosId: string) => post<Favorit>(`/api/favorit/${kosId}`),
    remove: (kosId: string) => del<null>(`/api/favorit/${kosId}`),
  },

  inquiries: {
    send: (kos_id: string, pesan: string) => post<Inquiry>('/api/inquiries', { kos_id, pesan }),
    mine: () => get<Inquiry[]>('/api/inquiries/my'),
    owner: () => get<Inquiry[]>('/api/inquiries/owner'),
    reply: (id: string, balasan: string) => patch<Inquiry>(`/api/inquiries/${id}/reply`, { balasan }),
  },

  notifikasi: {
    list: (query?: Query) => get<Notifikasi[]>('/api/notifikasi', query),
    count: () => get<{ belum_dibaca: number }>('/api/notifikasi/jumlah'),
    read: (id: string) => patch<Notifikasi>(`/api/notifikasi/${id}/baca`),
    readAll: () => patch<{ diperbarui: number }>('/api/notifikasi/baca-semua'),
    remove: (id: string) => del<null>(`/api/notifikasi/${id}`),
  },

  laporan: {
    send: (body: { kos_id: string; alasan: string; deskripsi: string }) => post<Laporan>('/api/laporan', body),
  },

  admin: {
    stats: () => get<AdminStats>('/api/admin/stats'),
    kos: (query?: Query) => get<Kos[]>('/api/admin/kos', query),
    verify: (id: string, status_verifikasi: Exclude<StatusVerifikasi, 'pending'>, catatan_verifikasi?: string) =>
      patch<Kos>(`/api/admin/kos/${id}/verifikasi`, { status_verifikasi, catatan_verifikasi }),
    users: (query?: Query) => get<User[]>('/api/admin/users', query),
    laporan: (query?: Query) => get<Laporan[]>('/api/admin/laporan', query),
    handleLaporan: (id: string, status: Exclude<StatusLaporan, 'terbuka'>, catatan_admin?: string) =>
      patch<Laporan>(`/api/admin/laporan/${id}`, { status, catatan_admin }),
    aktivitas: (query?: Query) => get<Aktivitas[]>('/api/admin/aktivitas', query),
    exportKos: async (): Promise<Blob> => {
      const res = await send('GET', '/api/admin/export/kos')
      if (!res.ok) {
        let message = 'Gagal mengekspor data'
        try {
          message = (await res.json()).message || message
        } catch {
          /* respons bukan JSON */
        }
        throw new ApiError(message, res.status)
      }
      return res.blob()
    },
  },
}
