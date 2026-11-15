import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const dot: Record<ToastKind, string> = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  info: 'bg-violet-300',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef<number[]>([])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++
    setItems((current) => [...current.slice(-3), { id, kind, message }])
    const timer = window.setTimeout(
      () => setItems((current) => current.filter((item) => item.id !== id)),
      kind === 'error' ? 5000 : 3200,
    )
    timers.current.push(timer)
  }, [])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.kind === 'error' ? 'alert' : 'status'}
            className="toast-in pointer-events-auto flex items-start gap-3 rounded-xl bg-[#0f172a] px-5 py-4 text-sm text-white shadow-xl"
          >
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot[item.kind]}`} />
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>')
  return ctx
}
