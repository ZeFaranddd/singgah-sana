import { useState } from 'react'
import { api } from '@/lib/api'
import { pemilikOf, rupiah, tanggal, tipeLabel } from '@/lib/format'
import { useAsync, useDebounced, useDocumentTitle } from '@/lib/hooks'
import { Link } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Button, ConfirmDialog, EmptyState, ErrorState, Icon, LoadingBlock, Pagination, SectionTitle, SelectField, StatusKosBadge, TextField } from '@/components/ui'
import type { Kos } from '@/lib/types'
import { VerifikasiModal } from './VerifikasiModal'

export function AdminSemuaKos() {
  useDocumentTitle('Semua kos')
  const toast = useToast()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const qd = useDebounced(q)
  const { data, loading, error, reload } = useAsync(() => api.admin.kos({ q: qd || undefined, status: status || undefined, page, limit: 15 }), [qd, status, page])
  const [aksi, setAksi] = useState<{ kos: Kos; status: 'approved' | 'rejected' } | null>(null)
  const [hapus, setHapus] = useState<Kos | null>(null)
  const [menghapus, setMenghapus] = useState(false)
  const [ekspor, setEkspor] = useState(false)
  const list = data?.data ?? []

  const unduh = async () => {
    setEkspor(true)
    try {
      const blob = await api.admin.exportKos()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rekap_kos_singgah_sana.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Rekap CSV diunduh.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengekspor')
    } finally {
      setEkspor(false)
    }
  }

  const konfirmasiHapus = async () => {
    if (!hapus) return
    setMenghapus(true)
    try {
      await api.kos.remove(hapus._id)
      toast.success('Kos dihapus.')
      setHapus(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus kos')
    } finally {
      setMenghapus(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Semua kos" subtitle="Seluruh listing di portal, apa pun statusnya." action={<Button small loading={ekspor} onClick={unduh}><Icon name="download" size={16} /> Ekspor CSV</Button>} />
      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <TextField aria-label="Cari kos" placeholder="Cari nama, alamat, atau area…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <SelectField aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Semua status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Terbit</option>
          <option value="rejected">Ditolak</option>
        </SelectField>
      </div>
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState title="Tidak ada kos" text="Ubah kata kunci atau filter status." />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#e2e8f0] bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#64748b]">
              <tr>
                {['Kos', 'Pemilik', 'Harga', 'Kamar', 'Status', 'Aksi'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {list.map((k) => (
                <tr key={k._id}>
                  <td className="px-4 py-3">
                    <Link to={`/kos/${k._id}`} className="body-medium hover:text-[#7c3aed]">{k.nama}</Link>
                    <p className="text-xs text-[#64748b]">{tipeLabel(k.tipe)} · {k.area_kampus} · {tanggal(k.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">{pemilikOf(k)?.nama ?? '-'}</td>
                  <td className="px-4 py-3">{rupiah(k.harga_per_bulan)}</td>
                  <td className="px-4 py-3">{k.jumlah_kamar_tersedia}/{k.jumlah_kamar_total}</td>
                  <td className="px-4 py-3"><StatusKosBadge status={k.status_verifikasi} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {k.status_verifikasi !== 'approved' && <Button small onClick={() => setAksi({ kos: k, status: 'approved' })}>Setujui</Button>}
                      {k.status_verifikasi !== 'rejected' && <Button small onClick={() => setAksi({ kos: k, status: 'rejected' })}>{k.status_verifikasi === 'approved' ? 'Turunkan' : 'Tolak'}</Button>}
                      <Button small variant="ghost" aria-label={`Hapus ${k.nama}`} className="text-[#b91c1c] hover:bg-red-50" onClick={() => setHapus(k)}><Icon name="trash" size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data?.pagination && <Pagination page={data.pagination.currentPage} totalPages={data.pagination.totalPages} onChange={setPage} />}
      <VerifikasiModal kos={aksi?.kos ?? null} status={aksi?.status ?? 'approved'} onClose={() => setAksi(null)} onDone={() => { setAksi(null); reload() }} />
      <ConfirmDialog open={Boolean(hapus)} danger loading={menghapus} title="Hapus kos ini?" confirmLabel="Hapus kos" message={<>“{hapus?.nama}” akan dihapus permanen beserta favorit dan pesan terkait.</>} onConfirm={() => void konfirmasiHapus()} onClose={() => setHapus(null)} />
    </div>
  )
}
