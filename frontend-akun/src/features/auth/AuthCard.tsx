"use client";

import type { FormEvent, ReactNode, Ref } from "react";
import { Logo } from "../../components/layout/Brand";
import { Icon, type IconName } from "../../components/ui/Icon";

export function AuthCard({ title, description, children, onSubmit, noValidate = true, formRef }: { title: string; description?: ReactNode; children: ReactNode; onSubmit?: (e: FormEvent) => void; noValidate?: boolean; formRef?: Ref<HTMLFormElement> }) {
  const body = (
    <>
      <Logo size={72} />
      <h1>{title}</h1>
      {description && <p className="auth-desc">{description}</p>}
      {children}
    </>
  );
  return onSubmit ? (
    <form ref={formRef} className="auth-card" onSubmit={onSubmit} noValidate={noValidate}>{body}</form>
  ) : (
    <section className="auth-card">{body}</section>
  );
}

export function StatusIcon({ name, tone = "brand" }: { name: IconName; tone?: "brand" | "success" }) {
  return <span className={`status-icon ${tone === "success" ? "success" : ""}`}><Icon name={name} size={28} /></span>;
}
