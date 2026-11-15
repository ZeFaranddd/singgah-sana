"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { MemberShell } from "../../components/layout/Shells";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Card, PageHeading } from "../../components/ui/Display";
import { Alert, EmptyState, ErrorState, Skeleton, Spinner } from "../../components/ui/Feedback";
import { TextArea } from "../../components/ui/Field";
import { Icon } from "../../components/ui/Icon";
import { Link } from "../../components/ui/Link";
import { Avatar } from "../../components/ui/Display";
import type { Percakapan, Pesan } from "../../lib/api/types";
import { externalPaths, limits } from "../../lib/config";
import { formatClock, formatRupiah, formatTime } from "../../lib/format";
import { useAsync } from "../../lib/hooks/useAsync";
import { navigate, useLocation } from "../../lib/router";
import { useSummary } from "../account/SummaryContext";
import { inquiryApi } from "./api";

type LocalMsg = Pesan & { state?: "sending" | "failed" };

export default function MessagesPage() {
  const { query } = useLocation();
  const selectedId = query.get("c");
  const [search, setSearch] = useState("");
  const summary = useSummary();

  const convs = useAsync((signal) => inquiryApi.list(signal), []);
  const list: Percakapan[] = convs.data ?? []; // data lama dipertahankan saat memuat ulang (tanpa mengosongkan layar)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? list.filter((c) => c.kos.nama.toLowerCase().includes(q) || c.pemilik.nama.toLowerCase().includes(q)) : list;
  }, [list, search]);

  // Desktop: pilih percakapan pertama otomatis. Mobile: tampilkan daftar dulu.
  const isDesktop = typeof matchMedia === "function" && matchMedia("(min-width: 1001px)").matches;
  useEffect(() => {
    if (convs.data && !selectedId && isDesktop && list[0]) navigate(`/pesan?c=${list[0].id}`, { replace: true, force: true });
  }, [convs.data, selectedId, isDesktop, list]);

  const selected = list.find((c) => c.id === selectedId) ?? null;
  const view = selected ? "chat" : "list";

  return (
    <MemberShell routeKey="/pesan">
      <PageHeading title="Pesan" description={list.length || !convs.data ? "Percakapanmu dengan pemilik kos." : "Pertanyaan dan balasan dari pemilik akan tersimpan di sini."} />
      {convs.status === "loading" && !convs.data && <div aria-busy="true"><Spinner label="Memuat percakapan…" /><Skeleton lines={4} /></div>}
      {convs.status === "error" && <ErrorState error={convs.error} onRetry={convs.reload} title="Pesan belum dapat dimuat" />}
      {convs.data && list.length === 0 && (
        <EmptyState icon="message-circle" title="Mulai percakapan pertamamu" description="Buka detail kos yang kamu minati, lalu pilih Tanya pemilik."
          action={<ButtonLink to={externalPaths.explore} external>Cari kos</ButtonLink>} />
      )}
      {convs.data && list.length > 0 && (
        <div className="messages-layout" data-view={view}>
          <aside className="conversation-list" aria-label="Daftar percakapan">
            <div className="search">
              <Icon name="search" />
              <input type="search" aria-label="Cari nama kos atau pemilik" placeholder="Cari nama kos atau pemilik" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {filtered.length === 0 && <p className="muted small">Tidak ada percakapan yang cocok.</p>}
            <ul>
              {filtered.map((c) => (
                <li key={c.id}>
                  <Link to={`/pesan?c=${c.id}`} className={`conversation ${c.id === selectedId ? "active" : ""}`} aria-current={c.id === selectedId ? "true" : undefined}>
                    <strong>{c.pemilik.nama}{c.belumDibaca > 0 && <span className="unread-dot" aria-label={`${c.belumDibaca} pesan belum dibaca`} />}</strong>
                    <b>{c.kos.nama}</b>
                    <span>{c.cuplikan}</span>
                    <small>{formatTime(c.waktu)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
          {selected ? (
            <Thread key={selected.id} conv={selected} onActivity={() => { convs.reload(); summary?.reload(); }} />
          ) : (
            <Card className="chat chat-placeholder"><p className="muted">Pilih percakapan untuk membaca pesan.</p></Card>
          )}
        </div>
      )}
    </MemberShell>
  );
}

function Thread({ conv, onActivity }: { conv: Percakapan; onActivity: () => void }) {
  const msgs = useAsync((signal) => inquiryApi.messages(conv.id, signal), [conv.id]);
  const [local, setLocal] = useState<LocalMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string>();
  const endRef = useRef<HTMLDivElement>(null);
  const full = conv.kos.kamarTersedia === 0;

  useEffect(() => { if (msgs.status === "success") onActivity(); /* membuka percakapan menandai terbaca */ }, [msgs.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [local.length, msgs.status]);

  const send = async (text: string, retryId?: string) => {
    const id = retryId ?? `tmp-${Date.now()}`;
    const optimistic: LocalMsg = { id, dari: "saya", isi: text, waktu: new Date().toISOString(), status: "terkirim", state: "sending" };
    setLocal((l) => (retryId ? l.map((m) => (m.id === id ? optimistic : m)) : [...l, optimistic]));
    try {
      const saved = await inquiryApi.send(conv.id, text);
      setLocal((l) => l.map((m) => (m.id === id ? { ...saved } : m)));
      onActivity();
    } catch {
      setLocal((l) => l.map((m) => (m.id === id ? { ...m, state: "failed" } : m)));
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) { setDraftError("Tulis pesanmu terlebih dahulu."); return; }
    if (text.length > limits.messageMaxLength) { setDraftError(`Maksimal ${limits.messageMaxLength.toLocaleString("id-ID")} karakter.`); return; }
    setDraftError(undefined);
    setDraft("");
    void send(text);
  };

  const all: LocalMsg[] = [...(msgs.status === "success" ? msgs.data : []), ...local];

  return (
    <Card className="chat" aria-label={`Percakapan dengan ${conv.pemilik.nama}`}>
      <div className="chat-person">
        <Link to="/pesan" className="back-link" aria-label="Kembali ke daftar percakapan"><Icon name="chevron-left" /></Link>
        <Avatar nama={conv.pemilik.nama} />
        <div>
          <h2 className="chat-title">{conv.pemilik.nama}</h2>
          <p className="muted small">Pengelola {conv.kos.nama}</p>
        </div>
      </div>
      <div className="related">
        <img src={conv.kos.fotoUrl} alt="" width={96} height={72} />
        <div>
          <strong>{conv.kos.nama}</strong>
          <p className="muted small">{formatRupiah(conv.kos.hargaBulanan)} / bulan · {full ? "Kamar penuh" : `Sisa ${conv.kos.kamarTersedia} kamar`}</p>
          <Link to={externalPaths.kosDetail(conv.kos.id)} external className="link">Lihat detail kos</Link>
        </div>
      </div>

      <div className="thread" role="log" aria-live="polite" aria-label="Riwayat pesan">
        {msgs.status === "loading" && <Spinner label="Memuat pesan…" />}
        {msgs.status === "error" && <ErrorState error={msgs.error} onRetry={msgs.reload} title="Pesan belum dapat dimuat" />}
        {all.map((m) => (
          <div key={m.id} className={`bubble ${m.dari === "saya" ? "outgoing" : "incoming"}`}>
            <span>{m.isi}</span>
            <small>
              {formatClock(m.waktu)}
              {m.dari === "saya" && ` · ${m.state === "sending" ? "Mengirim…" : m.state === "failed" ? "Gagal terkirim" : m.status === "dibaca" ? "Dibaca" : "Terkirim"}`}
              {m.state === "failed" && <> · <button type="button" className="link" onClick={() => send(m.isi, m.id)}>Kirim ulang</button></>}
            </small>
          </div>
        ))}
        {local.some((m) => m.state === "failed") && <Alert tone="error">Pesan gagal terkirim. Periksa koneksi lalu coba lagi.</Alert>}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} noValidate className="composer">
        <TextArea label="Pesan untuk pemilik" name="isi" placeholder="Tulis pesanmu" value={draft} onChange={(v) => { setDraft(v); setDraftError(undefined); }} error={draftError} rows={3} maxLength={limits.messageMaxLength} />
        <div className="send-row">
          <small className="muted" aria-live="off">{draft.length.toLocaleString("id-ID")} / {limits.messageMaxLength.toLocaleString("id-ID")} karakter</small>
          <Button type="submit">Kirim pesan</Button>
        </div>
      </form>
    </Card>
  );
}
