'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/state';
import { useToast } from '@/components/ui/toast';
import { ApiError, errorMessage } from '@/lib/api/client';
import { formatRelativeShort } from '@/lib/format';
import { useSession } from '@/features/auth/use-session';
import { ajukanKos, ubahKos } from '../../api';
import { deleteDraft, loadDraft, saveDraft } from '../../draft';
import { EMPTY_KOS_FORM, STEP_FIELDS, fromKos, kosFormSchema, toKosInput, type KosFormValues } from '../../schema';
import type { Kos, KosInput } from '../../types';
import { KosPhoto } from '../kos-photo';
import { PhotoPicker } from './photo-picker';
import { Stepper, STEP_LABELS } from './stepper';
import { StepInformasi } from './step-informasi';
import { StepLokasi } from './step-lokasi';
import { StepFasilitas } from './step-fasilitas';
import { StepKamar } from './step-kamar';
import { StepTinjau } from './step-tinjau';
import type { KosForm } from './types';

const STEP_DESCRIPTIONS = [
  'Ceritakan identitas dan suasana kosmu.',
  'Tentukan alamat dan titik lokasi pada peta.',
  'Tambahkan foto yang menggambarkan kondisi kos.',
  'Pilih fasilitas dan tulis aturan kos.',
  'Isi harga sewa dan ketersediaan kamar.',
  'Periksa semua informasi sebelum dikirim untuk ditinjau.',
];

const LAST_STEP = STEP_LABELS.length - 1;

type KosWizardProps = {
  /** Jika diisi, wizard berjalan dalam mode edit untuk kos ini. */
  kos?: Kos;
};

/** Hanya field yang berubah yang dikirim saat edit, agar status tidak berubah tanpa alasan. */
function changedFields(before: KosInput, after: KosInput): Partial<KosInput> {
  const diff: Partial<KosInput> = {};
  for (const key of Object.keys(after) as (keyof KosInput)[]) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      (diff as Record<string, unknown>)[key] = after[key];
    }
  }
  return diff;
}

export function KosWizard({ kos }: KosWizardProps) {
  const editing = Boolean(kos);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { session } = useSession();
  const userId = session?.user._id;

  // Draf lokal dipulihkan sekali saat wizard dibuka dari "Kos saya" (?draf=1).
  // Aman dibaca saat inisialisasi: PemilikShell baru merender halaman ini di browser setelah sesi siap.
  const [restored] = useState(() => (!kos && userId && searchParams.get('draf') === '1' ? loadDraft(userId) : null));
  const initialStep = restored ? Math.min(restored.step, LAST_STEP) : 0;

  const form: KosForm = useForm({
    resolver: zodResolver(kosFormSchema),
    defaultValues: kos ? fromKos(kos) : (restored?.values ?? EMPTY_KOS_FORM),
    mode: 'onTouched',
  });

  const [step, setStep] = useState(initialStep);
  const [maxReached, setMaxReached] = useState(editing ? LAST_STEP : initialStep);
  const [files, setFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const draftInfo = restored ? `Draf dipulihkan (disimpan ${formatRelativeShort(restored.savedAt)}).` : null;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fotoUrls = useWatch({ control: form.control, name: 'foto_urls' });

  const goTo = (target: number) => {
    setStep(target);
    setMaxReached((current) => Math.max(current, target));
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validatePhotos = () => {
    if (editing) return true;
    const count = files.length || form.getValues('foto_urls').length;
    if (count === 0) {
      setPhotoError('Tambahkan minimal satu foto kos.');
      return false;
    }
    setPhotoError(undefined);
    return true;
  };

  const next = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 ? true : await form.trigger(fields as Path<KosFormValues>[], { shouldFocus: true });
    const photosOk = step === 2 ? validatePhotos() : true;
    if (valid && photosOk) goTo(step + 1);
  };

  const onSaveDraft = () => {
    if (!userId) return;
    saveDraft(userId, form.getValues(), step);
    toast.success(
      files.length > 0 ? 'Draf disimpan. Foto dari perangkat perlu dipilih ulang saat melanjutkan.' : 'Draf disimpan di perangkat ini.',
    );
  };

  const applyServerErrors = (error: ApiError) => {
    if (!error.fieldErrors) return;
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      if (field in EMPTY_KOS_FORM && messages[0]) {
        form.setError(field as Path<KosFormValues>, { type: 'server', message: messages[0] });
      }
    }
  };

  const submit = () =>
    form.handleSubmit(
      async (values) => {
        if (!confirmed) {
          setConfirmError('Centang pernyataan ini sebelum mengirim.');
          return;
        }
        if (!validatePhotos()) {
          goTo(2);
          return;
        }
        setConfirmError(undefined);
        setSubmitError(null);
        setSubmitting(true);
        try {
          const input = toKosInput(values);
          if (kos) {
            const diff = changedFields(toKosInput(fromKos(kos)), input);
            if (Object.keys(diff).length === 0) {
              toast.success('Tidak ada perubahan untuk disimpan.');
              router.push(`/pemilik/kos/${kos._id}`);
              return;
            }
            const result = await ubahKos(kos._id, diff);
            toast.success(result.message ?? 'Perubahan tersimpan.');
            router.push(`/pemilik/kos/${kos._id}`);
          } else {
            const result = await ajukanKos(input, { files, fotoUrls: values.foto_urls });
            if (userId) deleteDraft(userId);
            toast.success(result.message ?? 'Listing berhasil dikirim untuk ditinjau.');
            router.push(`/pemilik/kos/${result.data._id}`);
          }
        } catch (error) {
          if (error instanceof ApiError) applyServerErrors(error);
          setSubmitError(errorMessage(error));
          setSubmitting(false);
        }
      },
      (errors) => {
        // Ada field tidak valid di langkah sebelumnya: buka langkah pertama yang bermasalah.
        const firstStep = STEP_FIELDS.findIndex((fields) => fields.some((field) => field in errors));
        if (firstStep >= 0) goTo(firstStep);
      },
    )();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none sm:text-[28px]">
          {editing ? `Edit ${kos?.nama}` : STEP_LABELS[step] === 'Informasi' ? 'Informasi kos' : STEP_LABELS[step]}
        </h1>
        <p className="mt-2 text-[15px] text-ink-muted">
          Langkah {step + 1} dari {STEP_LABELS.length} · {STEP_DESCRIPTIONS[step]}
        </p>
      </div>

      <Stepper current={step} maxReached={maxReached} onSelect={goTo} />

      {draftInfo ? <Alert>{draftInfo}</Alert> : null}

      <Card>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (step === LAST_STEP) void submit();
            else void next();
          }}
        >
          {step === 0 ? <StepInformasi form={form} /> : null}
          {step === 1 ? <StepLokasi form={form} /> : null}
          {step === 2 ? (
            editing && kos ? (
              <div className="flex flex-col gap-4">
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {kos.foto.map((src, index) => (
                    <li key={src}>
                      <KosPhoto src={src} alt={`Foto ${index + 1} ${kos.nama}`} className="aspect-[4/3] w-full" />
                    </li>
                  ))}
                </ul>
                <Alert>Mengganti foto belum tersedia pada versi ini. Foto di atas tetap dipakai.</Alert>
              </div>
            ) : (
              <PhotoPicker
                files={files}
                onFilesChange={(next) => {
                  setFiles(next);
                  if (next.length > 0) setPhotoError(undefined);
                }}
                urls={fotoUrls}
                onUrlsChange={(urls) => {
                  form.setValue('foto_urls', urls, { shouldDirty: true });
                  if (urls.length > 0) setPhotoError(undefined);
                }}
                error={photoError ?? form.formState.errors.foto_urls?.message}
              />
            )
          ) : null}
          {step === 3 ? <StepFasilitas form={form} /> : null}
          {step === 4 ? <StepKamar form={form} editing={editing} /> : null}
          {step === LAST_STEP ? (
            <StepTinjau
              form={form}
              files={files}
              existingPhotos={kos?.foto ?? []}
              editing={editing}
              confirmed={confirmed}
              onConfirmedChange={(value) => {
                setConfirmed(value);
                if (value) setConfirmError(undefined);
              }}
              confirmError={confirmError}
            />
          ) : null}

          {submitError ? (
            <Alert tone="danger" className="mt-6">
              {submitError}
            </Alert>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={submitting}>
                Kembali
              </Button>
            ) : null}
            {!editing ? (
              <Button variant="secondary" onClick={onSaveDraft} disabled={submitting}>
                Simpan draf
              </Button>
            ) : null}
            <Button type="submit" loading={submitting}>
              {step === LAST_STEP
                ? editing
                  ? 'Simpan perubahan'
                  : 'Kirim untuk ditinjau'
                : `Lanjut: ${STEP_LABELS[step + 1]?.toLowerCase()}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
