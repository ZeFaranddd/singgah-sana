"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";

export type AsyncState<T> =
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: T; error: ApiError | Error };

/** Memuat data sekali per perubahan deps; `reload` untuk coba lagi. Membatalkan hasil basi. */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ status: "loading", data: s.data }));
    loaderRef.current(ctrl.signal).then(
      (data) => !ctrl.signal.aborted && setState({ status: "success", data }),
      (error) => !ctrl.signal.aborted && setState({ status: "error", error, data: undefined }),
    );
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater: (prev: T) => T) => {
    setState((s) => (s.status === "success" ? { status: "success", data: updater(s.data) } : s));
  }, []);
  return { ...state, reload, setData };
}
