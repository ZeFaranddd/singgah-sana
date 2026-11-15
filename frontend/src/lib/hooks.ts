import { useCallback, useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
  setData: (updater: T | null | ((prev: T | null) => T | null)) => void
}

/**
 * Menjalankan fungsi async saat komponen tampil / saat deps berubah.
 * Hasil dari permintaan lama diabaikan bila ada permintaan yang lebih baru.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList, enabled = true): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let batal = false
    setLoading(true)
    setError(null)
    fnRef
      .current()
      .then((result) => {
        if (!batal) setData(result)
      })
      .catch((err: unknown) => {
        if (!batal) setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      })
      .finally(() => {
        if (!batal) setLoading(false)
      })
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload, setData }
}

/** Nilai yang baru ikut berubah setelah `delay` ms tanpa perubahan (untuk kolom pencarian). */
export function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export const NOTIF_EVENT = 'singgah:notif'
/** Beri tahu ikon lonceng agar memuat ulang jumlah notifikasi. */
export const emitNotifChanged = () => window.dispatchEvent(new Event(NOTIF_EVENT))

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · Singgah-sana` : 'Singgah-sana — Portal Kos Terverifikasi'
    return () => {
      document.title = previous
    }
  }, [title])
}
