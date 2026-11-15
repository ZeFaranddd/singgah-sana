"use client";

import { useEffect } from "react";
import { Alert } from "../../components/ui/Feedback";
import { Button, ButtonLink } from "../../components/ui/Button";
import { externalPaths } from "../../lib/config";
import { navigate } from "../../lib/router";
import { AuthCard, StatusIcon } from "./AuthCard";
import { useAuth } from "./AuthContext";
import { authApi } from "./api";

/** Akun dibatasi (status akun suspended). Alasan dan langkah klarifikasi ada di pemberitahuan akun. */
export function RestrictedPage() {
  const { clear } = useAuth();
  const other = async () => {
    try { await authApi.logout(); } catch { /* sesi mungkin sudah tidak ada */ }
    clear();
    navigate("/masuk", { force: true });
  };
  return (
    <AuthCard title="Akses akun dibatasi" description="Akun ini sementara tidak dapat masuk atau mengirim pesan.">
      <span className="badge badge-danger">Akses dibatasi</span>
      <Alert tone="error">
        Alasan dan langkah klarifikasi tercantum pada pemberitahuan akunmu. Jika perlu bantuan, gunakan pusat bantuan untuk menghubungi pengelola.
      </Alert>
      <ButtonLink to={externalPaths.help} external block>Buka pusat bantuan</ButtonLink>
      <Button variant="secondary" block onClick={other}>Gunakan akun lain</Button>
    </AuthCard>
  );
}

export function AccountDeletedPage() {
  return (
    <AuthCard title="Akun telah dihapus" description="Kamu sudah keluar. Terima kasih telah menggunakan Singgah Sana.">
      <StatusIcon name="circle-check" tone="success" />
      <ButtonLink to={externalPaths.explore} external block>Kembali ke beranda</ButtonLink>
    </AuthCard>
  );
}
