import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { homePathFor, useAuth } from '@/lib/auth'
import { useDocumentTitle } from '@/lib/hooks'
import { Link, navigate, useSearchParams } from '@/lib/router'
import { useToast } from '@/lib/toast'
import type { Role } from '@/lib/types'
import { Button, Icon, Logo, Notice, TextField } from '@/components/ui'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[#f5f3ff] p-12 lg:flex">
        <Link to="/" aria-label="Beranda">
          <Logo large />
        </Link>
        <div>
          <h2 className="font-display max-w-md text-4xl leading-tight">Cari kos yang pas. Mulai cerita barumu.</h2>
          <ul className="mt-8 space-y-4 text-[#475569]">
            <li className="flex items-start gap-3">
              <Icon name="shield" /> Setiap kos diperiksa admin sebelum tayang.
            </li>
            <li className="flex items-start gap-3">
              <Icon name="home" /> Sisa kamar diperbarui langsung oleh pemilik.
            </li>
            <li className="flex items-start gap-3">
              <Icon name="message" /> Tanya fasilitas dan jadwalkan survei lewat pesan.
            </li>
          </ul>
        </div>
        <p className="text-xs text-[#64748b]">© 2026 Singgah-sana</p>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block lg:hidden" aria-label="Beranda">
            <Logo large />
          </Link>
          <h1 className="font-heading text-3xl">{title}</h1>
          <p className="mt-3 text-[#64748b]">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm text-[#64748b]">{footer}</p>
        </div>
      </div>
    </div>
  )
}

function PasswordField(props: { label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <TextField
        label={props.label}
        type={show ? 'text' : 'password'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        error={props.error}
        hint={props.hint}
        autoComplete={props.autoComplete}
        className="pr-12"
      />
      <button type="button" aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setShow((s) => !s)} className="absolute right-3 top-[38px] flex size-8 items-center justify-center rounded-md text-[#64748b] hover:bg-[#f1f5f9]">
        <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
      </button>
    </div>
  )
}

export function LoginPage() {
  useDocumentTitle('Masuk')
  const { login } = useAuth()
  const toast = useToast()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const next = params.get('next')
  const expired = params.get('expired') === '1'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!EMAIL_RE.test(email.trim())) nextErrors.email = 'Masukkan alamat email yang valid.'
    if (!password) nextErrors.password = 'Kata sandi wajib diisi.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      toast.success(`Selamat datang, ${user.nama}.`)
      const aman = next && next.startsWith('/') && !next.startsWith('//')
      navigate(aman ? next : homePathFor(user.role), { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const contoh: { label: string; email: string; password: string }[] = [
    { label: 'Pencari', email: 'pencari1@gmail.com', password: 'PencariPassword123!' },
    { label: 'Pemilik', email: 'pemilik1@gmail.com', password: 'PemilikPassword123!' },
    { label: 'Admin', email: 'admin@gmail.com', password: 'AdminPassword123!' },
  ]

  return (
    <AuthShell
      title="Masuk ke akunmu"
      subtitle="Lanjutkan pencarian, kelola kos, atau tinjau pengajuan."
      footer={
        <>
          Belum punya akun?{' '}
          <Link to={next ? `/daftar?next=${encodeURIComponent(next)}` : '/daftar'} className="label text-[#7c3aed] hover:underline">
            Daftar sekarang
          </Link>
        </>
      }
    >
      {expired && (
        <div className="mb-5">
          <Notice tone="amber">Sesi kamu sudah berakhir. Silakan masuk kembali.</Notice>
        </div>
      )}
      <form onSubmit={submit} noValidate className="space-y-5">
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" placeholder="nama@email.com" />
        <PasswordField label="Kata sandi" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
        {formError && (
          <div role="alert">
            <Notice tone="red">{formError}</Notice>
          </div>
        )}
        <Button primary type="submit" loading={loading} className="w-full">
          Masuk
        </Button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-8 rounded-2xl border border-dashed border-[#cbd5e1] p-4">
          <p className="text-xs text-[#64748b]">Mode pengembangan — isi otomatis dengan akun dari seeder:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {contoh.map((akun) => (
              <button
                key={akun.label}
                type="button"
                className="h-9 rounded-full border border-[#e2e8f0] px-4 text-sm hover:border-violet-300 hover:bg-violet-50"
                onClick={() => {
                  setEmail(akun.email)
                  setPassword(akun.password)
                  setErrors({})
                }}
              >
                {akun.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  )
}

export function RegisterPage() {
  useDocumentTitle('Daftar')
  const { register } = useAuth()
  const toast = useToast()
  const [params] = useSearchParams()
  const peranAwal = params.get('peran') === 'pemilik' ? 'pemilik' : 'pencari'
  const [role, setRole] = useState<Exclude<Role, 'admin'>>(peranAwal)
  const [form, setForm] = useState({ nama: '', email: '', nomor_telepon: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (form.nama.trim().length < 3) next.nama = 'Nama lengkap minimal 3 karakter.'
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Masukkan alamat email yang valid.'
    if (!/^(\+62|62|0)8\d{7,12}$/.test(form.nomor_telepon.replace(/[\s-]/g, ''))) next.nomor_telepon = 'Gunakan nomor WhatsApp Indonesia, mis. 081234567890.'
    if (form.password.length < 6) next.password = 'Kata sandi minimal 6 karakter.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      const user = await register({
        nama: form.nama.trim(),
        email: form.email.trim(),
        nomor_telepon: form.nomor_telepon.replace(/[\s-]/g, ''),
        password: form.password,
        role,
      })
      toast.success('Akun berhasil dibuat. Selamat datang!')
      const nextPath = params.get('next')
      const aman = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
      navigate(aman ? nextPath : user.role === 'pemilik' ? '/pemilik/kos/baru' : '/kos', { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Buat akun baru"
      subtitle="Gratis untuk pencari kos maupun pemilik kos."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to="/masuk" className="label text-[#7c3aed] hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <fieldset>
          <legend className="body-medium mb-2 text-sm">Saya ingin</legend>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['pencari', 'Mencari kos'],
                ['pemilik', 'Mendaftarkan kos'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className={`flex h-12 cursor-pointer items-center justify-center rounded-lg border text-sm transition ${role === value ? 'border-[#7c3aed] bg-[#f5f3ff] text-[#7c3aed]' : 'border-[#e2e8f0] hover:border-violet-300'}`}>
                <input type="radio" name="peran" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField label="Nama lengkap" value={form.nama} onChange={(e) => set('nama')(e.target.value)} error={errors.nama} autoComplete="name" />
        <TextField label="Email" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} error={errors.email} autoComplete="email" placeholder="nama@email.com" />
        <TextField label="Nomor WhatsApp" type="tel" value={form.nomor_telepon} onChange={(e) => set('nomor_telepon')(e.target.value)} error={errors.nomor_telepon} autoComplete="tel" placeholder="081234567890" hint="Dipakai agar pemilik dan pencari bisa saling menghubungi." />
        <PasswordField label="Kata sandi" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" hint="Minimal 6 karakter." />
        {formError && (
          <div role="alert">
            <Notice tone="red">{formError}</Notice>
          </div>
        )}
        <Button primary type="submit" loading={loading} className="w-full">
          Buat akun
        </Button>
      </form>
    </AuthShell>
  )
}
