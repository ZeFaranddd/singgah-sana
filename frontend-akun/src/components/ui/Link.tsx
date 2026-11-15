"use client";

import NextLink from "next/link";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { isNavigationAllowed } from "../../lib/router";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  /** Tujuan milik bagian FE lain atau di luar aplikasi: tautan biasa, bukan navigasi klien. */
  external?: boolean;
}

export function Link({ to, external, onClick, children, ...rest }: Props) {
  if (external)
    return (
      <a href={to} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented && !isNavigationAllowed(to)) e.preventDefault(); // guard perubahan belum disimpan
  };
  return (
    <NextLink href={to} onClick={handle} {...rest}>
      {children}
    </NextLink>
  );
}
