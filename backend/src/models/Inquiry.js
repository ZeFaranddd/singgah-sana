const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    pencari_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pemilik_id: {
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
    pesan: {
      type: String,
      required: [true, 'Pesan pertanyaan wajib diisi'],
      trim: true,
    },
    balasan: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['menunggu', 'dibalas'],
      default: 'menunggu',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
