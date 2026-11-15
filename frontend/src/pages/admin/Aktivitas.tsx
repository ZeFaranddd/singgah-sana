import { useState } from 'react'
import { api } from '@/lib/api'
import { tanggalWaktu, waktuRelatif } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Badge, EmptyState, ErrorState, LoadingBlock, Pagination, SectionTitle, SelectField } from '@/components/ui'

const AKSI: Record<string, string> = {
  kos_diajukan: 'Kos diajukan',
  kos_diajukan_ulang: 'Kos diajukan ulang',
  kos_disetujui: 'Kos disetujui',
  kos_ditolak: 'Kos ditolak',
  kos_dihapus: 'Kos dihapus',
  laporan_dibuat: 'Laporan dibuat',
  laporan_diproses: 'Laporan diproses',
  laporan_selesai: 'Laporan selesai',
  laporan_ditolak: 'Laporan ditolak',
  user_terdaftar: 'Pengguna mendaftar',
}

export function AdminAktivitas() {
  useDocumentTitle('Aktivitas')
  const [aksi, setAksi] = useState('')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => api.admin.aktivitas({ aksi: aksi || undefined, page, limit: 20 }), [aksi, page])
  const list = data?.data ?? []

  return (
    <div className="space-y-6">
      <SectionTitle title="Aktivitas" subtitle="Riwayat tindakan penting di portal." />
      <div className="max-w-xs">
        <SelectField aria-label="Jenis aktivitas" value={aksi} onChange={(e) => { setAksi(e.target.value); setPage(1) }}>
          <option value="">Semua aktivitas</option>
          {Object.entries(AKSI).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
      </div>
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState title="Belum ada aktivitas" />
      ) : (
        <ul className="divide-y divide-[#e2e8f0] rounded-3xl border border-[#e2e8f0] bg-white">
          {list.map((a) => (
            <li key={a._id} className="flex flex-wrap items-start justify-between gap-3 p-5">
              <div>
                <p className="body-medium">{a.ringkasan}</p>
                <p className="mt-1 text-sm text-[#64748b]">{a.aktor_nama} ({a.aktor_role}) · <span title={tanggalWaktu(a.createdAt)}>{waktuRelatif(a.createdAt)}</span></p>
              </div>
              <Badge tone="gray">{AKSI[a.aksi] ?? a.aksi}</Badge>
            </li>
          ))}
        </ul>
      )}
      {data?.pagination && <Pagination page={data.pagination.currentPage} totalPages={data.pagination.totalPages} onChange={setPage} />}
    </div>
  )
}
