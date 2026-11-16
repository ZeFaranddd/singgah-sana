const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../services/mailService');
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/jwt');
const Session = require('../models/Session');
const { createSession } = require('../middlewares/sessionMiddleware');
const userDto = user => ({ _id: user._id, nama: user.nama, email: user.email,
  nomor_telepon: user.nomor_telepon, role: user.role, status: user.status || 'active',
  foto_profil: user.foto_profil, createdAt: user.createdAt, password_updated_at: user.password_updated_at });

const generateToken = (id, role, version = 0) => {
  return jwt.sign(
    { id, role, version },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const { nama, password, nomor_telepon, role } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (typeof nama !== 'string' || nama.trim().length < 3 || !email || typeof password !== 'string' || typeof nomor_telepon !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi seluruh field wajib: nama, email, password, nomor_telepon',
      });
    }

    if (typeof password !== 'string' || password.length < 15 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(422).json({ success: false, message: 'Kata sandi minimal 15 karakter dan maksimal 72 byte.' });
    }
    let userRole = typeof role === 'string' ? role.toLowerCase() : 'pencari';
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

    const token = req.sessionRecord ? undefined : generateToken(user._id, user.role);
    if (req.sessionRecord) await createSession(req, res, user._id);

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
    const { password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Mohon masukkan email dan password',
      });
    }

    const user = await User.findOne({ email }).select('+password +token_version');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    if (user.status === 'suspended') return res.status(403).json({ success: false, message: 'Akun ditangguhkan.' });
    const token = req.sessionRecord ? undefined : generateToken(user._id, user.role, user.token_version);
    if (req.sessionRecord) await createSession(req, res, user._id);

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
      data: userDto(user),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { nama, nomor_telepon } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const errors = {};
    if (nama !== undefined && (typeof nama !== 'string' || nama.trim().length < 3 || nama.length > 100)) errors.nama = ['Nama harus terdiri dari 3–100 karakter.'];
    if (nomor_telepon !== undefined && (typeof nomor_telepon !== 'string' || !/^(\+62|62|0)8\d{7,12}$/.test(nomor_telepon))) errors.telepon = ['Nomor kontak tidak valid.'];
    if (Object.keys(errors).length) return res.status(422).json({ success: false, code: 'VALIDATION_ERROR', message: 'Periksa kembali isian profil.', errors });
    if (nama) user.nama = nama.trim();
    if (nomor_telepon) user.nomor_telepon = nomor_telepon;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: userDto(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { password_lama, password_baru } = req.body;
    if (typeof password_lama !== 'string' || typeof password_baru !== 'string' ||
        password_baru.length < 15 || Buffer.byteLength(password_baru, 'utf8') > 72 || password_lama === password_baru) {
      return res.status(422).json({ success: false, message: 'Gunakan sandi baru minimal 15 karakter, maksimal 72 byte, dan berbeda dari sandi lama.' });
    }
    const user = await User.findById(req.user._id).select('+password +token_version');
    if (!await user.matchPassword(password_lama)) return res.status(422).json({ success: false, message: 'Kata sandi lama tidak sesuai.' });
    user.password = password_baru;
    user.password_updated_at = new Date();
    user.token_version = (user.token_version || 0) + 1;
    await user.save();
    await Session.deleteMany({ user_id: user._id });
    if (req.sessionRecord) await createSession(req, res, user._id);
    res.json({ success: true, message: 'Kata sandi diganti. Sesi perangkat lain dicabut.', data: null });
  } catch (error) { next(error); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const user = email ? await User.findOne({ email }) : null;
    if (user && user.status !== 'suspended') {
      const token = crypto.randomBytes(32).toString('base64url');
      user.reset_token_hash = sha256(token);
      user.reset_token_expires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const base = (process.env.APP_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
      const link = `${base}/reset-sandi?token=${token}`;
      sendResetPasswordEmail(user.email, user.nama, link).catch((e) =>
        console.error('Gagal kirim email reset:', e.message));
    }
    // Respons selalu sama agar email terdaftar/tidak terdaftar tidak bisa ditebak
    res.json({ success: true, message: 'Jika email terdaftar, tautan pemulihan akan dikirim.', data: null });
  } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== 'string' || typeof password !== 'string' ||
        password.length < 15 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(422).json({ success: false, message: 'Kata sandi minimal 15 karakter dan maksimal 72 byte.' });
    }
    const user = await User.findOne({
      reset_token_hash: sha256(token),
      reset_token_expires: { $gt: new Date() },
    }).select('+password +token_version +reset_token_hash +reset_token_expires');
    if (!user) {
      return res.status(400).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Tautan tidak valid atau sudah kedaluwarsa.' });
    }
    user.password = password;
    user.password_updated_at = new Date();
    user.token_version = (user.token_version || 0) + 1;
    user.reset_token_hash = undefined;
    user.reset_token_expires = undefined;
    await user.save();
    await Session.deleteMany({ user_id: user._id });
    res.json({ success: true, message: 'Kata sandi berhasil diganti.', data: null });
  } catch (error) { next(error); }
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword };