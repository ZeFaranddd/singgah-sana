import { ButtonLink } from '@/components/ui/button';
import { BrandLogo } from '@/components/layout/brand-logo';

// Sementara: halaman beranda publik dikerjakan FE01 (Orang 1) dan akan menggantikan berkas ini.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <BrandLogo className="h-14 w-14" />
      <h1 className="text-3xl font-bold">Singgah-sana</h1>
      <p className="text-ink-muted">Halaman publik sedang dikerjakan. Pemilik kos dapat membuka ruang pemilik.</p>
      <ButtonLink href="/pemilik">Buka ruang pemilik</ButtonLink>
    </main>
  );
}
