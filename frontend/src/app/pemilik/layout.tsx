import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PemilikShell } from '@/components/layout/pemilik-shell';

export const metadata: Metadata = {
  title: 'Ruang pemilik',
  robots: { index: false },
};

export default function PemilikLayout({ children }: { children: ReactNode }) {
  return <PemilikShell>{children}</PemilikShell>;
}
