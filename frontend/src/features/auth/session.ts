import type { Session } from './types';

// Penyimpanan sesi di sisi klien (localStorage), sesuai backend saat ini yang memakai JWT Bearer.
// Jika tim beralih ke sesi server + cookie (keputusan D1 di kontrak), cukup modul ini yang diganti.
// Modul ini dipakai bersama: halaman masuk (Orang 2) memanggil saveSession() setelah login berhasil.

const STORAGE_KEY = 'singgahsana.session';
const CHANGE_EVENT = 'singgahsana:session-change';

let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;

function readStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Sesi aktif, atau null. Hasil di-cache agar referensinya stabil untuk useSyncExternalStore. */
export function getSession(): Session | null {
  const raw = readStorage();
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Session) : null;
    cachedSession = parsed && parsed.token && parsed.user ? parsed : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function saveSession(session: Session): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // abaikan: penyimpanan bisa tidak tersedia pada mode tertentu
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Untuk useSyncExternalStore: memberi tahu saat sesi berubah, juga dari tab lain. */
export function subscribeSession(onChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', handleStorage);
  };
}
