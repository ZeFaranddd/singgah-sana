const mongoose = require('mongoose');

// Catatan audit untuk halaman "Aktivitas" milik admin.
// Aktor & target disimpan sebagai salinan teks agar riwayat tetap terbaca
// walaupun pengguna atau kos yang bersangkutan sudah dihapus.
const aktivitasSchema = new mongoose.Schema(
  {
    aktor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    aktor_nama: { type: String, default: 'Sistem', trim: true },
    aktor_role: { type: String, default: 'sistem', trim: true },
    aksi: { type: String, required: true, trim: true, index: true },
    target_tipe: { type: String, enum: ['kos', 'laporan', 'user', 'lainnya'], default: 'lainnya' },
    target_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    target_label: { type: String, default: '', trim: true },
    ringkasan: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

aktivitasSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Aktivitas', aktivitasSchema);
