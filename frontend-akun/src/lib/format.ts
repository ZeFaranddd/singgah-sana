const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const formatRupiah = (n: number) => rupiah.format(n).replace(/ /g, " ");

export function initials(nama: string) {
  return nama.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function formatTime(iso: string, nowMs = Date.now()) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date(nowMs).toDateString();
  const yesterday = d.toDateString() === new Date(nowMs - 86_400_000).toDateString();
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
  if (sameDay) return `Hari ini · ${jam}`;
  if (yesterday) return `Kemarin · ${jam}`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
export const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
