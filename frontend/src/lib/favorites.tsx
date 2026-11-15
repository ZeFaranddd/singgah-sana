import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import { useAuth } from './auth'
import { navigate } from './router'
import { useToast } from './toast'

interface FavoritesContextValue {
  ids: Set<string>
  isSaved: (kosId: string) => boolean
  toggle: (kosId: string) => Promise<void>
  count: number
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const toast = useToast()
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<Set<string>>(new Set())

  const isSeeker = user?.role === 'pencari'

  useEffect(() => {
    if (!isSeeker) {
      setIds(new Set())
      return
    }
    let batal = false
    api.favorit
      .list()
      .then((res) => {
        if (!batal) setIds(new Set(res.data.map((f) => f.kos_id._id)))
      })
      .catch(() => {
        /* daftar favorit gagal dimuat: ikon tetap kosong, tidak mengganggu halaman */
      })
    return () => {
      batal = true
    }
  }, [isSeeker, user?._id])

  const toggle = useCallback(
    async (kosId: string) => {
      if (!user) {
        toast.info('Masuk dulu untuk menyimpan kos ke favorit.')
        navigate(`/masuk?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
        return
      }
      if (user.role !== 'pencari') {
        toast.info('Favorit hanya tersedia untuk akun pencari kos.')
        return
      }
      if (busy.has(kosId)) return

      const sudahTersimpan = ids.has(kosId)
      setBusy((b) => new Set(b).add(kosId))
      try {
        if (sudahTersimpan) {
          await api.favorit.remove(kosId)
          setIds((current) => {
            const next = new Set(current)
            next.delete(kosId)
            return next
          })
          toast.success('Dihapus dari favorit.')
        } else {
          await api.favorit.add(kosId)
          setIds((current) => new Set(current).add(kosId))
          toast.success('Disimpan ke favorit.')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal memperbarui favorit')
      } finally {
        setBusy((b) => {
          const next = new Set(b)
          next.delete(kosId)
          return next
        })
      }
    },
    [user, ids, busy, toast],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({ ids, isSaved: (id) => ids.has(id), toggle, count: ids.size }),
    [ids, toggle],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites harus dipakai di dalam <FavoritesProvider>')
  return ctx
}
