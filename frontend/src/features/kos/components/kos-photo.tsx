'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { resolveAssetUrl } from '@/lib/api/config';

type KosPhotoProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
};

/** Foto kos dengan cadangan bila URL kosong atau gagal dimuat. */
export function KosPhoto({ src, alt, className }: KosPhotoProps) {
  const [failed, setFailed] = useState(false);
  const url = resolveAssetUrl(src);

  if (!url || failed) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-xl bg-canvas text-ink-subtle', className)}
        role="img"
        aria-label={`${alt} (foto tidak tersedia)`}
      >
        <ImageOff className="h-6 w-6" aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- sumber foto beragam (URL luar & /uploads backend)
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('rounded-xl bg-canvas object-cover', className)}
    />
  );
}
