export const ADMIN_KOS_PAGE_SIZE = 15;

export function isAdminKosListResponse(result) {
  return (
    Array.isArray(result?.data) &&
    Number.isInteger(result.pagination?.currentPage) &&
    Number.isInteger(result.pagination?.totalPages) &&
    Number.isInteger(result.pagination?.totalData) &&
    Number.isInteger(result.pagination?.limit)
  );
}
