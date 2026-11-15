import { useState } from 'react'
import { api } from '@/lib/api'
import { waktuRelatif } from '@/lib/format'
import { emitNotifChanged, useAsync, useDocumentTitle } from '@/lib/hooks'
import { navigate } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Button, EmptyState, ErrorState, Icon, LoadingBlock, Pagination, SectionTitle, Tabs } from '@/components/ui'
import type { Notifikasi } from '@/lib/types'

const ikon: Record<string, string> = {
  pesan_baru: 'message',
  balasan_pesan: 'message',
  kos_menunggu: 'clock',
  kos_disetujui: 'shield',
  kos_ditolak: 'shield',
  laporan_baru: 'flag',
  laporan_ditangani: 'flag',
  info: 'bell',
}

export function NotifikasiPage() {
  useDocumentTitle('Notifikasi')
  const toast = useToast()
  const [filter, setFilter] = useState<'semua' | 'belum_dibaca'>('semua')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(
    () => api.notifikasi.list({ status: filter === 'belum_dibaca' ? 'belum_dibaca' : undefined, page, limit: 15 }),
    [filter, page],
  )
  const list: Notifikasi[] = data?.data ?? []

  const buka = async (n: Notifikasi) => {
    if (!n.dibaca) {
      try {
        await api.notifikasi.read(n._id)
        emitNotifChanged()
      } catch {
        /* gagal menandai dibaca tidak menghalangi navigasi */
      }
    }
    if (n.tautan) navigate(n.tautan)
    else reload()
  }

  const bacaSemua = async () => {
    try {
      await api.notifikasi.readAll()
      emitNotifChanged()
      toast.success('Semua notifikasi ditandai sudah dibaca.')
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui notifikasi')
    }
  }

  const hapus = async (n: Notifikasi) => {
    try {
      await api.notifikasi.remove(n._id)
      emitNotifChanged()
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus notifikasi')
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Notifikasi"
        subtitle={data?.belum_dibaca ? `${data.belum_dibaca} belum dibaca` : 'Aktivitas terbaru akunmu.'}
        action={
          <Button small onClick={bacaSemua} disabled={!data?.belum_dibaca}>
            <Icon name="check" size={16} /> Tandai semua dibaca
          </Button>
        }
      />
      <Tabs
        value={filter}
        onChange={(v) => {
          setFilter(v)
          setPage(1)
        }}
        items={[
          { value: 'semua', label: 'Semua' },
          { value: 'belum_dibaca', label: 'Belum dibaca', count: data?.belum_dibaca },
        ]}
      />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState title={filter === 'belum_dibaca' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'} text="Pemberitahuan tentang pesan, verifikasi, dan laporan akan muncul di sini." />
      ) : (
        <ul className="space-y-3">
          {list.map((n) => (
            <li key={n._id} className={`flex items-start gap-4 rounded-2xl border p-4 ${n.dibaca ? 'border-[#e2e8f0] bg-white' : 'border-violet-200 bg-[#f5f3ff]'}`}>
              <button type="button" onClick={() => void buka(n)} className="flex min-w-0 flex-1 items-start gap-4 text-left">
                <span className="mt-0.5"><Icon name={ikon[n.tipe] ?? 'bell'} /></span>
                <span className="min-w-0 flex-1">
                  <span className={`block ${n.dibaca ? 'body-medium' : 'label'}`}>{n.judul}</span>
                  {n.isi && <span className="mt-1 block text-sm text-[#64748b]">{n.isi}</span>}
                  <span className="mt-2 block text-xs text-[#64748b]">{waktuRelatif(n.createdAt)}</span>
                </span>
                {!n.dibaca && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-[#7c3aed]" aria-label="Belum dibaca" />}
              </button>
              <button type="button" onClick={() => void hapus(n)} aria-label="Hapus notifikasi" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#64748b] hover:bg-white hover:text-[#b91c1c]">
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {data?.pagination && <Pagination page={data.pagination.currentPage} totalPages={data.pagination.totalPages} onChange={setPage} />}
    </div>
  )
}
