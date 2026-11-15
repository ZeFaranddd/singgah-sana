"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Pembungkus tipis next/navigation agar kode fitur tidak terikat langsung ke Next
 * dan navigasi imperatif (setelah login, guard perubahan belum disimpan) tetap sederhana.
 */
type AppRouter = ReturnType<typeof useRouter>;
let routerRef: AppRouter | null = null;

/** Dipasang sekali di root (Providers). */
export function RouterBridge() {
  const router = useRouter();
  useEffect(() => {
    routerRef = router;
    return () => { if (routerRef === router) routerRef = null; };
  }, [router]);
  return null;
}

export function useLocation() {
  const path = usePathname();
  const query = useSearchParams();
  const qs = query.toString();
  return { path, query, raw: qs ? `${path}?${qs}` : path };
}

let guard: ((to: string) => boolean) | null = null;
/** Menahan perpindahan (mis. perubahan belum disimpan). Kembalikan false untuk membatalkan. */
export function setNavigationGuard(fn: ((to: string) => boolean) | null) {
  guard = fn;
}
/** Dipakai <Link> sebelum berpindah. */
export function isNavigationAllowed(to: string) {
  return !guard || guard(to);
}

export function navigate(to: string, opts: { replace?: boolean; force?: boolean } = {}) {
  if (!opts.force && !isNavigationAllowed(to)) return;
  if (!routerRef) {
    if (opts.replace) window.location.replace(to);
    else window.location.assign(to);
    return;
  }
  if (opts.replace) routerRef.replace(to);
  else routerRef.push(to);
}

/** Hanya terima jalur internal ("/x"), bukan "//host" atau URL absolut (cegah open redirect). */
export function safeInternalPath(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}
