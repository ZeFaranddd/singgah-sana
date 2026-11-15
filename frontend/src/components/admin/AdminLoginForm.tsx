'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { ADMIN_TOKEN_KEY } from '../../lib/auth';
import { loginAdmin } from '../../lib/adminApi';

type AdminLoginFormProps = {
  expired: boolean;
};

export default function AdminLoginForm({ expired }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await loginAdmin({ email: email.trim(), password });

      if (result.data?.role !== 'admin') {
        setErrorMessage('Akun ini tidak memiliki akses admin.');
        return;
      }

      if (!result.data.token) {
        throw new Error('Server tidak mengembalikan token autentikasi.');
      }

      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, result.data.token);
      router.replace('/admin');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Login gagal. Silakan coba kembali.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <ShieldCheck aria-hidden="true" size={26} />
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">
          Singgah-sana
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Masuk ruang admin
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Gunakan akun yang memiliki akses administrasi portal kos.
        </p>

        {expired && (
          <p
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            Sesi admin berakhir. Masuk kembali untuk melanjutkan.
          </p>
        )}

        {errorMessage && (
          <p
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700"
              htmlFor="admin-email"
            >
              Alamat email
            </label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                id="admin-email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700"
              htmlFor="admin-password"
            >
              Kata sandi
            </label>
            <div className="relative">
              <KeyRound
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                id="admin-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan kata sandi"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={
                  showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" size={18} />
                ) : (
                  <Eye aria-hidden="true" size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            className="flex w-full items-center justify-center rounded-lg bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Memeriksa akun...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Akses admin diberikan oleh pengelola layanan. Hubungi pengelola jika
          memerlukan bantuan akses.
        </p>
      </section>
    </main>
  );
}
