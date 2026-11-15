import { Badge } from '@/components/ui/badge';
import { getKosStatus } from '../status';
import type { Kos } from '../types';

export function KosStatusBadge({ kos }: { kos: Pick<Kos, 'status_verifikasi' | 'catatan_verifikasi'> }) {
  const status = getKosStatus(kos);
  return <Badge tone={status.tone}>{status.label}</Badge>;
}
