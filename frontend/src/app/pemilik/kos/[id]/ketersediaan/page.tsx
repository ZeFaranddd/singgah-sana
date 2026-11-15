import type { Metadata } from 'next';
import { KetersediaanView } from '@/features/kos/components/ketersediaan-view';

export const metadata: Metadata = { title: 'Ketersediaan kamar' };

export default async function KetersediaanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KetersediaanView id={id} />;
}
