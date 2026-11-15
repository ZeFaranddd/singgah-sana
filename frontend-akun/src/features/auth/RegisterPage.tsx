"use client";

import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Checkbox, Field } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Feedback";
import { Link } from "../../components/ui/Link";
import { externalPaths } from "../../lib/config";
import { useForm } from "../../lib/hooks/useForm";
import { navigate } from "../../lib/router";
import { email, matches, password, phone, required, type Schema } from "../../lib/validation/rules";
import { AuthCard } from "./AuthCard";
import { useAuth } from "./AuthContext";

interface V extends Record<string, string> { nama: string; email: string; telepon: string; password: string; konfirmasi: string }
const schema: Schema<V> = {
  nama: [required("Nama lengkap wajib diisi.")],
  email: [required("Masukkan alamat email."), email()],
  telepon: [required("Nomor kontak wajib diisi."), phone()],
  password: [required("Buat kata sandi."), password],
  konfirmasi: [required("Ulangi kata sandi."), matches<V>("password", "Konfirmasi belum sama dengan kata sandi.")],
};

export default function RegisterPage() {
  const { register } = useAuth();
  const form = useForm<V>({ nama: "", email: "", telepon: "", password: "", konfirmasi: "" }, schema);
  const [agree, setAgree] = useState(false);
  const [agreeError, setAgreeError] = useState<string>();

  const onSubmit = form.submit(async (v) => {
    if (!agree) { setAgreeError("Setujui ketentuan dan kebijakan privasi untuk melanjutkan."); return; }
    await register({ nama: v.nama.trim(), email: v.email.trim(), telepon: v.telepon.replace(/[\s-]/g, ""), password: v.password });
    navigate("/verifikasi-email", { force: true });
  });

  return (
    <AuthCard title="Buat akunmu" description="Satu akun untuk mencari dan mengelola kos." onSubmit={onSubmit} formRef={form.formRef}>
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <Field label="Nama lengkap" autoComplete="name" placeholder="Nama sesuai identitas" required {...form.field("nama")} />
      <Field label="Alamat email" type="email" autoComplete="email" placeholder="nama@email.com" required {...form.field("email")} />
      <Field label="Nomor kontak" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" helper="Nomor tidak ditampilkan pada profil publik pencari." required {...form.field("telepon")} />
      <Field label="Kata sandi" type="password" autoComplete="new-password" helper="Minimal 8 karakter, dengan huruf dan angka." required {...form.field("password")} />
      <Field label="Konfirmasi kata sandi" type="password" autoComplete="new-password" required {...form.field("konfirmasi")} />
      <Checkbox checked={agree} onChange={(v) => { setAgree(v); setAgreeError(undefined); }} error={agreeError}>
        Saya menyetujui <Link to={externalPaths.terms} external className="link-inline">ketentuan penggunaan</Link> dan <Link to={externalPaths.privacy} external className="link-inline">kebijakan privasi</Link>.
      </Checkbox>
      <Button type="submit" block loading={form.submitting}>Buat akun</Button>
      <p className="auth-alt">Sudah punya akun? <Link to="/masuk" className="link">Masuk</Link></p>
    </AuthCard>
  );
}
