export function formatAdminDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
