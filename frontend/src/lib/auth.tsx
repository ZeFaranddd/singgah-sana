import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, setSessionExpiredHandler, tokenStore } from './api'
import { navigate } from './router'
import type { Role, User } from './types'

interface RegisterInput {
  nama: string
  email: string
  password: string
  nomor_telepon: string
  role: Exclude<Role, 'admin'>
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => void
  refresh: () => Promise<User | null>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const homePathFor = (role: Role) =>
  role === 'admin' ? '/admin' : role === 'pemilik' ? '/pemilik' : '/pencari'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(tokenStore.get()))

  const logout = useCallback(() => {
    tokenStore.clear()
    setUserState(null)
    navigate('/')
  }, [])

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUserState(null)
      return null
    }
    const res = await api.auth.me()
    setUserState(res.data)
    return res.data
  }, [])

  // Pulihkan sesi dari token yang tersimpan
  useEffect(() => {
    if (!tokenStore.get()) return
    let batal = false
    api.auth
      .me()
      .then((res) => {
        if (!batal) setUserState(res.data)
      })
      .catch((error: { status?: number }) => {
        // Hanya buang token bila server menolaknya; gangguan jaringan tidak boleh mengeluarkan pengguna
        if (!batal && error?.status === 401) tokenStore.clear()
      })
      .finally(() => {
        if (!batal) setLoading(false)
      })
    return () => {
      batal = true
    }
  }, [])

  // Token kedaluwarsa di tengah sesi
  useEffect(() => {
    setSessionExpiredHandler(() => {
      tokenStore.clear()
      setUserState(null)
      navigate(`/masuk?next=${encodeURIComponent(window.location.pathname)}&expired=1`, { replace: true })
    })
    return () => setSessionExpiredHandler(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password)
    tokenStore.set(res.data.token)
    const me = await api.auth.me()
    setUserState(me.data)
    return me.data
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.auth.register(input)
    tokenStore.set(res.data.token)
    const me = await api.auth.me()
    setUserState(me.data)
    return me.data
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, refresh, setUser: setUserState }),
    [user, loading, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
