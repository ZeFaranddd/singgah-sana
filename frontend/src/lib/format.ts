import type { Kos, PemilikRingkas, TipeKos } from './types'

const rupiahFormat = new Intl.NumberFormat('id-ID')

export const rupiah = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? '-' : `Rp ${rupiahFormat.format(Number(n))}`

export const tipeLabel = (tipe: TipeKos | string) =>
  tipe ? tipe.charAt(0).toUpperCase() + tipe.slice(1) : ''

const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export const tanggal = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
}

const jam = (d: Date) => `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`

export const tanggalWaktu = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return `${tanggal(iso)}, ${jam(d)}`
}

/** "Baru saja", "10 menit lalu", "Hari ini, 10.24", "Kemarin, 09.10", atau tanggal lengkap. */
export const waktuRelatif = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const now = new Date()
  const selisihMenit = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (selisihMenit < 1) return 'Baru saja'
  if (selisihMenit < 60) return `${selisihMenit} menit lalu`
  const hariIni = now.toDateString() === d.toDateString()
  if (hariIni) return `Hari ini, ${jam(d)}`
  const kemarin = new Date(now)
  kemarin.setDate(now.getDate() - 1)
  if (kemarin.toDateString() === d.toDateString()) return `Kemarin, ${jam(d)}`
  return tanggalWaktu(iso)
}

export const inisial = (nama?: string) => {
  const bagian = (nama || '').trim().split(/\s+/).filter(Boolean)
  if (bagian.length === 0) return '?'
  if (bagian.length === 1) return bagian[0].slice(0, 2).toUpperCase()
  return (bagian[0][0] + bagian[bagian.length - 1][0]).toUpperCase()
}

export const namaDepan = (nama?: string) => (nama || '').trim().split(/\s+/)[0] || ''

/** Ubah nomor lokal (08xx) menjadi tautan WhatsApp internasional (62xx). */
export const linkWhatsApp = (telepon?: string, teks?: string) => {
  if (!telepon) return ''
  let digit = telepon.replace(/\D/g, '')
  if (digit.startsWith('0')) digit = `62${digit.slice(1)}`
  else if (digit.startsWith('8')) digit = `62${digit}`
  if (digit.length < 8) return ''
  return `https://wa.me/${digit}${teks ? `?text=${encodeURIComponent(teks)}` : ''}`
}

/** Pemilik bisa berupa objek (populate) atau sekadar id. */
export const pemilikOf = (kos: Pick<Kos, 'pemilik_id'>): PemilikRingkas | null =>
  kos.pemilik_id && typeof kos.pemilik_id === 'object' ? kos.pemilik_id : null

// Foto cadangan bila gambar gagal dimuat (berkas bawaan frontend/public/assets)
export const FOTO_CADANGAN = ['/assets/42ce5.png', '/assets/cdcb4.png', '/assets/423bf.png', '/assets/c8ce8.png']

export const fotoUtama = (kos: Pick<Kos, 'foto' | '_id'>, index = 0) =>
  kos.foto?.[index] || FOTO_CADANGAN[(index + kos._id.charCodeAt(kos._id.length - 1)) % FOTO_CADANGAN.length]

export const alasanLabel: Record<string, string> = {
  informasi_tidak_akurat: 'Informasi tidak akurat',
  foto_tidak_sesuai: 'Foto tidak sesuai kenyataan',
  dugaan_penipuan: 'Dugaan penipuan',
  kamar_sudah_penuh: 'Kamar sudah penuh',
  lainnya: 'Lainnya',
}

export const FASILITAS_UMUM = [
  'AC',
  'WiFi',
  'Kamar Mandi Dalam',
  'Water Heater',
  'Kasur',
  'Lemari',
  'Meja Belajar',
  'Dapur Bersama',
  'Parkir Motor',
  'Parkir Mobil',
  'CCTV 24 Jam',
  'Laundry',
]
