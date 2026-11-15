import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './button';

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-white px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden />}
      </span>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description ? <p className="max-w-md text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-danger/20 bg-danger-soft px-6 py-10 text-center',
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-danger" aria-hidden />
      <p className="max-w-md text-sm font-medium text-danger">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}

type AlertTone = 'info' | 'danger' | 'success';

const alertTones: Record<AlertTone, { box: string; Icon: typeof Info }> = {
  info: { box: 'bg-brand-soft text-brand', Icon: Info },
  danger: { box: 'bg-danger-soft text-danger', Icon: AlertCircle },
  success: { box: 'bg-success-soft text-success', Icon: CheckCircle2 },
};

export function Alert({ tone = 'info', children, className }: { tone?: AlertTone; children: ReactNode; className?: string }) {
  const { box, Icon } = alertTones[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'note'} className={cn('flex items-start gap-3 rounded-xl px-4 py-3 text-sm', box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
