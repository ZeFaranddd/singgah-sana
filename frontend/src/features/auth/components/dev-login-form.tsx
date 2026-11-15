'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, describedBy } from '@/components/ui/field';
import { Alert } from '@/components/ui/state';
import { errorMessage } from '@/lib/api/client';
import { login } from '../api';
import { saveSession } from '../session';

const schema = z.object({
  email: z.email('Masukkan email yang valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

type Values = z.infer<typeof schema>;

/**
 * Login cepat KHUSUS development, agar ruang pemilik bisa diuji sebelum halaman masuk (FE02) selesai.
 * Tidak dirender di build produksi (lihat pemanggilnya).
 */
export function DevLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      saveSession(await login(values.email, values.password));
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 text-left">
      <Alert>Mode pengembangan: login cepat untuk menguji ruang pemilik.</Alert>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field id="dev-email" label="Email" error={errors.email?.message}>
        <Input
          id="dev-email"
          type="email"
          autoComplete="email"
          invalid={!!errors.email}
          aria-describedby={describedBy('dev-email', errors.email?.message)}
          {...register('email')}
        />
      </Field>
      <Field id="dev-password" label="Kata sandi" error={errors.password?.message}>
        <Input
          id="dev-password"
          type="password"
          autoComplete="current-password"
          invalid={!!errors.password}
          aria-describedby={describedBy('dev-password', errors.password?.message)}
          {...register('password')}
        />
      </Field>
      <Button type="submit" loading={isSubmitting}>
        Masuk
      </Button>
    </form>
  );
}
