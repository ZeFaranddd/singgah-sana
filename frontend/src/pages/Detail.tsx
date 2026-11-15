import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/lib/favorites'
import { alasanLabel, fotoUtama, linkWhatsApp, pemilikOf, rupiah, tanggal, tipeLabel } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Link, navigate } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Badge, Button, ErrorState, Icon, LinkButton, LoadingBlock, Modal, Notice, SafeImg, SectionTitle, SelectField, StatusKosBadge, TextArea, TextField } from '@/components/ui'
import { PublicLayout } from '@/layouts/PublicLayout'
import type { Kos } from '@/lib/types'

function PesanModal({ kos, mode, open, onClose }: { kos: Kos; mode: 'tanya' | 'survei'; open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [pesan, setPesan] = useState('')
  const [tanggalSurvei, setTanggalSurvei] = useState('')
  const [jamSurvei, setJamSurvei] = useState('16:00')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hariIni = new Date().toISOString().slice(0, 10)

  const kirim = async () => {
    setError('')
    let isi = pesan.trim()
    if (mode === 'survei') {
      if (!tanggalSurvei) return setError('Pilih tanggal survei.')
      isi = `Halo, saya ingin menjadwalkan survei ke ${kos.nama} pada ${tanggal(tanggalSurvei)} pukul ${jamSurvei} WIB.${isi ? ` Catatan: ${isi}` : ''}`
    }
    if (isi.length < 5) return setError('Tulis pesanmu terlebih dahulu (minimal 5 karakter).')
    setLoading(true)
    try {
      await api.inquiries.send(kos._id, isi)
      toast.success('Pesan terkirim ke pemilik kos.')
      setPesan('')
      onClose()
      navigate('/pencari/pesan')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'survei' ? 'Jadwalkan survei' : 'Tanya pemilik'}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button primary loading={loading} onClick={kirim}>
            Kirim pesan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[#64748b]">
          {kos.nama} · pemilik akan membalas lewat halaman Pesan di akunmu.
        </p>
        {mode === 'survei' && (
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Tanggal" type="date" min={hariIni} value={tanggalSurvei} onChange={(e) => setTanggalSurvei(e.target.value)} />
            <TextField label="Jam" type="time" value={jamSurvei} onChange={(e) => setJamSurvei(e.target.value)} />
          </div>
        )}
        <TextArea
          label={mode === 'survei' ? 'Catatan (opsional)' : 'Pesanmu'}
          value={pesan}
          maxLength={800}
          onChange={(e) => setPesan(e.target.value)}
          placeholder={mode === 'survei' ? 'Mis. saya datang bersama orang tua.' : 'Mis. apakah kamar lantai 1 masih kosong dan boleh membawa kulkas?'}
        />
        {error && <Notice tone="red">{error}</Notice>}
      </div>
    </Modal>
  )
}

function LaporModal({ kos, open, onClose }: { kos: Kos; open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [alasan, setAlasan] = useState('informasi_tidak_akurat')
  const [deskripsi, setDeskripsi] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const kirim = async () => {
    setError('')
    if (deskripsi.trim().length < 10) return setError('Jelaskan masalahnya minimal 10 karakter.')
    setLoading(true)
    try {
      await api.laporan.send({ kos_id: kos._id, alasan, deskripsi: deskripsi.trim() })
      toast.success('Laporan terkirim. Admin akan memeriksanya.')
      setDeskripsi('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim laporan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Laporkan kos ini"
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="danger" loading={loading} onClick={kirim}>
            Kirim laporan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField label="Alasan" value={alasan} onChange={(e) => setAlasan(e.target.value)}>
          {Object.entries(alasanLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <TextArea label="Ceritakan masalahnya" value={deskripsi} maxLength={1000} onChange={(e) => setDeskripsi(e.target.value)} />
        {error && <Notice tone="red">{error}</Notice>}
      </div>
    </Modal>
  )
}

export function DetailPage({ id }: { id: string }) {
  const { user } = useAuth()
  const { isSaved, toggle } = useFavorites()
  const { data, loading, error, reload } = useAsync(() => api.kos.get(id), [id, user?._id])
  const kos = data?.data ?? null
  const [foto, setFoto] = useState(0)
  const [modal, setModal] = useState<null | 'tanya' | 'survei' | 'lapor'>(null)

  useDocumentTitle(kos?.nama ?? 'Detail kos')

  const butuhMasuk = () => {
    navigate(`/masuk?next=${encodeURIComponent(window.location.pathname)}`)
  }
  const buka = (jenis: 'tanya' | 'survei' | 'lapor') => {
    if (!user) return butuhMasuk()
    if (user.role !== 'pencari') return
    setModal(jenis)
  }

  if (loading) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-[1312px] px-5 py-16">
          <LoadingBlock label="Memuat detail kos…" />
        </main>
      </PublicLayout>
    )
  }
  if (error || !kos) {
    return (
      <PublicLayout>
        <main className="mx-auto max-w-[1312px] px-5 py-16">
          <ErrorState message={error ?? 'Kos tidak ditemukan.'} onRetry={reload} />
          <div className="mt-6 flex justify-center">
            <LinkButton to="/kos">Kembali ke daftar kos</LinkButton>
          </div>
        </main>
      </PublicLayout>
    )
  }

  const pemilik = pemilikOf(kos)
  const milikSendiri = user?.role === 'pemilik' && pemilik?._id === user._id
  const tayang = kos.status_verifikasi === 'approved'
  const penuh = kos.jumlah_kamar_tersedia <= 0
  const wa = linkWhatsApp(pemilik?.nomor_telepon, `Halo, saya melihat ${kos.nama} di Singgah-sana dan ingin bertanya.`)
  const { latitude, longitude } = kos.koordinat
  const d = 0.004
  const peta = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - d}%2C${latitude - d}%2C${longitude + d}%2C${latitude + d}&layer=mapnik&marker=${latitude}%2C${longitude}`
  const petaLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  const saved = isSaved(kos._id)
  const fotoLain = kos.foto.length > 1 ? kos.foto.map((_, i) => i).filter((i) => i !== foto).slice(0, 2) : []

  return (
    <PublicLayout>
      <main className="mx-auto max-w-[1312px] px-5 py-12">
        <nav aria-label="Jejak halaman" className="text-sm text-[#64748b]">
          <Link to="/kos" className="hover:text-[#7c3aed]">Jelajah kos</Link> / <Link to={`/kos?area_kampus=${encodeURIComponent(kos.area_kampus)}`} className="hover:text-[#7c3aed]">{kos.area_kampus}</Link> / Detail kos
        </nav>
        <h1 className="font-heading mt-6 text-3xl">{kos.nama}</h1>
        <p className="mt-3 text-[#64748b]">{kos.alamat}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {tayang ? <Badge tone="green">Diverifikasi admin</Badge> : <StatusKosBadge status={kos.status_verifikasi} />}
          <Badge>{tipeLabel(kos.tipe)}</Badge>
        </div>

        {!tayang && (
          <div className="mt-6">
            <Notice tone="amber">
              Kos ini belum tayang di pencarian publik. Hanya kamu {user?.role === 'admin' ? '(admin)' : '(pemilik)'} yang bisa melihat halaman ini.
              {kos.catatan_verifikasi && <> Catatan: {kos.catatan_verifikasi}</>}
            </Notice>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-[2fr_1fr]">
          <SafeImg className="h-[300px] w-full rounded-2xl object-cover md:h-[420px]" src={fotoUtama(kos, foto)} alt={`Foto ${foto + 1} ${kos.nama}`} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            {fotoLain.length > 0
              ? fotoLain.map((i) => (
                  <button key={i} type="button" onClick={() => setFoto(i)} aria-label={`Lihat foto ${i + 1}`} className="overflow-hidden rounded-2xl">
                    <SafeImg className="h-[140px] w-full object-cover transition hover:scale-[1.03] md:h-[202px]" src={kos.foto[i]} alt="" fallbackIndex={i + 1} />
                  </button>
                ))
              : (
                <div className="col-span-2 flex h-full min-h-[140px] items-center justify-center rounded-2xl bg-[#f8fafc] p-6 text-center text-sm text-[#64748b] md:col-span-1">
                  Pemilik baru menambahkan satu foto.
                </div>
              )}
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_416px]">
          <div className="space-y-10">
            <div className={`rounded-2xl p-6 ${penuh ? 'bg-[#f8fafc]' : 'bg-[#f0fdf4]'}`}>
              <h2 className="font-heading text-xl">{penuh ? 'Semua kamar sedang terisi' : `Tersedia ${kos.jumlah_kamar_tersedia} dari ${kos.jumlah_kamar_total} kamar`}</h2>
              <p className="mt-2 text-sm text-[#64748b]">Ketersediaan diperbarui pemilik · {tanggal(kos.updatedAt)}</p>
            </div>
            <SectionTitle title="Tentang kos ini" subtitle={kos.deskripsi} />
            <div>
              <h2 className="font-heading text-2xl leading-8">Fasilitas</h2>
              {kos.fasilitas.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {kos.fasilitas.map((f) => (
                    <li key={f}><Badge tone="gray">{f}</Badge></li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[#64748b]">Pemilik belum mencantumkan fasilitas.</p>
              )}
            </div>
            <SectionTitle title="Harga dan ukuran" subtitle={`Sewa ${rupiah(kos.harga_per_bulan)} per bulan · Ukuran kamar ${kos.luas_kamar}`} />
            <div>
              <h2 className="font-heading text-2xl leading-8">Aturan kos</h2>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-[#64748b]">
                <li>Untuk penghuni {kos.tipe}</li>
                {kos.peraturan.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-heading text-2xl leading-8">Lokasi</h2>
              <p className="mt-2 text-[#64748b]">{kos.alamat}</p>
              <iframe title={`Peta lokasi ${kos.nama}`} src={peta} loading="lazy" className="mt-4 h-72 w-full rounded-2xl border border-[#e2e8f0]" />
              <a href={petaLink} target="_blank" rel="noreferrer" className="label mt-3 inline-flex items-center gap-2 text-sm text-[#7c3aed] hover:underline">
                Buka di Google Maps <Icon name="external" size={16} />
              </a>
            </div>
          </div>

          <aside className="h-fit space-y-4 rounded-3xl border border-[#e2e8f0] p-6 lg:sticky lg:top-28">
            <p className="font-heading text-2xl">{rupiah(kos.harga_per_bulan)}</p>
            <p className="text-sm text-[#64748b]">per bulan</p>
            <div>
              <Badge tone={penuh ? 'gray' : 'purple'}>{penuh ? 'Kamar penuh' : `Sisa ${kos.jumlah_kamar_tersedia} kamar`}</Badge>
            </div>

            {milikSendiri ? (
              <>
                <Notice tone="purple">Ini kos milikmu.</Notice>
                <LinkButton variant="primary" className="w-full" to={`/pemilik/kos/${kos._id}/ubah`}>Ubah data kos</LinkButton>
              </>
            ) : user?.role === 'admin' ? (
              <LinkButton variant="primary" className="w-full" to="/admin/peninjauan">Ke antrean peninjauan</LinkButton>
            ) : user?.role === 'pemilik' ? (
              <Notice tone="gray">Akun pemilik tidak dapat mengirim pesan ke kos lain.</Notice>
            ) : (
              <>
                {tayang ? (
                  <>
                    <Button primary className="w-full" onClick={() => buka('tanya')}>Tanya pemilik</Button>
                    <Button className="w-full" onClick={() => buka('survei')}>Jadwalkan survei</Button>
                  </>
                ) : (
                  <Notice tone="gray">Kos belum dapat menerima pesan.</Notice>
                )}
                {!user && <p className="text-center text-xs text-[#64748b]">Kamu perlu masuk untuk mengirim pesan.</p>}
              </>
            )}

            {wa && tayang && (
              <a href={wa} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] text-base hover:border-emerald-400 hover:bg-emerald-50">
                <Icon name="phone" size={20} /> Chat via WhatsApp
              </a>
            )}

            {tayang && user?.role !== 'admin' && !milikSendiri && (
              <div className="flex gap-3">
                <Button small className="flex-1" onClick={() => void toggle(kos._id)}>
                  <Icon name="heart" size={20} filled={saved} /> {saved ? 'Tersimpan' : 'Simpan'}
                </Button>
                {user?.role !== 'pemilik' && (
                  <Button small variant="ghost" className="flex-1" onClick={() => buka('lapor')}>
                    <Icon name="flag" size={16} /> Laporkan
                  </Button>
                )}
              </div>
            )}

            {pemilik && (
              <p className="border-t border-[#e2e8f0] pt-4 text-sm">
                Dikelola oleh <strong>{pemilik.nama}</strong>
              </p>
            )}
          </aside>
        </div>
      </main>
      {kos && user?.role === 'pencari' && (
        <>
          <PesanModal kos={kos} mode="tanya" open={modal === 'tanya'} onClose={() => setModal(null)} />
          <PesanModal kos={kos} mode="survei" open={modal === 'survei'} onClose={() => setModal(null)} />
          <LaporModal kos={kos} open={modal === 'lapor'} onClose={() => setModal(null)} />
        </>
      )}
    </PublicLayout>
  )
}
