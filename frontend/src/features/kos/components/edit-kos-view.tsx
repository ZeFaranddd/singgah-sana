'use client';

import { ErrorState } from '@/components/ui/state';
import { Spinner } from '@/components/ui/spinner';
import { useKos } from '../hooks';
import { KosWizard } from './wizard/kos-wizard';

export function EditKosView({ id }: { id: string }) {
  const { data: kos, error, loading, reload } = useKos(id);
  if (loading) return <Spinner label="Memuat data kos…" />;
  if (error || !kos) return <ErrorState message={error ?? 'Kos tidak ditemukan.'} onRetry={reload} />;
  return <KosWizard kos={kos} />;
}
