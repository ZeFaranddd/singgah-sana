const mongoose = require('mongoose');

const TIPE_NOTIFIKASI = [
  'pesan_baru',        // pemilik: ada pertanyaan baru dari pencari
  'balasan_pesan',     // pencari: pemilik membalas pertanyaan
  'kos_menunggu',      // admin: ada kos baru / perubahan kos yang perlu ditinjau
  'kos_disetujui',     // pemilik: kos disetujui admin
  'kos_ditolak',       // pemilik: kos ditolak admin
  'laporan_baru',      // admin: ada laporan pengguna
  'laporan_ditangani', // pencari: laporan yang dikirim sudah ditindaklanjuti
  'info',
];

const notifikasiSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tipe: {
      type: String,
      enum: TIPE_NOTIFIKASI,
      default: 'info',
    },
    judul: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    isi: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    // Path halaman di frontend yang dibuka saat notifikasi diklik, mis. '/pemilik/pesan'
    tautan: {
      type: String,
      default: '',
      trim: true,
    },
    dibaca: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notifikasiSchema.index({ user_id: 1, dibaca: 1, createdAt: -1 });

const Notifikasi = mongoose.model('Notifikasi', notifikasiSchema);
Notifikasi.TIPE_NOTIFIKASI = TIPE_NOTIFIKASI;

module.exports = Notifikasi;
