import { useState } from 'react'
import { api } from '@/lib/api'
import { fotoUtama, rupiah, tanggal, tipeLabel } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Link } from '@/lib/router'
import { useToast } from '@/lib/toast'
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Icon, LinkButton, LoadingBlock, Notice, SafeImg, SectionTitle, StatusKosBadge, Tabs } from '@/components/ui'
import type { Kos, StatusVerifikasi } from '@/lib/types'

function KuotaKamar({ kos, onChange }: { kos: Kos; onChange: (k: Kos) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const ubah = async (delta: number) => {
    const baru = kos.jumlah_kamar_tersedia + delta
    if (baru < 0 || baru > kos.jumlah_kamar_total) return
    setBusy(true)
    try {
      const res = await api.kos.update(kos._id, { jumlah_kamar_tersedia: baru })
      onChange({ ...kos, ...res.data, pemilik_id: kos.pemilik_id })
      toast.success(`Kamar tersedia: ${baru}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui kamar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Kurangi kamar tersedia" disabled={busy || kos.jumlah_kamar_tersedia <= 0} onClick={() => void ubah(-1)} className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] hover:bg-violet-50 disabled:opacity-40">
        <Icon name="minus" size={16} />
      </button>
      <span className="min-w-24 text-center text-sm" aria-live="polite">
        <strong className="font-bold-face text-lg">{kos.jumlah_kamar_tersedia}</strong> / {kos.jumlah_kamar_total} kamar
      </span>
      <button type="button" aria-label="Tambah kamar tersedia" disabled={busy || kos.jumlah_kamar_tersedia >= kos.jumlah_kamar_total} onClick={() => void ubah(1)} className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] hover:bg-violet-50 disabled:opacity-40">
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

export function OwnerKosSaya() {
  useDocumentTitle('Kos saya')
  const toast = useToast()
  const { data, loading, error, reload, setData } = useAsync(() => api.kos.mine(), [])
  const [filter, setFilter] = useState<'semua' | StatusVerifikasi>('semua')
  const [hapus, setHapus] = useState<Kos | null>(null)
  const [menghapus, setMenghapus] = useState(false)

  const semua = data?.data ?? []
  const tampil = filter === 'semua' ? semua : semua.filter((k) => k.status_verifikasi === filter)
  const hitung = (s: StatusVerifikasi) => semua.filter((k) => k.status_verifikasi === s).length

  const perbarui = (kos: Kos) => setData((prev) => (prev ? { ...prev, data: prev.data.map((k) => (k._id === kos._id ? kos : k)) } : prev))

  const konfirmasiHapus = async () => {
    if (!hapus) return
    setMenghapus(true)
    try {
      await api.kos.remove(hapus._id)
      toast.success(`${hapus.nama} dihapus.`)
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
      <SectionTitle title="Kos saya" subtitle="Kelola data dan ketersediaan kamar." action={<LinkButton variant="primary" to="/pemilik/kos/baru">+ Tambah kos</LinkButton>} />
      <Tabs
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'semua', label: 'Semua', count: semua.length },
          { value: 'approved', label: 'Terbit', count: hitung('approved') },
          { value: 'pending', label: 'Menunggu', count: hitung('pending') },
          { value: 'rejected', label: 'Perlu revisi', count: hitung('rejected') },
        ]}
      />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : tampil.length === 0 ? (
        <EmptyState title="Belum ada kos di sini" text="Tambahkan kos baru atau pilih filter lain." action={<LinkButton variant="primary" to="/pemilik/kos/baru">Tambah kos</LinkButton>} />
      ) : (
        <ul className="space-y-4">
          {tampil.map((k) => (
            <li key={k._id} className="rounded-3xl border border-[#e2e8f0] bg-white p-5">
              <div className="flex flex-col gap-5 md:flex-row">
                <SafeImg className="h-40 w-full shrink-0 rounded-2xl object-cover md:w-56" src={fotoUtama(k)} alt={k.nama} />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-heading text-lg">{k.nama}</h3>
                    <StatusKosBadge status={k.status_verifikasi} />
                    <Badge tone="gray">{tipeLabel(k.tipe)}</Badge>
                  </div>
                  <p className="text-sm text-[#64748b]">{k.alamat}</p>
                  <p className="text-sm"><strong className="font-bold-face">{rupiah(k.harga_per_bulan)}</strong> / bulan · diperbarui {tanggal(k.updatedAt)}</p>
                  {k.status_verifikasi === 'rejected' && <Notice tone="red">{k.catatan_verifikasi || 'Kos ditolak admin.'}</Notice>}
                  {k.status_verifikasi === 'pending' && <Notice tone="amber">Sedang menunggu peninjauan admin.</Notice>}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <KuotaKamar kos={k} onChange={perbarui} />
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/kos/${k._id}`} className="inline-flex h-10 items-center rounded-lg border border-[#e2e8f0] px-4 text-sm hover:border-violet-300 hover:bg-violet-50">Lihat</Link>
                      <Link to={`/pemilik/kos/${k._id}/ubah`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] px-4 text-sm hover:border-violet-300 hover:bg-violet-50"><Icon name="edit" size={16} /> Ubah</Link>
                      <Button small variant="ghost" className="text-[#b91c1c] hover:bg-red-50" onClick={() => setHapus(k)}><Icon name="trash" size={16} /> Hapus</Button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(hapus)}
        danger
        loading={menghapus}
        title="Hapus kos ini?"
        confirmLabel="Hapus kos"
        message={<>“{hapus?.nama}” akan dihapus permanen beserta favorit dan pesan yang terkait. Tindakan ini tidak dapat dibatalkan.</>}
        onConfirm={() => void konfirmasiHapus()}
        onClose={() => setHapus(null)}
      />
    </div>
  )
}
