import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Activity,
  ChevronRight,
  ClipboardList,
  Flag,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/cn';

import type { AdminUser } from '../../hooks/useAdminSession';

type NavigationItem = {
  href?: string;
  icon: LucideIcon;
  label: string;
};

type NavigationItemsProps = {
  onNavigate: () => void;
  pathname: string;
};

type AdminLayoutProps = {
  admin: AdminUser;
  children: ReactNode;
  onLogout: () => void;
  pageDescription: string;
  pageTitle: string;
  pathname: string;
};

const navigation = [
  { label: 'Ringkasan', href: '/admin', icon: LayoutDashboard },
  { label: 'Peninjauan', href: '/admin/review', icon: ClipboardList },
  { label: 'Semua kos', href: '/admin/kos', icon: Home },
  { label: 'Pengguna', href: '/admin/users', icon: Users },
  { label: 'Laporan', icon: Flag },
  { label: 'Aktivitas', icon: Activity },
] satisfies NavigationItem[];

function NavigationItems({ onNavigate, pathname }: NavigationItemsProps) {
  return navigation.map((item) => {
    const Icon = item.icon;
    const isActive =
      item.href === pathname || pathname.startsWith(`${item.href}/`);
    const className = cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
      isActive
        ? 'bg-indigo-50 text-indigo-800'
        : 'cursor-not-allowed text-slate-400'
    );

    if (!item.href) {
      return (
        <span
          aria-disabled="true"
          className={className}
          key={item.label}
          title="Halaman ini belum dibuat"
        >
          <Icon aria-hidden="true" size={18} />
          {item.label}
        </span>
      );
    }

    return (
      <Link
        aria-current={isActive ? 'page' : undefined}
        className={className}
        href={item.href}
        key={item.label}
        onClick={onNavigate}
      >
        <Icon aria-hidden="true" size={18} />
        {item.label}
      </Link>
    );
  });
}

export default function AdminLayout({
  admin,
  children,
  onLogout,
  pageTitle,
  pageDescription,
  pathname,
}: AdminLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined;
    }

    closeButtonRef.current?.focus();
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileNavOpen]);

  function closeMobileNav() {
    setIsMobileNavOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {isMobileNavOpen && (
        <button
          aria-label="Tutup menu navigasi"
          className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden"
          onClick={closeMobileNav}
          type="button"
        />
      )}

      <aside
        id="admin-navigation-sidebar"
        className={cn(
          'invisible fixed inset-y-0 left-0 z-30 flex w-64 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform duration-200 motion-reduce:transition-none lg:visible lg:translate-x-0',
          isMobileNavOpen && 'visible translate-x-0'
        )}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white">
            <ShieldCheck aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="font-bold tracking-tight">Singgah-sana</p>
            <p className="text-xs text-slate-500">Ruang admin</p>
          </div>
          <button
            aria-label="Tutup menu navigasi"
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={closeMobileNav}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <nav aria-label="Navigasi administrasi" className="space-y-1 px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Administrasi
          </p>
          <NavigationItems
            onNavigate={closeMobileNav}
            pathname={pathname}
          />
        </nav>

        <div className="mt-auto border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
          FE04 · Admin &amp; Moderasi
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Buka menu navigasi"
              aria-controls="admin-navigation-sidebar"
              aria-expanded={isMobileNavOpen}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 lg:hidden"
              onClick={() => setIsMobileNavOpen(true)}
              ref={menuButtonRef}
              type="button"
            >
              <Menu aria-hidden="true" size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{pageTitle}</h1>
              <p className="hidden truncate text-sm text-slate-500 sm:block">
                {pageDescription}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{admin.nama}</p>
              <p className="text-xs capitalize text-slate-500">{admin.role}</p>
            </div>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800"
            >
              {admin.nama?.trim().charAt(0).toUpperCase() || 'A'}
            </span>
            <button
              aria-label="Keluar dari akun admin"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              onClick={onLogout}
              type="button"
            >
              <LogOut aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <a
          className="sr-only rounded bg-white px-4 py-2 text-indigo-800 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:ring-2 focus:ring-indigo-600"
          href="#admin-main"
        >
          Lewati navigasi
        </a>
        <main
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8"
          id="admin-main"
          tabIndex={-1}
        >
          <div className="mb-7 flex items-center gap-2 text-xs text-slate-500">
            <span>Administrasi</span>
            <ChevronRight aria-hidden="true" size={14} />
            <span className="font-medium text-slate-700">{pageTitle}</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
