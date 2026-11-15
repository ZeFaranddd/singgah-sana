"use client";

import { useEffect } from "react";
import { Button, TextButton } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Feedback";
import { Link } from "../../components/ui/Link";
import { ApiError } from "../../lib/api/client";
import { useForm } from "../../lib/hooks/useForm";
import { navigate, safeInternalPath, useLocation } from "../../lib/router";
import { email, required, type Schema } from "../../lib/validation/rules";
import { AuthCard } from "./AuthCard";
import { useAuth } from "./AuthContext";

interface V extends Record<string, string> { email: string; password: string }
const schema: Schema<V> = {
  email: [required("Masukkan alamat email."), email()],
  password: [required("Masukkan kata sandi.")],
};

export default function LoginPage() {
  const { login } = useAuth();
  const { query } = useLocation();
  const form = useForm<V>({ email: "", password: "" }, schema);
  const expired = query.get("sesi") === "berakhir";


  const onSubmit = form.submit(async (v) => {
    try {
      const user = await login({ email: v.email.trim(), password: v.password });
      const next = safeInternalPath(query.get("next"));
      navigate(next ?? (user.status === "suspended" ? "/dibatasi" : "/akun"), { replace: true, force: true });
    } catch (e) {
      if (e instanceof ApiError && e.code === "ACCOUNT_SUSPENDED") {
        navigate("/dibatasi", { replace: true, force: true });
        return;
      }
      throw e; // ditampilkan form (INVALID_CREDENTIALS, RATE_LIMITED, jaringan)
    }
  });

  return (
    <AuthCard title="Selamat datang kembali" description="Masuk untuk melanjutkan pencarian kosmu." onSubmit={onSubmit} formRef={form.formRef}>
      {expired && !form.formError && <Alert>Sesi kamu berakhir. Masuk kembali untuk melanjutkan.</Alert>}
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <Field label="Alamat email" type="email" autoComplete="email" placeholder="nama@email.com" {...form.field("email")} />
      <Field label="Kata sandi" type="password" autoComplete="current-password" placeholder="Kata sandi" {...form.field("password")} />
      <Link to="/lupa-sandi" className="link">Lupa kata sandi?</Link>
      <Button type="submit" block loading={form.submitting}>Masuk</Button>
      <p className="auth-alt">Belum punya akun? <Link to="/daftar" className="link">Daftar</Link></p>
    </AuthCard>
  );
}
