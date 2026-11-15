import { Link } from '@/lib/router'
import { useFavorites } from '@/lib/favorites'
import { fotoUtama, rupiah, tipeLabel } from '@/lib/format'
import type { Kos } from '@/lib/types'
import { Badge, Icon, SafeImg } from './ui'

export function PropertyCard({ kos }: { kos: Kos }) {
  const { isSaved, toggle } = useFavorites()
  const saved = isSaved(kos._id)
  const penuh = kos.jumlah_kamar_tersedia <= 0
  const fasilitas = kos.fasilitas.slice(0, 3).join(' · ')

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/kos/${kos._id}`} className="relative block h-[214px] overflow-hidden" aria-label={`Lihat detail ${kos.nama}`}>
        <SafeImg className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" src={fotoUtama(kos)} alt={kos.nama} />
        <div className="absolute left-3 top-3">
          <Badge tone={penuh ? 'gray' : 'purple'}>{penuh ? 'Kamar penuh' : `Sisa ${kos.jumlah_kamar_tersedia} kamar`}</Badge>
        </div>
      </Link>
      <button
        type="button"
        aria-label={saved ? 'Hapus dari favorit' : 'Simpan ke favorit'}
        aria-pressed={saved}
        className={`absolute right-3 top-3 flex size-10 items-center justify-center rounded-full shadow-sm transition ${saved ? 'bg-violet-100' : 'bg-white hover:bg-violet-50'}`}
        onClick={() => void toggle(kos._id)}
      >
        <Icon name="heart" size={20} filled={saved} />
      </button>
      <Link to={`/kos/${kos._id}`} className="block p-4">
        <Badge>{tipeLabel(kos.tipe)}</Badge>
        <h3 className="font-heading-regular mt-2 text-base leading-6 text-[#0f172a]">{kos.nama}</h3>
        <p className="mt-1 text-sm leading-[22px] text-[#64748b]">{kos.area_kampus}</p>
        {fasilitas && <p className="mt-2 text-xs text-[#64748b]">{fasilitas}</p>}
        <p className="mt-2 flex items-center gap-2 text-xs text-[#166534]">
          <Icon name="shield" size={16} /> Diverifikasi admin
        </p>
        <p className="mt-2">
          <strong className="font-bold-face text-xl">{rupiah(kos.harga_per_bulan)}</strong>
          <span className="ml-2 text-xs text-[#64748b]">/ bulan</span>
        </p>
      </Link>
    </article>
  )
}
