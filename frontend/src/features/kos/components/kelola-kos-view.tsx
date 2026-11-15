'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Pencil, Trash2, BedDouble } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Alert, ErrorState } from '@/components/ui/state';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/api/client';
import { capitalize, formatDate, formatRupiah } from '@/lib/format';
import { hapusKos } from '../api';
import { useKos } from '../hooks';
import { getKosStatus, isPublic } from '../status';
import { KosPhoto } from './kos-photo';
import { KosStatusBadge } from './kos-status-badge';

export function KelolaKosView({ id }: { id: string }) {
  const { data: kos, error, loading, reload } = useKos(id);
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) return <Spinner label="Memuat data kos…" />;
  if (error || !kos) return <ErrorState message={error ?? 'Kos tidak ditemukan.'} onRetry={reload} />;

  const status = getKosStatus(kos);
  const penuh = kos.jumlah_kamar_tersedia === 0;

  const remove = async () => {
    setDeleting(true);
    try {
      const result = await hapusKos(kos._id);
      toast.success(result.message ?? 'Kos dihapus.');
      router.push('/pemilik/kos');
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <PageHeader
        title={kos.nama}
        description={`${kos.area_kampus} · ${capitalize(kos.tipe)}`}
        backHref="/pemilik/kos"
        backLabel="Kos saya"
      />

      <div className="flex flex-col gap-5">
        <Card>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <KosPhoto src={kos.foto[0]} alt={`Foto utama ${kos.nama}`} className="aspect-[4/3] w-full sm:w-56" />
            <div className="min-w-0">
              <KosStatusBadge kos={kos} />
              <p className="mt-3 font-heading text-xl font-semibold">
                {penuh ? 'Semua kamar penuh' : `${kos.jumlah_kamar_tersedia} dari ${kos.jumlah_kamar_total} kamar tersedia`}
              </p>
              <p className="mt-2 text-sm text-ink-muted">Diperbarui {formatDate(kos.updatedAt)}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {isPublic(kos) ? (
              <ButtonLink href={`/kos/${kos._id}`} variant="secondary" icon={<ExternalLink className="h-4 w-4" aria-hidden />}>
                Lihat halaman kos
              </ButtonLink>
            ) : null}
            <ButtonLink href={`/pemilik/kos/${kos._id}/edit`} icon={<Pencil className="h-4 w-4" aria-hidden />}>
              {status.key === 'perlu_revisi' ? 'Perbaiki listing' : 'Edit informasi'}
            </ButtonLink>
            <Button variant="danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 className="h-4 w-4" aria-hidden />}>
              Hapus kos
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Harga dan ketersediaan</CardTitle>
          <CardDescription>Perbarui jumlah kamar tersedia ketika ada penghuni masuk atau keluar.</CardDescription>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-canvas text-ink-muted">
                <tr>
                  <th scope="col" className="rounded-l-xl px-4 py-3 font-medium">
                    Kamar
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Harga / bulan
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Total
                  </th>
                  <th scope="col" className="rounded-r-xl px-4 py-3 font-medium">
                    Tersedia
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4">{kos.luas_kamar || 'Ukuran belum diisi'}</td>
                  <td className="px-4 py-4">{formatRupiah(kos.harga_per_bulan)}</td>
                  <td className="px-4 py-4">{kos.jumlah_kamar_total}</td>
                  <td className="px-4 py-4 font-semibold">{kos.jumlah_kamar_tersedia}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ButtonLink href={`/pemilik/kos/${kos._id}/ketersediaan`} className="mt-4" icon={<BedDouble className="h-4 w-4" aria-hidden />}>
            Ubah ketersediaan
          </ButtonLink>
        </Card>

        <Card>
          {status.key === 'terbit' ? (
            <>
              <CardTitle>Listing diterbitkan</CardTitle>
              <CardDescription>
                {kos.diverifikasi_pada
                  ? `Admin menyetujui listing pada ${formatDate(kos.diverifikasi_pada)}.`
                  : 'Listing sudah disetujui admin.'}
              </CardDescription>
              <Alert className="mt-4">Perubahan informasi, lokasi, harga, atau fasilitas akan ditinjau ulang sebelum tayang kembali.</Alert>
            </>
          ) : status.key === 'perlu_revisi' ? (
            <>
              <CardTitle>Listing perlu revisi</CardTitle>
              <CardDescription>Perbaiki bagian yang diminta admin, lalu simpan untuk mengirim ulang ke peninjauan.</CardDescription>
              <Alert tone="danger" className="mt-4">
                <span className="font-semibold">Catatan admin:</span> {kos.catatan_verifikasi || 'Tidak ada catatan.'}
              </Alert>
            </>
          ) : (
            <>
              <CardTitle>{status.key === 'ditinjau_ulang' ? 'Perubahan sedang ditinjau' : 'Menunggu peninjauan admin'}</CardTitle>
              <CardDescription>Listing tampil di pencarian setelah disetujui admin. Kami menampilkan statusnya di sini.</CardDescription>
            </>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus kos ini?"
        description={`"${kos.nama}" beserta pesan dan data favorit terkait akan dihapus permanen.`}
        confirmLabel="Hapus kos"
        tone="danger"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
