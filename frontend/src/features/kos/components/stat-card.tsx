import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/spinner';

type StatCardProps = {
  label: string;
  value: ReactNode;
  caption: string;
  loading?: boolean;
};

export function StatCard({ label, value, caption, loading = false }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-sm">
      <p className="text-sm text-ink-muted">{label}</p>
      {loading ? <Skeleton className="mt-3 h-8 w-12" /> : <p className="mt-2 font-heading text-3xl font-bold">{value}</p>}
      <p className="mt-2 text-xs text-ink-muted">{caption}</p>
    </div>
  );
}
