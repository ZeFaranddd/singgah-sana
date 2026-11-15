"use client";

import { useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Select, TextArea } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Feedback";
import { Icon } from "../../components/ui/Icon";
import type { KategoriLaporan, KosRingkas, LaporanHasil } from "../../lib/api/types";
import { limits } from "../../lib/config";
import { useForm } from "../../lib/hooks/useForm";
import { maxLength, minLength, required, validateImage, type Schema } from "../../lib/validation/rules";
import { reportApi } from "./api";

interface V extends Record<string, string> { kategori: string; keterangan: string }
const schema: Schema<V> = {
  kategori: [required("Pilih kategori laporan.")],
  keterangan: [required("Jelaskan informasi yang perlu diperiksa."), minLength(limits.reportDetailMin, `Jelaskan minimal ${limits.reportDetailMin} karakter.`), maxLength(limits.reportDetailMax)],
};
const categories: { value: KategoriLaporan; label: string }[] = [
  { value: "harga", label: "Harga tidak sesuai" },
  { value: "foto", label: "Foto tidak sesuai" },
  { value: "alamat", label: "Alamat atau lokasi keliru" },
  { value: "ketersediaan", label: "Ketersediaan kamar keliru" },
  { value: "lainnya", label: "Lainnya" },
];

export function ReportDialog({ kos, onClose }: { kos: KosRingkas; onClose: () => void }) {
  const form = useForm<V>({ kategori: "", keterangan: "" }, schema);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [result, setResult] = useState<LaporanHasil | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const err = validateImage(f, limits.reportAttachmentMaxBytes, limits.imageTypes);
    setFileError(err ?? undefined);
    setFile(err ? null : f);
  };

  const onSubmit = form.submit(async (v) => {
    setResult(await reportApi.create(kos.id, { kategori: v.kategori as KategoriLaporan, keterangan: v.keterangan.trim(), lampiran: file }));
  });

  if (result)
    return (
      <Dialog wide title="Laporan terkirim" description="Terima kasih. Pengelola akan memeriksa informasi yang kamu kirim." onClose={onClose}>
        <Alert tone="success">Nomor laporan: <strong>{result.nomor}</strong>. Kami akan memberi kabar melalui notifikasi.</Alert>
        <Button onClick={onClose} data-autofocus>Selesai</Button>
      </Dialog>
    );

  return (
    <Dialog wide title="Laporkan informasi kos" description={`${kos.nama} · Jelaskan informasi yang perlu diperiksa oleh pengelola.`} onClose={onClose}>
      <form className="dialog-form" onSubmit={onSubmit} noValidate ref={form.formRef}>
        {form.formError && <Alert tone="error">{form.formError}</Alert>}
        <Select label="Kategori laporan" required placeholder="Pilih kategori" options={categories} {...form.field("kategori")} />
        <TextArea label="Keterangan" required maxLength={limits.reportDetailMax} placeholder="Contoh: biaya tambahan belum dijelaskan pada listing." helper="Jelaskan dengan jelas tanpa memasukkan data pribadi sensitif." {...form.field("keterangan")} />
        <div className="attach">
          <h3 className="h4">Lampiran (opsional)</h3>
          <p className="muted small" id="attach-help">JPG atau PNG, maksimal {Math.round(limits.reportAttachmentMaxBytes / 1024 / 1024)} MB.</p>
          <input ref={input} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} aria-describedby="attach-help" />
          {file ? (
            <div className="file-row">
              <Icon name="upload" />
              <span><strong>{file.name}</strong><br /><small className="muted">{Math.max(1, Math.round(file.size / 1024))} KB</small></span>
              <Button variant="secondary" onClick={() => input.current?.click()}>Ganti</Button>
              <Button variant="ghost" onClick={() => setFile(null)}>Hapus</Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => input.current?.click()}>Tambah lampiran</Button>
          )}
          {fileError && <p className="field-note field-note-error" role="alert">{fileError}</p>}
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={form.submitting}>Kirim laporan</Button>
        </div>
      </form>
    </Dialog>
  );
}
