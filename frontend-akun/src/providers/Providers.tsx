"use client";

import type { ReactNode } from "react";
import { SkipLink } from "../components/layout/Shells";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../features/auth/AuthContext";
import { RouterBridge } from "../lib/router";
import { DevPanel } from "./DevPanel";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterBridge />
        <SkipLink />
        {children}
        {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_API_MOCK === "true" && <DevPanel />}
      </AuthProvider>
    </ToastProvider>
  );
}
