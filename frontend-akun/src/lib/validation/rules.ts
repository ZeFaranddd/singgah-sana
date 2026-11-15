/**
 * Validasi di batas penerimaan data. Bentuk keluaran sama dengan `errors` pada
 * respons gagal API ({ field: [pesan] }) sehingga error klien dan server
 * dipakai oleh komponen yang sama. Backend tetap memvalidasi ulang.
 * Dapat diganti Zod + React Hook Form (rekomendasi Kontrak) setelah paketnya
 * lulus pengujian kompatibilitas (K3).
 */
export type FieldErrors = Record<string, string[]>;
export type Rule<V> = (value: string, values: V) => string | null;
export type Schema<V> = { [K in keyof V]?: Rule<V>[] };

export const required =
  (msg = "Wajib diisi"): Rule<unknown> =>
  (v) => (v.trim() ? null : msg);

export const email =
  (msg = "Masukkan alamat email yang valid."): Rule<unknown> =>
  (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : msg);

export const minLength =
  (n: number, msg?: string): Rule<unknown> =>
  (v) => (!v || v.length >= n ? null : (msg ?? `Gunakan minimal ${n} karakter.`));

export const maxLength =
  (n: number, msg?: string): Rule<unknown> =>
  (v) => (v.length <= n ? null : (msg ?? `Maksimal ${n.toLocaleString("id-ID")} karakter.`));

export const password: Rule<unknown> = (v) =>
  !v || (v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)) ? null : "Minimal 8 karakter, dengan huruf dan angka.";

/** Nomor seluler Indonesia: 08xx, 628xx, atau +628xx. */
export const phone =
  (msg = "Masukkan nomor seluler yang valid, mis. 081234567890."): Rule<unknown> =>
  (v) => (!v.trim() || /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(v.replace(/[\s-]/g, "")) ? null : msg);

export const matches =
  <V>(other: keyof V, msg: string): Rule<V> =>
  (v, values) => (v === String(values[other] ?? "") ? null : msg);

export const equals =
  (expected: string, msg: string): Rule<unknown> =>
  (v) => (v === expected ? null : msg);

export function validateField<V>(schema: Schema<V>, name: keyof V, values: V): string[] {
  const out: string[] = [];
  for (const rule of schema[name] ?? []) {
    const r = (rule as Rule<V>)(String(values[name] ?? ""), values);
    if (r) {
      out.push(r);
      break; // satu pesan paling relevan per field
    }
  }
  return out;
}

export function validate<V>(schema: Schema<V>, values: V): FieldErrors {
  const errors: FieldErrors = {};
  for (const name of Object.keys(schema) as (keyof V)[]) {
    const e = validateField(schema, name, values);
    if (e.length) errors[name as string] = e;
  }
  return errors;
}

/** Validasi berkas gambar di klien. Hanya kenyamanan UX; backend memeriksa isi, format, dan ukuran. */
export function validateImage(file: File, maxBytes: number, types: readonly string[]): string | null {
  if (!types.includes(file.type)) return "Gunakan berkas JPG atau PNG.";
  if (file.size > maxBytes) return `Ukuran berkas maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  return null;
}
