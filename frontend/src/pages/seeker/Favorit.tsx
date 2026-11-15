import { api } from '@/lib/api'
import { useFavorites } from '@/lib/favorites'
import { useAsync, useDocumentTitle } from '@/lib/hooks'
import { EmptyState, ErrorState, LinkButton, LoadingBlock, SectionTitle } from '@/components/ui'
import { PropertyCard } from '@/components/PropertyCard'

export function SeekerFavorit() {
  useDocumentTitle('Favorit')
  const { ids } = useFavorites()
  const { data, loading, error, reload } = useAsync(() => api.favorit.list(), [])
  // Ikuti perubahan ikon hati secara langsung tanpa memuat ulang
  const list = (data?.data ?? []).filter((f) => ids.has(f.kos_id._id))

  return (
    <div className="space-y-6">
      <SectionTitle title="Kos favorit" subtitle="Kos yang kamu simpan untuk dibandingkan nanti." />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState title="Belum ada favorit" text="Tekan ikon hati pada kos yang kamu suka untuk menyimpannya di sini." action={<LinkButton variant="primary" to="/kos">Jelajahi kos</LinkButton>} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((f) => (
            <PropertyCard key={f._id} kos={f.kos_id} />
          ))}
        </div>
      )}
    </div>
  )
}
