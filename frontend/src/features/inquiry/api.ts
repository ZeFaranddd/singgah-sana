import { apiRequest } from '@/lib/api/client';
import type { ApiResult } from '@/lib/api/types';
import type { OwnerInquiry } from './types';

/** GET /api/inquiries/owner  (target: GET /inquiry/owner) */
export async function listInquiryPemilik(signal?: AbortSignal): Promise<OwnerInquiry[]> {
  const result = await apiRequest<ApiResult<OwnerInquiry[]>>('/inquiries/owner', { signal });
  return result.data;
}

/** PATCH /api/inquiries/:id/reply  (target: PATCH /inquiry/:id/reply). Balasan hanya sekali. */
export async function balasInquiry(id: string, balasan: string): Promise<ApiResult<OwnerInquiry>> {
  return apiRequest<ApiResult<OwnerInquiry>>(`/inquiries/${encodeURIComponent(id)}/reply`, {
    method: 'PATCH',
    body: { balasan },
  });
}
