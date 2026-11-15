import type { Metadata } from 'next';
import { KosSayaView } from '@/features/kos/components/kos-saya-view';

export const metadata: Metadata = { title: 'Kos saya' };

export default function KosSayaPage() {
  return <KosSayaView />;
}
