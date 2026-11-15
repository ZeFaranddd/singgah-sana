"use client";

import { useEffect, useState } from "react";
import { AccountLayout } from "../../components/layout/AccountLayout";
import { Button } from "../../components/ui/Button";
import { Chip, PageHeading } from "../../components/ui/Display";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback";
import { Icon, type IconName } from "../../components/ui/Icon";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../lib/api/client";
import type { Notifikasi } from "../../lib/api/types";
import { limits } from "../../lib/config";
import { formatTime } from "../../lib/format";
import { useAsync } from "../../lib/hooks/useAsync";
import { navigate } from "../../lib/router";
import { accountApi } from "./api";
import { useSummary } from "./SummaryContext";

const icons: Record<Notifikasi["jenis"], IconName> = { pesan: "message-circle", email: "shield-check", kos: "heart" };

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [extra, setExtra] = useState<Notifikasi[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [moreBusy, setMoreBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const summary = useSummary();

  const q = useAsync((signal) => accountApi.notifications({ status: unreadOnly ? "belum-dibaca" : undefined, page: 1, limit: limits.pageSize }, signal), [unreadOnly]);
  useEffect(() => { setExtra([]); setPage(1); setReadIds(new Set()); }, [unreadOnly]);

  const items = q.data ? [...q.data.data, ...extra] : [];
  const pg = q.data?.pagination;
  const isRead = (n: Notifikasi) => n.dibaca || readIds.has(n.id);

  const open = async (n: Notifikasi) => {
    if (!isRead(n)) {
      setReadIds((s) => new Set(s).add(n.id));
      accountApi.markRead(n.id).then(() => summary?.reload(), () => undefined);
    }
    if (n.tautan) navigate(n.tautan);
  };
  const markAll = async () => {
    setBusy(true);
    try {
      await accountApi.markAllRead();
      setReadIds(new Set(items.map((n) => n.id)));
      summary?.reload();
      toast.show({ tone: "success", message: "Semua notifikasi sudah ditandai dibaca." });
    } catch (e) {
      toast.show({ tone: "error", message: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  const loadMore = async () => {
    setMoreBusy(true);
    try {
      const r = await accountApi.notifications({ status: unreadOnly ? "belum-dibaca" : undefined, page: page + 1, limit: limits.pageSize });
      setExtra((e) => [...e, ...r.data]);
      setPage(page + 1);
    } catch (e) {
      toast.show({ tone: "error", message: errorMessage(e) });
    } finally {
      setMoreBusy(false);
    }
  };

  return (
    <AccountLayout>
      <PageHeading title="Notifikasi" description="Kabar terbaru tentang akun dan aktivitasmu." />
      <div className="filters" role="group" aria-label="Saring notifikasi">
        <Chip active={!unreadOnly} onClick={() => setUnreadOnly(false)}>Semua</Chip>
        <Chip active={unreadOnly} onClick={() => setUnreadOnly(true)}>Belum dibaca</Chip>
        <Button variant="secondary" onClick={markAll} loading={busy} disabled={items.every(isRead)}>Tandai semua dibaca</Button>
      </div>
      {q.status === "loading" && !q.data && <div aria-busy="true"><Skeleton lines={3} /><Skeleton lines={3} /></div>}
      {q.status === "error" && <ErrorState error={q.error} onRetry={q.reload} title="Notifikasi belum dapat dimuat" />}
      {q.data && items.length === 0 && (
        <EmptyState icon="bell" title={unreadOnly ? "Tidak ada notifikasi baru" : "Belum ada notifikasi"} description={unreadOnly ? "Semua notifikasi sudah kamu baca." : "Kabar tentang akun dan aktivitasmu akan muncul di sini."} />
      )}
      {items.length > 0 && (
        <ul className="notification-list">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" className={`card notification ${isRead(n) ? "" : "unread"}`} onClick={() => open(n)}>
                <span className="notif-icon"><Icon name={icons[n.jenis]} size={24} /></span>
                <span className="notif-body">
                  <strong>{n.judul}{!isRead(n) && <span className="sr-only"> (belum dibaca)</span>}</strong>
                  <span className="muted">{n.isi}</span>
                  <small className="muted">{formatTime(n.waktu)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {pg && page < pg.totalPages && <div className="center"><Button variant="secondary" onClick={loadMore} loading={moreBusy}>Muat lebih banyak</Button></div>}
    </AccountLayout>
  );
}
