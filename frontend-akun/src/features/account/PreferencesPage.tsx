"use client";

import { useEffect, useState } from "react";
import { AccountLayout } from "../../components/layout/AccountLayout";
import { Button } from "../../components/ui/Button";
import { Card, PageHeading, Switch } from "../../components/ui/Display";
import { Alert, ErrorState, Skeleton } from "../../components/ui/Feedback";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../lib/api/client";
import type { PreferensiNotifikasi } from "../../lib/api/types";
import { useAsync } from "../../lib/hooks/useAsync";
import { accountApi } from "./api";

const items: { key: keyof PreferensiNotifikasi; title: string; desc: string }[] = [
  { key: "pesanPemilik", title: "Pesan dari pemilik", desc: "Kabar saat ada balasan di percakapanmu." },
  { key: "pembaruanFavorit", title: "Pembaruan kos favorit", desc: "Perubahan penting pada kos yang kamu simpan." },
  { key: "kabarProduk", title: "Tips dan kabar produk", desc: "Panduan mencari kos dan pembaruan fitur." },
];

export default function PreferencesPage() {
  const q = useAsync((signal) => accountApi.preferences(signal), []);
  const [draft, setDraft] = useState<PreferensiNotifikasi | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  useEffect(() => { if (q.status === "success") setDraft(q.data); }, [q.status, q.data]);

  const save = async () => {
    if (!draft) return;
    setBusy(true); setError(null);
    try {
      await accountApi.savePreferences(draft);
      toast.show({ tone: "success", message: "Preferensi notifikasi berhasil disimpan." });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountLayout>
      <PageHeading title="Preferensi notifikasi" description="Atur pemberitahuan yang ingin kamu terima." />
      {q.status === "loading" && <div aria-busy="true"><Skeleton lines={3} /></div>}
      {q.status === "error" && <ErrorState error={q.error} onRetry={q.reload} title="Preferensi belum dapat dimuat" />}
      {draft && (
        <Card className="preferences">
          <h2 className="h3">Pemberitahuan melalui email</h2>
          {error && <Alert tone="error">{error}</Alert>}
          {items.map((it) => (
            <div className="preference" key={it.key}>
              <div>
                <h3 className="h4" id={`pref-${it.key}`}>{it.title}</h3>
                <p className="muted small" id={`pref-${it.key}-d`}>{it.desc}</p>
              </div>
              <Switch checked={draft[it.key]} onChange={(v) => setDraft({ ...draft, [it.key]: v })} labelledBy={`pref-${it.key}`} describedBy={`pref-${it.key}-d`} />
            </div>
          ))}
          <Alert>Email keamanan, verifikasi, dan pemulihan akun tetap dikirim.</Alert>
          <div><Button onClick={save} loading={busy}>Simpan preferensi</Button></div>
        </Card>
      )}
    </AccountLayout>
  );
}
