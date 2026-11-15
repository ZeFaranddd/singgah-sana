import { api } from '@/lib/api'
import { waktuRelatif } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Badge, Card, ErrorState, LinkButton, LoadingBlock, Metric, SectionTitle } from '@/components/ui'

export function AdminRingkasan() {
  useDocumentTitle('Ringkasan admin')
  const stats = useAsync(() => api.admin.stats(), [])
  const aktivitas = useAsync(() => api.admin.aktivitas({ limit: 4 }), [])

  if (stats.loading) return <LoadingBlock />
  if (stats.error || !stats.data) return <ErrorState message={stats.error ?? 'Statistik tidak tersedia'} onRetry={stats.reload} />

  const { kos, users, laporan } = stats.data.data
  const belumSelesai = laporan.terbuka + laporan.diproses

  return (
    <div className="space-y-6">
      <SectionTitle title="Ringkasan admin" subtitle="Pantau antrean peninjauan dan hal yang membutuhkan perhatian." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Menunggu tinjauan" value={kos.pending} helper="Listing baru atau perubahan" />
        <Metric label="Laporan terbuka" value={belumSelesai} helper={`${laporan.terbuka} baru, ${laporan.diproses} diproses`} />
        <Metric label="Kos terbit" value={kos.approved} helper={`${kos.totalKamarTersedia} kamar tersedia`} />
        <Metric label="Pengguna" value={users.totalUsers} helper={`${users.pencari} pencari, ${users.pemilik} pemilik`} />
      </div>
      <Card>
        <Badge tone={kos.pending ? 'amber' : 'gray'}>{kos.pending} pengajuan</Badge>
        <h3 className="body-medium mt-6">Tinjau informasi kos sebelum diterbitkan</h3>
        <p className="my-6 text-sm text-[#64748b]">Periksa alamat, foto, harga, ketersediaan, fasilitas, dan aturan.</p>
        <LinkButton variant="primary" to="/admin/peninjauan">Buka antrean</LinkButton>
        <hr className="my-6 border-[#e2e8f0]" />
        <h3 className="body-medium">{belumSelesai} laporan belum selesai</h3>
        <p className="my-6 text-sm text-[#64748b]">Periksa laporan pengguna dan bukti sebelum mengambil tindakan.</p>
        <LinkButton to="/admin/laporan">Lihat laporan</LinkButton>
      </Card>
      <Card>
        <h3 className="font-heading text-xl">Aktivitas terbaru</h3>
        {aktivitas.loading ? (
          <LoadingBlock />
        ) : (
          <ul className="mt-4 space-y-4">
            {(aktivitas.data?.data ?? []).map((a) => (
              <li key={a._id}>
                <p className="body-medium">{a.ringkasan}</p>
                <p className="mt-1 text-sm text-[#64748b]">{a.aktor_nama} · {waktuRelatif(a.createdAt)}</p>
              </li>
            ))}
            {(aktivitas.data?.data ?? []).length === 0 && <li className="text-sm text-[#64748b]">Belum ada aktivitas.</li>}
          </ul>
        )}
        <div className="mt-6"><LinkButton to="/admin/aktivitas">Semua aktivitas</LinkButton></div>
      </Card>
    </div>
  )
}
