'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { EmptyState, ErrorState } from '@/components/ui/state';
import { Skeleton } from '@/components/ui/spinner';
import { cn } from '@/lib/cn';
import { formatRelativeShort } from '@/lib/format';
import { useInquiryPemilik } from '../hooks';
import type { OwnerInquiry } from '../types';
import { InquiryThread } from './inquiry-thread';

type Filter = 'semua' | 'menunggu' | 'dibalas';

export function PesanView() {
  const { data, error, loading, reload, setData } = useInquiryPemilik();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('semua');

  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (data ?? []).filter((item) => {
      const matchFilter = filter === 'semua' || item.status === filter;
      const matchQuery =
        !term ||
        (item.pencari_id?.nama ?? '').toLowerCase().includes(term) ||
        item.kos_id.nama.toLowerCase().includes(term) ||
        item.pesan.toLowerCase().includes(term);
      return matchFilter && matchQuery;
    });
  }, [data, filter, query]);

  const selectedId = searchParams.get('id') ?? list[0]?._id ?? null;
  const selected = (data ?? []).find((item) => item._id === selectedId) ?? null;

  const select = (id: string) => router.replace(`${pathname}?id=${id}`, { scroll: false });

  const onReplied = (updated: OwnerInquiry) => {
    setData((current) => current?.map((item) => (item._id === updated._id ? updated : item)));
  };

  return (
    <>
      <PageHeader title="Pesan calon penghuni" description="Jawab pertanyaan tentang kos, ketersediaan, dan jadwal kunjungan." />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-96" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" aria-hidden />}
          title="Belum ada percakapan"
          description="Pertanyaan calon penghuni untuk kos yang sudah terbit akan muncul di sini."
        />
      ) : (
        <Card className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-3">
            <label htmlFor="cari-pesan" className="text-sm font-semibold">
              Cari percakapan
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
              <Input
                id="cari-pesan"
                type="search"
                placeholder="Cari nama atau kos…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            <div className="flex gap-2" role="group" aria-label="Filter status pesan">
              {(['semua', 'menunggu', 'dibalas'] as Filter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    filter === value ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink hover:border-brand-ring',
                  )}
                >
                  {value === 'semua' ? 'Semua' : value === 'menunggu' ? 'Belum dibalas' : 'Dibalas'}
                </button>
              ))}
            </div>
            {list.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">Tidak ada percakapan yang cocok.</p>
            ) : (
              <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
                {list.map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => select(item._id)}
                      aria-current={item._id === selected?._id ? 'true' : undefined}
                      className={cn(
                        'w-full rounded-2xl px-4 py-3 text-left transition-colors',
                        item._id === selected?._id ? 'bg-brand-soft' : 'bg-canvas hover:bg-brand-soft/60',
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{item.pencari_id?.nama ?? 'Calon penghuni'}</span>
                        {item.status === 'menunggu' ? (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Belum dibalas" />
                        ) : null}
                      </span>
                      <span className="mt-1 block truncate text-sm text-ink-muted">{item.pesan}</span>
                      <span className="mt-1 block text-xs text-ink-subtle">
                        {item.kos_id.nama} · {formatRelativeShort(item.createdAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="min-w-0 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {selected ? (
              <InquiryThread key={selected._id} inquiry={selected} onReplied={onReplied} />
            ) : (
              <p className="text-sm text-ink-muted">Pilih percakapan untuk melihat isinya.</p>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
