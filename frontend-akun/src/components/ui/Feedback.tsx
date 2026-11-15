"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { errorMessage } from "../../lib/api/client";

type Tone = "info" | "success" | "error";
const toneIcon: Record<Tone, IconName> = { info: "info", success: "circle-check", error: "circle-alert" };

export function Alert({ tone = "info", children, action }: { tone?: Tone; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon name={toneIcon[tone]} />
      <span className="alert-body">{children}</span>
      {action}
    </div>
  );
}

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="state-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`skeleton-block ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton" style={{ width: `${90 - i * 18}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: IconName; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={icon} size={32} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Data belum dapat dimuat" }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <div className="empty-state empty-state-error" role="alert">
      <span className="empty-icon"><Icon name="circle-alert" size={32} /></span>
      <h2>{title}</h2>
      <p>{errorMessage(error, "Terjadi kesalahan saat memuat data.")}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Coba lagi</Button>}
    </div>
  );
}
