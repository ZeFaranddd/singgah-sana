import { api } from '@/lib/api'
import { fotoUtama, linkWhatsApp, rupiah, waktuRelatif } from '@/lib/format'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { Link } from '@/lib/router'
import { Badge, EmptyState, ErrorState, Icon, LinkButton, LoadingBlock, SafeImg, SectionTitle } from '@/components/ui'

export function SeekerPesan() {
  useDocumentTitle('Pesan')
  const { data, loading, error, reload } = useAsync(() => api.inquiries.mine(), [])
  const list = data?.data ?? []

  return (
    <div className="space-y-6">
      <SectionTitle title="Pesan" subtitle="Pertanyaan dan permintaan survei yang kamu kirim ke pemilik." />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState title="Belum ada pesan" text="Buka detail kos lalu pilih “Tanya pemilik” atau “Jadwalkan survei”." action={<LinkButton variant="primary" to="/kos">Jelajahi kos</LinkButton>} />
      ) : (
        <ul className="space-y-4">
          {list.map((i) => {
            const wa = linkWhatsApp(i.pemilik_id?.nomor_telepon, `Halo, saya menghubungi terkait ${i.kos_id.nama} di Singgah-sana.`)
            return (
              <li key={i._id} className="rounded-3xl border border-[#e2e8f0] bg-white p-5">
                <div className="flex gap-4">
                  <SafeImg className="hidden size-20 shrink-0 rounded-xl object-cover sm:block" src={fotoUtama(i.kos_id)} alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/kos/${i.kos_id._id}`} className="body-medium hover:text-[#7c3aed]">
                        {i.kos_id.nama}
                      </Link>
                      <Badge tone={i.status === 'dibalas' ? 'green' : 'amber'}>{i.status === 'dibalas' ? 'Sudah dibalas' : 'Menunggu balasan'}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {rupiah(i.kos_id.harga_per_bulan)} / bulan · dikirim {waktuRelatif(i.createdAt)}
                    </p>
                    <p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm">{i.pesan}</p>
                    {i.status === 'dibalas' && (
                      <div className="mt-3 rounded-2xl bg-[#f5f3ff] p-4 text-sm">
                        <p className="label mb-1 text-xs text-[#7c3aed]">Balasan {i.pemilik_id?.nama}</p>
                        {i.balasan}
                      </div>
                    )}
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="label mt-4 inline-flex items-center gap-2 text-sm text-[#7c3aed] hover:underline">
                        <Icon name="phone" size={16} /> Lanjut via WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
