'use client';

import { useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';

type TagPickerProps = {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  /** Pilihan cepat yang bisa diaktifkan/nonaktifkan dengan sekali klik. */
  suggestions?: string[];
  placeholder: string;
  maxLength: number;
  invalid?: boolean;
  describedBy?: string;
};

/** Pilih dari daftar umum atau tambahkan isian sendiri. Duplikat (tanpa membedakan huruf besar) diabaikan. */
export function TagPicker({ id, value, onChange, suggestions = [], placeholder, maxLength, invalid, describedBy }: TagPickerProps) {
  const [draft, setDraft] = useState('');
  const has = (item: string) => value.some((v) => v.toLowerCase() === item.toLowerCase());

  const toggle = (item: string) => onChange(has(item) ? value.filter((v) => v.toLowerCase() !== item.toLowerCase()) : [...value, item]);

  const add = () => {
    const item = draft.trim().replace(/\s+/g, ' ');
    if (!item) return;
    if (!has(item)) onChange([...value, item.slice(0, maxLength)]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  };

  const custom = value.filter((v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((item) => {
            const selected = has(item);
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(item)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm transition-colors',
                  selected ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-white text-ink hover:border-brand-ring',
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      ) : null}

      {custom.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Isian tambahan">
          {custom.map((item) => (
            <li
              key={item}
              className="flex items-center gap-1 rounded-full border border-brand bg-brand-soft py-1.5 pl-4 pr-2 text-sm font-medium text-brand"
            >
              {item}
              <button type="button" onClick={() => toggle(item)} className="rounded-full p-1 hover:bg-white" aria-label={`Hapus ${item}`}>
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          invalid={invalid}
          aria-describedby={describedBy}
        />
        <Button variant="secondary" onClick={add} disabled={!draft.trim()} icon={<Plus className="h-4 w-4" aria-hidden />}>
          Tambah
        </Button>
      </div>
    </div>
  );
}
