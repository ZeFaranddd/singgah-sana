'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './api/client';

type AsyncState<T> = {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  /** Muat ulang data, misalnya setelah aksi berhasil atau tombol "Coba lagi". */
  reload: () => void;
  /** Ganti data lokal tanpa memanggil API, misalnya setelah update berhasil. */
  setData: (updater: (current: T | undefined) => T | undefined) => void;
};

type Settled<T> = { key: string; data?: T; error: string | null };

/**
 * Menjalankan fungsi pengambil data saat komponen tampil dan saat `deps` berubah.
 * `loading` diturunkan dari kunci permintaan (bukan setState di dalam effect),
 * dan hasil permintaan lama diabaikan bila sudah ada permintaan yang lebih baru.
 */
export function useAsync<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[], enabled = true): AsyncState<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [override, setOverride] = useState<{ key: string; data: T | undefined } | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const key = JSON.stringify([version, ...deps]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSettled({ key, data, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setSettled({ key, error: errorMessage(err) });
      });
    return () => controller.abort();
  }, [enabled, key]);

  const current = settled?.key === key ? settled : null;
  const data = override?.key === key ? override.data : current?.data;

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (updater: (value: T | undefined) => T | undefined) => {
      setOverride((prev) => {
        const base = prev?.key === key ? prev.data : settled?.key === key ? settled.data : undefined;
        return { key, data: updater(base) };
      });
    },
    [key, settled],
  );

  return {
    data,
    error: current?.error ?? null,
    loading: enabled && current === null,
    reload,
    setData,
  };
}
