"use client";

import { useEffect, useState } from "react";
import { AccountLayout } from "../../components/layout/AccountLayout";
import { Button } from "../../components/ui/Button";
import { Card, PageHeading } from "../../components/ui/Display";
import { Dialog } from "../../components/ui/Dialog";
import { Alert } from "../../components/ui/Feedback";
import { Field } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../lib/format";
import { useForm } from "../../lib/hooks/useForm";
import { email, equals, matches, password, required, type Schema } from "../../lib/validation/rules";
import { useAuth } from "../auth/AuthContext";
import { accountApi } from "./api";

type Open = null | "password" | "email" | "delete";

export default function SecurityPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState<Open>(null);
  if (!user) return null;
  return (
    <AccountLayout>
      <PageHeading title="Keamanan akun" description="Kelola cara masuk dan lindungi akunmu." />
      <Card className="action-card">
        <h2 className="h3">Kata sandi</h2>
        <h3 className="h4">Terakhir diperbarui {formatDate(user.passwordDiperbaruiPada)}</h3>
        <p className="muted">Gunakan kata sandi unik dan jangan membagikannya.</p>
        <Button variant="secondary" onClick={() => setOpen("password")}>Ubah kata sandi</Button>
      </Card>
      <Card className="action-card">
        <h2 className="h3">Alamat email</h2>
        <h3 className="h4">{user.email} · {user.emailTerverifikasi ? "Terverifikasi" : "Belum terverifikasi"}</h3>
        <p className="muted">Perubahan email perlu diverifikasi melalui alamat baru.</p>
        <Button variant="secondary" onClick={() => setOpen("email")}>Ubah email</Button>
      </Card>
      <Card className="action-card">
        <h2 className="h3">Hapus akun</h2>
        <p className="muted">Menghapus akun menghilangkan akses ke favorit dan percakapanmu. Periksa dampaknya sebelum melanjutkan.</p>
        <Button variant="secondary" onClick={() => setOpen("delete")}>Tinjau penghapusan akun</Button>
      </Card>
      {open === "password" && <ChangePasswordDialog onClose={() => setOpen(null)} />}
      {open === "email" && <ChangeEmailDialog onClose={() => setOpen(null)} />}
      {open === "delete" && <DeleteAccountDialog onClose={() => setOpen(null)} />}
    </AccountLayout>
  );
}

interface PV extends Record<string, string> { passwordSaatIni: string; passwordBaru: string; konfirmasi: string }
const pwSchema: Schema<PV> = {
  passwordSaatIni: [required("Masukkan kata sandi saat ini.")],
  passwordBaru: [required("Buat kata sandi baru."), password],
  konfirmasi: [required("Ulangi kata sandi baru."), matches<PV>("passwordBaru", "Konfirmasi belum sama dengan sandi baru.")],
};
function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const form = useForm<PV>({ passwordSaatIni: "", passwordBaru: "", konfirmasi: "" }, pwSchema);
  const onSubmit = form.submit(async (v) => {
    setUser(await accountApi.changePassword({ passwordSaatIni: v.passwordSaatIni, passwordBaru: v.passwordBaru }));
    toast.show({ tone: "success", message: "Kata sandi akun berhasil diperbarui." });
    onClose();
  });
  return (
    <Dialog title="Ubah kata sandi" description="Masukkan kata sandi saat ini untuk mengonfirmasi perubahan." onClose={onClose}>
      <form className="dialog-form" onSubmit={onSubmit} noValidate ref={form.formRef}>
        {form.formError && <Alert tone="error">{form.formError}</Alert>}
        <Field label="Kata sandi saat ini" type="password" autoComplete="current-password" {...form.field("passwordSaatIni")} />
        <Field label="Kata sandi baru" type="password" autoComplete="new-password" helper="Minimal 8 karakter, dengan huruf dan angka." {...form.field("passwordBaru")} />
        <Field label="Konfirmasi sandi baru" type="password" autoComplete="new-password" {...form.field("konfirmasi")} />
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={form.submitting}>Simpan kata sandi</Button>
        </div>
      </form>
    </Dialog>
  );
}

interface EV extends Record<string, string> { emailBaru: string; password: string }
const emSchema: Schema<EV> = {
  emailBaru: [required("Masukkan alamat email baru."), email()],
  password: [required("Masukkan kata sandi saat ini.")],
};
function ChangeEmailDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const form = useForm<EV>({ emailBaru: "", password: "" }, emSchema);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const onSubmit = form.submit(async (v) => {
    const r = await accountApi.changeEmail({ emailBaru: v.emailBaru.trim(), password: v.password });
    setSentTo(r.emailBaru);
  });
  if (sentTo)
    return (
      <Dialog title="Verifikasi alamat barumu" description={`Tautan dikirim ke ${sentTo}. Email lama tetap aktif sebelum verifikasi.`} onClose={onClose}>
        <Alert>Tautan verifikasi berlaku selama 24 jam.</Alert>
        <Button onClick={onClose} data-autofocus>Selesai</Button>
      </Dialog>
    );
  return (
    <Dialog title="Ubah alamat email" description={`Email saat ini: ${user?.email}. Alamat baru perlu diverifikasi.`} onClose={onClose}>
      <form className="dialog-form" onSubmit={onSubmit} noValidate ref={form.formRef}>
        {form.formError && <Alert tone="error">{form.formError}</Alert>}
        <Field label="Alamat email baru" type="email" autoComplete="email" placeholder="emailbaru@example.com" {...form.field("emailBaru")} />
        <Field label="Kata sandi saat ini" type="password" autoComplete="current-password" {...form.field("password")} />
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={form.submitting}>Simpan alamat email</Button>
        </div>
      </form>
    </Dialog>
  );
}

interface DV extends Record<string, string> { password: string; konfirmasi: string }
const delSchema: Schema<DV> = {
  password: [required("Masukkan kata sandi saat ini.")],
  konfirmasi: [equals("HAPUS", "Ketik HAPUS (huruf besar) untuk mengonfirmasi.")],
};
function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { clear } = useAuth();
  const form = useForm<DV>({ password: "", konfirmasi: "" }, delSchema);
  const onSubmit = form.submit(async (v) => {
    await accountApi.deleteAccount({ password: v.password });
    clear("/akun-dihapus"); // gerbang anggota mengarahkan ke halaman akun dihapus
  });
  return (
    <Dialog destructive title="Hapus akunmu?" description="Akses akun akan dihapus. Favorit akan hilang dan kamu tidak dapat membuka percakapan." onClose={onClose}>
      <form className="dialog-form" onSubmit={onSubmit} noValidate ref={form.formRef}>
        <Alert tone="error">Tindakan ini tidak dapat dibatalkan.</Alert>
        {form.formError && <Alert tone="error">{form.formError}</Alert>}
        <Field label="Kata sandi saat ini" type="password" autoComplete="current-password" {...form.field("password")} />
        <Field label="Ketik HAPUS untuk mengonfirmasi" placeholder="HAPUS" autoComplete="off" {...form.field("konfirmasi")} />
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="danger" loading={form.submitting}>Hapus akun permanen</Button>
        </div>
      </form>
    </Dialog>
  );
}
