import type { Metadata } from 'next';
import { KelolaKosView } from '@/features/kos/components/kelola-kos-view';

export const metadata: Metadata = { title: 'Kelola kos' };

export default async function KelolaKosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KelolaKosView id={id} />;
}
