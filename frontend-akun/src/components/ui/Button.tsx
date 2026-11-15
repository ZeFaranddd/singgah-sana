"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "./Link";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface BaseProps {
  variant?: Variant;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  block,
  loading,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}: BaseProps & { loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`btn btn-${variant} ${block ? "btn-block" : ""} ${className}`}
      {...rest}
    >
      {loading && <span className="spinner spinner-inline" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Tautan bergaya tombol (navigasi tetap berupa <a>, bukan <button>). */
export function ButtonLink({
  to,
  external,
  variant = "primary",
  block,
  className = "",
  children,
}: BaseProps & { to: string; external?: boolean }) {
  return (
    <Link to={to} external={external} className={`btn btn-${variant} ${block ? "btn-block" : ""} ${className}`}>
      {children}
    </Link>
  );
}

export function TextButton({ className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`link ${className}`} {...rest} />;
}
