const mongoose = require('mongoose');

const ALASAN_LAPORAN = [
  'informasi_tidak_akurat',
  'foto_tidak_sesuai',
  'dugaan_penipuan',
  'kamar_sudah_penuh',
  'lainnya',
];

const STATUS_LAPORAN = ['terbuka', 'diproses', 'selesai', 'ditolak'];

const laporanSchema = new mongoose.Schema(
  {
    pelapor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kos_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kos',
      required: true,
      index: true,
    },
    // Salinan nama kos: laporan tetap terbaca meski kos-nya kemudian dihapus
    kos_nama: {
      type: String,
      required: true,
      trim: true,
    },
    alasan: {
      type: String,
      enum: {
        values: ALASAN_LAPORAN,
        message: `Alasan laporan harus salah satu dari: ${ALASAN_LAPORAN.join(', ')}`,
      },
      required: [true, 'Alasan laporan wajib diisi'],
    },
    deskripsi: {
      type: String,
      required: [true, 'Deskripsi laporan wajib diisi'],
      trim: true,
      minlength: [10, 'Deskripsi laporan minimal 10 karakter'],
      maxlength: [1000, 'Deskripsi laporan maksimal 1000 karakter'],
    },
    status: {
      type: String,
      enum: STATUS_LAPORAN,
      default: 'terbuka',
      index: true,
    },
    catatan_admin: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Catatan admin maksimal 1000 karakter'],
    },
    ditangani_oleh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ditangani_pada: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Laporan = mongoose.model('Laporan', laporanSchema);
Laporan.ALASAN_LAPORAN = ALASAN_LAPORAN;
Laporan.STATUS_LAPORAN = STATUS_LAPORAN;

module.exports = Laporan;
