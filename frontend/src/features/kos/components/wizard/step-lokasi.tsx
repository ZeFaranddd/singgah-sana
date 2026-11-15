'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea, describedBy } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/spinner';
import { PETA_TITIK_AWAL } from '../../options';
import type { LatLng } from './location-picker';
import type { KosForm } from './types';

// Leaflet membutuhkan `window`, jadi peta hanya dimuat di browser.
const LocationPicker = dynamic(() => import('./location-picker'), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full sm:h-80" />,
});

export function StepLokasi({ form }: { form: KosForm }) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [latText, lngText] = useWatch({ control, name: ['latitude', 'longitude'] });
  const lat = Number(latText);
  const lng = Number(lngText);
  const hasPoint = latText !== '' && lngText !== '' && !Number.isNaN(lat) && !Number.isNaN(lng);
  const point: LatLng | null = hasPoint ? { latitude: lat, longitude: lng } : null;

  const setPoint = useCallback(
    (value: LatLng) => {
      setValue('latitude', String(value.latitude), { shouldValidate: true, shouldDirty: true });
      setValue('longitude', String(value.longitude), { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Perangkat ini tidak mendukung pencarian lokasi.');
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setPoint({
          latitude: Math.round(position.coords.latitude * 1e6) / 1e6,
          longitude: Math.round(position.coords.longitude * 1e6) / 1e6,
        });
      },
      () => {
        setLocating(false);
        setGeoError('Lokasi tidak dapat diambil. Pilih titik langsung pada peta.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <Field id="alamat" label="Alamat lengkap" required hint="Nama jalan, nomor, kelurahan, dan kecamatan." error={errors.alamat?.message}>
        <Textarea
          id="alamat"
          rows={3}
          placeholder="Jl. Pogung Kidul No. 42B, Sinduadi, Mlati, Sleman"
          invalid={!!errors.alamat}
          aria-describedby={describedBy('alamat', errors.alamat?.message, true)}
          {...register('alamat')}
        />
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              Titik lokasi <span className="text-danger">*</span>
            </p>
            <p className="text-xs text-ink-muted">Klik peta atau geser pin ke lokasi kos.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={useMyLocation}
            loading={locating}
            icon={<LocateFixed className="h-4 w-4" aria-hidden />}
          >
            Gunakan lokasi saya
          </Button>
        </div>
        <LocationPicker value={point} fallbackCenter={PETA_TITIK_AWAL} onChange={setPoint} />
        {geoError ? <p className="text-sm text-danger">{geoError}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="latitude" label="Latitude" error={errors.latitude?.message}>
          <Input
            id="latitude"
            inputMode="decimal"
            placeholder="-7.771300"
            invalid={!!errors.latitude}
            aria-describedby={describedBy('latitude', errors.latitude?.message)}
            {...register('latitude')}
          />
        </Field>
        <Field id="longitude" label="Longitude" error={errors.longitude?.message}>
          <Input
            id="longitude"
            inputMode="decimal"
            placeholder="110.377500"
            invalid={!!errors.longitude}
            aria-describedby={describedBy('longitude', errors.longitude?.message)}
            {...register('longitude')}
          />
        </Field>
      </div>
    </div>
  );
}
