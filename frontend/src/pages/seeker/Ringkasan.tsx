import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/lib/favorites'
import { namaDepan, waktuRelatif } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Link } from '@/lib/router'
import { Card, EmptyState, LinkButton, LoadingBlock, Metric, SectionTitle } from '@/components/ui'
import { PropertyCard } from '@/components/PropertyCard'

export function SeekerRingkasan() {
  useDocumentTitle('Ringkasan akun')
  const { user } = useAuth()
  const { ids } = useFavorites()
  const favorit = useAsync(() => api.favorit.list(), [])
  const pesan = useAsync(() => api.inquiries.mine(), [])
  const notif = useAsync(() => api.notifikasi.count(), [])

  const tersimpan = (favorit.data?.data ?? []).filter((f) => ids.has(f.kos_id._id)).slice(0, 3)
  const inquiries = pesan.data?.data ?? []
  const menunggu = inquiries.filter((i) => i.status === 'menunggu').length
  const balasanTerbaru = inquiries.find((i) => i.status === 'dibalas')
  const pref = user?.preferensi
  const punyaPreferensi = Boolean(pref && (pref.area_kampus || pref.tipe || pref.harga_maks || pref.fasilitas.length))

  return (
    <div className="space-y-6">
      <SectionTitle title={`Halo, ${namaDepan(user?.nama)}.`} subtitle="Lanjutkan pencarian kos yang cocok untukmu." />
      <div className="grid gap-6 sm:grid-cols-3">
        <Metric label="Kos favorit" value={ids.size} helper="Pilihan yang kamu simpan" />
        <Metric label="Pertanyaan terkirim" value={inquiries.length} helper={`${menunggu} menunggu balasan`} />
        <Metric label="Notifikasi baru" value={notif.data?.data.belum_dibaca ?? 0} helper="Aktivitas terbaru akunmu" />
      </div>

      <Card>
        <h3 className="font-heading text-xl">{punyaPreferensi ? 'Preferensimu sudah tersimpan' : 'Atur preferensi pencarian'}</h3>
        <p className="my-6 text-[#64748b]">
          {punyaPreferensi ? 'Rekomendasi di beranda disesuaikan dengan area, tipe, dan anggaran yang kamu pilih.' : 'Simpan area, tipe, dan anggaran agar kami bisa menampilkan rekomendasi kos yang sesuai.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton to="/pencari/preferensi">{punyaPreferensi ? 'Ubah preferensi' : 'Atur preferensi'}</LinkButton>
          <LinkButton to="/pencari/profil">Lengkapi profil</LinkButton>
        </div>
      </Card>

      <SectionTitle title="Pilihan tersimpan" subtitle="Kos yang bisa kamu lihat kembali." />
      {favorit.loading ? (
        <LoadingBlock />
      ) : tersimpan.length === 0 ? (
        <EmptyState title="Belum ada favorit" text="Tekan ikon hati pada kos yang kamu suka untuk menyimpannya di sini." action={<LinkButton variant="primary" to="/kos">Jelajahi kos</LinkButton>} />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {tersimpan.map((f) => (
              <PropertyCard key={f._id} kos={f.kos_id} />
            ))}
          </div>
          <Link to="/pencari/favorit" className="label text-sm text-[#7c3aed] hover:underline">
            Lihat semua favorit
          </Link>
        </>
      )}

      {balasanTerbaru && (
        <Card>
          <h3 className="font-heading text-xl">Balasan dari {balasanTerbaru.pemilik_id?.nama ?? 'pemilik'}</h3>
          <p className="mt-4 text-xs text-[#64748b]">
            {balasanTerbaru.kos_id.nama} · {waktuRelatif(balasanTerbaru.updatedAt)}
          </p>
          <p className="my-6">{balasanTerbaru.balasan}</p>
          <LinkButton variant="primary" to="/pencari/pesan">Buka pesan</LinkButton>
        </Card>
      )}
    </div>
  )
}
