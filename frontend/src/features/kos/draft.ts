import type { KosFormValues } from './schema';

// Draf pendaftaran disimpan di perangkat (localStorage) karena backend belum punya status "draft"
// (kontrak v1.2 bagian 5 masih rancangan). Berkas foto tidak ikut tersimpan; URL foto ikut.

export type KosDraft = {
  values: KosFormValues;
  step: number;
  savedAt: string;
};

function key(userId: string) {
  return `singgahsana.draf-kos.${userId}`;
}

export function loadDraft(userId: string): KosDraft | null {
  try {
    const raw = window.localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as KosDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, values: KosFormValues, step: number): KosDraft {
  const draft: KosDraft = { values, step, savedAt: new Date().toISOString() };
  window.localStorage.setItem(key(userId), JSON.stringify(draft));
  return draft;
}

export function deleteDraft(userId: string): void {
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    // abaikan
  }
}
