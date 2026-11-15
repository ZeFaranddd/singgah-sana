'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Textarea, describedBy } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/api/client';
import { balasInquiry } from '../api';
import { balasanSchema, type BalasanValues } from '../schema';
import type { OwnerInquiry } from '../types';

type ReplyFormProps = {
  inquiry: OwnerInquiry;
  onReplied: (updated: OwnerInquiry) => void;
};

export function ReplyForm({ inquiry, onReplied }: ReplyFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BalasanValues>({
    resolver: zodResolver(balasanSchema),
    defaultValues: { balasan: '' },
    mode: 'onTouched',
  });
  const length = useWatch({ control, name: 'balasan' })?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await balasInquiry(inquiry._id, values.balasan.trim());
      // Respons balasan tidak mem-populate kos/pencari, jadi gabungkan dengan data yang sudah ada.
      onReplied({ ...inquiry, balasan: result.data.balasan, status: result.data.status, updatedAt: result.data.updatedAt });
      reset();
      toast.success('Balasan terkirim.');
    } catch (error) {
      setError('balasan', { type: 'server', message: errorMessage(error) });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <Field id="balasan" label="Balasan" hint={`Balasan hanya bisa dikirim sekali. ${length}/1.000`} error={errors.balasan?.message}>
        <Textarea
          id="balasan"
          rows={4}
          placeholder="Tulis balasan untuk calon penghuni…"
          invalid={!!errors.balasan}
          aria-describedby={describedBy('balasan', errors.balasan?.message, true)}
          {...register('balasan')}
        />
      </Field>
      <div>
        <Button type="submit" loading={isSubmitting} icon={<Send className="h-4 w-4" aria-hidden />}>
          Kirim balasan
        </Button>
      </div>
      <p className="text-xs text-ink-muted">Jangan bagikan kata sandi, OTP, atau data pribadi sensitif melalui pesan.</p>
    </form>
  );
}
