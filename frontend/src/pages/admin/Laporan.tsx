import { useState } from 'react'
import { api } from '@/lib/api'
import { alasanLabel, waktuRelatif } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Link } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Badge, Button, EmptyState, ErrorState, LoadingBlock, Modal, Notice, Pagination, SectionTitle, StatusLaporanBadge, Tabs, TextArea } from '@/components/ui'
import type { Kos, Laporan, StatusLaporan } from '@/lib/types'
import { VerifikasiModal } from './VerifikasiModal'

type Tindakan = Exclude<StatusLaporan, 'terbuka'>
const judulTindakan: Record<Tindakan, string> = { diproses: 'Tandai sedang diproses', selesai: 'Tandai selesai', ditolak: 'Tolak laporan' }

export function AdminLaporan() {
  useDocumentTitle('Laporan')
  const toast = useToast()
  const [filter, setFilter] = useState<'' | StatusLaporan>('terbuka')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => api.admin.laporan({ status: filter || undefined, page, limit: 10 }), [filter, page])
  const [tindakan, setTindakan] = useState<{ laporan: Laporan; status: Tindakan } | null>(null)
  const [turunkan, setTurunkan] = useState<Kos | null>(null)
  const [catatan, setCatatan] = useState('')
  const [error2, setError2] = useState('')
  const [loading2, setLoading2] = useState(false)
  const list = data?.data ?? []

  const kirim = async () => {
    if (!tindakan) return
    if (tindakan.status !== 'diproses' && catatan.trim().length < 3) return setError2('Beri catatan singkat untuk pelapor.')
    setLoading2(true)
    setError2('')
    try {
      await api.admin.handleLaporan(tindakan.laporan._id, tindakan.status, catatan.trim() || undefined)
      toast.success('Laporan diperbarui dan pelapor diberi tahu.')
      setTindakan(null)
      setCatatan('')
      reload()
    } catch (err) {
      setError2(err instanceof Error ? err.message : 'Gagal memperbarui laporan')
    } finally {
      setLoading2(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Laporan" subtitle="Periksa laporan pengguna dan bukti sebelum mengambil tindakan." />
      <Tabs
        value={filter}
        onChange={(v) => { setFilter(v); setPage(1) }}
        items={[
          { value: 'terbuka', label: 'Terbuka' },
          { value: 'diproses', label: 'Diproses' },
          { value: 'selesai', label: 'Selesai' },
          { value: 'ditolak', label: 'Ditolak' },
          { value: '', label: 'Semua' },
        ]}
      />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState title="Tidak ada laporan" text="Laporan dari pencari kos akan muncul di sini." />
      ) : (
        <ul className="space-y-4">
          {list.map((l) => {
            const kosAda = l.kos_id
            return (
              <li key={l._id} className="rounded-3xl border border-[#e2e8f0] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {kosAda ? <Link to={`/kos/${kosAda._id}`} className="font-heading text-lg hover:text-[#7c3aed]">{l.kos_nama}</Link> : <span className="font-heading text-lg">{l.kos_nama}</span>}
                    <Badge tone="gray">{alasanLabel[l.alasan] ?? l.alasan}</Badge>
                  </div>
                  <StatusLaporanBadge status={l.status} />
                </div>
                <p className="mt-1 text-xs text-[#64748b]">Oleh {l.pelapor_id?.nama ?? 'pengguna terhapus'} · {waktuRelatif(l.createdAt)}</p>
                <p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm">{l.deskripsi}</p>
                {!kosAda && <div className="mt-3"><Notice tone="gray">Kos ini sudah dihapus dari sistem.</Notice></div>}
                {l.catatan_admin && <p className="mt-3 text-sm text-[#64748b]">Catatan admin{l.ditangani_oleh ? ` (${l.ditangani_oleh.nama})` : ''}: {l.catatan_admin}</p>}
                {(l.status === 'terbuka' || l.status === 'diproses') && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {l.status === 'terbuka' && <Button small onClick={() => { setCatatan(''); setError2(''); setTindakan({ laporan: l, status: 'diproses' }) }}>Proses</Button>}
                    <Button primary small onClick={() => { setCatatan(''); setError2(''); setTindakan({ laporan: l, status: 'selesai' }) }}>Selesai</Button>
                    <Button small onClick={() => { setCatatan(''); setError2(''); setTindakan({ laporan: l, status: 'ditolak' }) }}>Tolak laporan</Button>
                    {kosAda && kosAda.status_verifikasi === 'approved' && (
                      <Button small variant="danger" onClick={() => setTurunkan({ _id: kosAda._id, nama: l.kos_nama } as Kos)}>Turunkan kos</Button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {data?.pagination && <Pagination page={data.pagination.currentPage} totalPages={data.pagination.totalPages} onChange={setPage} />}

      <Modal
        open={Boolean(tindakan)}
        onClose={() => setTindakan(null)}
        title={tindakan ? judulTindakan[tindakan.status] : ''}
        footer={<><Button onClick={() => setTindakan(null)} disabled={loading2}>Batal</Button><Button primary loading={loading2} onClick={kirim}>Simpan</Button></>}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#475569]">{tindakan?.laporan.kos_nama}</p>
          <TextArea label="Catatan untuk pelapor" value={catatan} onChange={(e) => setCatatan(e.target.value)} maxLength={500} />
          {error2 && <Notice tone="red">{error2}</Notice>}
        </div>
      </Modal>
      <VerifikasiModal kos={turunkan} status="rejected" onClose={() => setTurunkan(null)} onDone={() => { setTurunkan(null); reload() }} />
    </div>
  )
}
