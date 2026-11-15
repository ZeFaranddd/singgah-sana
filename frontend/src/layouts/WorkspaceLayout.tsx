import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { NOTIF_EVENT } from '@/lib/hooks'
import { Link, useLocation } from '@/lib/router'
import { Avatar, Badge, Icon, Logo } from '@/components/ui'
import { Footer } from './PublicLayout'

interface MenuItem {
  icon: string
  label: string
  path: string
  /** path tambahan yang juga dianggap aktif untuk menu ini */
  also?: string[]
}

const menus: Record<'pencari' | 'pemilik' | 'admin', { title: string; subtitle?: string; headerLabel: string; items: MenuItem[] }> = {
  pencari: {
    title: 'Akun saya',
    subtitle: 'Kelola pengalamanmu',
    headerLabel: 'Akun pencari',
    items: [
      { icon: 'home', label: 'Ringkasan', path: '/pencari' },
      { icon: 'heart', label: 'Favorit', path: '/pencari/favorit' },
      { icon: 'message', label: 'Pesan', path: '/pencari/pesan' },
      { icon: 'bell', label: 'Notifikasi', path: '/pencari/notifikasi' },
      { icon: 'user', label: 'Profil', path: '/pencari/profil' },
      { icon: 'shield', label: 'Keamanan', path: '/pencari/keamanan' },
      { icon: 'sliders', label: 'Preferensi', path: '/pencari/preferensi' },
    ],
  },
  pemilik: {
    title: 'Kelola properti',
    subtitle: 'Semua kos dalam satu tempat',
    headerLabel: 'Ruang pemilik',
    items: [
      { icon: 'home', label: 'Ringkasan', path: '/pemilik' },
      { icon: 'pin', label: 'Kos saya', path: '/pemilik/kos', also: ['/pemilik/kos/baru', '/pemilik/kos/'] },
      { icon: 'message', label: 'Pesan', path: '/pemilik/pesan' },
      { icon: 'bell', label: 'Notifikasi', path: '/pemilik/notifikasi' },
      { icon: 'user', label: 'Profil', path: '/pemilik/profil' },
      { icon: 'shield', label: 'Keamanan', path: '/pemilik/keamanan' },
    ],
  },
  admin: {
    title: 'Administrasi',
    headerLabel: 'Ruang admin',
    items: [
      { icon: 'home', label: 'Ringkasan', path: '/admin' },
      { icon: 'shield', label: 'Peninjauan', path: '/admin/peninjauan' },
      { icon: 'pin', label: 'Semua kos', path: '/admin/kos' },
      { icon: 'user', label: 'Pengguna', path: '/admin/pengguna' },
      { icon: 'flag', label: 'Laporan', path: '/admin/laporan' },
      { icon: 'clock', label: 'Aktivitas', path: '/admin/aktivitas' },
      { icon: 'bell', label: 'Notifikasi', path: '/admin/notifikasi' },
      { icon: 'lock', label: 'Akun', path: '/admin/profil', also: ['/admin/keamanan'] },
    ],
  },
}

const isActive = (item: MenuItem, pathname: string) => {
  if (pathname === item.path) return true
  if (item.also?.some((p) => (p.endsWith('/') ? pathname.startsWith(p) : pathname === p))) return true
  return false
}

function NotificationBell({ to }: { to: string }) {
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    api.notifikasi
      .count()
      .then((res) => setCount(res.data.belum_dibaca))
      .catch(() => {
        /* jumlah notifikasi gagal dimuat: lonceng tampil tanpa angka */
      })
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    window.addEventListener(NOTIF_EVENT, load)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(NOTIF_EVENT, load)
    }
  }, [load])

  return (
    <Link to={to} aria-label={count > 0 ? `Notifikasi, ${count} belum dibaca` : 'Notifikasi'} className="relative flex size-11 items-center justify-center rounded-full border border-[#e2e8f0] hover:bg-[#f5f3ff]">
      <Icon name="bell" size={20} />
      {count > 0 && (
        <span className="label absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[#7c3aed] px-1 text-[11px] leading-5 text-white">{count > 99 ? '99+' : count}</span>
      )}
    </Link>
  )
}

export function WorkspaceLayout({ mode, children }: { mode: 'pencari' | 'pemilik' | 'admin'; children: ReactNode }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const menu = menus[mode]

  return (
    <>
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex h-[88px] max-w-[1440px] items-center gap-4 px-5 md:gap-6 md:px-6">
          <Link to="/" aria-label="Ke beranda Singgah-sana">
            <Logo large />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="body-medium truncate">{menu.headerLabel}</p>
            {mode === 'admin' && <p className="text-xs text-[#64748b]">Moderasi portal kos</p>}
          </div>
          {mode === 'pemilik' && <span className="hidden sm:block"><Badge tone="green">Akun pemilik</Badge></span>}
          <Link to="/kos" className="hidden h-12 items-center rounded-lg border border-[#e2e8f0] px-6 hover:border-violet-300 hover:bg-violet-50 md:inline-flex">
            Lihat situs
          </Link>
          <NotificationBell to={`/${mode}/notifikasi`} />
          <div className="hidden items-center gap-3 lg:flex">
            <Avatar nama={user?.nama} />
            <div className="max-w-40 leading-tight">
              <p className="body-medium truncate text-sm">{user?.nama}</p>
              <p className="truncate text-xs text-[#64748b]">{user?.email}</p>
            </div>
          </div>
          <button type="button" onClick={logout} className="flex h-11 items-center gap-2 rounded-lg border border-[#e2e8f0] px-3 text-sm hover:border-violet-300 hover:bg-violet-50 md:px-5" aria-label="Keluar">
            <Icon name="logout" size={16} />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </header>
      <main className="min-h-[calc(100vh-192px)] bg-[#f8fafc] px-5 py-8 md:px-10 lg:px-16 lg:py-16">
        <div className="mx-auto grid max-w-[1312px] gap-8 lg:grid-cols-[216px_1fr]">
          <aside className="h-fit rounded-lg bg-white p-4 lg:sticky lg:top-6">
            <h2 className="body-medium">{menu.title}</h2>
            {menu.subtitle && <p className="mt-2 text-xs text-[#64748b]">{menu.subtitle}</p>}
            <nav aria-label={menu.title} className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
              {menu.items.map((item) => {
                const active = isActive(item, pathname)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={`label flex min-w-max items-center gap-3 rounded-lg p-3 text-sm ${active ? 'bg-[#f5f3ff] text-[#7c3aed]' : 'hover:bg-[#f8fafc]'}`}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  )
}
