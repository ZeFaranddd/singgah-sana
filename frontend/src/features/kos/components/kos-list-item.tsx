import { ButtonLink } from '@/components/ui/button';
import { capitalize } from '@/lib/format';
import { getKosStatus } from '../status';
import type { Kos } from '../types';
import { KosPhoto } from './kos-photo';
import { KosStatusBadge } from './kos-status-badge';

export function KosListItem({ kos }: { kos: Kos }) {
  const status = getKosStatus(kos);
  const detail = status.key === 'terbit' ? `${kos.jumlah_kamar_tersedia} dari ${kos.jumlah_kamar_total} kamar tersedia` : status.hint;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-3 transition-colors hover:border-brand-ring sm:flex-row sm:items-center">
      <KosPhoto src={kos.foto[0]} alt={`Foto ${kos.nama}`} className="h-36 w-full shrink-0 sm:h-[72px] sm:w-[96px]" />
      <div className="min-w-0 flex-1 px-1 sm:px-0">
        <p className="truncate font-semibold">{kos.nama}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {kos.area_kampus} · {capitalize(kos.tipe)}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{detail}</p>
      </div>
      <div className="flex items-center justify-between gap-4 px-1 sm:justify-end sm:px-2">
        <KosStatusBadge kos={kos} />
        <ButtonLink href={`/pemilik/kos/${kos._id}`} variant="secondary" size="sm">
          Kelola
        </ButtonLink>
      </div>
    </li>
  );
}
