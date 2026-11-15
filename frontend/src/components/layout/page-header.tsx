import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({ title, description, actions, backHref, backLabel = 'Kembali' }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref ? (
          <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-2 text-[15px] text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
