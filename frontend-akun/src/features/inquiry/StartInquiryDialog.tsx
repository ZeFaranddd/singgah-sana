"use client";

import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { TextArea } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Feedback";
import { useToast } from "../../components/ui/Toast";
import type { KosRingkas } from "../../lib/api/types";
import { limits } from "../../lib/config";
import { useForm } from "../../lib/hooks/useForm";
import { navigate } from "../../lib/router";
import { maxLength, required, type Schema } from "../../lib/validation/rules";
import { useSummary } from "../account/SummaryContext";
import { inquiryApi } from "./api";

interface V extends Record<string, string> { isi: string }
const schema: Schema<V> = {
  isi: [required("Tulis pertanyaanmu terlebih dahulu."), maxLength(limits.messageMaxLength)],
};
const quick = ["Apakah masih ada kamar kosong?", "Apakah bisa survei besok?", "Apa saja biaya tambahannya?"];

export function StartInquiryDialog({ kos, onClose }: { kos: KosRingkas; onClose: () => void }) {
  const full = kos.kamarTersedia === 0;
  const form = useForm<V>({ isi: "" }, schema);
  const toast = useToast();
  const summary = useSummary();

  const onSubmit = form.submit(async (v) => {
    const { percakapanId } = await inquiryApi.start(kos.id, v.isi.trim());
    summary?.reload();
    toast.show({ tone: "success", message: "Pesan terkirim ke pemilik." });
    onClose();
    navigate(`/pesan?c=${encodeURIComponent(percakapanId)}`, { force: true });
  });

  return (
    <Dialog
      wide
      title="Tanya pemilik kos"
      description={full ? `Kos sedang penuh. Tanyakan ketersediaan berikutnya kepada ${kos.pemilik.nama}.` : `Pesanmu akan dikirim ke ${kos.pemilik.nama} untuk ${kos.nama}.`}
      onClose={onClose}
    >
      <form className="dialog-form" onSubmit={onSubmit} noValidate ref={form.formRef}>
        {form.formError && <Alert tone="error">{form.formError}</Alert>}
        <div className="quick-questions" role="group" aria-label="Pertanyaan cepat">
          {quick.map((q) => (
            <Button key={q} variant="secondary" onClick={() => form.set("isi", q)}>{q}</Button>
          ))}
        </div>
        <TextArea label="Pesan untuk pemilik" placeholder={full ? "Mohon kabari saya jika kamar tersedia kembali." : "Tulis pertanyaanmu"} maxLength={limits.messageMaxLength} {...form.field("isi")} helper={`${form.values.isi.length.toLocaleString("id-ID")} / ${limits.messageMaxLength.toLocaleString("id-ID")} karakter`} />
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={form.submitting}>Kirim pesan</Button>
        </div>
      </form>
    </Dialog>
  );
}
