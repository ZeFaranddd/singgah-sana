/** Bentuk respons backend saat ini: { success, message?, data }. */
export type ApiResult<T> = {
  success: true;
  message?: string;
  count?: number;
  data: T;
};
