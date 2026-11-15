'use client';

import { useMemo } from 'react';
import { Plus, Home } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/state';
import { Skeleton } from '@/components/ui/spinner';
import { formatRelativeShort } from '@/lib/format';
import { useSession } from '@/features/auth/use-session';
import { useInquiryPemilik } from '@/features/inquiry/hooks';
import { useKosSaya } from '../hooks';
import { getKosStatus } from '../status';
import { StatCard } from './stat-card';

export function RingkasanView() {
  const { session } = useSession();
  const kos = useKosSaya();
  const inquiry = useInquiryPemilik();

  const stats = useMemo(() => {
    const list = kos.data ?? [];
    const terbit = list.filter((k) => k.status_verifikasi === 'approved');
    return {
      terbit: terbit.length,
      tersedia: terbit.reduce((sum, k) => sum + k.jumlah_kamar_tersedia, 0),
      total: terbit.reduce((sum, k) => sum + k.jumlah_kamar_total, 0),
      perluRevisi: list.filter((k) => k.status_verifikasi === 'rejected'),
      ditinjau: list.filter((k) => k.status_verifikasi === 'pending').length,
    };
  }, [kos.data]);

  const menunggu = useMemo(() => (inquiry.data ?? []).filter((i) => i.status === 'menunggu'), [inquiry.data]);
  const firstName = session?.user.nama.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader
        title="Ringkasan pemilik"
        description={`Selamat datang${firstName ? `, ${firstName}` : ''}. Pantau kos dan percakapan terbarumu.`}
        actions={
          <ButtonLink href="/pemilik/kos/baru" icon={<Plus className="h-4 w-4" aria-hidden />}>
            Tambah kos
          </ButtonLink>
        }
      />

      {kos.error ? (
        <ErrorState message={kos.error} onRetry={kos.reload} />
      ) : (
        <>
          <section aria-label="Statistik" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Kos terbit" value={stats.terbit} caption="Aktif pada pencarian" loading={kos.loading} />
            <StatCard
              label="Kamar tersedia"
              value={stats.tersedia}
              caption={`Dari ${stats.total} kamar di ${stats.terbit} kos terbit`}
              loading={kos.loading}
            />
            <StatCard
              label="Pesan belum dibalas"
              value={inquiry.error ? '–' : menunggu.length}
              caption="Dari calon penghuni"
              loading={inquiry.loading}
            />
            <StatCard label="Perlu perhatian" value={stats.perluRevisi.length} caption="Listing perlu diperbaiki" loading={kos.loading} />
          </section>

          {!kos.loading && (kos.data ?? []).length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={<Home className="h-6 w-6" aria-hidden />}
              title="Mulai kelola kos pertamamu"
              description="Daftarkan kos, lalu admin akan meninjaunya sebelum tampil di pencarian."
              action={<ButtonLink href="/pemilik/kos/baru">Daftarkan kos</ButtonLink>}
            />
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              {stats.perluRevisi.map((k) => (
                <Card key={k._id}>
                  <Badge tone="danger">Listing perlu revisi</Badge>
                  <h2 className="mt-3 font-semibold">{k.nama}</h2>
                  <p className="mt-2 text-sm text-ink-muted">{getKosStatus(k).hint}</p>
                  <ButtonLink href={`/pemilik/kos/${k._id}/edit`} variant="secondary" className="mt-4">
                    Perbaiki listing
                  </ButtonLink>
                </Card>
              ))}

              <Card>
                <h2 className="font-semibold">Pesan terbaru</h2>
                {inquiry.loading ? (
                  <Skeleton className="mt-4 h-16" />
                ) : inquiry.error ? (
                  <p className="mt-2 text-sm text-danger">{inquiry.error}</p>
                ) : menunggu.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">Semua pesan sudah dibalas.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line">
                    {menunggu.slice(0, 3).map((item) => (
                      <li key={item._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium">{item.pencari_id?.nama ?? 'Calon penghuni'} bertanya</p>
                          <p className="mt-1 text-sm text-ink-muted">
                            {item.kos_id.nama} · {formatRelativeShort(item.createdAt)}
                          </p>
                        </div>
                        <ButtonLink href={`/pemilik/pesan?id=${item._id}`} variant="secondary" size="sm">
                          Balas pesan
                        </ButtonLink>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {stats.ditinjau > 0 ? (
                <Card>
                  <h2 className="font-semibold">Menunggu peninjauan</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    {stats.ditinjau} kos sedang ditinjau admin. Listing tampil di pencarian setelah disetujui.
                  </p>
                </Card>
              ) : null}
            </div>
          )}
        </>
      )}
    </>
  );
}
