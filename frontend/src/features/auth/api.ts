import { apiRequest } from '@/lib/api/client';
import type { ApiResult } from '@/lib/api/types';
import type { Session, SessionUser } from './types';

type LoginResponse = SessionUser & { token: string };

/** POST /api/auth/login — mengembalikan sesi siap disimpan. */
export async function login(email: string, password: string): Promise<Session> {
  const result = await apiRequest<ApiResult<LoginResponse>>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  const { token, ...user } = result.data;
  return { token, user };
}
