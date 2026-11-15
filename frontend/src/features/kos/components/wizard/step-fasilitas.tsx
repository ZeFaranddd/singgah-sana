import { Controller } from 'react-hook-form';
import { Field, describedBy } from '@/components/ui/field';
import { FASILITAS_UMUM } from '../../options';
import { TagPicker } from './tag-picker';
import type { KosForm } from './types';

export function StepFasilitas({ form }: { form: KosForm }) {
  const {
    control,
    formState: { errors },
  } = form;
  const fasilitasError = errors.fasilitas?.message ?? errors.fasilitas?.root?.message;
  const peraturanError = errors.peraturan?.message ?? errors.peraturan?.root?.message;

  return (
    <div className="flex flex-col gap-8">
      <Field
        id="fasilitas-baru"
        label="Fasilitas"
        required
        hint="Pilih fasilitas yang tersedia atau tambahkan sendiri."
        error={fasilitasError}
      >
        <Controller
          control={control}
          name="fasilitas"
          render={({ field }) => (
            <TagPicker
              id="fasilitas-baru"
              value={field.value}
              onChange={field.onChange}
              suggestions={FASILITAS_UMUM}
              placeholder="Fasilitas lain, misalnya Water heater"
              maxLength={50}
              invalid={!!fasilitasError}
              describedBy={describedBy('fasilitas-baru', fasilitasError, true)}
            />
          )}
        />
      </Field>

      <Field
        id="peraturan-baru"
        label="Aturan kos"
        hint="Opsional. Tulis aturan yang perlu diketahui calon penghuni."
        error={peraturanError}
      >
        <Controller
          control={control}
          name="peraturan"
          render={({ field }) => (
            <TagPicker
              id="peraturan-baru"
              value={field.value}
              onChange={field.onChange}
              placeholder="Misalnya: Tamu lawan jenis dilarang menginap"
              maxLength={100}
              invalid={!!peraturanError}
              describedBy={describedBy('peraturan-baru', peraturanError, true)}
            />
          )}
        />
      </Field>
    </div>
  );
}
