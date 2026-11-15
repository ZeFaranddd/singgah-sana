const DEFAULT_API_URL = 'http://localhost:5000/api';

/** URL dasar API Express, termasuk prefix /api. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

/** Origin backend tanpa /api, dipakai untuk berkas statis seperti /uploads. */
export const BACKEND_ORIGIN = API_URL.replace(/\/api$/, '');

/** Foto dari backend bisa berupa URL penuh atau path relatif "/uploads/...". */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
