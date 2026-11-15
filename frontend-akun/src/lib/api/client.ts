import { config } from "../config";
import type { ApiFailure, ApiSuccess, ErrorCode } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly errors: Record<string, string[]>;
  constructor(status: number, body: Pick<ApiFailure, "message" | "code"> & { errors?: Record<string, string[]> }) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.errors = body.errors ?? {};
  }
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown; // objek JSON atau FormData
  signal?: AbortSignal;
}

export interface RawResponse {
  status: number;
  body: ApiSuccess<unknown> | ApiFailure;
}
export type Transport = (method: string, url: string, options: RequestOptions) => Promise<RawResponse>;

let sessionHandler: ((error: ApiError) => void) | null = null;
/** Dipasang AuthProvider: dipanggil saat sesi berakhir (401) atau akun dibatasi. */
export function setSessionErrorHandler(handler: ((error: ApiError) => void) | null) {
  sessionHandler = handler;
}

const fetchTransport: Transport = async (method, url, { body, signal }) => {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(url, {
    method,
    signal,
    // Sesi disarankan berupa cookie HttpOnly (K4, belum disepakati). Token tidak pernah disimpan di JS/localStorage.
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    /* respons bukan JSON */
  }
  if (parsed && typeof parsed === "object" && "success" in parsed) {
    return { status: res.status, body: parsed as RawResponse["body"] };
  }
  return {
    status: res.status,
    body: { success: false, message: "Respons server tidak dapat dibaca.", code: "UNKNOWN" },
  };
};

// Import dinamis di balik pemeriksaan env literal: mock tidak ikut bundle bila flag tidak "true".
async function getTransport(): Promise<Transport> {
  if (process.env.NEXT_PUBLIC_API_MOCK === "true") {
    const mod = await import("./mock/transport");
    return mod.mockTransport;
  }
  return fetchTransport;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "") qs.set(k, String(v));
  const s = qs.toString();
  return `${config.apiBaseUrl}${config.apiPrefix}${path}${s ? `?${s}` : ""}`;
}

export interface Result<T> {
  data: T;
  message: string;
  pagination?: ApiSuccess<T>["pagination"];
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<Result<T>> {
  let raw: RawResponse;
  try {
    raw = await (await getTransport())(method, buildUrl(path, options.query), options);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, {
      code: "NETWORK_ERROR",
      message: "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
    });
  }
  if (raw.body.success) {
    return { data: raw.body.data as T, message: raw.body.message, pagination: raw.body.pagination };
  }
  const error = new ApiError(raw.status, raw.body);
  const isAuthEndpoint = path.startsWith("/auth/login") || path.startsWith("/auth/register");
  if (!isAuthEndpoint && (error.code === "UNAUTHENTICATED" || error.code === "ACCOUNT_SUSPENDED")) {
    sessionHandler?.(error);
  }
  throw error;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("DELETE", path, { ...options, body }),
};

/** Pesan ramah untuk kesalahan yang tidak dipetakan ke field. */
export function errorMessage(e: unknown, fallback = "Terjadi kesalahan. Coba lagi."): string {
  if (e instanceof ApiError) {
    if (e.code === "RATE_LIMITED") return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
    return e.message || fallback;
  }
  return fallback;
}
