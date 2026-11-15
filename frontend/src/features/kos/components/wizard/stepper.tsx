import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export const STEP_LABELS = ['Informasi', 'Lokasi', 'Foto', 'Fasilitas', 'Kamar', 'Tinjau'];

type StepperProps = {
  current: number;
  /** Langkah terjauh yang sudah valid; pengguna boleh lompat mundur ke langkah mana pun sebelumnya. */
  maxReached: number;
  onSelect: (step: number) => void;
};

export function Stepper({ current, maxReached, onSelect }: StepperProps) {
  return (
    <nav aria-label="Langkah pendaftaran" className="rounded-2xl border border-line bg-white p-2">
      <ol className="grid grid-cols-3 gap-1 sm:grid-cols-6">
        {STEP_LABELS.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const reachable = index <= maxReached;
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(index)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm',
                  active && 'bg-brand-soft text-brand',
                  !active && reachable && 'text-ink hover:bg-canvas',
                  !reachable && 'cursor-not-allowed text-ink-subtle',
                )}
              >
                {done ? <Check className="h-4 w-4 shrink-0 text-success" aria-hidden /> : <span className="shrink-0">{index + 1}.</span>}
                <span className="truncate">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
