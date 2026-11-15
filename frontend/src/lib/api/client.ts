import { API_URL } from './config';
import { clearSession, getToken } from '@/features/auth/session';

/** Galat field: { nama: ["Nama wajib diisi"] } — format error kontrak v1.2. */
export type FieldErrors = Record<string, string[]>;

type ApiErrorBody = {
  success?: boolean;
  message?: string;
  code?: string;
  errors?: FieldErrors;
  data?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: FieldErrors;
  readonly data?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || defaultMessage(status));
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fieldErrors = body.errors;
    this.data = body.data;
  }
}

function defaultMessage(status: number): string {
  if (status === 0) return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  if (status === 401) return 'Sesi Anda berakhir. Silakan masuk kembali.';
  if (status === 403) return 'Anda tidak memiliki akses untuk tindakan ini.';
  if (status === 404) return 'Data tidak ditemukan.';
  if (status === 409) return 'Data sudah berubah. Muat ulang lalu coba lagi.';
  if (status >= 500) return 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi.';
  return 'Permintaan tidak dapat diproses.';
}

export const SESSION_EXPIRED_EVENT = 'singgahsana:session-expired';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Objek biasa dikirim sebagai JSON; FormData dikirim apa adanya (multipart). */
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Default true: sertakan header Authorization jika ada sesi. */
  auth?: boolean;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_URL}${path.startsWith('/') ? '' : '/'}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Satu-satunya pintu komponen ke API backend.
 * Mengembalikan isi JSON lengkap ({ success, message, data, ... }) atau melempar ApiError.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, auth = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      signal,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, {});
  }

  const text = await response.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearSession();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, (json as ApiErrorBody) ?? {});
  }

  return json as T;
}

/** Pesan galat yang aman ditampilkan ke pengguna. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan. Coba lagi.';
}
