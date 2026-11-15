export const MOCK_CHANGE_KOS_ID = '000000000000000000001031';

const mockOwner = {
  _id: '000000000000000000001008',
  kode: 'USR-1008',
  nama: 'Nadia Putri',
  email: 'nadia@example.com',
  nomor_telepon: '081234567890',
};

const mockChangeSubmittedAt = '2026-11-13T03:50:00.000Z';

export const mockChangeQueueItem = {
  jenis: 'perubahan',
  kos: {
    _id: MOCK_CHANGE_KOS_ID,
    kode: 'KS-1031',
    nama: 'Kos Harmoni Pogung',
  },
  pemilik: {
    _id: mockOwner._id,
    kode: mockOwner.kode,
    nama: mockOwner.nama,
  },
  dikirim_pada: mockChangeSubmittedAt,
};

export const mockChangeKosDetail = {
  _id: MOCK_CHANGE_KOS_ID,
  kode: 'KS-1031',
  nama: 'Kos Harmoni Pogung',
  deskripsi: 'Dekat kampus',
  alamat: 'Jl. Pogung Kidul No. 42B, Mlati, Sleman',
  area_kampus: 'Pogung',
  tipe: 'putra',
  koordinat: {
    latitude: -7.7614,
    longitude: 110.3762,
  },
  foto: [],
  fasilitas: ['WiFi', 'Parkir'],
  peraturan: ['Akses 24 jam'],
  harga_mulai: 1650000,
  jumlah_kamar_total: 12,
  jumlah_kamar_tersedia: 8,
  tipe_kamar: [
    {
      _id: '000000000000000000000001',
      nama: 'Standard',
      ukuran: '3 x 4 m',
      harga_per_bulan: 1650000,
      deposit: 500000,
      masa_sewa: 'bulanan',
      perabot: ['Kasur', 'Lemari', 'Meja'],
      fasilitas_kamar: ['AC', 'WiFi', 'Kamar mandi dalam'],
      foto: [],
      jumlah_kamar_total: 12,
      jumlah_kamar_tersedia: 8,
    },
  ],
  status_verifikasi: 'approved',
  pemilik: mockOwner,
  perubahan_tertunda: {
    status: 'pending',
    diajukan_pada: mockChangeSubmittedAt,
    catatan_pemilik: 'Kami menambahkan dapur bersama.',
    catatan_admin: '',
    data: {
      deskripsi: 'Dekat kampus, tambahan akses bus',
      fasilitas: ['WiFi', 'Parkir', 'Dapur bersama'],
      foto: [
        '/uploads/kos-a.jpg',
        '/uploads/kos-b.jpg',
        '/uploads/kos-c.jpg',
        '/uploads/kos-d.jpg',
      ],
    },
    daftar_perubahan: [
      {
        field: 'deskripsi',
        label: 'Deskripsi',
        lama: 'Dekat kampus',
        baru: 'Dekat kampus, tambahan akses bus',
      },
      {
        field: 'fasilitas',
        label: 'Fasilitas',
        lama: ['WiFi', 'Parkir'],
        baru: ['WiFi', 'Parkir', 'Dapur bersama'],
      },
      {
        field: 'foto',
        label: 'Foto',
        lama: ['/uploads/kos-a.jpg', '/uploads/kos-b.jpg', '/uploads/kos-c.jpg'],
        baru: [
          '/uploads/kos-a.jpg',
          '/uploads/kos-b.jpg',
          '/uploads/kos-c.jpg',
          '/uploads/kos-d.jpg',
        ],
      },
    ],
  },
  createdAt: '2026-10-25T03:50:00.000Z',
  updatedAt: mockChangeSubmittedAt,
};

export function isMockAdminChangeKos(id) {
  return String(id) === MOCK_CHANGE_KOS_ID;
}
