import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, tokenStore } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { tanggal } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { Link } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Avatar, Badge, Button, Card, Notice, SectionTitle, TextField } from '@/components/ui'

const roleLabel = { pencari: 'Pencari kos', pemilik: 'Pemilik kos', admin: 'Administrator' } as const

export function ProfilPage() {
  useDocumentTitle('Profil')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [nama, setNama] = useState(user?.nama ?? '')
  const [telepon, setTelepon] = useState(user?.nomor_telepon ?? '')
  const [errors, setErrors] = useState<{ nama?: string; telepon?: string }>({})
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const simpan = async (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (nama.trim().length < 3) next.nama = 'Nama minimal 3 karakter.'
    if (!/^(\+62|62|0)8\d{7,12}$/.test(telepon.replace(/[\s-]/g, ''))) next.telepon = 'Gunakan nomor WhatsApp Indonesia, mis. 081234567890.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setLoading(true)
    try {
      const res = await api.auth.updateProfile({ nama: nama.trim(), nomor_telepon: telepon.replace(/[\s-]/g, '') })
      setUser(res.data)
      toast.success('Profil diperbarui.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan profil')
    } finally {
      setLoading(false)
    }
  }

  const berubah = nama.trim() !== user.nama || telepon !== user.nomor_telepon

  return (
    <div className="space-y-6">
      <SectionTitle title="Profil" subtitle="Data ini dilihat pemilik atau pencari saat saling menghubungi." />
      <Card>
        <div className="mb-6 flex items-center gap-4">
          <Avatar nama={user.nama} size={56} />
          <div>
            <p className="body-medium">{user.email}</p>
            <div className="mt-1 flex items-center gap-3">
              <Badge>{roleLabel[user.role]}</Badge>
              <span className="text-xs text-[#64748b]">Bergabung {tanggal(user.createdAt)}</span>
            </div>
          </div>
        </div>
        <form onSubmit={simpan} noValidate className="grid max-w-xl gap-5">
          <TextField label="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} error={errors.nama} />
          <TextField label="Email" value={user.email} disabled hint="Email tidak dapat diubah." />
          <TextField label="Nomor WhatsApp" type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} error={errors.telepon} />
          <div className="flex items-center gap-4">
            <Button primary type="submit" loading={loading} disabled={!berubah}>
              Simpan perubahan
            </Button>
            <Link to={`/${user.role}/keamanan`} className="label text-sm text-[#7c3aed] hover:underline">
              Ganti kata sandi
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function KeamananPage() {
  useDocumentTitle('Keamanan')
  const toast = useToast()
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [ulang, setUlang] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const simpan = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!lama) next.lama = 'Masukkan kata sandi saat ini.'
    if (baru.length < 6) next.baru = 'Kata sandi baru minimal 6 karakter.'
    else if (baru === lama) next.baru = 'Kata sandi baru harus berbeda dari yang lama.'
    if (ulang !== baru) next.ulang = 'Konfirmasi tidak sama dengan kata sandi baru.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return
    setLoading(true)
    try {
      const res = await api.auth.changePassword(lama, baru)
      tokenStore.set(res.data.token)
      setLama('')
      setBaru('')
      setUlang('')
      toast.success('Kata sandi berhasil diganti.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengganti kata sandi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Keamanan" subtitle="Ganti kata sandi secara berkala agar akunmu tetap aman." />
      <Card>
        <form onSubmit={simpan} noValidate className="grid max-w-xl gap-5">
          <TextField label="Kata sandi saat ini" type="password" autoComplete="current-password" value={lama} onChange={(e) => setLama(e.target.value)} error={errors.lama} />
          <TextField label="Kata sandi baru" type="password" autoComplete="new-password" value={baru} onChange={(e) => setBaru(e.target.value)} error={errors.baru} hint="Minimal 6 karakter." />
          <TextField label="Ulangi kata sandi baru" type="password" autoComplete="new-password" value={ulang} onChange={(e) => setUlang(e.target.value)} error={errors.ulang} />
          {formError && <Notice tone="red">{formError}</Notice>}
          <div>
            <Button primary type="submit" loading={loading}>
              Ganti kata sandi
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
