import { Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatRelativeShort } from '@/lib/format';
import type { OwnerInquiry } from '../types';
import { ReplyForm } from './reply-form';

type InquiryThreadProps = {
  inquiry: OwnerInquiry;
  onReplied: (updated: OwnerInquiry) => void;
};

export function InquiryThread({ inquiry, onReplied }: InquiryThreadProps) {
  const pencari = inquiry.pencari_id;
  return (
    <div className="flex flex-col gap-5">
      <div className="border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">{pencari?.nama ?? 'Calon penghuni'}</h2>
          <Badge tone={inquiry.status === 'menunggu' ? 'warning' : 'success'}>
            {inquiry.status === 'menunggu' ? 'Belum dibalas' : 'Dibalas'}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{inquiry.kos_id.nama}</p>
        {pencari?.nomor_telepon || pencari?.email ? (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
            {pencari.nomor_telepon ? (
              <a href={`tel:${pencari.nomor_telepon}`} className="inline-flex items-center gap-2 hover:text-brand">
                <Phone className="h-4 w-4" aria-hidden />
                {pencari.nomor_telepon}
              </a>
            ) : null}
            {pencari.email ? (
              <a href={`mailto:${pencari.email}`} className="inline-flex items-center gap-2 hover:text-brand">
                <Mail className="h-4 w-4" aria-hidden />
                {pencari.email}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="max-w-[90%] rounded-2xl bg-canvas px-4 py-3">
          <p className="whitespace-pre-line text-[15px]">{inquiry.pesan}</p>
          <p className="mt-2 text-xs text-ink-muted">
            {formatDate(inquiry.createdAt)} · {formatRelativeShort(inquiry.createdAt)}
          </p>
        </div>
        {inquiry.status === 'dibalas' ? (
          <div className="ml-auto max-w-[90%] rounded-2xl bg-brand-soft px-4 py-3">
            <p className="whitespace-pre-line text-[15px]">{inquiry.balasan}</p>
            <p className="mt-2 text-xs text-ink-muted">Terkirim · {formatRelativeShort(inquiry.updatedAt)}</p>
          </div>
        ) : null}
      </div>

      {inquiry.status === 'menunggu' ? <ReplyForm inquiry={inquiry} onReplied={onReplied} /> : null}
    </div>
  );
}
