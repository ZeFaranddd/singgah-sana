import type { Metadata } from "next";
import { AuthShell } from "../components/layout/Shells";
import { ButtonLink } from "../components/ui/Button";
import { AuthCard } from "../features/auth/AuthCard";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  return (
    <AuthShell story={false}>
      <AuthCard title="Halaman tidak ditemukan" description="Alamat yang kamu buka tidak tersedia.">
        <ButtonLink to="/akun" block>Ke akun saya</ButtonLink>
      </AuthCard>
    </AuthShell>
  );
}
