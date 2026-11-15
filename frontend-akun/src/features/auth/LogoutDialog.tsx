"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Alert } from "../../components/ui/Feedback";
import { errorMessage } from "../../lib/api/client";
import { useAuth } from "./AuthContext";

const Ctx = createContext<() => void>(() => undefined);
export const useLogoutRequest = () => useContext(Ctx);

export function LogoutProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await logout("/masuk"); // gerbang anggota mengarahkan ke /masuk
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Ctx.Provider value={() => setOpen(true)}>
      {children}
      {open && (
        <Dialog title="Keluar dari akun?" description="Favorit dan percakapanmu tetap tersimpan. Kamu bisa masuk kembali kapan saja." onClose={() => setOpen(false)}>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={confirm} loading={busy} data-autofocus>Keluar</Button>
          </div>
        </Dialog>
      )}
    </Ctx.Provider>
  );
}
