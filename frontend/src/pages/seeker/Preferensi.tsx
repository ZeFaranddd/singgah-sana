import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { FASILITAS_UMUM, rupiah } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { navigate } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Button, Card, Chip, SectionTitle, SelectField, TextField } from '@/components/ui'
import type { TipeKos } from '@/lib/types'

export function SeekerPreferensi() {
  useDocumentTitle('Preferensi')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const areas = useAsync(() => api.kos.areas(), [])
  const pref = user?.preferensi
  const [area, setArea] = useState(pref?.area_kampus ?? '')
  const [tipe, setTipe] = useState<'' | TipeKos>(pref?.tipe ?? '')
  const [harga, setHarga] = useState(pref?.harga_maks ? String(pref.harga_maks) : '')
  const [fasilitas, setFasilitas] = useState<string[]>(pref?.fasilitas ?? [])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggle = (f: string) => setFasilitas((c) => (c.includes(f) ? c.filter((x) => x !== f) : [...c, f]))

  const simpan = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const nilai = harga.trim() === '' ? null : Number(harga)
    if (nilai !== null && (!Number.isFinite(nilai) || nilai < 0)) return setError('Anggaran harus berupa angka positif.')
    setLoading(true)
    try {
      const res = await api.auth.updateProfile({ preferensi: { area_kampus: area, tipe, harga_maks: nilai, fasilitas } })
      setUser(res.data)
      toast.success('Preferensi disimpan. Rekomendasi di beranda sudah diperbarui.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan preferensi')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setArea('')
    setTipe('')
    setHarga('')
    setFasilitas([])
  }

  const cari = () => {
    const p = new URLSearchParams()
    if (area) p.set('area_kampus', area)
    if (tipe) p.set('tipe', tipe)
    if (harga) p.set('harga_max', harga)
    if (fasilitas.length) p.set('fasilitas', fasilitas.join(','))
    navigate(`/kos${p.toString() ? `?${p}` : ''}`)
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Preferensi" subtitle="Dipakai untuk rekomendasi di beranda dan mempercepat pencarian." />
      <Card>
        <form onSubmit={simpan} noValidate className="grid max-w-2xl gap-6">
          <div>
            <TextField label="Area kampus" list="daftar-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Mis. Pogung UGM" hint="Pilih dari daftar area yang tersedia atau ketik sendiri." />
            <datalist id="daftar-area">
              {(areas.data?.data ?? []).map((a) => (
                <option key={a.area_kampus} value={a.area_kampus} />
              ))}
            </datalist>
          </div>
          <SelectField label="Tipe kos" value={tipe} onChange={(e) => setTipe(e.target.value as '' | TipeKos)}>
            <option value="">Semua tipe</option>
            <option value="putra">Putra</option>
            <option value="putri">Putri</option>
            <option value="campur">Campur</option>
          </SelectField>
          <TextField label="Anggaran maksimal per bulan (Rp)" type="number" inputMode="numeric" min={0} step={50000} value={harga} onChange={(e) => setHarga(e.target.value)} error={error} hint={harga && Number(harga) > 0 ? rupiah(Number(harga)) : 'Kosongkan bila tidak dibatasi.'} />
          <div>
            <span className="body-medium mb-3 block text-sm">Fasilitas yang penting</span>
            <div className="flex flex-wrap gap-2">
              {FASILITAS_UMUM.map((f) => (
                <Chip key={f} active={fasilitas.includes(f)} onClick={() => toggle(f)}>
                  {f}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button primary type="submit" loading={loading}>Simpan preferensi</Button>
            <Button onClick={cari}>Cari dengan pilihan ini</Button>
            <Button variant="ghost" onClick={reset}>Kosongkan</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
