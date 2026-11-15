import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth'
import { FavoritesProvider } from '@/lib/favorites'
import { Link, matchPath, Redirect, useLocation } from '@/lib/router'
import { ToastProvider } from '@/lib/toast'
import { GuestOnly, RequireRole } from '@/components/guards'
import { LinkButton } from '@/components/ui'
import { PublicLayout } from '@/layouts/PublicLayout'
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout'
import { LoginPage, RegisterPage } from '@/pages/Auth'
import { BrowsePage } from '@/pages/Browse'
import { DetailPage } from '@/pages/Detail'
import { HomePage } from '@/pages/Home'
import { KeamananPage, ProfilPage } from '@/pages/shared/Akun'
import { NotifikasiPage } from '@/pages/shared/Notifikasi'
import { SeekerFavorit } from '@/pages/seeker/Favorit'
import { SeekerPesan } from '@/pages/seeker/Pesan'
import { SeekerPreferensi } from '@/pages/seeker/Preferensi'
import { SeekerRingkasan } from '@/pages/seeker/Ringkasan'
import { OwnerKosForm } from '@/pages/owner/KosForm'
import { OwnerKosSaya } from '@/pages/owner/KosSaya'
import { OwnerPesan } from '@/pages/owner/Pesan'
import { OwnerRingkasan } from '@/pages/owner/Ringkasan'
import { AdminAktivitas } from '@/pages/admin/Aktivitas'
import { AdminLaporan } from '@/pages/admin/Laporan'
import { AdminPeninjauan } from '@/pages/admin/Peninjauan'
import { AdminPengguna } from '@/pages/admin/Pengguna'
import { AdminRingkasan } from '@/pages/admin/Ringkasan'
import { AdminSemuaKos } from '@/pages/admin/SemuaKos'

type Params = Record<string, string>
type Mode = 'pencari' | 'pemilik' | 'admin'

const workspace = (mode: Mode, page: ReactNode) => (
  <RequireRole roles={[mode]}>
    <WorkspaceLayout mode={mode}>{page}</WorkspaceLayout>
  </RequireRole>
)

function NotFound() {
  return (
    <PublicLayout>
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <p className="font-display text-6xl text-[#7c3aed]">404</p>
        <h1 className="font-heading mt-4 text-2xl">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-[#64748b]">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
        <div className="mt-8 flex gap-3">
          <LinkButton variant="primary" to="/">Ke beranda</LinkButton>
          <Link to="/kos" className="inline-flex h-12 items-center rounded-lg border border-[#e2e8f0] px-6 hover:bg-violet-50">Jelajah kos</Link>
        </div>
      </main>
    </PublicLayout>
  )
}

const routes: { path: string; render: (p: Params) => ReactNode }[] = [
  { path: '/', render: () => <HomePage /> },
  { path: '/kos', render: () => <BrowsePage /> },
  { path: '/kos/:id', render: (p) => <DetailPage id={p.id} key={p.id} /> },
  { path: '/masuk', render: () => <GuestOnly><LoginPage /></GuestOnly> },
  { path: '/daftar', render: () => <GuestOnly><RegisterPage /></GuestOnly> },

  { path: '/pencari', render: () => workspace('pencari', <SeekerRingkasan />) },
  { path: '/pencari/favorit', render: () => workspace('pencari', <SeekerFavorit />) },
  { path: '/pencari/pesan', render: () => workspace('pencari', <SeekerPesan />) },
  { path: '/pencari/notifikasi', render: () => workspace('pencari', <NotifikasiPage />) },
  { path: '/pencari/profil', render: () => workspace('pencari', <ProfilPage />) },
  { path: '/pencari/keamanan', render: () => workspace('pencari', <KeamananPage />) },
  { path: '/pencari/preferensi', render: () => workspace('pencari', <SeekerPreferensi />) },

  { path: '/pemilik', render: () => workspace('pemilik', <OwnerRingkasan />) },
  { path: '/pemilik/kos', render: () => workspace('pemilik', <OwnerKosSaya />) },
  { path: '/pemilik/kos/baru', render: () => workspace('pemilik', <OwnerKosForm />) },
  { path: '/pemilik/kos/:id/ubah', render: (p) => workspace('pemilik', <OwnerKosForm id={p.id} key={p.id} />) },
  { path: '/pemilik/pesan', render: () => workspace('pemilik', <OwnerPesan />) },
  { path: '/pemilik/notifikasi', render: () => workspace('pemilik', <NotifikasiPage />) },
  { path: '/pemilik/profil', render: () => workspace('pemilik', <ProfilPage />) },
  { path: '/pemilik/keamanan', render: () => workspace('pemilik', <KeamananPage />) },

  { path: '/admin', render: () => workspace('admin', <AdminRingkasan />) },
  { path: '/admin/peninjauan', render: () => workspace('admin', <AdminPeninjauan />) },
  { path: '/admin/kos', render: () => workspace('admin', <AdminSemuaKos />) },
  { path: '/admin/pengguna', render: () => workspace('admin', <AdminPengguna />) },
  { path: '/admin/laporan', render: () => workspace('admin', <AdminLaporan />) },
  { path: '/admin/aktivitas', render: () => workspace('admin', <AdminAktivitas />) },
  { path: '/admin/notifikasi', render: () => workspace('admin', <NotifikasiPage />) },
  { path: '/admin/profil', render: () => workspace('admin', <ProfilPage />) },
  { path: '/admin/keamanan', render: () => workspace('admin', <KeamananPage />) },
]

function Router() {
  const { pathname } = useLocation()

  // Gulir ke atas saat pindah halaman, atau ke #anchor bila ada
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80)
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  // Alamat lama/pendek
  if (pathname === '/login') return <Redirect to="/masuk" />
  if (pathname === '/register') return <Redirect to="/daftar" />

  for (const route of routes) {
    const params = matchPath(route.path, pathname)
    if (params) return <>{route.render(params)}</>
  }
  return <NotFound />
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <FavoritesProvider>
          <Router />
        </FavoritesProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
