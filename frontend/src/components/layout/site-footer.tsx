import Link from 'next/link';
import { BrandLogo } from './brand-logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-8 w-8" />
          <p className="text-sm text-ink-muted">Tempat singgah. Awal cerita.</p>
        </div>
        <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
          <span>© 2026 Singgah-sana</span>
          <Link href="/" className="hover:text-brand">
            Beranda
          </Link>
        </nav>
      </div>
    </footer>
  );
}
