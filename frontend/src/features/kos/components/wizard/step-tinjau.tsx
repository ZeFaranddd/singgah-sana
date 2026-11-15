'use client';

import { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { Check, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/state';
import { capitalize, formatRupiah } from '@/lib/format';
import { KosPhoto } from '../kos-photo';
import type { KosForm } from './types';

type StepTinjauProps = {
  form: KosForm;
  files: File[];
  existingPhotos: string[];
  editing: boolean;
  confirmed: boolean;
  onConfirmedChange: (value: boolean) => void;
  confirmError?: string;
};

export function StepTinjau({ form, files, existingPhotos, editing, confirmed, onConfirmedChange, confirmError }: StepTinjauProps) {
  const values = useWatch({ control: form.control });
  const fotoUrls = (values.foto_urls ?? []).filter((url): url is string => Boolean(url));
  const fasilitas = values.fasilitas ?? [];
  const peraturan = values.peraturan ?? [];
  const filePreview = useMemo(() => (files[0] ? URL.createObjectURL(files[0]) : null), [files]);
  useEffect(
    () => () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    },
    [filePreview],
  );

  const cover = filePreview ?? fotoUrls[0] ?? existingPhotos[0] ?? null;
  const fotoCount = editing ? existingPhotos.length : files.length || fotoUrls.length;
  const harga = Number(values.harga_per_bulan);

  const checks = [
    { ok: Boolean(values.alamat && values.latitude && values.longitude), text: 'Alamat lengkap dan titik lokasi sudah terisi' },
    { ok: fotoCount > 0, text: `${fotoCount} foto kos tersedia${fotoCount > 0 ? ', foto pertama menjadi foto utama' : ''}` },
    { ok: fasilitas.length > 0, text: `${fasilitas.length} fasilitas dan ${peraturan.length} aturan` },
    {
      ok: Boolean(values.jumlah_kamar_total),
      text: `${values.jumlah_kamar_total || 0} total kamar · ${values.jumlah_kamar_tersedia || 0} tersedia`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        <KosPhoto src={cover} alt={`Foto utama ${values.nama || 'kos'}`} className="aspect-[4/3] w-full sm:w-64" />
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{values.nama || 'Tanpa nama'}</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {values.tipe ? capitalize(values.tipe) : '-'} · {values.area_kampus || '-'}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{values.alamat}</p>
          <p className="mt-3 font-heading text-lg font-semibold">
            {Number.isFinite(harga) && harga > 0 ? `${formatRupiah(harga)} / bulan` : 'Harga belum diisi'}
          </p>
          <Badge className="mt-3">{editing ? 'Perubahan' : 'Pengajuan baru'}</Badge>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {checks.map(({ ok, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm">
            {ok ? (
              <Check className="mt-0.5 h-4 w-4 text-success" aria-hidden />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" aria-hidden />
            )}
            <span>{text}</span>
          </li>
        ))}
      </ul>

      <Alert>
        {editing
          ? 'Perubahan nama, lokasi, harga, fasilitas, atau total kamar membuat listing ditinjau ulang oleh admin sebelum tayang kembali.'
          : 'Setelah dikirim, listing belum langsung tayang. Status peninjauan dapat dilihat pada Kos saya.'}
      </Alert>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmedChange(e.target.checked)}
            aria-invalid={!!confirmError || undefined}
            aria-describedby={confirmError ? 'konfirmasi-error' : undefined}
            className="mt-0.5 h-5 w-5 rounded border-line accent-brand"
          />
          <span>Saya memastikan informasi dan foto sesuai kondisi kos serta berhak mengelola listing ini.</span>
        </label>
        {confirmError ? (
          <p id="konfirmasi-error" role="alert" className="mt-2 text-xs font-medium text-danger">
            {confirmError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
