import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { namaDepan, waktuRelatif } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Badge, Card, EmptyState, ErrorState, LinkButton, LoadingBlock, Metric, SectionTitle } from '@/components/ui'

export function OwnerRingkasan() {
  useDocumentTitle('Ringkasan pemilik')
  const { user } = useAuth()
  const kosRes = useAsync(() => api.kos.mine(), [])
  const pesanRes = useAsync(() => api.inquiries.owner(), [])

  if (kosRes.loading || pesanRes.loading) return <LoadingBlock />
  if (kosRes.error || pesanRes.error) return <ErrorState message={(kosRes.error || pesanRes.error) as string} onRetry={() => { kosRes.reload(); pesanRes.reload() }} />

  const kos = kosRes.data?.data ?? []
  const pesan = pesanRes.data?.data ?? []
  const terbit = kos.filter((k) => k.status_verifikasi === 'approved')
  const menunggu = kos.filter((k) => k.status_verifikasi === 'pending')
  const perluRevisi = kos.filter((k) => k.status_verifikasi === 'rejected')
  const kamarTersedia = terbit.reduce((n, k) => n + k.jumlah_kamar_tersedia, 0)
  const kamarTotal = terbit.reduce((n, k) => n + k.jumlah_kamar_total, 0)
  const belumDibalas = pesan.filter((p) => p.status === 'menunggu')

  return (
    <div className="space-y-6">
      <SectionTitle title="Ringkasan pemilik" subtitle={`Selamat datang, ${namaDepan(user?.nama)}. Pantau kos dan percakapan terbarumu.`} action={<LinkButton variant="primary" to="/pemilik/kos/baru">+ Tambah kos</LinkButton>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Kos terbit" value={terbit.length} helper={menunggu.length ? `${menunggu.length} menunggu tinjauan` : 'Aktif pada pencarian'} />
        <Metric label="Kamar tersedia" value={kamarTersedia} helper={`Dari ${kamarTotal} kamar di ${terbit.length} kos`} />
        <Metric label="Pesan belum dibalas" value={belumDibalas.length} helper="Dari calon penghuni" />
        <Metric label="Perlu perhatian" value={perluRevisi.length} helper={perluRevisi.length ? 'Listing perlu diperbaiki' : 'Tidak ada'} />
      </div>

      {kos.length === 0 && <EmptyState title="Belum ada kos" text="Daftarkan kos pertamamu. Admin akan memeriksa datanya sebelum tayang." action={<LinkButton variant="primary" to="/pemilik/kos/baru">Tambah kos</LinkButton>} />}

      {perluRevisi.map((k) => (
        <Card key={k._id}>
          <Badge tone="red">Listing perlu revisi</Badge>
          <h3 className="body-medium mt-6">{k.nama}</h3>
          <p className="my-6 text-sm text-[#64748b]">{k.catatan_verifikasi || 'Perbarui data kos agar bisa ditinjau kembali.'}</p>
          <LinkButton to={`/pemilik/kos/${k._id}/ubah`}>Perbaiki listing</LinkButton>
        </Card>
      ))}

      {belumDibalas.length > 0 && (
        <Card>
          <h3 className="font-heading text-xl">Pesan yang menunggu balasan</h3>
          <ul className="mt-4 divide-y divide-[#e2e8f0]">
            {belumDibalas.slice(0, 3).map((p) => (
              <li key={p._id} className="py-4">
                <p className="body-medium">{p.pencari_id?.nama} menanyakan ketersediaan</p>
                <p className="mt-1 text-sm text-[#64748b]">{p.kos_id.nama} · {waktuRelatif(p.createdAt)}</p>
              </li>
            ))}
          </ul>
          <LinkButton className="mt-2" to="/pemilik/pesan">Balas pesan</LinkButton>
        </Card>
      )}

      {menunggu.length > 0 && (
        <Card>
          <h3 className="font-heading text-xl">Sedang ditinjau admin</h3>
          <ul className="mt-4 space-y-2 text-sm text-[#64748b]">
            {menunggu.map((k) => (
              <li key={k._id}>{k.nama} · diajukan {waktuRelatif(k.updatedAt)}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
