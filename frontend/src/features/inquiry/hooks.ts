'use client';

import { useAsync } from '@/lib/use-async';
import { listInquiryPemilik } from './api';

export function useInquiryPemilik() {
  return useAsync((signal) => listInquiryPemilik(signal), []);
}
