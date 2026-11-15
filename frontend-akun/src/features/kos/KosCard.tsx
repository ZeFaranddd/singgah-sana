"use client";

import type { ReactNode } from "react";
import { Badge } from "../../components/ui/Display";
import { Icon } from "../../components/ui/Icon";
import { Link } from "../../components/ui/Link";
import { externalPaths } from "../../lib/config";
import { formatRupiah } from "../../lib/format";
import type { KosRingkas } from "../../lib/api/types";

export function availabilityLabel(k: KosRingkas) {
  if (!k.tampilPublik) return "Tidak aktif";
  return k.kamarTersedia > 0 ? `Sisa ${k.kamarTersedia} kamar` : "Kamar penuh";
}

/** Kartu kos tunggal untuk ringkasan, favorit, dan hasil lain. Listing tidak aktif tetap terbaca dan diberi penanda. */
export function KosCard({ kos, onRemove, removing, actions }: { kos: KosRingkas; onRemove?: () => void; removing?: boolean; actions?: ReactNode }) {
  const inactive = !kos.tampilPublik;
  return (
    <article className={`property-card ${inactive ? "inactive-card" : ""}`} aria-labelledby={`kos-${kos.id}`}>
      <div className="property-image">
        {/* Foto datang dari penyedia cloud (host belum disepakati, K10): <img> dulu, next/image setelah remotePatterns ditetapkan. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kos.fotoUrl} alt={`Foto ${kos.nama}`} loading="lazy" width={720} height={536} />
        <Badge className="on-image">{availabilityLabel(kos)}</Badge>
        {onRemove && (
          <button type="button" className="fav-button" onClick={onRemove} disabled={removing} aria-label={`Hapus ${kos.nama} dari favorit`}>
            <Icon name="heart" fill />
          </button>
        )}
      </div>
      <div className="property-info">
        <Badge>{kos.tipe}</Badge>
        <h3 id={`kos-${kos.id}`}>
          <Link to={externalPaths.kosDetail(kos.id)} external>{kos.nama}</Link>
        </h3>
        <p className="muted">{kos.lokasi}</p>
        <p className="muted small">{kos.fasilitas.join(" · ")}</p>
        {kos.terverifikasi && (
          <p className="verified"><Icon name="shield-check" size={16} /> Diverifikasi admin</p>
        )}
        <p className="price"><strong>{formatRupiah(kos.hargaBulanan)}</strong> <span className="muted small">/ bulan</span></p>
        {actions && <div className="card-actions">{actions}</div>}
      </div>
    </article>
  );
}
