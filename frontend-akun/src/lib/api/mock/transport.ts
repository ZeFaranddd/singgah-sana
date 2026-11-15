/**
 * Mock API. Mengikuti skema ../types dan amplop respons yang sama dengan backend nyata.
 * Hanya dipakai bila VITE_API_MOCK=true; tidak pernah menjadi fallback saat API nyata gagal.
 * Akun uji: nadia@example.com / Password1
 */
import type { RawResponse, RequestOptions, Transport } from "../client";
import type {
  ApiFailure, Favorit, Notifikasi, Percakapan, Pesan, PreferensiNotifikasi, User, KosRingkas,
} from "../types";
import { getScenario } from "./scenario";

const pogung = "/photos/kos-pogung.webp";
const kaliurang = "/photos/kos-kaliurang.webp";
const karangmalang = "/photos/kos-karangmalang.webp";

const SESSION_KEY = "ss-mock-session";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const owner = (id: string, nama: string) => ({ id, nama });
const kosList: KosRingkas[] = [
  { id: "k1", nama: "Kos Singgah Eksklusif Pogung", lokasi: "Pogung Kidul, Mlati", tipe: "Putra", hargaBulanan: 1_650_000, fasilitas: ["AC", "WiFi", "Kamar mandi dalam"], kamarTersedia: 3, fotoUrl: pogung, terverifikasi: true, tampilPublik: true, pemilik: owner("o1", "Budi Santoso") },
  { id: "k2", nama: "Kos Ruang Rindu Kaliurang", lokasi: "Kaliurang, Caturtunggal", tipe: "Campur", hargaBulanan: 1_850_000, fasilitas: ["AC", "WiFi", "Dapur bersama"], kamarTersedia: 0, fotoUrl: kaliurang, terverifikasi: true, tampilPublik: true, pemilik: owner("o2", "Sari Wulandari") },
  { id: "k3", nama: "Kos Taman Karangmalang", lokasi: "Karangmalang, Depok", tipe: "Putra", hargaBulanan: 1_250_000, fasilitas: ["WiFi", "Kipas angin", "Parkir motor"], kamarTersedia: 2, fotoUrl: karangmalang, terverifikasi: true, tampilPublik: false, pemilik: owner("o3", "Agus Prasetyo") },
];

const seedUser: User = {
  id: "u1", nama: "Nadia Putri", email: "nadia@example.com", emailTerverifikasi: true, telepon: "081234567890",
  role: "pencari", status: "active", fotoUrl: null, passwordDiperbaruiPada: "2026-11-12T08:00:00.000Z",
};

const db = {
  password: "Password1",
  user: { ...seedUser },
  favorit: kosList.map<Favorit>((kos, i) => ({ id: `f${i + 1}`, tersimpanPada: ago(24 * (i + 1)), kos })),
  notifikasi: <Notifikasi[]>[
    { id: "n1", jenis: "pesan", judul: "Budi membalas pesanmu", isi: "Masih tersedia 3 kamar. Untuk survei besok sore bisa.", waktu: ago(1), dibaca: false, tautan: "/pesan?c=p1" },
    { id: "n2", jenis: "email", judul: "Email berhasil diverifikasi", isi: "Akunmu siap untuk menyimpan kos dan menghubungi pemilik.", waktu: ago(5), dibaca: false, tautan: null },
    { id: "n3", jenis: "kos", judul: "Informasi kos favorit diperbarui", isi: "Kos Ruang Rindu Kaliurang memiliki pembaruan informasi.", waktu: ago(22), dibaca: true, tautan: null },
  ],
  prefs: <PreferensiNotifikasi>{ pesanPemilik: true, pembaruanFavorit: true, kabarProduk: false },
  percakapan: <Percakapan[]>[
    { id: "p1", pemilik: kosList[0].pemilik, kos: pick(kosList[0]), cuplikan: "Untuk survei besok sore bisa, Kak.", waktu: ago(1), belumDibaca: 1 },
    { id: "p2", pemilik: kosList[1].pemilik, kos: pick(kosList[1]), cuplikan: "Terima kasih sudah menghubungi.", waktu: ago(26), belumDibaca: 0 },
  ],
  pesan: <Record<string, Pesan[]>>{
    p1: [
      { id: "m1", dari: "saya", isi: "Halo Pak Budi, apakah masih ada kamar kosong? Saya ingin survei besok sore.", waktu: ago(1.2), status: "dibaca" },
      { id: "m2", dari: "pemilik", isi: "Halo Kak Nadia, masih tersedia 3 kamar. Untuk survei besok sore bisa, Kak.", waktu: ago(1), status: "dibaca" },
    ],
    p2: [
      { id: "m3", dari: "saya", isi: "Apakah kamar akan tersedia lagi bulan depan?", waktu: ago(27), status: "dibaca" },
      { id: "m4", dari: "pemilik", isi: "Terima kasih sudah menghubungi.", waktu: ago(26), status: "dibaca" },
    ],
  },
  reportSeq: 1148,
};
function pick(k: KosRingkas) {
  return { id: k.id, nama: k.nama, hargaBulanan: k.hargaBulanan, kamarTersedia: k.kamarTersedia, fotoUrl: k.fotoUrl };
}

const loggedIn = () => {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
};
const setLoggedIn = (v: boolean) => {
  try { v ? sessionStorage.setItem(SESSION_KEY, "1") : sessionStorage.removeItem(SESSION_KEY); } catch { /* abaikan */ }
};

const ok = (data: unknown, message = "Berhasil"): RawResponse => ({
  status: 200, body: { success: true, message, data },
});
function paged<T>(all: T[], q: RequestOptions["query"], message = "Data berhasil diambil"): RawResponse {
  const limit = Number(q?.limit ?? 12), page = Number(q?.page ?? 1);
  const slice = all.slice((page - 1) * limit, page * limit);
  return { status: 200, body: { success: true, message, data: slice, pagination: { totalData: all.length, totalPages: Math.max(1, Math.ceil(all.length / limit)), currentPage: page, limit } } };
}
const fail = (status: number, code: ApiFailure["code"], message: string, errors?: Record<string, string[]>): RawResponse => ({
  status, body: { success: false, code, message, ...(errors ? { errors } : {}) },
});
const invalid = (errors: Record<string, string[]>) => fail(422, "VALIDATION_ERROR", "Periksa kembali formulir", errors);
const unauth = () => fail(401, "UNAUTHENTICATED", "Sesi berakhir. Masuk kembali untuk melanjutkan.");

const passwordOk = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

type Handler = (ctx: { body: any; query: RequestOptions["query"]; params: string[] }) => RawResponse | Promise<RawResponse>;
const routes: Array<[string, RegExp, Handler, boolean]> = []; // [method, path, handler, publik]
const route = (m: string, re: RegExp, h: Handler, publik = false) => routes.push([m, re, h, publik]);

// ---------- auth
route("POST", /^\/auth\/login$/, ({ body }) => {
  if (getScenario() === "dibatasi") return fail(403, "ACCOUNT_SUSPENDED", "Akun dibatasi sementara.");
  if (body?.email?.toLowerCase() !== db.user.email || body?.password !== db.password)
    return fail(401, "INVALID_CREDENTIALS", "Email atau kata sandi belum benar. Periksa kembali.");
  setLoggedIn(true);
  return ok(db.user, "Berhasil masuk");
}, true);
route("POST", /^\/auth\/register$/, ({ body }) => {
  const errors: Record<string, string[]> = {};
  if (String(body?.email).toLowerCase() === db.user.email) errors.email = ["Email sudah terdaftar. Silakan masuk."];
  if (!passwordOk(String(body?.password ?? ""))) errors.password = ["Minimal 8 karakter, dengan huruf dan angka."];
  if (Object.keys(errors).length) return invalid(errors);
  db.user = { ...seedUser, nama: body.nama, email: body.email, telepon: body.telepon, emailTerverifikasi: false, role: "pencari" };
  setLoggedIn(true);
  return ok(db.user, "Akun dibuat");
}, true);
route("GET", /^\/auth\/me$/, () => {
  if (getScenario() === "dibatasi" && loggedIn()) return fail(403, "ACCOUNT_SUSPENDED", "Akun dibatasi sementara.");
  return loggedIn() ? ok(db.user) : unauth();
}, true);
route("POST", /^\/auth\/logout$/, () => { setLoggedIn(false); return ok(null, "Berhasil keluar"); }, true);
route("POST", /^\/auth\/forgot-password$/, () => ok(null, "Jika email terdaftar, tautan pemulihan dikirim."), true);
route("POST", /^\/auth\/reset-password$/, ({ body }) => {
  if (body?.token === "kedaluwarsa") return fail(410, "TOKEN_EXPIRED", "Tautan sudah kedaluwarsa.");
  if (!passwordOk(String(body?.password ?? ""))) return invalid({ password: ["Minimal 8 karakter, dengan huruf dan angka."] });
  db.password = body.password;
  return ok(null, "Kata sandi diperbarui");
}, true);
route("POST", /^\/auth\/verify-email$/, ({ body }) => {
  if (body?.token === "kedaluwarsa") return fail(410, "TOKEN_EXPIRED", "Tautan sudah kedaluwarsa.");
  db.user = { ...db.user, emailTerverifikasi: true };
  return ok(db.user, "Email terverifikasi");
}, true);
route("POST", /^\/auth\/resend-verification$/, () => ok(null, "Email verifikasi dikirim ulang"), true);

// ---------- akun
route("GET", /^\/me\/ringkasan$/, () => {
  const empty = getScenario() === "kosong";
  const latest = db.percakapan[0];
  return ok({
    jumlahFavorit: empty ? 0 : db.favorit.length,
    pesanBelumDibaca: empty ? 0 : db.percakapan.reduce((n, p) => n + p.belumDibaca, 0),
    notifikasiBaru: empty ? 0 : db.notifikasi.filter((n) => !n.dibaca).length,
    favoritTerbaru: empty ? [] : db.favorit.slice(0, 3),
    balasanTerbaru: empty || !latest ? null : { percakapanId: latest.id, dari: latest.pemilik.nama, kos: latest.kos.nama, waktu: latest.waktu, cuplikan: "Masih tersedia 3 kamar. Untuk survei besok sore bisa, Kak." },
  });
});
route("PATCH", /^\/me\/profile$/, ({ body }) => {
  const errors: Record<string, string[]> = {};
  if (!String(body?.nama ?? "").trim()) errors.nama = ["Nama wajib diisi"];
  if (Object.keys(errors).length) return invalid(errors);
  db.user = { ...db.user, nama: body.nama.trim(), telepon: body.telepon };
  return ok(db.user, "Profil disimpan");
});
route("POST", /^\/me\/photo$/, ({ body }) => {
  const file = body instanceof FormData ? (body.get("foto") as File | null) : null;
  if (!file || !["image/jpeg", "image/png"].includes(file.type)) return invalid({ foto: ["Gunakan JPG atau PNG."] });
  if (file.size > 2 * 1024 * 1024) return invalid({ foto: ["Ukuran maksimal 2 MB."] });
  db.user = { ...db.user, fotoUrl: URL.createObjectURL(file) };
  return ok(db.user, "Foto diperbarui");
});
route("POST", /^\/me\/password$/, ({ body }) => {
  if (body?.passwordSaatIni !== db.password) return invalid({ passwordSaatIni: ["Kata sandi saat ini belum benar."] });
  if (!passwordOk(String(body?.passwordBaru ?? ""))) return invalid({ passwordBaru: ["Minimal 8 karakter, dengan huruf dan angka."] });
  db.password = body.passwordBaru;
  db.user = { ...db.user, passwordDiperbaruiPada: now() };
  return ok(db.user, "Kata sandi diperbarui");
});
route("POST", /^\/me\/email$/, ({ body }) => {
  if (body?.password !== db.password) return invalid({ password: ["Kata sandi saat ini belum benar."] });
  if (String(body?.emailBaru).toLowerCase() === "sudah@example.com") return invalid({ emailBaru: ["Email sudah dipakai akun lain."] });
  return ok({ emailBaru: body.emailBaru }, "Tautan verifikasi dikirim");
});
route("DELETE", /^\/me$/, ({ body }) => {
  if (body?.password !== db.password) return invalid({ password: ["Kata sandi saat ini belum benar."] });
  setLoggedIn(false);
  return ok(null, "Akun dihapus");
});
route("GET", /^\/me\/notifications$/, ({ query }) => {
  if (getScenario() === "kosong") return paged([], query);
  let list = db.notifikasi;
  if (query?.status === "belum-dibaca") list = list.filter((n) => !n.dibaca);
  return paged(list, query);
});
route("POST", /^\/me\/notifications\/read-all$/, () => { db.notifikasi.forEach((n) => (n.dibaca = true)); return ok(null, "Semua notifikasi dibaca"); });
route("POST", /^\/me\/notifications\/([^/]+)\/read$/, ({ params }) => { const n = db.notifikasi.find((x) => x.id === params[0]); if (n) n.dibaca = true; return ok(null); });
route("GET", /^\/me\/notification-preferences$/, () => ok(db.prefs));
route("PUT", /^\/me\/notification-preferences$/, ({ body }) => { db.prefs = { ...db.prefs, ...body }; return ok(db.prefs, "Preferensi disimpan"); });

// ---------- favorit
route("GET", /^\/favorites$/, ({ query }) => {
  if (getScenario() === "kosong") return paged([], query);
  let list = [...db.favorit];
  if (query?.tersedia === "true") list = list.filter((f) => f.kos.kamarTersedia > 0 && f.kos.tampilPublik);
  if (query?.sort === "harga-asc") list.sort((a, b) => a.kos.hargaBulanan - b.kos.hargaBulanan);
  if (query?.sort === "harga-desc") list.sort((a, b) => b.kos.hargaBulanan - a.kos.hargaBulanan);
  return paged(list, query);
});
route("DELETE", /^\/favorites\/([^/]+)$/, ({ params }) => {
  const i = db.favorit.findIndex((f) => f.kos.id === params[0]);
  if (i >= 0) { removed.set(params[0], db.favorit[i]); db.favorit.splice(i, 1); }
  return ok(null, "Dihapus dari favorit");
});
const removed = new Map<string, Favorit>();
route("PUT", /^\/favorites\/([^/]+)$/, ({ params }) => {
  const f = removed.get(params[0]) ?? (kosList.find((k) => k.id === params[0]) && { id: `f-${params[0]}`, tersimpanPada: now(), kos: kosList.find((k) => k.id === params[0])! });
  if (!f) return fail(404, "NOT_FOUND", "Kos tidak ditemukan.");
  if (!db.favorit.some((x) => x.kos.id === params[0])) db.favorit.push(f); // idempoten: tidak terduplikasi
  return ok(null, "Disimpan ke favorit");
});

// ---------- pesan
route("GET", /^\/inquiries$/, () => ok(getScenario() === "kosong" ? [] : db.percakapan));
route("GET", /^\/inquiries\/([^/]+)\/messages$/, ({ params }) => {
  const p = db.percakapan.find((x) => x.id === params[0]);
  if (!p) return fail(404, "NOT_FOUND", "Percakapan tidak ditemukan.");
  p.belumDibaca = 0;
  return ok([...(db.pesan[p.id] ?? [])]); // salinan: respons nyata bukan referensi ke state server
});
route("POST", /^\/inquiries\/([^/]+)\/messages$/, ({ params, body }) => {
  const p = db.percakapan.find((x) => x.id === params[0]);
  if (!p) return fail(404, "NOT_FOUND", "Percakapan tidak ditemukan.");
  const isi = String(body?.isi ?? "").trim();
  if (!isi) return invalid({ isi: ["Pesan wajib diisi"] });
  if (isi.length > 2000) return invalid({ isi: ["Maksimal 2.000 karakter"] });
  if (isi.toLowerCase().includes("gagal")) return fail(500, "UNKNOWN", "Pesan gagal terkirim.");
  const msg: Pesan = { id: `m${Date.now()}`, dari: "saya", isi, waktu: now(), status: "terkirim" };
  (db.pesan[p.id] ??= []).push(msg);
  p.cuplikan = isi; p.waktu = msg.waktu;
  return ok(msg, "Pesan terkirim");
});
route("POST", /^\/kos\/([^/]+)\/inquiries$/, ({ params, body }) => {
  const kos = kosList.find((k) => k.id === params[0]);
  if (!kos) return fail(404, "NOT_FOUND", "Kos tidak ditemukan.");
  if (!kos.tampilPublik) return fail(409, "CONFLICT", "Listing sedang tidak aktif dan tidak menerima pertanyaan baru.");
  const isi = String(body?.isi ?? "").trim();
  if (!isi) return invalid({ isi: ["Pesan wajib diisi"] });
  let p = db.percakapan.find((x) => x.kos.id === kos.id);
  if (!p) { p = { id: `p${Date.now()}`, pemilik: kos.pemilik, kos: pick(kos), cuplikan: isi, waktu: now(), belumDibaca: 0 }; db.percakapan.unshift(p); }
  (db.pesan[p.id] ??= []).push({ id: `m${Date.now()}`, dari: "saya", isi, waktu: now(), status: "terkirim" });
  return ok({ percakapanId: p.id }, "Pesan terkirim");
});

// ---------- laporan
route("POST", /^\/kos\/([^/]+)\/reports$/, ({ body }) => {
  const f = body instanceof FormData ? body : null;
  const errors: Record<string, string[]> = {};
  if (!f?.get("kategori")) errors.kategori = ["Pilih kategori laporan"];
  if (String(f?.get("keterangan") ?? "").trim().length < 20) errors.keterangan = ["Jelaskan minimal 20 karakter"];
  if (Object.keys(errors).length) return invalid(errors);
  db.reportSeq += 1;
  return ok({ id: `r${db.reportSeq}`, nomor: `SS-2026-${db.reportSeq}` }, "Laporan terkirim");
});

export const mockTransport: Transport = async (method, url, options) => {
  const scenario = getScenario();
  await wait(scenario === "lambat" ? 3000 : 350);
  const u = new URL(url, location.origin);
  const path = u.pathname.replace(/^.*?\/api(?:\/v\d+)?/, "") || "/";
  const query = Object.fromEntries(u.searchParams);
  for (const [m, re, handler, publik] of routes) {
    const match = re.exec(path);
    if (m !== method || !match) continue;
    if (!publik) {
      if (!loggedIn() || scenario === "sesi") return unauth();
      if (scenario === "dibatasi") return fail(403, "ACCOUNT_SUSPENDED", "Akun dibatasi sementara.");
      if (scenario === "gagal" && method === "GET") return fail(500, "UNKNOWN", "Server sedang bermasalah. Coba lagi sebentar lagi.");
    }
    return handler({ body: options.body, query, params: match.slice(1) });
  }
  return fail(404, "NOT_FOUND", "Endpoint tidak ditemukan.");
};
