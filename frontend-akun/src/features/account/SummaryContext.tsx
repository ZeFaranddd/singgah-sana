"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Ringkasan } from "../../lib/api/types";
import { useAsync, type AsyncState } from "../../lib/hooks/useAsync";
import { accountApi } from "./api";

type Value = AsyncState<Ringkasan> & { reload: () => void };
const Ctx = createContext<Value | null>(null);

/** Satu pemuatan ringkasan dipakai header (lencana) dan halaman Ringkasan. */
export function SummaryProvider({ children }: { children: ReactNode }) {
  const s = useAsync((signal) => accountApi.summary(signal), []);
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}
export function useSummary(): Value | null {
  return useContext(Ctx);
}
