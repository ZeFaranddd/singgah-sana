"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { useLogoutRequest } from "../../features/auth/LogoutDialog";
import { useSummary } from "../../features/account/SummaryContext";
import { externalPaths } from "../../lib/config";
import { useLocation } from "../../lib/router";
import { Avatar } from "../ui/Display";
import { Icon } from "../ui/Icon";
import { Link } from "../ui/Link";
import { Logo } from "./Brand";

const mainNav = [
  { to: externalPaths.explore, label: "Jelajah Kos", external: true },
  { to: "/favorit", label: "Favorit" },
  { to: "/pesan", label: "Pesan" },
  { to: "/akun", label: "Ringkasan" },
] as const;

export function MemberHeader() {
  const requestLogout = useLogoutRequest();
  const { user } = useAuth();
  const { path } = useLocation();
  const summary = useSummary();
  const unread = summary?.status === "success" ? summary.data.notifikasiBaru : 0;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!user) return null;
  const isOwner = user.role === "pemilik" || user.role === "admin";

  return (
    <header className="member-header">
      <Link to="/akun" aria-label="Singgah Sana, ringkasan akun"><Logo /></Link>
      <nav aria-label="Navigasi utama" className="main-nav">
        {mainNav.map((n) => (
          <Link key={n.to} to={n.to} external={"external" in n} aria-current={path === n.to ? "page" : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="account-actions">
        <Link to="/akun/notifikasi" className="icon-button" aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}>
          <Icon name="bell" size={24} />
          {unread > 0 && <span className="dot-badge" aria-hidden="true">{unread}</span>}
        </Link>
        <div className="menu-wrap" ref={wrap}>
          <button ref={trigger} type="button" className="account-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Avatar nama={user.nama} fotoUrl={user.fotoUrl} />
            <span className="account-name">{user.nama}</span>
            <Icon name="chevron-down" size={16} />
          </button>
          {open && (
            <div className="menu" role="menu" aria-label="Menu akun">
              <div className="menu-head">
                <strong>{user.nama}</strong>
                <span>{user.email}</span>
              </div>
              <div className="menu-mobile-only">
                {mainNav.map((n) => (
                  <Link key={n.to} role="menuitem" to={n.to} external={"external" in n}>{n.label}</Link>
                ))}
              </div>
              <Link role="menuitem" to="/akun/profil">Profil</Link>
              <Link role="menuitem" to="/akun/keamanan">Keamanan</Link>
              {isOwner && <Link role="menuitem" to={externalPaths.ownerSpace} external>Ruang pemilik</Link>}
              <button type="button" role="menuitem" onClick={() => { setOpen(false); requestLogout(); }}>Keluar</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
