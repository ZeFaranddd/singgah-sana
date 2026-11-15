import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'

/**
 * Router mini berbasis History API (tanpa dependensi tambahan).
 * Rute memakai path biasa (/kos/123), sehingga server harus mengembalikan index.html
 * untuk path non-API — sudah ditangani oleh backend/src/app.js dan proxy Vite.
 */

const NAV_EVENT = 'singgah:navigate'

const subscribe = (callback: () => void) => {
  window.addEventListener('popstate', callback)
  window.addEventListener(NAV_EVENT, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(NAV_EVENT, callback)
  }
}

const getSnapshot = () => window.location.pathname + window.location.search

export function navigate(to: string, options: { replace?: boolean } = {}) {
  const current = window.location.pathname + window.location.search + window.location.hash
  if (to === current) return
  if (options.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  window.dispatchEvent(new Event(NAV_EVENT))
}

export function useLocation() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '/')
  const index = snapshot.indexOf('?')
  return {
    pathname: index === -1 ? snapshot : snapshot.slice(0, index),
    search: index === -1 ? '' : snapshot.slice(index),
  }
}

export function useSearchParams() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)

  const setParams = useCallback(
    (next: Record<string, string | number | boolean | undefined | null>, options: { replace?: boolean } = {}) => {
      const merged = new URLSearchParams(window.location.search)
      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || value === false) merged.delete(key)
        else merged.set(key, String(value))
      })
      const qs = merged.toString()
      navigate(`${window.location.pathname}${qs ? `?${qs}` : ''}`, { replace: options.replace ?? true })
    },
    [],
  )

  return [params, setParams] as const
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
  children?: ReactNode
}

export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    // Biarkan browser menangani klik tengah, Ctrl/Cmd+klik, dan target baru
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (rest.target && rest.target !== '_self') return
    event.preventDefault()
    navigate(to)
  }
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  )
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    navigate(to, { replace: true })
  }, [to])
  return null
}

/** Cocokkan pola seperti "/kos/:id" dengan path; kembalikan params atau null. */
export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const clean = (value: string) => value.replace(/\/+$/, '') || '/'
  const patternParts = clean(pattern).split('/')
  const pathParts = clean(pathname).split('/')
  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i]
    const actual = pathParts[i]
    if (expected.startsWith(':')) {
      try {
        params[expected.slice(1)] = decodeURIComponent(actual)
      } catch {
        return null
      }
    } else if (expected !== actual) {
      return null
    }
  }
  return params
}
