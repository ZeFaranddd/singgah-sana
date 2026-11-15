"use client";

import { useEffect } from "react";
import { AccountLayout } from "../../components/layout/AccountLayout";
import { ButtonLink } from "../../components/ui/Button";
import { Card, PageHeading } from "../../components/ui/Display";
import { ErrorState, Skeleton } from "../../components/ui/Feedback";
import { Link } from "../../components/ui/Link";
import { formatTime } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import { KosCard } from "../kos/KosCard";
import { useSummary } from "./SummaryContext";

export default function SummaryPage() {
  const { user } = useAuth();
  const s = useSummary()!;
  const first = user?.nama.split(" ")[0] ?? "";

  return (
    <AccountLayout>
      <PageHeading title={`Halo, ${first}.`} description="Lanjutkan pencarian kos yang cocok untukmu." />
      {s.status === "loading" && !s.data && <div aria-busy="true"><Skeleton lines={3} /><Skeleton lines={3} /></div>}
      {s.status === "error" && <ErrorState error={s.error} onRetry={s.reload} title="Ringkasan belum dapat dimuat" />}
      {s.data && (
        <>
          <ul className="stats" aria-label="Ringkasan aktivitas">
            {[
              ["Kos favorit", s.data.jumlahFavorit, "Pilihan yang kamu simpan"],
              ["Pesan belum dibaca", s.data.pesanBelumDibaca, "Balasan baru dari pemilik"],
              ["Notifikasi baru", s.data.notifikasiBaru, "Aktivitas terbaru akunmu"],
            ].map(([label, n, sub]) => (
              <li key={label as string}>
                <Card as="div">
                  <p className="muted">{label}</p>
                  <strong className="stat-num">{n}</strong>
                  <small className="muted">{sub}</small>
                </Card>
              </li>
            ))}
          </ul>

          {!user?.telepon && (
            <Card className="action-card">
              <h2 className="h3">Lengkapi profilmu</h2>
              <p className="muted">Tambahkan nomor kontak agar komunikasi dengan pemilik lebih mudah.</p>
              <ButtonLink to="/akun/profil" variant="secondary">Lengkapi profil</ButtonLink>
            </Card>
          )}
          {user && user.emailTerverifikasi ? (
            <Card className="action-card">
              <h2 className="h3">Semua siap untuk mulai mencari</h2>
              <p className="muted">Emailmu sudah diverifikasi. Lengkapi profil agar komunikasi dengan pemilik lebih mudah.</p>
              <ButtonLink to="/akun/profil" variant="secondary">Lengkapi profil</ButtonLink>
            </Card>
          ) : (
            <Card className="action-card">
              <h2 className="h3">Verifikasi emailmu</h2>
              <p className="muted">Beberapa fitur aktif setelah email diverifikasi.</p>
              <ButtonLink to="/verifikasi-email" variant="secondary">Verifikasi sekarang</ButtonLink>
            </Card>
          )}

          <section aria-labelledby="fav-title" className="stack">
            <PageHeading id="fav-title" title="Pilihan tersimpan" description="Kos yang bisa kamu lihat kembali." level={2} />
            {s.data.favoritTerbaru.length === 0 ? (
              <p className="muted">Belum ada kos tersimpan. Ketuk ikon hati pada kos yang kamu suka.</p>
            ) : (
              <ul className="properties">
                {s.data.favoritTerbaru.map((f) => (
                  <li key={f.id}><KosCard kos={f.kos} /></li>
                ))}
              </ul>
            )}
            <Link to="/favorit" className="link">Lihat semua favorit</Link>
          </section>

          {s.data.balasanTerbaru && (
            <Card className="action-card">
              <h2 className="h3">Balasan dari {s.data.balasanTerbaru.dari}</h2>
              <small className="muted">{s.data.balasanTerbaru.kos} · {formatTime(s.data.balasanTerbaru.waktu)}</small>
              <p>{s.data.balasanTerbaru.cuplikan}</p>
              <ButtonLink to={`/pesan?c=${s.data.balasanTerbaru.percakapanId}`}>Buka pesan</ButtonLink>
            </Card>
          )}
        </>
      )}
    </AccountLayout>
  );
}
