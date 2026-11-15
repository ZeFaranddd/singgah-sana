import { Field, Input, describedBy } from '@/components/ui/field';
import { Alert } from '@/components/ui/state';
import type { KosForm } from './types';

export function StepKamar({ form, editing }: { form: KosForm; editing: boolean }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="harga_per_bulan"
          label="Harga per bulan (Rp)"
          required
          hint="Angka saja, minimal 100.000."
          error={errors.harga_per_bulan?.message}
        >
          <Input
            id="harga_per_bulan"
            inputMode="numeric"
            placeholder="1650000"
            invalid={!!errors.harga_per_bulan}
            aria-describedby={describedBy('harga_per_bulan', errors.harga_per_bulan?.message, true)}
            {...register('harga_per_bulan')}
          />
        </Field>
        <Field id="luas_kamar" label="Ukuran kamar" hint="Opsional, misalnya 3 × 4 meter." error={errors.luas_kamar?.message}>
          <Input
            id="luas_kamar"
            placeholder="3 × 4 meter"
            invalid={!!errors.luas_kamar}
            aria-describedby={describedBy('luas_kamar', errors.luas_kamar?.message, true)}
            {...register('luas_kamar')}
          />
        </Field>
        <Field id="jumlah_kamar_total" label="Total kamar" required error={errors.jumlah_kamar_total?.message}>
          <Input
            id="jumlah_kamar_total"
            inputMode="numeric"
            placeholder="12"
            invalid={!!errors.jumlah_kamar_total}
            aria-describedby={describedBy('jumlah_kamar_total', errors.jumlah_kamar_total?.message)}
            {...register('jumlah_kamar_total', { deps: ['jumlah_kamar_tersedia'] })}
          />
        </Field>
        <Field id="jumlah_kamar_tersedia" label="Kamar tersedia" required error={errors.jumlah_kamar_tersedia?.message}>
          <Input
            id="jumlah_kamar_tersedia"
            inputMode="numeric"
            placeholder="8"
            invalid={!!errors.jumlah_kamar_tersedia}
            aria-describedby={describedBy('jumlah_kamar_tersedia', errors.jumlah_kamar_tersedia?.message)}
            {...register('jumlah_kamar_tersedia')}
          />
        </Field>
      </div>
      <Alert>
        Jumlah tersedia tidak boleh melebihi total kamar. Harga dan stok tampil pada halaman kos.
        {editing ? ' Mengubah harga atau total kamar membuat listing ditinjau ulang; mengubah jumlah tersedia saja tidak.' : ''}
      </Alert>
    </div>
  );
}
