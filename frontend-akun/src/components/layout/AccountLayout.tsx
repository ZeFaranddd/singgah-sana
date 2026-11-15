"use client";

import type { ReactNode } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { useLogoutRequest } from "../../features/auth/LogoutDialog";
import { externalPaths } from "../../lib/config";
import { useLocation } from "../../lib/router";
import { Button, ButtonLink } from "../ui/Button";
import { Icon, type IconName } from "../ui/Icon";
import { Link } from "../ui/Link";
import { Footer } from "./Brand";
import { MemberHeader } from "./MemberHeader";
import { MainRegion } from "./Shells";

const nav: { to: string; icon: IconName; label: string }[] = [
  { to: "/akun", icon: "house", label: "Ringkasan" },
  { to: "/akun/profil", icon: "user", label: "Profil" },
  { to: "/akun/keamanan", icon: "lock", label: "Keamanan" },
  { to: "/akun/notifikasi", icon: "bell", label: "Notifikasi" },
  { to: "/akun/preferensi", icon: "sliders-horizontal", label: "Preferensi" },
];

export function AccountLayout({ children }: { children: ReactNode }) {
  const { path } = useLocation();
  const { user } = useAuth();
  const requestLogout = useLogoutRequest();
  const isOwner = user?.role === "pemilik" || user?.role === "admin";
  return (
    <div className="page account-page">
      <MemberHeader />
      <div className="account-main">
        <aside className="sidebar" aria-label="Menu akun saya">
          <h2 className="sidebar-title">Akun saya</h2>
          <p className="sidebar-sub">Kelola pengalamanmu</p>
          <nav aria-label="Akun saya">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} aria-current={path === n.to ? "page" : undefined}>
                <Icon name={n.icon} />
                {n.label}
              </Link>
            ))}
          </nav>
          {isOwner && <ButtonLink to={externalPaths.ownerSpace} external variant="secondary" block>Ruang pemilik</ButtonLink>}
          <Button variant="ghost" block onClick={requestLogout}>Keluar</Button>
        </aside>
        <MainRegion routeKey={path} className="account-content">
          {children}
        </MainRegion>
      </div>
      <Footer />
    </div>
  );
}
