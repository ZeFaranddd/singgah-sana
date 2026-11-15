'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Home, MapPin, MessageCircle, Settings, LogOut, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { SESSION_EXPIRED_EVENT } from '@/lib/api/client';
import { useSession } from '@/features/auth/use-session';
import { clearSession } from '@/features/auth/session';
import { DevLoginForm } from '@/features/auth/components/dev-login-form';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { BrandLogo } from './brand-logo';
import { SiteFooter } from './site-footer';

const NAV = [
  { href: '/pemilik', label: 'Ringkasan', icon: Home, exact: true },
  { href: '/pemilik/kos', label: 'Kos saya', icon: MapPin, exact: false },
  { href: '/pemilik/pesan', label: 'Pesan', icon: MessageCircle, exact: false },
];

// Rute halaman masuk & akun milik FE02 (Orang 2).
const LOGIN_PATH = '/masuk';
const ACCOUNT_PATH = '/akun';

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function PemilikShell({ children }: { children: ReactNode }) {
  const { session, ready } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const onExpired = () => toast.error('Sesi Anda berakhir. Silakan masuk kembali.');
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [toast]);

  const logout = () => {
    clearSession();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Beranda Singgah-sana" className="rounded-lg">
              <BrandLogo />
            </Link>
            <span className="font-heading text-base font-semibold">Ruang pemilik</span>
          </div>
          <div className="flex items-center gap-3">
            <ButtonLink href="/" variant="secondary" size="sm" className="hidden sm:inline-flex">
              Mode pencari
            </ButtonLink>
            {session ? (
              <span
                title={session.user.nama}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
              >
                {initials(session.user.nama)}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-10">
        {!ready ? (
          <Spinner className="w-full" />
        ) : !session ? (
          <AuthRequired />
        ) : session.user.role !== 'pemilik' ? (
          <RoleMismatch />
        ) : (
          <>
            <aside className="lg:w-56 lg:shrink-0">
              <nav aria-label="Navigasi ruang pemilik" className="rounded-card border border-line bg-white p-3 lg:sticky lg:top-24 lg:p-4">
                <div className="hidden px-2 pb-3 lg:block">
                  <p className="font-heading text-sm font-semibold">Kelola properti</p>
                  <p className="text-xs text-ink-muted">Semua kos dalam satu tempat</p>
                </div>
                <ul className="flex gap-1 overflow-x-auto lg:flex-col">
                  {NAV.map(({ href, label, icon: Icon, exact }) => {
                    const active = isActive(pathname, href, exact);
                    return (
                      <li key={href} className="shrink-0">
                        <Link
                          href={href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                            active ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-canvas hover:text-brand',
                          )}
                        >
                          <Icon className="h-[18px] w-[18px]" aria-hidden />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                  <li className="mx-1 hidden border-t border-line lg:my-2 lg:block" aria-hidden />
                  <li className="shrink-0">
                    <Link
                      href={ACCOUNT_PATH}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-canvas hover:text-brand"
                    >
                      <Settings className="h-[18px] w-[18px]" aria-hidden />
                      Pengaturan akun
                    </Link>
                  </li>
                  <li className="shrink-0">
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-danger-soft hover:text-danger"
                    >
                      <LogOut className="h-[18px] w-[18px]" aria-hidden />
                      Keluar
                    </button>
                  </li>
                </ul>
              </nav>
            </aside>
            <main className="min-w-0 flex-1">{children}</main>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function AuthRequired() {
  const showDevLogin = process.env.NODE_ENV === 'development';
  return (
    <Card className="mx-auto w-full max-w-md text-center">
      <LockKeyhole className="mx-auto h-8 w-8 text-brand" aria-hidden />
      <h1 className="mt-3 text-xl font-semibold">Masuk untuk mengelola kos</h1>
      <p className="mt-2 text-sm text-ink-muted">Ruang pemilik hanya dapat diakses oleh akun pemilik kos.</p>
      <ButtonLink href={LOGIN_PATH} className="mt-5 w-full">
        Masuk
      </ButtonLink>
      {showDevLogin ? (
        <div className="mt-6 border-t border-line pt-6">
          <DevLoginForm />
        </div>
      ) : null}
    </Card>
  );
}

function RoleMismatch() {
  return (
    <Card className="mx-auto w-full max-w-md text-center">
      <LockKeyhole className="mx-auto h-8 w-8 text-brand" aria-hidden />
      <h1 className="mt-3 text-xl font-semibold">Akses khusus pemilik kos</h1>
      <p className="mt-2 text-sm text-ink-muted">Akun Anda tidak memiliki peran pemilik, sehingga tidak dapat membuka ruang ini.</p>
      <ButtonLink href="/" variant="secondary" className="mt-5 w-full">
        Kembali ke beranda
      </ButtonLink>
    </Card>
  );
}
