import type { ReactNode } from 'react';
import Link from 'next/link';
import type { AdminSession, AdminUser } from '../../hooks/useAdminSession';
import AdminLayout from './AdminLayout';

export type AdminPageRenderProps = {
  admin: AdminUser;
  expireSession: () => void;
  token: string;
};

export type AdminPageViewProps = {
  children: ReactNode | ((session: AdminPageRenderProps) => ReactNode);
  pageDescription: string;
  pageTitle: string;
  pathname: string;
  session: AdminSession;
};

export default function AdminPageView({
  children,
  pageDescription,
  pageTitle,
  pathname,
  session,
}: AdminPageViewProps) {
  if (session.status === 'checking' || session.status === 'redirecting') {
    return (
      <main
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600"
        role="status"
      >
        Memeriksa sesi admin...
      </main>
    );
  }

  if (session.status === 'forbidden') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Akses tidak tersedia</h1>
          <p className="mt-2 text-sm text-slate-600">
            Akun ini tidak memiliki akses admin.
          </p>
          <Link
            className="mt-6 inline-flex rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
            href="/admin/login"
          >
            Kembali ke login admin
          </Link>
        </section>
      </main>
    );
  }

  if (session.status === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-700" role="alert">
            {session.errorMessage}
          </p>
          <button
            className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={session.retry}
            type="button"
          >
            Coba periksa sesi lagi
          </button>
        </section>
      </main>
    );
  }

  if (!session.admin || !session.token) {
    return (
      <main
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600"
        role="status"
      >
        Memeriksa sesi admin...
      </main>
    );
  }

  const pageContent =
    typeof children === 'function'
      ? children({
          admin: session.admin,
          expireSession: session.expireSession,
          token: session.token,
        })
      : children;

  return (
    <AdminLayout
      admin={session.admin}
      onLogout={session.logout}
      pageDescription={pageDescription}
      pageTitle={pageTitle}
      pathname={pathname}
    >
      {pageContent}
    </AdminLayout>
  );
}
