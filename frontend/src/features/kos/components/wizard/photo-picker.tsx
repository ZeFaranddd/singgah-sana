'use client';

import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { Alert } from '@/components/ui/state';

// Batas mengikuti backend/src/middlewares/uploadMiddleware.js: maks 5 berkas, 5 MB, JPG/PNG/WEBP.
export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

type PhotoPickerProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  error?: string;
};

export function PhotoPicker({ files, onFilesChange, urls, onUrlsChange, error }: PhotoPickerProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setLocalError(null);
    const next = [...files];
    for (const file of Array.from(list)) {
      if (!ACCEPTED.includes(file.type)) {
        setLocalError(`"${file.name}" bukan JPG, PNG, atau WEBP.`);
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setLocalError(`"${file.name}" lebih dari 5 MB.`);
        continue;
      }
      if (next.length >= MAX_PHOTOS) {
        setLocalError(`Maksimal ${MAX_PHOTOS} foto.`);
        break;
      }
      next.push(file);
    }
    onFilesChange(next);
  };

  const addUrl = () => {
    const value = urlDraft.trim();
    if (!value) return;
    if (!/^https:\/\/\S+$/i.test(value)) {
      setLocalError('URL foto harus diawali https://');
      return;
    }
    if (urls.length >= MAX_PHOTOS) {
      setLocalError(`Maksimal ${MAX_PHOTOS} foto.`);
      return;
    }
    setLocalError(null);
    onUrlsChange([...urls, value]);
    setUrlDraft('');
  };

  const shownError = localError ?? error;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="foto-berkas"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-canvas px-6 py-8 text-center transition-colors hover:border-brand-ring hover:bg-brand-soft"
        >
          <ImagePlus className="h-7 w-7 text-brand" aria-hidden />
          <span className="font-medium">Pilih foto dari perangkat</span>
          <span className="text-xs text-ink-muted">JPG, PNG, atau WEBP · maks 5 MB per foto · maks {MAX_PHOTOS} foto</span>
        </label>
        <input
          id="foto-berkas"
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {previews.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map(({ file, url }, index) => (
            <li key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau berkas lokal (blob:) */}
              <img src={url} alt={`Pratinjau ${file.name}`} className="aspect-[4/3] w-full rounded-xl object-cover" />
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold">Foto utama</span>
              ) : null}
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((f) => f !== file))}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-ink hover:text-danger"
                aria-label={`Hapus ${file.name}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {files.length === 0 ? (
        <div className="flex flex-col gap-3">
          <label htmlFor="foto-url" className="text-sm font-semibold">
            Atau tempel URL foto
          </label>
          <div className="flex gap-2">
            <Input
              id="foto-url"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
            />
            <Button variant="secondary" onClick={addUrl} disabled={!urlDraft.trim()} icon={<Link2 className="h-4 w-4" aria-hidden />}>
              Tambah
            </Button>
          </div>
          {urls.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {urls.map((url) => (
                <li key={url} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                  <span className="truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => onUrlsChange(urls.filter((u) => u !== url))}
                    className="text-ink-subtle hover:text-danger"
                    aria-label="Hapus URL foto"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <Alert>Foto dari perangkat dipakai. Hapus semua foto di atas jika ingin memakai URL foto.</Alert>
      )}

      {shownError ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
