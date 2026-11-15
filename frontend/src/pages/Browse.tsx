import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { KosQuery } from '@/lib/api'
import { FASILITAS_UMUM } from '@/lib/format'
import { useAsync, useDebounced, useDocumentTitle } from '@/lib/hooks'
import { Link, useSearchParams } from '@/lib/router'
import { Button, Chip, EmptyState, ErrorState, Icon, LoadingBlock, Pagination, SectionTitle, SelectField, TextField } from '@/components/ui'
import { PropertyCard } from '@/components/PropertyCard'
import { PublicLayout } from '@/layouts/PublicLayout'

const LIMIT = 12

export function BrowsePage() {
  const [params, setParams] = useSearchParams()
  const [showFilter, setShowFilter] = useState(false)

  const q = params.get('q') ?? ''
  const tipe = params.get('tipe') ?? ''
  const area = params.get('area_kampus') ?? ''
  const hargaMin = params.get('harga_min') ?? ''
  const hargaMax = params.get('harga_max') ?? ''
  const fasilitas = (params.get('fasilitas') ?? '').split(',').filter(Boolean)
  const tersedia = params.get('kamar_tersedia') === 'true'
  const sort = params.get('sort') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  // Kolom pencarian & harga: nilai lokal agar mengetik terasa mulus, URL diperbarui setelah jeda
  const [qLocal, setQLocal] = useState(q)
  const [minLocal, setMinLocal] = useState(hargaMin)
  const [maxLocal, setMaxLocal] = useState(hargaMax)
  const qDebounced = useDebounced(qLocal)
  const minDebounced = useDebounced(minLocal)
  const maxDebounced = useDebounced(maxLocal)

  useEffect(() => setQLocal(q), [q])
  useEffect(() => setMinLocal(hargaMin), [hargaMin])
  useEffect(() => setMaxLocal(hargaMax), [hargaMax])

  useEffect(() => {
    if (qDebounced !== q) setParams({ q: qDebounced, page: undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced])
  useEffect(() => {
    if (minDebounced !== hargaMin) setParams({ harga_min: minDebounced, page: undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDebounced])
  useEffect(() => {
    if (maxDebounced !== hargaMax) setParams({ harga_max: maxDebounced, page: undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDebounced])

  const query: KosQuery = {
    q: q || undefined,
    tipe: tipe || undefined,
    area_kampus: area || undefined,
    harga_min: hargaMin || undefined,
    harga_max: hargaMax || undefined,
    fasilitas: fasilitas.length ? fasilitas.join(',') : undefined,
    kamar_tersedia: tersedia ? 'true' : undefined,
    sort: sort || undefined,
    page,
    limit: LIMIT,
  }

  const { data, loading, error, reload } = useAsync(() => api.kos.list(query), [JSON.stringify(query)])
  const list = data?.data ?? []
  const pagination = data?.pagination

  useDocumentTitle(area ? `Kos di ${area}` : 'Jelajah kos')

  const toggleFasilitas = (nama: string) => {
    const next = fasilitas.includes(nama) ? fasilitas.filter((f) => f !== nama) : [...fasilitas, nama]
    setParams({ fasilitas: next.join(','), page: undefined })
  }

  const adaFilter = Boolean(q || tipe || area || hargaMin || hargaMax || fasilitas.length || tersedia || sort)
  const resetSemua = () => {
    setQLocal('')
    setMinLocal('')
    setMaxLocal('')
    setParams({ q: '', tipe: '', area_kampus: '', harga_min: '', harga_max: '', fasilitas: '', kamar_tersedia: '', sort: '', page: undefined })
  }

  const jumlahFilterLanjut = [hargaMin, hargaMax, fasilitas.length ? 'f' : '', tersedia ? 't' : '', sort].filter(Boolean).length

  return (
    <PublicLayout>
      <main className="mx-auto min-h-[75vh] max-w-[1440px] px-5 py-16 md:px-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#7c3aed] hover:underline">
          <Icon name="arrowLeft" size={16} /> Kembali ke beranda
        </Link>

        <div className="rounded-2xl border border-[#e2e8f0] p-4">
          <label htmlFor="cari-kos" className="text-xs text-[#64748b]">
            Ubah pencarian
          </label>
          <div className="mt-1 flex items-center gap-3">
            <Icon name="search" size={20} className="text-[#64748b]" />
            <input id="cari-kos" type="search" className="block w-full text-lg outline-none placeholder:text-[#94a3b8]" value={qLocal} onChange={(e) => setQLocal(e.target.value)} placeholder="Cari nama kos, alamat, atau area…" />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <SectionTitle
            title={area ? `Kos di ${area}` : 'Kos terverifikasi'}
            subtitle={loading && !data ? 'Mencari kos…' : `${pagination?.totalData ?? 0} kos sesuai pencarianmu`}
          />
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['', 'Semua'],
                ['putra', 'Putra'],
                ['putri', 'Putri'],
                ['campur', 'Campur'],
              ] as const
            ).map(([value, label]) => (
              <Chip key={label} active={tipe === value} onClick={() => setParams({ tipe: value, page: undefined })}>
                {label}
              </Chip>
            ))}
            <button type="button" aria-expanded={showFilter} onClick={() => setShowFilter((s) => !s)} className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm ${showFilter ? 'border-[#7c3aed] bg-[#f5f3ff] text-[#7c3aed]' : 'border-[#e2e8f0] hover:border-violet-300'}`}>
              <Icon name="sliders" size={16} />
              Filter{jumlahFilterLanjut > 0 ? ` (${jumlahFilterLanjut})` : ''}
            </button>
          </div>
        </div>

        {showFilter && (
          <div className="mt-6 grid gap-6 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-5 md:grid-cols-2 xl:grid-cols-4">
            <TextField label="Harga minimum (Rp)" type="number" inputMode="numeric" min={0} step={50000} value={minLocal} onChange={(e) => setMinLocal(e.target.value)} placeholder="0" />
            <TextField label="Harga maksimum (Rp)" type="number" inputMode="numeric" min={0} step={50000} value={maxLocal} onChange={(e) => setMaxLocal(e.target.value)} placeholder="Tanpa batas" />
            <SelectField label="Urutkan" value={sort} onChange={(e) => setParams({ sort: e.target.value, page: undefined })}>
              <option value="">Terbaru</option>
              <option value="harga_asc">Harga terendah</option>
              <option value="harga_desc">Harga tertinggi</option>
              <option value="kamar_banyak">Kamar tersedia terbanyak</option>
            </SelectField>
            <div>
              <span className="body-medium mb-2 block text-sm">Ketersediaan</span>
              <label className="flex h-12 cursor-pointer items-center gap-3 rounded-lg border border-[#e2e8f0] bg-white px-4 text-sm">
                <input type="checkbox" className="size-4 accent-[#7c3aed]" checked={tersedia} onChange={(e) => setParams({ kamar_tersedia: e.target.checked ? 'true' : '', page: undefined })} />
                Hanya yang masih ada kamar
              </label>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <span className="body-medium mb-3 block text-sm">Fasilitas</span>
              <div className="flex flex-wrap gap-2">
                {FASILITAS_UMUM.map((f) => (
                  <Chip key={f} active={fasilitas.includes(f)} onClick={() => toggleFasilitas(f)}>
                    {f}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {adaFilter && (
          <div className="mt-4">
            <Button variant="ghost" small onClick={resetSemua}>
              Hapus semua filter
            </Button>
          </div>
        )}

        <div className="mt-10">
          {loading && !data ? (
            <LoadingBlock label="Mencari kos…" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : list.length === 0 ? (
            <EmptyState title="Belum ada kos yang cocok" text="Coba ubah kata kunci, longgarkan rentang harga, atau kurangi filter fasilitas." action={adaFilter ? <Button onClick={resetSemua}>Hapus semua filter</Button> : undefined} />
          ) : (
            <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-4 ${loading ? 'opacity-60 transition' : ''}`}>
              {list.map((kos) => (
                <PropertyCard key={kos._id} kos={kos} />
              ))}
            </div>
          )}
        </div>

        {pagination && (
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onChange={(p) => {
              setParams({ page: p === 1 ? undefined : p }, { replace: false })
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </main>
    </PublicLayout>
  )
}
