'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/page-header';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field, Input, describedBy } from '@/components/ui/field';
import { Alert, ErrorState } from '@/components/ui/state';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format';
import { ubahKetersediaan } from '../api';
import { useKos } from '../hooks';
import { ketersediaanSchema } from '../schema';
import type { Kos } from '../types';

export function KetersediaanView({ id }: { id: string }) {
  const { data: kos, error, loading, reload } = useKos(id);

  if (loading) return <Spinner label="Memuat data kos…" />;
  if (error || !kos) return <ErrorState message={error ?? 'Kos tidak ditemukan.'} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Ketersediaan kamar"
        description={`${kos.nama} · Perbarui stok sesuai kondisi sebenarnya.`}
        backHref={`/pemilik/kos/${kos._id}`}
        backLabel="Kelola kos"
      />
      <KetersediaanForm kos={kos} />
    </>
  );
}

function KetersediaanForm({ kos }: { kos: Kos }) {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ketersediaanSchema(kos.jumlah_kamar_total)),
    defaultValues: { jumlah_kamar_tersedia: String(kos.jumlah_kamar_tersedia) },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await ubahKetersediaan(kos._id, Number(values.jumlah_kamar_tersedia));
      toast.success('Ketersediaan kamar diperbarui.');
      router.push(`/pemilik/kos/${kos._id}`);
    } catch (err) {
      setError('jumlah_kamar_tersedia', { type: 'server', message: errorMessage(err) });
    }
  });

  return (
    <Card>
      <CardTitle>Kamar · {formatRupiah(kos.harga_per_bulan)} / bulan</CardTitle>
      <CardDescription>Perubahan ketersediaan berlaku langsung pada pencarian, tanpa peninjauan ulang.</CardDescription>
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="total" label="Total kamar" hint="Ubah total kamar melalui Edit informasi.">
            <Input id="total" value={kos.jumlah_kamar_total} readOnly disabled aria-describedby="total-hint" />
          </Field>
          <Field id="jumlah_kamar_tersedia" label="Kamar tersedia" required error={errors.jumlah_kamar_tersedia?.message}>
            <Input
              id="jumlah_kamar_tersedia"
              inputMode="numeric"
              invalid={!!errors.jumlah_kamar_tersedia}
              aria-describedby={describedBy('jumlah_kamar_tersedia', errors.jumlah_kamar_tersedia?.message)}
              {...register('jumlah_kamar_tersedia')}
            />
          </Field>
        </div>
        <Alert>
          Isi 0 jika semua kamar penuh. Listing tetap tampil dengan status penuh dan calon penghuni masih bisa menghubungi pemilik.
        </Alert>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/pemilik/kos/${kos._id}`} variant="secondary">
            Batal
          </ButtonLink>
          <Button type="submit" loading={isSubmitting}>
            Simpan stok
          </Button>
          <Button
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => setValue('jumlah_kamar_tersedia', '0', { shouldValidate: true, shouldDirty: true })}
          >
            Tandai penuh
          </Button>
        </div>
      </form>
    </Card>
  );
}
