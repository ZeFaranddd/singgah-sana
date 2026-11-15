import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { FASILITAS_UMUM, pemilikOf, rupiah, tipeLabel } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { navigate } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Badge, Button, Card, Chip, ErrorState, Icon, LoadingBlock, Notice, SafeImg, SectionTitle, SelectField, TextArea, TextField } from '@/components/ui'
import type { Kos, TipeKos } from '@/lib/types'

const LANGKAH = ['Informasi dasar', 'Lokasi', 'Harga & kamar', 'Fasilitas & aturan', 'Foto', 'Tinjau']
const MAKS_FOTO = 5
const MAKS_UKURAN = 5 * 1024 * 1024
const TIPE_FOTO = ['image/jpeg', 'image/png', 'image/webp']

interface FormState {
  nama: string
  deskripsi: string
  tipe: TipeKos | ''
  alamat: string
  area_kampus: string
  latitude: string
  longitude: string
  harga: string
  luas_kamar: string
  total: string
  tersedia: string
  fasilitas: string[]
  peraturan: string
}

const awal: FormState = {
  nama: '',
  deskripsi: '',
  tipe: '',
  alamat: '',
  area_kampus: '',
  latitude: '-7.7681',
  longitude: '110.3779',
  harga: '',
  luas_kamar: '3 x 4 meter',
  total: '',
  tersedia: '',
  fasilitas: [],
  peraturan: 'Akses 24 jam\nDilarang merokok di dalam kamar',
}

const dariKos = (kos: Kos): FormState => ({
  nama: kos.nama,
  deskripsi: kos.deskripsi,
  tipe: kos.tipe,
  alamat: kos.alamat,
  area_kampus: kos.area_kampus,
  latitude: String(kos.koordinat.latitude),
  longitude: String(kos.koordinat.longitude),
  harga: String(kos.harga_per_bulan),
  luas_kamar: kos.luas_kamar,
  total: String(kos.jumlah_kamar_total),
  tersedia: String(kos.jumlah_kamar_tersedia),
  fasilitas: [...kos.fasilitas],
  peraturan: kos.peraturan.join('\n'),
})

const bersihkan = (teks: string) => teks.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()

function validasi(langkah: number, f: FormState, jumlahFoto: number): Record<string, string> {
  const e: Record<string, string> = {}
  if (langkah === 0) {
    if (f.nama.trim().length < 3) e.nama = 'Nama kos minimal 3 karakter.'
    if (f.deskripsi.trim().length < 20) e.deskripsi = 'Deskripsi minimal 20 karakter agar calon penghuni paham.'
    if (!f.tipe) e.tipe = 'Pilih tipe kos.'
  }
  if (langkah === 1) {
    if (f.alamat.trim().length < 10) e.alamat = 'Tulis alamat lengkap (minimal 10 karakter).'
    if (!f.area_kampus.trim()) e.area_kampus = 'Isi area kampus, mis. Pogung UGM.'
    const lat = Number(f.latitude)
    const lng = Number(f.longitude)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) e.latitude = 'Latitude tidak valid.'
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) e.longitude = 'Longitude tidak valid.'
  }
  if (langkah === 2) {
    const harga = Number(f.harga)
    const total = Number(f.total)
    const tersedia = Number(f.tersedia)
    if (!Number.isFinite(harga) || harga < 100000) e.harga = 'Harga minimal Rp 100.000.'
    if (!f.luas_kamar.trim()) e.luas_kamar = 'Isi ukuran kamar.'
    if (!Number.isInteger(total) || total < 1) e.total = 'Jumlah kamar minimal 1.'
    if (f.tersedia === '' || !Number.isInteger(tersedia) || tersedia < 0) e.tersedia = 'Isi jumlah kamar tersedia (0 bila penuh).'
    else if (Number.isInteger(total) && tersedia > total) e.tersedia = 'Tidak boleh melebihi jumlah kamar total.'
  }
  if (langkah === 4 && jumlahFoto < 1) e.foto = 'Tambahkan minimal satu foto kos.'
  return e
}

export function OwnerKosForm({ id }: { id?: string }) {
  const editing = Boolean(id)
  useDocumentTitle(editing ? 'Ubah kos' : 'Tambah kos')
  const { user } = useAuth()
  const toast = useToast()

  const muat = useAsync(() => api.kos.get(id as string), [id], editing)
  const [langkah, setLangkah] = useState(0)
  const [form, setForm] = useState<FormState>(awal)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fotoLama, setFotoLama] = useState<string[]>([])
  const [fotoBaru, setFotoBaru] = useState<File[]>([])
  const [fasilitasCustom, setFasilitasCustom] = useState('')
  const [kirim, setKirim] = useState(false)
  const [formError, setFormError] = useState('')
  const [siap, setSiap] = useState(!editing)

  const kosAsli = muat.data?.data ?? null

  useEffect(() => {
    if (kosAsli && !siap) {
      setForm(dariKos(kosAsli))
      setFotoLama([...kosAsli.foto])
      setSiap(true)
    }
  }, [kosAsli, siap])

  const previews = useMemo(() => fotoBaru.map((file) => URL.createObjectURL(file)), [fotoBaru])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => {
      if (!e[key]) return e
      const { [key]: _hapus, ...sisa } = e
      return sisa
    })
  }

  if (editing && muat.loading) return <LoadingBlock label="Memuat data kos…" />
  if (editing && (muat.error || !kosAsli)) return <ErrorState message={muat.error ?? 'Kos tidak ditemukan.'} onRetry={muat.reload} />
  if (editing && kosAsli) {
    const pemilik = pemilikOf(kosAsli)
    if (pemilik && user && pemilik._id !== user._id) {
      return <ErrorState message="Kamu hanya dapat mengubah kos milikmu sendiri." />
    }
  }

  const jumlahFoto = fotoLama.length + fotoBaru.length

  const lanjut = () => {
    const e = validasi(langkah, form, jumlahFoto)
    setErrors(e)
    if (Object.keys(e).length === 0) {
      setLangkah((l) => Math.min(l + 1, LANGKAH.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const tambahFoto = (files: FileList | null) => {
    if (!files) return
    const baru: File[] = []
    let pesan = ''
    Array.from(files).forEach((file) => {
      if (!TIPE_FOTO.includes(file.type)) pesan = 'Hanya berkas JPG, PNG, atau WEBP yang diizinkan.'
      else if (file.size > MAKS_UKURAN) pesan = 'Ukuran tiap foto maksimal 5 MB.'
      else baru.push(file)
    })
    const sisa = MAKS_FOTO - jumlahFoto
    if (baru.length > sisa) pesan = `Foto maksimal ${MAKS_FOTO} berkas.`
    setFotoBaru((c) => [...c, ...baru.slice(0, Math.max(sisa, 0))])
    setErrors(pesan ? { foto: pesan } : {})
  }

  const toggleFasilitas = (f: string) => set('fasilitas', form.fasilitas.includes(f) ? form.fasilitas.filter((x) => x !== f) : [...form.fasilitas, f])

  const tambahCustom = () => {
    const nama = bersihkan(fasilitasCustom)
    if (!nama) return
    if (!form.fasilitas.some((f) => f.toLowerCase() === nama.toLowerCase())) set('fasilitas', [...form.fasilitas, nama])
    setFasilitasCustom('')
  }

  const lokasiSaya = () => {
    if (!navigator.geolocation) return toast.error('Peramban tidak mendukung lokasi.')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude.toFixed(6))
        set('longitude', pos.coords.longitude.toFixed(6))
        toast.success('Koordinat diisi dari lokasimu saat ini.')
      },
      () => toast.error('Tidak bisa membaca lokasi. Isi koordinat secara manual.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const kirimForm = async () => {
    // Validasi ulang seluruh langkah sebelum dikirim
    for (let i = 0; i < 5; i += 1) {
      const e = validasi(i, form, jumlahFoto)
      if (Object.keys(e).length > 0) {
        setErrors(e)
        setLangkah(i)
        return
      }
    }
    setFormError('')
    setKirim(true)
    try {
      const data = new FormData()
      data.append('nama', form.nama.trim())
      data.append('deskripsi', form.deskripsi.trim())
      data.append('alamat', form.alamat.trim())
      data.append('area_kampus', form.area_kampus.trim())
      data.append('latitude', form.latitude)
      data.append('longitude', form.longitude)
      data.append('harga_per_bulan', form.harga)
      data.append('tipe', form.tipe)
      data.append('luas_kamar', form.luas_kamar.trim())
      data.append('jumlah_kamar_total', form.total)
      data.append('jumlah_kamar_tersedia', form.tersedia)
      data.append('fasilitas', form.fasilitas.map(bersihkan).filter(Boolean).join(','))
      data.append('peraturan', form.peraturan.split('\n').map(bersihkan).filter(Boolean).join(','))
      fotoBaru.forEach((file) => data.append('foto', file))

      if (editing && id) {
        // foto_urls selalu dikirim saat mengubah (string kosong = tidak ada foto lama yang dipertahankan)
        if (fotoLama.length === 0) data.append('foto_urls', '')
        fotoLama.forEach((url) => data.append('foto_urls', url))
        const res = await api.kos.update(id, data)
        toast.success(res.message ?? 'Kos diperbarui.')
      } else {
        const res = await api.kos.create(data)
        toast.success(res.message ?? 'Kos terkirim untuk ditinjau.')
      }
      navigate('/pemilik/kos')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan kos')
    } finally {
      setKirim(false)
    }
  }

  const berisiPerubahanPenting = editing && kosAsli && kosAsli.status_verifikasi !== 'pending'
  const tipeOpsi: TipeKos[] = ['putra', 'putri', 'campur']

  return (
    <div className="space-y-6">
      <SectionTitle title={editing ? 'Ubah data kos' : 'Tambah kos'} subtitle={editing ? kosAsli?.nama : 'Isi data kos. Admin akan memeriksanya sebelum tayang di pencarian.'} />

      <ol className="flex flex-wrap gap-2" aria-label="Langkah pengisian">
        {LANGKAH.map((nama, i) => (
          <li key={nama} aria-current={i === langkah ? 'step' : undefined}>
            <button
              type="button"
              disabled={i > langkah}
              onClick={() => setLangkah(i)}
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm ${i === langkah ? 'bg-[#7c3aed] text-white' : i < langkah ? 'bg-[#f5f3ff] text-[#7c3aed]' : 'border border-[#e2e8f0] text-[#64748b]'}`}
            >
              <span className="label">{i < langkah ? '✓' : i + 1}</span>
              <span className="hidden sm:inline">{nama}</span>
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <h3 className="font-heading mb-6 text-xl">{LANGKAH[langkah]}</h3>

        {langkah === 0 && (
          <div className="grid max-w-2xl gap-5">
            <TextField label="Nama kos" value={form.nama} onChange={(e) => set('nama', e.target.value)} error={errors.nama} maxLength={120} />
            <TextArea label="Deskripsi" rows={5} value={form.deskripsi} onChange={(e) => set('deskripsi', e.target.value)} error={errors.deskripsi} hint="Ceritakan suasana, jarak ke kampus, dan keunggulan kos." />
            <div>
              <span className="body-medium mb-2 block text-sm">Tipe kos</span>
              <div className="flex flex-wrap gap-2">
                {tipeOpsi.map((t) => (
                  <Chip key={t} active={form.tipe === t} onClick={() => set('tipe', t)}>
                    {tipeLabel(t)}
                  </Chip>
                ))}
              </div>
              {errors.tipe && <p role="alert" className="mt-1.5 text-xs text-[#b91c1c]">{errors.tipe}</p>}
            </div>
          </div>
        )}

        {langkah === 1 && (
          <div className="grid max-w-2xl gap-5">
            <TextArea label="Alamat lengkap" rows={3} value={form.alamat} onChange={(e) => set('alamat', e.target.value)} error={errors.alamat} />
            <TextField label="Area kampus" value={form.area_kampus} onChange={(e) => set('area_kampus', e.target.value)} error={errors.area_kampus} placeholder="Mis. Pogung UGM" hint="Dipakai sebagai kategori pencarian area." />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Latitude" inputMode="decimal" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} error={errors.latitude} />
              <TextField label="Longitude" inputMode="decimal" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} error={errors.longitude} />
            </div>
            <div>
              <Button small onClick={lokasiSaya}>Gunakan lokasiku sekarang</Button>
              <p className="mt-2 text-xs text-[#64748b]">Atau salin koordinat dari Google Maps (klik kanan pada titik kos).</p>
            </div>
          </div>
        )}

        {langkah === 2 && (
          <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
            <TextField label="Harga sewa per bulan (Rp)" type="number" inputMode="numeric" min={100000} step={50000} value={form.harga} onChange={(e) => set('harga', e.target.value)} error={errors.harga} hint={Number(form.harga) > 0 ? rupiah(Number(form.harga)) : undefined} />
            <TextField label="Ukuran kamar" value={form.luas_kamar} onChange={(e) => set('luas_kamar', e.target.value)} error={errors.luas_kamar} />
            <TextField label="Jumlah kamar total" type="number" inputMode="numeric" min={1} value={form.total} onChange={(e) => set('total', e.target.value)} error={errors.total} />
            <TextField label="Kamar tersedia saat ini" type="number" inputMode="numeric" min={0} value={form.tersedia} onChange={(e) => set('tersedia', e.target.value)} error={errors.tersedia} hint="Bisa diperbarui kapan saja dari halaman Kos saya." />
          </div>
        )}

        {langkah === 3 && (
          <div className="grid max-w-2xl gap-6">
            <div>
              <span className="body-medium mb-3 block text-sm">Fasilitas</span>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...FASILITAS_UMUM, ...form.fasilitas])].map((f) => (
                  <Chip key={f} active={form.fasilitas.includes(f)} onClick={() => toggleFasilitas(f)}>
                    {f}
                  </Chip>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <input
                  aria-label="Fasilitas lain"
                  className="h-12 flex-1 rounded-lg border border-[#e2e8f0] px-4 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-violet-200"
                  placeholder="Fasilitas lain, mis. Smart TV"
                  value={fasilitasCustom}
                  onChange={(e) => setFasilitasCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      tambahCustom()
                    }
                  }}
                />
                <Button onClick={tambahCustom}><Icon name="plus" size={16} /> Tambah</Button>
              </div>
            </div>
            <TextArea label="Aturan kos" rows={5} value={form.peraturan} onChange={(e) => set('peraturan', e.target.value)} hint="Satu aturan per baris." />
          </div>
        )}

        {langkah === 4 && (
          <div className="space-y-5">
            <p className="text-sm text-[#64748b]">Unggah 1–5 foto (JPG, PNG, atau WEBP, maks 5 MB per foto). Foto pertama menjadi foto utama.</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {fotoLama.map((url, i) => (
                <div key={url} className="relative">
                  <SafeImg className="h-32 w-full rounded-xl object-cover" src={url} alt={`Foto ${i + 1}`} fallbackIndex={i} />
                  <button type="button" aria-label={`Hapus foto ${i + 1}`} onClick={() => setFotoLama((c) => c.filter((u) => u !== url))} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white shadow">
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
              {previews.map((url, i) => (
                <div key={url} className="relative">
                  <img className="h-32 w-full rounded-xl object-cover" src={url} alt={`Foto baru ${i + 1}`} />
                  <span className="absolute bottom-2 left-2"><Badge tone="green">Baru</Badge></span>
                  <button type="button" aria-label={`Hapus foto baru ${i + 1}`} onClick={() => setFotoBaru((c) => c.filter((_, idx) => idx !== i))} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white shadow">
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
              {jumlahFoto < MAKS_FOTO && (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbd5e1] text-sm text-[#64748b] hover:border-[#7c3aed] hover:bg-[#f5f3ff]">
                  <Icon name="upload" />
                  Tambah foto
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { tambahFoto(e.target.files); e.target.value = '' }} />
                </label>
              )}
            </div>
            {errors.foto && <p role="alert" className="text-sm text-[#b91c1c]">{errors.foto}</p>}
          </div>
        )}

        {langkah === 5 && (
          <div className="space-y-6">
            <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              {[
                ['Nama', form.nama],
                ['Tipe', tipeLabel(form.tipe)],
                ['Alamat', form.alamat],
                ['Area kampus', form.area_kampus],
                ['Koordinat', `${form.latitude}, ${form.longitude}`],
                ['Harga', `${rupiah(Number(form.harga))} / bulan`],
                ['Ukuran kamar', form.luas_kamar],
                ['Kamar', `${form.tersedia} tersedia dari ${form.total}`],
                ['Fasilitas', form.fasilitas.join(', ') || '-'],
                ['Aturan', form.peraturan.split('\n').filter(Boolean).join('; ') || '-'],
                ['Foto', `${jumlahFoto} berkas`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-[#64748b]">{k}</dt>
                  <dd className="body-medium mt-1 break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-[#64748b]"><strong>Deskripsi:</strong> {form.deskripsi}</p>
            {berisiPerubahanPenting ? (
              <Notice tone="amber">Perubahan pada data kos yang sudah ditinjau akan mengembalikan kos ke antrean peninjauan dan menyembunyikannya dari pencarian sampai disetujui lagi. Mengubah jumlah kamar tersedia saja tidak memicu tinjauan ulang.</Notice>
            ) : (
              <Notice tone="purple">Setelah dikirim, kos akan ditinjau admin sebelum tampil di pencarian.</Notice>
            )}
            {formError && <Notice tone="red">{formError}</Notice>}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={() => (langkah === 0 ? navigate('/pemilik/kos') : setLangkah((l) => l - 1))} disabled={kirim}>
          {langkah === 0 ? 'Batal' : 'Kembali'}
        </Button>
        {langkah < LANGKAH.length - 1 ? (
          <Button primary onClick={lanjut}>Lanjut</Button>
        ) : (
          <Button primary loading={kirim} onClick={kirimForm}>{editing ? 'Simpan perubahan' : 'Kirim untuk ditinjau'}</Button>
        )}
      </div>
    </div>
  )
}
