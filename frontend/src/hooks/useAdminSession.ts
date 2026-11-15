import { useCallback, useEffect, useState } from 'react';
import { getAdminSession } from '../lib/adminApi';
import { ApiError } from '../lib/api';
import { ADMIN_TOKEN_KEY } from '../lib/auth';

export type AdminUser = Record<string, unknown> & {
  email?: string;
  nama?: string;
  role: 'admin';
};

export type AdminSessionStatus =
  | 'checking'
  | 'redirecting'
  | 'forbidden'
  | 'error'
  | 'authenticated';

export type AdminSession = {
  admin: AdminUser | null;
  errorMessage: string;
  expireSession: () => void;
  logout: () => void;
  retry: () => void;
  status: AdminSessionStatus;
  token: string | null;
};

export type AdminSessionRouter = {
  isReady?: boolean;
  replace: (url: string) => unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getAdminUser(response: unknown): AdminUser | null {
  if (!isRecord(response) || !isRecord(response.data)) {
    return null;
  }

  const user = response.data;
  if (user.role !== 'admin') {
    return null;
  }

  return {
    ...user,
    email: typeof user.email === 'string' ? user.email : undefined,
    nama: typeof user.nama === 'string' ? user.nama : undefined,
    role: 'admin',
  };
}

export default function useAdminSession(
  router: AdminSessionRouter
): AdminSession {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AdminSessionStatus>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);
  const routerReady = router.isReady !== false;

  const retry = useCallback(() => {
    setStatus('checking');
    setErrorMessage('');
    setRetryVersion((version) => version + 1);
  }, []);

  const logout = useCallback(() => {
    window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdmin(null);
    setToken(null);
    setStatus('redirecting');
    router.replace('/admin/login');
  }, [router]);

  const expireSession = useCallback(() => {
    window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdmin(null);
    setToken(null);
    setStatus('redirecting');
    router.replace('/admin/login?expired=1');
  }, [router]);

  useEffect(() => {
    if (!routerReady) {
      return;
    }

    let isCurrent = true;
    const storedToken = window.sessionStorage.getItem(ADMIN_TOKEN_KEY);

    if (!storedToken) {
      router.replace('/admin/login');
      return () => {
        isCurrent = false;
      };
    }

    async function checkSession() {
      try {
        const result: unknown = await getAdminSession(storedToken);
        if (!isCurrent) {
          return;
        }

        const user = getAdminUser(result);
        if (!user) {
          window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdmin(null);
          setToken(null);
          setStatus('forbidden');
          return;
        }

        setAdmin(user);
        setToken(storedToken);
        setStatus('authenticated');
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        if (error instanceof ApiError && error.status === 403) {
          window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdmin(null);
          setToken(null);
          setStatus('forbidden');
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          expireSession();
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Sesi admin tidak dapat diperiksa.'
        );
        setStatus('error');
      }
    }

    void checkSession();

    return () => {
      isCurrent = false;
    };
  }, [expireSession, retryVersion, router, routerReady]);

  return {
    admin,
    errorMessage,
    expireSession,
    logout,
    retry,
    status,
    token,
  };
}
