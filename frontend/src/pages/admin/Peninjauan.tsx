import { useState } from 'react'
import { api } from '@/lib/api'
import { fotoUtama, pemilikOf, rupiah, tanggal, tipeLabel } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Link } from '@/lib/router'
import { Badge, Button, EmptyState, ErrorState, LoadingBlock, Pagination, SafeImg, SectionTitle } from '@/components/ui'
import type { Kos } from '@/lib/types'
import { VerifikasiModal } from './VerifikasiModal'

export function AdminPeninjauan() {
  useDocumentTitle('Peninjauan')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => api.admin.kos({ status: 'pending', page, limit: 10 }), [page])
  const [aksi, setAksi] = useState<{ kos: Kos; status: 'approved' | 'rejected' } | null>(null)
  const list = data?.data ?? []

  return (
    <div className="space-y-6">
      <SectionTitle title="Peninjauan" subtitle={`${data?.pagination?.totalData ?? 0} pengajuan menunggu. Periksa alamat, foto, harga, ketersediaan, fasilitas, dan aturan.`} />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState title="Antrean kosong" text="Tidak ada kos yang menunggu peninjauan. Kerja bagus!" />
      ) : (
        <ul className="space-y-5">
          {list.map((k) => {
            const pemilik = pemilikOf(k)
            return (
              <li key={k._id} className="rounded-3xl border border-[#e2e8f0] bg-white p-5">
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-72 lg:grid-cols-2">
                    {k.foto.slice(0, 4).map((f, i) => (
                      <SafeImg key={f + i} className={`h-24 w-full rounded-xl object-cover ${i === 0 ? 'col-span-3 h-40 lg:col-span-2' : ''}`} src={f} alt="" fallbackIndex={i} />
                    ))}
                    {k.foto.length === 0 && <SafeImg className="col-span-3 h-40 w-full rounded-xl object-cover lg:col-span-2" src={fotoUtama(k)} alt="" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-heading text-lg">{k.nama}</h3>
                      <Badge tone="amber">Menunggu</Badge>
                      <Badge tone="gray">{tipeLabel(k.tipe)}</Badge>
                    </div>
                    <p className="text-sm text-[#64748b]">{k.alamat} · {k.area_kampus}</p>
                    <p className="text-sm">{k.deskripsi}</p>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs text-[#64748b]">Harga</dt><dd className="body-medium">{rupiah(k.harga_per_bulan)} / bulan</dd></div>
                      <div><dt className="text-xs text-[#64748b]">Kamar</dt><dd className="body-medium">{k.jumlah_kamar_tersedia} tersedia dari {k.jumlah_kamar_total} · {k.luas_kamar}</dd></div>
                      <div><dt className="text-xs text-[#64748b]">Fasilitas</dt><dd className="body-medium">{k.fasilitas.join(', ') || '-'}</dd></div>
                      <div><dt className="text-xs text-[#64748b]">Aturan</dt><dd className="body-medium">{k.peraturan.join('; ') || '-'}</dd></div>
                      <div><dt className="text-xs text-[#64748b]">Pemilik</dt><dd className="body-medium">{pemilik?.nama} · {pemilik?.nomor_telepon}</dd></div>
                      <div><dt className="text-xs text-[#64748b]">Diajukan</dt><dd className="body-medium">{tanggal(k.updatedAt)}</dd></div>
                    </dl>
                    {k.catatan_verifikasi && <p className="rounded-xl bg-[#f8fafc] p-3 text-xs text-[#64748b]">{k.catatan_verifikasi}</p>}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button primary small onClick={() => setAksi({ kos: k, status: 'approved' })}>Setujui</Button>
                      <Button variant="danger" small onClick={() => setAksi({ kos: k, status: 'rejected' })}>Tolak</Button>
                      <Link to={`/kos/${k._id}`} className="inline-flex h-10 items-center rounded-lg border border-[#e2e8f0] px-4 text-sm hover:border-violet-300 hover:bg-violet-50">Lihat halaman kos</Link>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {data?.pagination && <Pagination page={data.pagination.currentPage} totalPages={data.pagination.totalPages} onChange={setPage} />}
      <VerifikasiModal
        kos={aksi?.kos ?? null}
        status={aksi?.status ?? 'approved'}
        onClose={() => setAksi(null)}
        onDone={() => {
          setAksi(null)
          reload()
        }}
      />
    </div>
  )
}
