'use client';

import { useAsync } from '@/lib/use-async';
import { getKosSaya, listKosSaya } from './api';

export function useKosSaya() {
  return useAsync((signal) => listKosSaya(signal), []);
}

export function useKos(id: string | undefined) {
  return useAsync((signal) => getKosSaya(id as string, signal), [id], Boolean(id));
}
