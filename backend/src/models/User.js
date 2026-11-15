const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, 'Nama lengkap wajib diisi'],
      trim: true,
      maxlength: [100, 'Nama maksimal 100 karakter'],
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        'Format email tidak valid',
      ],
    },
    password: {
      type: String,
      required: [true, 'Kata sandi wajib diisi'],
      minlength: [6, 'Kata sandi minimal 6 karakter'],
      select: false,
    },
    nomor_telepon: {
      type: String,
      required: [true, 'Nomor telepon/WhatsApp wajib diisi'],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'pemilik', 'pencari'],
        message: 'Role harus salah satu dari: admin, pemilik, atau pencari',
      },
      default: 'pencari',
    },
    foto_profil: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    },
    // Preferensi pencarian kos (dipakai pencari untuk rekomendasi & pengisian filter otomatis)
    preferensi: {
      area_kampus: { type: String, default: '', trim: true, maxlength: 80 },
      tipe: {
        type: String,
        enum: { values: ['', 'putra', 'putri', 'campur'], message: 'Preferensi tipe harus putra, putri, atau campur' },
        default: '',
      },
      harga_maks: { type: Number, default: null, min: [0, 'Anggaran maksimal tidak boleh negatif'] },
      fasilitas: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
