import type { ReactNode } from 'react'
import { homePathFor, useAuth } from '@/lib/auth'
import { Redirect } from '@/lib/router'
import type { Role } from '@/lib/types'
import { LoadingBlock } from './ui'

/** Hanya tampilkan children bila pengguna login dengan salah satu peran yang diizinkan. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="Memeriksa sesi…" />
      </div>
    )
  }
  if (!user) {
    const next = encodeURIComponent(window.location.pathname + window.location.search)
    return <Redirect to={`/masuk?next=${next}`} />
  }
  if (!roles.includes(user.role)) return <Redirect to={homePathFor(user.role)} />
  return <>{children}</>
}

/** Halaman tamu (login/daftar): pengguna yang sudah masuk diarahkan ke dashboard-nya. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="Memeriksa sesi…" />
      </div>
    )
  }
  if (user) {
    const next = new URLSearchParams(window.location.search).get('next')
    const aman = next && next.startsWith('/') && !next.startsWith('//')
    return <Redirect to={aman ? next : homePathFor(user.role)} />
  }
  return <>{children}</>
}
