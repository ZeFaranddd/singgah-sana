import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'brand';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-canvas text-ink-muted border-line',
  success: 'bg-success-soft text-success border-success/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  brand: 'bg-brand-soft text-brand border-brand/20',
};

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', tones[tone], className)}
      {...props}
    />
  );
}
