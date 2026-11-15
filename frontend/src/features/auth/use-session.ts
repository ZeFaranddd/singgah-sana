'use client';

import { useSyncExternalStore } from 'react';
import { getSession, subscribeSession } from './session';
import type { Session } from './types';

/**
 * Sesi pengguna di komponen klien.
 * `ready` bernilai false selama render server/hidrasi, supaya UI tidak berkedip antara
 * "belum masuk" dan "sudah masuk".
 */
export function useSession(): { session: Session | null; ready: boolean } {
  const session = useSyncExternalStore(subscribeSession, getSession, () => null);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return { session, ready };
}
