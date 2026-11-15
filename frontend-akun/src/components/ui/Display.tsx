"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { initials } from "../../lib/format";

export function Badge({ tone = "brand", children, className = "" }: { tone?: "brand" | "success" | "danger" | "neutral"; children: ReactNode; className?: string }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

export function Card({ as: Tag = "section", className = "", children, ...rest }: { as?: "section" | "div" | "article"; className?: string; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return <Tag className={`card ${className}`} {...(rest as object)}>{children}</Tag>;
}

export function Avatar({ nama, fotoUrl, size = 40 }: { nama: string; fotoUrl?: string | null; size?: 40 | 64 }) {
  return fotoUrl ? (
    <img className="avatar" style={{ width: size, height: size }} src={fotoUrl} alt="" />
  ) : (
    <span className="avatar" style={{ width: size, height: size, fontSize: size === 64 ? 20 : 14 }} aria-hidden="true">
      {initials(nama)}
    </span>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chip ${active ? "active" : ""}`} aria-pressed={!!active} onClick={onClick}>
      {children}
    </button>
  );
}

export function Switch({ checked, onChange, labelledBy, describedBy }: { checked: boolean; onChange: (v: boolean) => void; labelledBy: string; describedBy?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={`toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function PageHeading({ title, description, id, level = 1 }: { title: string; description?: string; id?: string; level?: 1 | 2 }) {
  const H = level === 1 ? "h1" : "h2";
  return (
    <div className="page-heading">
      <H id={id}>{title}</H>
      {description && <p>{description}</p>}
    </div>
  );
}
