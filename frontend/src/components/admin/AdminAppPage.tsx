'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAdminSession from '../../hooks/useAdminSession';
import AdminPageView, { type AdminPageRenderProps } from './AdminPageView';

type AdminAppPageProps = {
  children: ReactNode | ((session: AdminPageRenderProps) => ReactNode);
  pageDescription: string;
  pageTitle: string;
};

export default function AdminAppPage({
  children,
  pageDescription,
  pageTitle,
}: AdminAppPageProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const session = useAdminSession(router);

  return (
    <AdminPageView
      pageDescription={pageDescription}
      pageTitle={pageTitle}
      pathname={pathname}
      session={session}
    >
      {children}
    </AdminPageView>
  );
}
