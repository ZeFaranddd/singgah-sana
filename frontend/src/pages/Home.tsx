import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '@/lib/api'
import type { KosQuery } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { rupiah } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Link, navigate } from '@/lib/router'
import { Badge, Button, ErrorState, EmptyState, Icon, LinkButton, LoadingBlock, SectionTitle } from '@/components/ui'
import { PropertyCard } from '@/components/PropertyCard'
import { PublicLayout } from '@/layouts/PublicLayout'

const ANGGARAN = [
  { value: '', label: 'Tentukan anggaran' },
  { value: '1000000', label: 'Hingga Rp 1.000.000' },
  { value: '1500000', label: 'Hingga Rp 1.500.000' },
  { value: '2000000', label: 'Hingga Rp 2.000.000' },
  { value: '3000000', label: 'Hingga Rp 3.000.000' },
]

function SearchBox() {
  const { user } = useAuth()
  const pref = user?.role === 'pencari' ? user.preferensi : undefined
  const [q, setQ] = useState('')
  const [tipe, setTipe] = useState(pref?.tipe ?? '')
  const [harga, setHarga] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (tipe) params.set('tipe', tipe)
    if (harga) params.set('harga_max', harga)
    const qs = params.toString()
    navigate(`/kos${qs ? `?${qs}` : ''}`)
  }

  const fieldClass = 'flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-[#f8fafc]'
  const inputClass = 'w-full bg-transparent text-sm outline-none placeholder:text-[#94a3b8]'

  return (
    <form onSubmit={submit} role="search" className="mx-auto mt-8 grid max-w-[1120px] gap-3 rounded-3xl border border-[#e2e8f0] bg-white p-4 text-left md:grid-cols-[1fr_1fr_1fr_160px] md:items-center">
      <label className={fieldClass}>
        <Icon name="pin" size={20} />
        <span className="min-w-0 flex-1">
          <small className="block text-xs text-[#64748b]">Lokasi atau kampus</small>
          <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pogung, Sekip, Karangmalang…" />
        </span>
      </label>
      <label className={fieldClass}>
        <Icon name="home" size={20} />
        <span className="min-w-0 flex-1">
          <small className="block text-xs text-[#64748b]">Tipe kos</small>
          <select className={inputClass} value={tipe} onChange={(e) => setTipe(e.target.value as typeof tipe)}>
            <option value="">Semua tipe</option>
            <option value="putra">Putra</option>
            <option value="putri">Putri</option>
            <option value="campur">Campur</option>
          </select>
        </span>
      </label>
      <label className={fieldClass}>
        <Icon name="shield" size={20} />
        <span className="min-w-0 flex-1">
          <small className="block text-xs text-[#64748b]">Anggaran per bulan</small>
          <select className={inputClass} value={harga} onChange={(e) => setHarga(e.target.value)}>
            {ANGGARAN.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </span>
      </label>
      <Button primary type="submit">
        Cari kos
      </Button>
    </form>
  )
}

function KosGrid({ query, emptyText }: { query: KosQuery; emptyText: string }) {
  const { data, loading, error, reload } = useAsync(() => api.kos.list(query), [JSON.stringify(query)])
  if (loading) return <LoadingBlock label="Memuat kos…" />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const list = data?.data ?? []
  if (list.length === 0) return <EmptyState title="Belum ada kos" text={emptyText} />
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {list.map((kos) => (
        <PropertyCard key={kos._id} kos={kos} />
      ))}
    </div>
  )
}

export function HomePage() {
  useDocumentTitle('')
  const { user } = useAuth()
  const areas = useAsync(() => api.kos.areas(), [])

  const pref = user?.role === 'pencari' ? user.preferensi : undefined
  const punyaPreferensi = Boolean(pref && (pref.area_kampus || pref.tipe || pref.harga_maks || pref.fasilitas.length > 0))
  const rekomendasiQuery: KosQuery = {
    area_kampus: pref?.area_kampus || undefined,
    tipe: pref?.tipe || undefined,
    harga_max: pref?.harga_maks || undefined,
    fasilitas: pref && pref.fasilitas.length > 0 ? pref.fasilitas.join(',') : undefined,
    kamar_tersedia: true,
    limit: 4,
  }

  const daftarArea = (areas.data?.data ?? []).slice(0, 4)

  return (
    <PublicLayout>
      <main>
        <section className="bg-[#f5f3ff] px-5 py-16 text-center">
          <Badge tone="green">Kos diperiksa admin</Badge>
          <h1 className="font-display mx-auto mt-8 max-w-[1000px] text-4xl leading-tight text-[#0f172a] md:text-[44px] md:leading-[56px]">
            Cari kos yang pas.
            <br />
            Mulai cerita barumu.
          </h1>
          <p className="mt-6 text-[#64748b]">Temukan kos di sekitar kampus, cek sisa kamar, dan tanya langsung ke pemilik.</p>
          <SearchBox />
        </section>

        <section className="mx-auto max-w-[1440px] space-y-8 px-5 py-16 md:px-16">
          {punyaPreferensi && (
            <>
              <SectionTitle
                title="Rekomendasi untukmu"
                subtitle="Disaring dari preferensi yang kamu simpan."
                action={
                  <Link to="/pencari/preferensi" className="label text-sm text-[#7c3aed] hover:underline">
                    Ubah preferensi
                  </Link>
                }
              />
              <KosGrid query={rekomendasiQuery} emptyText="Belum ada kos yang cocok dengan preferensimu. Coba longgarkan filter di halaman preferensi." />
            </>
          )}

          <SectionTitle title="Pilihan kos di sekitar UGM" subtitle="Informasi jelas, pilihan lebih tenang." />
          <KosGrid query={{ kamar_tersedia: true, limit: 4 }} emptyText="Kos yang sudah diverifikasi akan tampil di sini." />
          <LinkButton to="/kos">Jelajahi semua kos</LinkButton>

          <div id="area" className="scroll-mt-28">
            <SectionTitle title="Mulai dari area favoritmu" subtitle="Dekat dengan kampus dan keseharianmu." />
          </div>
          {areas.loading ? (
            <LoadingBlock />
          ) : daftarArea.length === 0 ? (
            <EmptyState title="Belum ada area" text="Area kampus akan muncul setelah ada kos yang terbit." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {daftarArea.map((area) => (
                <Link key={area.area_kampus} to={`/kos?area_kampus=${encodeURIComponent(area.area_kampus)}`} className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] p-4 text-left hover:border-violet-300">
                  <Icon name="pin" />
                  <span>
                    <strong className="body-medium block">{area.area_kampus}</strong>
                    <small className="text-[#64748b]">
                      {area.jumlah_kos} kos · mulai {rupiah(area.harga_mulai)}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <SectionTitle title="Cari kos dengan lebih yakin" subtitle="Hal yang membantu kamu mengambil keputusan." />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ['shield', 'Informasi ditinjau admin', 'Kos melalui pemeriksaan sebelum ditampilkan.'],
              ['home', 'Ketersediaan terlihat jelas', 'Lihat jumlah kamar yang dilaporkan pemilik.'],
              ['message', 'Terhubung dengan pemilik', 'Tanyakan fasilitas dan rencana survei lewat pesan.'],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-2xl bg-[#f8fafc] p-6">
                <Icon name={icon} />
                <h3 className="font-heading-regular mt-4">{title}</h3>
                <p className="mt-4 text-sm text-[#64748b]">{text}</p>
              </div>
            ))}
          </div>

          {user?.role !== 'pencari' && (
            <div className="rounded-2xl bg-[#f5f3ff] p-6">
              <h3 className="font-heading text-xl">Punya kos di sekitar kampus?</h3>
              <p className="my-4 text-sm text-[#64748b]">Daftarkan propertimu, kelola ketersediaan, dan temui calon penghuni.</p>
              <LinkButton variant="primary" to={user?.role === 'pemilik' ? '/pemilik/kos/baru' : user ? '/admin' : '/daftar?peran=pemilik'}>
                {user?.role === 'pemilik' ? 'Tambah kos baru' : 'Mulai daftarkan kos'}
              </LinkButton>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  )
}
