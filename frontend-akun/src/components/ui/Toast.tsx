"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

interface ToastItem {
  id: number;
  tone: "success" | "error" | "info";
  message: string;
  action?: { label: string; onClick: () => void };
}
interface Ctx {
  show: (t: Omit<ToastItem, "id">) => void;
}
const ToastContext = createContext<Ctx>({ show: () => undefined });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback((t: Omit<ToastItem, "id">) => {
    const id = ++seq.current;
    setItems((l) => [...l.slice(-2), { ...t, id }]);
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="region" aria-label="Notifikasi" aria-live="polite">
        {items.map((t) => (
          <Toast key={t.id} item={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, item.action ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [item, onDone]);
  return (
    <div className={`toast toast-${item.tone}`} role={item.tone === "error" ? "alert" : "status"}>
      <Icon name={item.tone === "error" ? "circle-alert" : item.tone === "success" ? "circle-check" : "info"} />
      <span>{item.message}</span>
      {item.action && (
        <button type="button" className="link" onClick={() => { item.action!.onClick(); onDone(); }}>
          {item.action.label}
        </button>
      )}
      <button type="button" className="toast-close" onClick={onDone} aria-label="Tutup notifikasi">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
