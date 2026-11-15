"use client";

import { useEffect, useState } from "react";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Alert, Spinner } from "../../components/ui/Feedback";
import { Link } from "../../components/ui/Link";
import { ApiError, errorMessage } from "../../lib/api/client";
import { limits } from "../../lib/config";
import { useForm } from "../../lib/hooks/useForm";
import { navigate, useLocation } from "../../lib/router";
import { email, matches, password, required, type Schema } from "../../lib/validation/rules";
import { AuthCard, StatusIcon } from "./AuthCard";
import { useAuth } from "./AuthContext";
import { authApi } from "./api";

/** Hitung mundur untuk tombol kirim ulang. */
function useCooldown(seconds: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, start: () => setLeft(seconds) };
}

export function ForgotPasswordPage() {
  const form = useForm<{ email: string }>({ email: "" }, { email: [required("Masukkan alamat email."), email()] });
  const onSubmit = form.submit(async (v) => {
    await authApi.forgotPassword({ email: v.email.trim() }); // respons sama untuk email terdaftar/tidak (anti enumerasi)
    navigate("/lupa-sandi/terkirim", { force: true });
  });
  return (
    <AuthCard title="Lupa kata sandi?" description="Masukkan email akunmu untuk mendapatkan tautan pemulihan." onSubmit={onSubmit} formRef={form.formRef}>
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <Field label="Alamat email" type="email" autoComplete="email" placeholder="nama@email.com" {...form.field("email")} />
      <Button type="submit" block loading={form.submitting}>Kirim tautan pemulihan</Button>
      <Link to="/masuk" className="link">Kembali masuk</Link>
    </AuthCard>
  );
}

export function RecoverySentPage() {
  return (
    <AuthCard title="Periksa kotak masukmu" description="Jika email tersebut terdaftar, tautan pemulihan akan segera dikirim.">
      <StatusIcon name="mail" />
      <ButtonLink to="/masuk" block>Kembali masuk</ButtonLink>
      <ButtonLink to="/lupa-sandi" variant="secondary" block>Kirim ulang tautan</ButtonLink>
    </AuthCard>
  );
}

interface RV extends Record<string, string> { password: string; konfirmasi: string }
const resetSchema: Schema<RV> = {
  password: [required("Buat kata sandi baru."), password],
  konfirmasi: [required("Ulangi kata sandi baru."), matches<RV>("password", "Konfirmasi belum sama dengan kata sandi baru.")],
};

export function ResetPasswordPage() {
  const { query } = useLocation();
  const token = query.get("token") ?? "";
  const form = useForm<RV>({ password: "", konfirmasi: "" }, resetSchema);
  useEffect(() => { if (!token) navigate("/tautan-kedaluwarsa", { replace: true, force: true }); }, [token]);

  const onSubmit = form.submit(async (v) => {
    try {
      await authApi.resetPassword({ token, password: v.password });
      navigate("/reset-sandi/berhasil", { replace: true, force: true });
    } catch (e) {
      if (e instanceof ApiError && e.code === "TOKEN_EXPIRED") { navigate("/tautan-kedaluwarsa", { replace: true, force: true }); return; }
      throw e;
    }
  });
  return (
    <AuthCard title="Buat kata sandi baru" description="Gunakan kata sandi yang berbeda dari sebelumnya." onSubmit={onSubmit} formRef={form.formRef}>
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <Field label="Kata sandi baru" type="password" autoComplete="new-password" helper="Minimal 8 karakter, dengan huruf dan angka." {...form.field("password")} />
      <Field label="Konfirmasi kata sandi baru" type="password" autoComplete="new-password" {...form.field("konfirmasi")} />
      <Alert>Jangan gunakan kata sandi yang pernah dipakai.</Alert>
      <Button type="submit" block loading={form.submitting}>Simpan kata sandi</Button>
    </AuthCard>
  );
}

export function PasswordSuccessPage() {
  return (
    <AuthCard title="Kata sandi diperbarui" description="Kamu bisa masuk kembali menggunakan kata sandi baru.">
      <StatusIcon name="circle-check" tone="success" />
      <ButtonLink to="/masuk" block>Masuk kembali</ButtonLink>
    </AuthCard>
  );
}

export function LinkExpiredPage() {
  const { user } = useAuth();
  return (
    <AuthCard title="Tautan sudah kedaluwarsa" description="Minta tautan baru agar kamu dapat melanjutkan dengan aman.">
      <StatusIcon name="clock" />
      <ButtonLink to={user && !user.emailTerverifikasi ? "/verifikasi-email" : "/lupa-sandi"} block>Kirim tautan baru</ButtonLink>
    </AuthCard>
  );
}

/** "Periksa emailmu": menunggu pengguna membuka tautan di email. */
export function VerifyEmailPendingPage() {
  const { user, refresh } = useAuth();
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const cooldown = useCooldown(limits.resendCooldownSeconds);
  const [sending, setSending] = useState(false);

  const check = async () => {
    setChecking(true);
    const u = await refresh();
    setChecking(false);
    if (u?.emailTerverifikasi) navigate("/verifikasi-email/berhasil", { force: true });
    else setNotice({ tone: "error", text: "Email belum terverifikasi. Buka tautan pada email, lalu coba lagi." });
  };
  const resend = async () => {
    setSending(true);
    try {
      await authApi.resendVerification();
      cooldown.start();
      setNotice({ tone: "success", text: "Tautan verifikasi baru sudah dikirim. Cek kotak masuk dan folder spam." });
    } catch (e) {
      setNotice({ tone: "error", text: errorMessage(e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthCard title="Periksa emailmu" description={<>Kami mengirim tautan verifikasi ke <strong>{user?.email ?? "alamat emailmu"}</strong>.</>}>
      <Alert>Akunmu sudah dibuat. Verifikasi email untuk mengaktifkan seluruh fitur.</Alert>
      <p className="auth-desc">Buka tautan pada email untuk melanjutkan. Belum menerima email? Periksa folder spam.</p>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Button block onClick={check} loading={checking}>Saya sudah verifikasi</Button>
      <Button variant="secondary" block onClick={resend} loading={sending} disabled={cooldown.left > 0}>
        {cooldown.left > 0 ? `Kirim ulang email (${cooldown.left} dtk)` : "Kirim ulang email"}
      </Button>
      <Link to="/daftar" className="link">Gunakan alamat email lain</Link>
    </AuthCard>
  );
}

/** Tujuan tautan di email: /verifikasi-email/konfirmasi?token=... */
export function ConfirmEmailPage() {
  const { query } = useLocation();
  const token = query.get("token") ?? "";
  const { refresh } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "expired" | "error">("loading");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!token) { setState("expired"); return; }
    let live = true;
    authApi.verifyEmail({ token }).then(
      async () => { await refresh(); if (live) setState("ok"); },
      (e) => { if (!live) return; if (e instanceof ApiError && e.code === "TOKEN_EXPIRED") setState("expired"); else { setMsg(errorMessage(e)); setState("error"); } },
    );
    return () => { live = false; };
  }, [token, refresh]);

  if (state === "loading") return <AuthCard title="Memverifikasi email"><Spinner label="Memeriksa tautan…" /></AuthCard>;
  if (state === "expired") return <LinkExpiredPage />;
  if (state === "error")
    return (
      <AuthCard title="Verifikasi belum berhasil" description={msg}>
        <StatusIcon name="circle-alert" />
        <Button block onClick={() => location.reload()}>Coba lagi</Button>
      </AuthCard>
    );
  return <EmailVerifiedPage />;
}

export function EmailVerifiedPage() {
  return (
    <AuthCard title="Email berhasil diverifikasi" description="Akunmu siap dipakai untuk menyimpan kos dan menghubungi pemilik.">
      <StatusIcon name="circle-check" tone="success" />
      <ButtonLink to="/" external block>Mulai mencari kos</ButtonLink>
      <Link to="/akun" className="link">Buka ringkasan akun</Link>
    </AuthCard>
  );
}
