import { useState } from 'react'
import type { ReactNode } from 'react'
import { homePathFor, useAuth } from '@/lib/auth'
import { Link, navigate } from '@/lib/router'
import { Icon, Logo, LinkButton, Avatar } from '@/components/ui'

function PublicHeader() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const goArea = () => {
    setOpen(false)
    navigate('/#area')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[88px] max-w-[1440px] items-center gap-8 px-5 md:px-16">
        <Link to="/" aria-label="Beranda Singgah-sana">
          <Logo large />
        </Link>
        <nav className="hidden flex-1 items-center gap-8 md:flex" aria-label="Navigasi utama">
          <Link to="/kos" className="body-medium hover:text-[#7c3aed]">
            Jelajah Kos
          </Link>
          <button type="button" className="hover:text-[#7c3aed]" onClick={goArea}>
            Area Kampus
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          {user ? (
            <>
              <Link to={homePathFor(user.role)} className="hidden items-center gap-3 md:flex">
                <Avatar nama={user.nama} />
                <span className="body-medium text-sm">Dashboard</span>
              </Link>
              <button type="button" className="hidden h-12 rounded-lg border border-[#e2e8f0] px-6 hover:border-violet-300 hover:bg-violet-50 md:block" onClick={logout}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/masuk" className="flex h-12 items-center px-3 hover:text-[#7c3aed] md:px-4">
                Masuk
              </Link>
              <LinkButton to="/daftar?peran=pemilik" className="hidden md:inline-flex">
                Daftarkan kos
              </LinkButton>
            </>
          )}
          <button type="button" aria-label="Buka menu" aria-expanded={open} className="flex size-11 items-center justify-center rounded-lg border border-[#e2e8f0] md:hidden" onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'x' : 'menu'} size={20} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-[#e2e8f0] bg-white px-5 py-4 md:hidden" aria-label="Menu seluler">
          <ul className="space-y-1">
            <li>
              <Link to="/kos" className="block rounded-lg px-3 py-3 hover:bg-[#f5f3ff]" onClick={() => setOpen(false)}>
                Jelajah Kos
              </Link>
            </li>
            <li>
              <button type="button" className="block w-full rounded-lg px-3 py-3 text-left hover:bg-[#f5f3ff]" onClick={goArea}>
                Area Kampus
              </button>
            </li>
            {user ? (
              <>
                <li>
                  <Link to={homePathFor(user.role)} className="block rounded-lg px-3 py-3 hover:bg-[#f5f3ff]" onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button type="button" className="block w-full rounded-lg px-3 py-3 text-left hover:bg-[#f5f3ff]" onClick={logout}>
                    Keluar
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/daftar?peran=pemilik" className="block rounded-lg px-3 py-3 hover:bg-[#f5f3ff]" onClick={() => setOpen(false)}>
                  Daftarkan kos
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="bg-[#f8fafc] px-5 py-10 md:px-12">
      <div className="mx-auto flex max-w-[1344px] flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-[#64748b]">Tempat singgah. Awal cerita.</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link to="/kos" className="hover:text-[#7c3aed]">
              Jelajah kos
            </Link>
            <Link to="/daftar?peran=pemilik" className="hover:text-[#7c3aed]">
              Daftarkan kos
            </Link>
            <Link to="/masuk" className="hover:text-[#7c3aed]">
              Masuk
            </Link>
          </div>
        </div>
        <p className="text-xs text-[#64748b]">© 2026 Singgah-sana</p>
      </div>
    </footer>
  )
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Lompat ke konten
      </a>
      <PublicHeader />
      <div id="konten">{children}</div>
      <Footer />
    </>
  )
}
