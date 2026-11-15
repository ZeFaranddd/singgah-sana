"use client";

import type { ReactNode } from "react";
import { MemberArea } from "../../features/account/MemberArea";
import { MemberOnly } from "../../features/auth/RouteGuards";
import { AuthShell } from "./Shells";

/** Layout kelompok rute (auth): header, panel cerita, footer. Bertahan antarhalaman. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}

/** Layout kelompok rute (member): gerbang sesi + konteks ringkasan/keluar yang dipakai bersama. */
export function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <MemberOnly>
      <MemberArea>{children}</MemberArea>
    </MemberOnly>
  );
}
