"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, setSessionErrorHandler } from "../../lib/api/client";
import type { User } from "../../lib/api/types";
import { navigate } from "../../lib/router";
import { authApi } from "./api";

type Status = "loading" | "authenticated" | "guest" | "restricted";
interface AuthValue {
  status: Status;
  user: User | null;
  setUser: (u: User) => void;
  login: (b: { email: string; password: string }) => Promise<User>;
  register: (b: Parameters<typeof authApi.register>[0]) => Promise<User>;
  /** `to`: halaman tujuan setelah keluar; gerbang anggota mengarahkan ke sana (bukan ke "masuk?next="). */
  logout: (to?: string) => Promise<void>;
  /** Hapus sesi lokal tanpa memanggil API (mis. setelah akun dihapus). */
  clear: (to?: string) => void;
  /** Tujuan pasca-keluar yang sedang berlaku, atau null. */
  signOutTarget: string | null;
  refresh: () => Promise<User | null>;
}
const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: Status; user: User | null }>({ status: "loading", user: null });
  const [signOutTarget, setSignOutTarget] = useState<string | null>(null);

  const apply = useCallback((user: User | null) => {
    if (user) setSignOutTarget(null);
    setState(user ? { status: user.status === "suspended" ? "restricted" : "authenticated", user } : { status: "guest", user: null });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const u = await authApi.me();
      apply(u);
      return u;
    } catch (e) {
      if (e instanceof ApiError && e.code === "ACCOUNT_SUSPENDED") setState({ status: "restricted", user: null });
      else setState({ status: "guest", user: null }); // 401 atau server tak terjangkau: perlakukan sebagai belum masuk
      return null;
    }
  }, [apply]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Sesi berakhir / akun dibatasi di tengah pemakaian, dari request apa pun.
  useEffect(() => {
    setSessionErrorHandler((e) => {
      if (e.code === "ACCOUNT_SUSPENDED") {
        setState({ status: "restricted", user: null });
        navigate("/dibatasi", { replace: true, force: true });
      } else {
        setState({ status: "guest", user: null });
        navigate("/masuk?sesi=berakhir", { replace: true, force: true });
      }
    });
    return () => setSessionErrorHandler(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ...state,
      setUser: (u) => apply(u),
      login: async (b) => { const u = await authApi.login(b); apply(u); return u; },
      register: async (b) => { const u = await authApi.register(b); apply(u); return u; },
      signOutTarget,
      logout: async (to = "/masuk") => {
        try { await authApi.logout(); } finally { setSignOutTarget(to); setState({ status: "guest", user: null }); }
      },
      clear: (to = "/masuk") => { setSignOutTarget(to); setState({ status: "guest", user: null }); },
      refresh,
    }),
    [state, signOutTarget, apply, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
