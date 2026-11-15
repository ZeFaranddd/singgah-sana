"use client";

import type { ReactNode } from "react";
import { LogoutProvider } from "../auth/LogoutDialog";
import { SummaryProvider } from "./SummaryContext";

export function MemberArea({ children }: { children: ReactNode }) {
  return (
    <SummaryProvider>
      <LogoutProvider>{children}</LogoutProvider>
    </SummaryProvider>
  );
}
