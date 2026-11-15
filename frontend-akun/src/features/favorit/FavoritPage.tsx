"use client";

import { useEffect, useState } from "react";
import { MemberShell } from "../../components/layout/Shells";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Chip, PageHeading } from "../../components/ui/Display";
import { Alert, EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback";
import { Select } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../lib/api/client";
import { externalPaths, features, limits } from "../../lib/config";
import type { Favorit, FavoritSort } from "../../lib/api/types";
import { useAsync } from "../../lib/hooks/useAsync";
import { useSummary } from "../account/SummaryContext";
import { StartInquiryDialog } from "../inquiry/StartInquiryDialog";
import { KosCard } from "../kos/KosCard";
import { ReportDialog } from "../report/ReportDialog";
import { favoritApi } from "./api";

const sortOptions: { value: FavoritSort; label: string }[] = [
  { value: "terbaru", label: "Terbaru" },
  { value: "harga-asc", label: "Harga terendah" },
  { value: "harga-desc", label: "Harga tertinggi" },
];

export default function FavoritPage() {
  const [tersedia, setTersedia] = useState(false);
  const [sort, setSort] = useState<FavoritSort>("terbaru");
  const [page, setPage] = useState(1);
  const [extra, setExtra] = useState<Favorit[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [inquiry, setInquiry] = useState<Favorit | null>(null);
  const [report, setReport] = useState<Favorit | null>(null);
  const toast = useToast();
  const summary = useSummary();


  const list = useAsync((signal) => favoritApi.list({ tersedia: tersedia || undefined, sort, page: 1, limit: limits.pageSize }, signal), [tersedia, sort]);
  useEffect(() => { setExtra([]); setPage(1); }, [tersedia, sort]);

  const items: Favorit[] = list.data ? [...list.data.data, ...extra] : [];
  const pagination = list.data?.pagination;
  const hasMore = !!pagination && page < pagination.totalPages;
  const total = pagination?.totalData ?? items.length;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await favoritApi.list({ tersedia: tersedia || undefined, sort, page: page + 1, limit: limits.pageSize });
      setExtra((e) => [...e, ...r.data]);
      setPage(page + 1);
    } catch (e) {
      toast.show({ tone: "error", message: errorMessage(e) });
    } finally {
      setLoadingMore(false);
    }
  };

  const remove = async (f: Favorit) => {
    setRemoving(f.kos.id);
    try {
      await favoritApi.remove(f.kos.id);
      list.reload();
      summary?.reload();
      toast.show({
        tone: "success",
        message: "Kos dihapus dari favorit.",
        action: {
          label: "Batalkan",
          onClick: () => favoritApi.add(f.kos.id).then(() => { list.reload(); summary?.reload(); }, (e) => toast.show({ tone: "error", message: errorMessage(e) })),
        },
      });
    } catch (e) {
      toast.show({ tone: "error", message: errorMessage(e, "Gagal menghapus dari favorit.") });
    } finally {
      setRemoving(null);
    }
  };

  const filtered = tersedia || sort !== "terbaru";
  const hasInactive = items.some((f) => !f.kos.tampilPublik);

  return (
    <MemberShell routeKey="/favorit">
      <PageHeading
        title="Kos favorit"
        description={list.data && total > 0 ? `${total} pilihan tersimpan untuk kamu lihat kembali.` : "Simpan pilihan agar mudah ditemukan kembali."}
      />
      {list.status === "loading" && !list.data && (
        <div className="properties" aria-busy="true" aria-label="Memuat favorit">
          {[0, 1, 2].map((i) => <div key={i} className="property-card"><Skeleton lines={4} className="p-card" /></div>)}
        </div>
      )}
      {list.status === "error" && <ErrorState error={list.error} onRetry={list.reload} title="Favorit belum dapat dimuat" />}
      {list.data && items.length === 0 && !filtered && (
        <EmptyState icon="heart" title="Belum ada kos tersimpan" description="Ketuk ikon hati pada kos yang kamu suka. Pilihanmu akan muncul di sini."
          action={<ButtonLink to={externalPaths.explore} external>Jelajahi kos</ButtonLink>} />
      )}
      {list.data && (items.length > 0 || filtered) && (
        <>
          <div className="filters" role="group" aria-label="Saring dan urutkan favorit">
            <Chip active={!tersedia} onClick={() => setTersedia(false)}>Semua</Chip>
            <Chip active={tersedia} onClick={() => setTersedia(true)}>Kamar tersedia</Chip>
            <div className="filters-sort">
              <Select label="Urutkan" name="sort" value={sort} onChange={(v) => setSort((v || "terbaru") as FavoritSort)} options={sortOptions} placeholder="Terbaru" />
            </div>
          </div>
          {items.length === 0 ? (
            <EmptyState icon="search" title="Tidak ada hasil" description="Tidak ada favorit yang cocok dengan penyaringan ini."
              action={<Button variant="secondary" onClick={() => { setTersedia(false); setSort("terbaru"); }}>Hapus penyaringan</Button>} />
          ) : (
            <ul className="properties" aria-label="Daftar kos favorit">
              {items.map((f) => (
                <li key={f.id}>
                  <KosCard
                    kos={f.kos}
                    removing={removing === f.kos.id}
                    onRemove={() => remove(f)}
                    actions={
                      <>
                        <Button variant="secondary" onClick={() => setInquiry(f)} disabled={!f.kos.tampilPublik || (!features.inquiryWhenFull && f.kos.kamarTersedia === 0)}>Tanya pemilik</Button>
                        {features.report && <button type="button" className="link" onClick={() => setReport(f)}>Laporkan informasi</button>}
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          {hasMore && <div className="center"><Button variant="secondary" onClick={loadMore} loading={loadingMore}>Muat lebih banyak</Button></div>}
          <Alert>{hasInactive ? "Satu listing favorit sedang tidak aktif dan tidak menerima pertanyaan baru." : "Kos yang sementara tidak tayang tetap ada di daftar favorit dengan penanda ketersediaan."}</Alert>
        </>
      )}
      {inquiry && <StartInquiryDialog kos={inquiry.kos} onClose={() => setInquiry(null)} />}
      {report && <ReportDialog kos={report.kos} onClose={() => setReport(null)} />}
    </MemberShell>
  );
}
