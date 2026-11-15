import type { TipeKos } from './types';

export const TIPE_OPTIONS: { value: TipeKos; label: string }[] = [
  { value: 'putra', label: 'Putra' },
  { value: 'putri', label: 'Putri' },
  { value: 'campur', label: 'Campur' },
];

// Fasilitas yang disebut pada user story US2 dan desain Figma. Pemilik tetap bisa menambah sendiri.
export const FASILITAS_UMUM = [
  'AC',
  'WiFi',
  'Kamar mandi dalam',
  'Parkir motor',
  'Parkir mobil',
  'Dapur bersama',
  'Kasur',
  'Lemari',
  'Meja belajar',
  'Akses 24 jam',
  'Laundry',
  'CCTV',
];

export const AREA_KAMPUS = ['Pogung', 'Sekip', 'Kaliurang', 'Karangmalang', 'Sendowo', 'Sagan', 'Karangwuni'];

// Titik awal peta saat koordinat belum diisi (kawasan kampus UGM). Bukan nilai yang disimpan.
export const PETA_TITIK_AWAL = { latitude: -7.7713, longitude: 110.3775 };
