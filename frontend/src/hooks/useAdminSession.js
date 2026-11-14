import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ApiError, apiRequest } from '../lib/api';
import { ADMIN_TOKEN_KEY } from '../lib/auth';

export default function useAdminSession() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);

  const retry = useCallback(() => {
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
    if (!router.isReady) {
      return;
    }

    let isCurrent = true;
    const storedToken = window.sessionStorage.getItem(ADMIN_TOKEN_KEY);

    if (!storedToken) {
      setStatus('redirecting');
      router.replace('/admin/login');
      return () => {
        isCurrent = false;
      };
    }

    setStatus('checking');
    setErrorMessage('');

    async function checkSession() {
      try {
        const result = await apiRequest('/auth/me', { token: storedToken });
        if (!isCurrent) {
          return;
        }

        if (result.data?.role !== 'admin') {
          window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setStatus('forbidden');
          return;
        }

        setAdmin(result.data);
        setToken(storedToken);
        setStatus('authenticated');
      } catch (error) {
        if (!isCurrent) {
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

    checkSession();

    return () => {
      isCurrent = false;
    };
  }, [expireSession, retryVersion, router]);

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
