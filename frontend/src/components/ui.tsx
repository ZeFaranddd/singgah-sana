import { useEffect, useId, useRef } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Link } from '@/lib/router'
import { FOTO_CADANGAN, inisial } from '@/lib/format'
import type { StatusLaporan, StatusVerifikasi } from '@/lib/types'

/* ------------------------------------------------------------------ Ikon */

// Ikon bawaan desain Figma (berkas SVG di public/assets)
const iconAssets: Record<string, string> = {
  home: '/assets/e5a1c.svg',
  pin: '/assets/7d5f8.svg',
  shield: '/assets/192a2.svg',
  message: '/assets/51e80.svg',
  bell: '/assets/c2423.svg',
  clock: '/assets/e48fe.svg',
  user: '/assets/0530a.svg',
  heart: '/assets/51f8e.svg',
}

// Ikon tambahan (garis, mewarisi warna teks) untuk aksi yang tidak ada di desain
const inlineIcons: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>
  ),
  edit: (
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>
  ),
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </>
  ),
  menu: (
    <>
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  external: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
  list: (
    <>
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </>
  ),
  lock: (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  sliders: (
    <>
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="1" x2="7" y1="14" y2="14" />
      <line x1="9" x2="15" y1="8" y2="8" />
      <line x1="17" x2="23" y1="16" y2="16" />
    </>
  ),
}

interface IconProps {
  name: string
  size?: 16 | 20 | 24
  className?: string
  filled?: boolean
}

export function Icon({ name, size = 24, className = '', filled = false }: IconProps) {
  if (name === 'heart' && filled) {
    // Hati terisi (favorit tersimpan)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#7c3aed" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    )
  }
  if (iconAssets[name]) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <img src={iconAssets[name]} alt="" width={size} height={size} />
      </span>
    )
  }
  const shape = inlineIcons[name]
  if (!shape) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`}>
      {shape}
    </svg>
  )
}

export function Logo({ large = false }: { large?: boolean }) {
  return <img src={large ? '/assets/a81fa.svg' : '/assets/5dcbe.svg'} alt="Singgah-sana" />
}

/* ---------------------------------------------------------------- Tombol */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantClass: Record<Variant, string> = {
  primary: 'bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:bg-violet-300',
  secondary: 'border border-[#e2e8f0] bg-white text-[#0f172a] hover:border-violet-300 hover:bg-violet-50 disabled:text-slate-400 disabled:hover:bg-white disabled:hover:border-[#e2e8f0]',
  danger: 'bg-[#b91c1c] text-white hover:bg-[#991b1b] disabled:bg-red-300',
  ghost: 'text-[#7c3aed] hover:bg-violet-50 disabled:text-slate-400',
}

export const buttonClass = (variant: Variant = 'secondary', small = false, extra = '') =>
  `inline-flex items-center justify-center gap-2 rounded-lg text-base transition duration-200 ${small ? 'h-10 px-4 text-sm' : 'h-12 px-6'} ${variantClass[variant]} ${extra}`

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  small?: boolean
  loading?: boolean
  primary?: boolean
}

export function Button({ variant, primary, small, loading, disabled, className = '', children, type = 'button', ...rest }: ButtonProps) {
  const resolved: Variant = variant ?? (primary ? 'primary' : 'secondary')
  return (
    <button type={type} disabled={disabled || loading} className={buttonClass(resolved, small, className)} {...rest}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'secondary', small, className = '', children }: { to: string; variant?: Variant; small?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={buttonClass(variant, small, className)}>
      {children}
    </Link>
  )
}

/* ----------------------------------------------------------------- Badge */

type Tone = 'purple' | 'green' | 'red' | 'gray' | 'amber'

const toneClass: Record<Tone, string> = {
  purple: 'bg-[#f5f3ff] text-[#7c3aed]',
  green: 'bg-[#f0fdf4] text-[#166534]',
  red: 'bg-[#fef2f2] text-[#b91c1c]',
  gray: 'bg-[#f8fafc] text-[#475569]',
  amber: 'bg-[#fffbeb] text-[#b45309]',
}

export function Badge({ children, tone = 'purple' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`label inline-flex min-h-8 items-center rounded-full px-4 text-sm ${toneClass[tone]}`}>{children}</span>
}

export function StatusKosBadge({ status }: { status: StatusVerifikasi }) {
  if (status === 'approved') return <Badge tone="green">Terbit</Badge>
  if (status === 'rejected') return <Badge tone="red">Perlu revisi</Badge>
  return <Badge tone="amber">Menunggu tinjauan</Badge>
}

export function StatusLaporanBadge({ status }: { status: StatusLaporan }) {
  if (status === 'selesai') return <Badge tone="green">Selesai</Badge>
  if (status === 'ditolak') return <Badge tone="gray">Ditolak</Badge>
  if (status === 'diproses') return <Badge tone="purple">Diproses</Badge>
  return <Badge tone="amber">Terbuka</Badge>
}

/* ------------------------------------------------------- Status & muat */

export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function LoadingBlock({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-[#64748b]">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
      <h3 className="font-heading text-lg">{title}</h3>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-[#64748b]">{text}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-3xl border border-red-200 bg-[#fef2f2] px-6 py-8 text-center">
      <p className="font-heading text-base text-[#b91c1c]">Data belum bisa dimuat</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#7f1d1d]">{message}</p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button small onClick={onRetry}>
            Coba lagi
          </Button>
        </div>
      )}
    </div>
  )
}

export function Notice({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <div className={`rounded-2xl px-5 py-4 text-sm ${toneClass[tone]}`}>{children}</div>
}

/* ------------------------------------------------------------------ Foto */

export function SafeImg({ src, alt, className = '', fallbackIndex = 0 }: { src?: string; alt: string; className?: string; fallbackIndex?: number }) {
  const fallback = FOTO_CADANGAN[fallbackIndex % FOTO_CADANGAN.length]
  return (
    <img
      className={className}
      src={src || fallback}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        const el = event.currentTarget
        if (!el.src.endsWith(fallback)) el.src = fallback
      }}
    />
  )
}

export function Avatar({ nama, size = 40 }: { nama?: string; size?: number }) {
  return (
    <div className="label flex shrink-0 items-center justify-center rounded-full bg-[#f5f3ff] text-sm text-[#7c3aed]" style={{ width: size, height: size }} aria-hidden>
      {inisial(nama)}
    </div>
  )
}

/* ---------------------------------------------------------------- Layout */

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-heading text-2xl leading-8">{title}</h2>
        {subtitle && <p className="mt-2 text-[#64748b]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Metric({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-6">
      <p className="text-sm text-[#64748b]">{label}</p>
      <p className="font-display mt-3 text-3xl">{value}</p>
      {helper && <p className="mt-3 text-xs text-[#64748b]">{helper}</p>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-[#e2e8f0] bg-white p-6 ${className}`}>{children}</div>
}

/* ---------------------------------------------------------------- Formulir */

interface FieldShellProps {
  label?: string
  hint?: string
  error?: string
  id: string
  children: ReactNode
  className?: string
}

function FieldShell({ label, hint, error, id, children, className = '' }: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="body-medium mb-2 block text-sm text-[#0f172a]">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-[#b91c1c]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#64748b]">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

const inputBase =
  'block w-full rounded-lg border bg-white px-4 text-base text-[#0f172a] placeholder:text-[#94a3b8] transition focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:bg-[#f8fafc] disabled:text-[#64748b]'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  wrapperClassName?: string
}

export function TextField({ label, hint, error, wrapperClassName, className = '', ...rest }: TextFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${inputBase} h-12 ${error ? 'border-red-400' : 'border-[#e2e8f0]'} ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  wrapperClassName?: string
}

export function TextArea({ label, hint, error, wrapperClassName, className = '', rows = 4, ...rest }: TextAreaProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${inputBase} py-3 leading-6 ${error ? 'border-red-400' : 'border-[#e2e8f0]'} ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  wrapperClassName?: string
}

export function SelectField({ label, hint, error, wrapperClassName, className = '', children, ...rest }: SelectFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select id={id} aria-invalid={error ? true : undefined} className={`${inputBase} h-12 ${error ? 'border-red-400' : 'border-[#e2e8f0]'} ${className}`} {...rest}>
        {children}
      </select>
    </FieldShell>
  )
}

export function Chip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 items-center rounded-full px-5 text-sm transition ${active ? 'bg-[#7c3aed] text-white' : 'border border-[#e2e8f0] bg-white hover:border-violet-300'}`}
    >
      {children}
    </button>
  )
}

/* ----------------------------------------------------------------- Modal */

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
  dismissible?: boolean
}

export function Modal({ open, onClose, title, children, footer, size = 'md', dismissible = true }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open, onClose, dismissible])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-3xl ${size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] px-6 py-5">
          <h2 id={titleId} className="font-heading text-xl">
            {title}
          </h2>
          {dismissible && (
            <button type="button" onClick={onClose} aria-label="Tutup" className="flex size-9 items-center justify-center rounded-full hover:bg-[#f1f5f9]">
              <Icon name="x" size={20} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-[#e2e8f0] px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

interface ConfirmProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Ya, lanjutkan', danger, loading, onConfirm, onClose }: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      dismissible={!loading}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-6 text-[#475569]">{message}</div>
    </Modal>
  )
}

/* ------------------------------------------------------------ Paginasi */

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const item = 'flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm'
  return (
    <nav aria-label="Halaman" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button className={`${item} border border-[#e2e8f0] bg-white hover:border-violet-300 disabled:opacity-40`} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Sebelumnya
      </button>
      {pages.map((p) => (
        <button key={p} aria-current={p === page ? 'page' : undefined} className={`${item} ${p === page ? 'bg-[#7c3aed] text-white' : 'border border-[#e2e8f0] bg-white hover:border-violet-300'}`} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button className={`${item} border border-[#e2e8f0] bg-white hover:border-violet-300 disabled:opacity-40`} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Berikutnya
      </button>
    </nav>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={`h-10 rounded-full px-4 text-sm transition ${value === item.value ? 'bg-[#7c3aed] text-white' : 'border border-[#e2e8f0] bg-white hover:border-violet-300'}`}
        >
          {item.label}
          {item.count !== undefined && <span className={`ml-2 text-xs ${value === item.value ? 'text-violet-100' : 'text-[#64748b]'}`}>{item.count}</span>}
        </button>
      ))}
    </div>
  )
}
