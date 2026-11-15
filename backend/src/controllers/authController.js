const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/jwt');
const { catatAktivitas } = require('../utils/aktivitas');
const { kirimNotifikasi } = require('../utils/notifikasi');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { nama, email, password, nomor_telepon, role } = req.body;

    if (!nama || !email || !password || !nomor_telepon) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi seluruh field wajib: nama, email, password, nomor_telepon',
      });
    }

    let userRole = role ? role.toLowerCase() : 'pencari';
    if (userRole === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Pendaftaran akun dengan peran Administrator tidak diizinkan melalui form publik',
      });
    }

    if (!['pencari', 'pemilik'].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Peran pengguna haruslah "pencari" atau "pemilik"',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar, silakan gunakan email lain atau login',
      });
    }

    const user = await User.create({
      nama,
      email,
      password,
      nomor_telepon,
      role: userRole,
    });

    const token = generateToken(user._id, user.role);

    await catatAktivitas({
      aktor: user,
      aksi: 'user_terdaftar',
      targetTipe: 'user',
      targetId: user._id,
      targetLabel: user.nama,
      ringkasan: `${user.nama} mendaftar sebagai ${user.role}`,
    });
    await kirimNotifikasi(user._id, {
      tipe: 'info',
      judul: 'Selamat datang di Singgah-sana',
      isi:
        user.role === 'pemilik'
          ? 'Akunmu sudah aktif. Daftarkan kos pertamamu agar bisa ditinjau admin.'
          : 'Akunmu sudah aktif. Mulai jelajahi kos di sekitar kampus.',
      tautan: user.role === 'pemilik' ? '/pemilik/kos/baru' : '/kos',
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi akun berhasil!',
      data: {
        _id: user._id,
        nama: user.nama,
        email: user.email,
        nomor_telepon: user.nomor_telepon,
        role: user.role,
        foto_profil: user.foto_profil,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mohon masukkan email dan password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid: email tidak terdaftar',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid: kata sandi salah',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        _id: user._id,
        nama: user.nama,
        email: user.email,
        nomor_telepon: user.nomor_telepon,
        role: user.role,
        foto_profil: user.foto_profil,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { nama, nomor_telepon, foto_profil, preferensi } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    if (nama) user.nama = nama;
    if (nomor_telepon) user.nomor_telepon = nomor_telepon;
    if (foto_profil) user.foto_profil = foto_profil;

    if (preferensi && typeof preferensi === 'object') {
      // Memakai user.set() per path agar aman untuk nested path Mongoose
      if (preferensi.area_kampus !== undefined) {
        user.set('preferensi.area_kampus', String(preferensi.area_kampus));
      }
      if (preferensi.tipe !== undefined) {
        user.set('preferensi.tipe', String(preferensi.tipe).toLowerCase());
      }
      if (preferensi.harga_maks !== undefined) {
        const harga =
          preferensi.harga_maks === null || preferensi.harga_maks === ''
            ? null
            : Number(preferensi.harga_maks);
        if (harga !== null && !Number.isFinite(harga)) {
          return res.status(400).json({ success: false, message: 'Anggaran maksimal harus berupa angka' });
        }
        user.set('preferensi.harga_maks', harga);
      }
      if (preferensi.fasilitas !== undefined) {
        const daftar = Array.isArray(preferensi.fasilitas)
          ? preferensi.fasilitas
          : String(preferensi.fasilitas).split(',');
        user.set(
          'preferensi.fasilitas',
          daftar.map((f) => String(f).trim()).filter(Boolean).slice(0, 20)
        );
      }
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { password_lama, password_baru } = req.body;

    if (!password_lama || !password_baru) {
      return res.status(400).json({
        success: false,
        message: 'Mohon isi password_lama dan password_baru',
      });
    }

    if (String(password_baru).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru minimal 6 karakter',
      });
    }

    if (password_lama === password_baru) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru harus berbeda dari kata sandi lama',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const cocok = await user.matchPassword(password_lama);
    if (!cocok) {
      return res.status(400).json({ success: false, message: 'Kata sandi lama tidak sesuai' });
    }

    user.password = password_baru; // di-hash oleh hook pre-save pada User
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Kata sandi berhasil diganti',
      data: { token: generateToken(user._id, user.role) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
