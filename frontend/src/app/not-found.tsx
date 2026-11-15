import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="text-ink-muted">Alamat yang Anda buka tidak tersedia.</p>
      <ButtonLink href="/" variant="secondary">
        Kembali ke beranda
      </ButtonLink>
    </main>
  );
}
