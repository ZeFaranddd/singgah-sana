"use client";

import { useEffect, type ReactNode } from "react";
import { Spinner } from "../../components/ui/Feedback";
import { navigate, useLocation } from "../../lib/router";
import { useAuth } from "./AuthContext";

/**
 * Pemeriksaan sesi di klien hanya untuk pengalaman pengguna (arahkan ke halaman yang tepat).
 * Keputusan izin sebenarnya tetap di backend pada setiap request (Kontrak bagian 7).
 */
function FullPageSpinner() {
  return <div className="page-center"><Spinner label="Memuat…" /></div>;
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => { navigate(to, { replace: true, force: true }); }, [to]);
  return <FullPageSpinner />;
}

/** Halaman untuk tamu (masuk, daftar, lupa sandi). Pengguna yang sudah masuk dialihkan ke akun. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return <FullPageSpinner />;
  if (status === "authenticated") return <Redirect to="/akun" />;
  return <>{children}</>;
}

/** Halaman anggota. Tamu dialihkan ke masuk (dengan tujuan semula), akun dibatasi ke /dibatasi. */
export function MemberOnly({ children }: { children: ReactNode }) {
  const { status, signOutTarget } = useAuth();
  const { raw } = useLocation();
  if (status === "loading") return <FullPageSpinner />;
  if (signOutTarget) return <Redirect to={signOutTarget} />; // keluar/hapus akun disengaja: jangan simpan "next"
  if (status === "restricted") return <Redirect to="/dibatasi" />;
  if (status !== "authenticated") return <Redirect to={`/masuk?next=${encodeURIComponent(raw)}`} />;
  return <>{children}</>;
}

/** Jalur "/": placeholder. Dimiliki bagian Jelajah; saat digabung, halaman itu menggantikan ini. */
export function HomeRedirect() {
  const { status } = useAuth();
  if (status === "loading") return <FullPageSpinner />;
  return <Redirect to={status === "authenticated" ? "/akun" : "/masuk"} />;
}
