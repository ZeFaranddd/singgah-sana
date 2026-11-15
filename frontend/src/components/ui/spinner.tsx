import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ label = 'Memuat…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-3 py-16 text-sm text-ink-muted', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-line/70', className)} />;
}
