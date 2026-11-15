import { useWatch } from 'react-hook-form';
import { Field, Input, Select, Textarea, describedBy } from '@/components/ui/field';
import { AREA_KAMPUS, TIPE_OPTIONS } from '../../options';
import type { KosForm } from './types';

export function StepInformasi({ form }: { form: KosForm }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const deskripsiLength = useWatch({ control, name: 'deskripsi' })?.length ?? 0;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        id="nama"
        label="Nama kos"
        required
        className="sm:col-span-2"
        hint="Gunakan nama yang mudah dikenali, maksimal 120 karakter."
        error={errors.nama?.message}
      >
        <Input
          id="nama"
          placeholder="Kos Halaman Baru"
          invalid={!!errors.nama}
          aria-describedby={describedBy('nama', errors.nama?.message, true)}
          {...register('nama')}
        />
      </Field>

      <Field id="tipe" label="Jenis kos" required error={errors.tipe?.message}>
        <Select id="tipe" invalid={!!errors.tipe} aria-describedby={describedBy('tipe', errors.tipe?.message)} {...register('tipe')}>
          <option value="">Pilih jenis kos</option>
          {TIPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="area_kampus" label="Area kampus" required hint="Contoh: Pogung, Sekip, Kaliurang." error={errors.area_kampus?.message}>
        <Input
          id="area_kampus"
          list="area-kampus-options"
          placeholder="Pogung"
          invalid={!!errors.area_kampus}
          aria-describedby={describedBy('area_kampus', errors.area_kampus?.message, true)}
          {...register('area_kampus')}
        />
        <datalist id="area-kampus-options">
          {AREA_KAMPUS.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
      </Field>

      <Field
        id="deskripsi"
        label="Deskripsi kos"
        required
        className="sm:col-span-2"
        hint={`Jelaskan lingkungan, keunggulan, dan akses di sekitar kos. ${deskripsiLength}/2.000`}
        error={errors.deskripsi?.message}
      >
        <Textarea
          id="deskripsi"
          rows={5}
          placeholder="Kos nyaman di lingkungan tenang, dekat kampus dan akses transportasi."
          invalid={!!errors.deskripsi}
          aria-describedby={describedBy('deskripsi', errors.deskripsi?.message, true)}
          {...register('deskripsi')}
        />
      </Field>
    </div>
  );
}
