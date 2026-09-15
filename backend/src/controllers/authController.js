const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /api/auth/register
async function register(req, res) {
  try {
    const { nama, email, password, role, noHp } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password wajib diisi" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // role admin tidak boleh dibuat lewat registrasi publik
    const finalRole = role === "pemilik" ? "pemilik" : "pencari";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nama,
      email,
      password: hashedPassword,
      role: finalRole,
      noHp,
    });

    res.status(201).json({
      message: "Registrasi berhasil",
      user: { id: user._id, nama: user.nama, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password wajib diisi" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: { id: user._id, nama: user.nama, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
}

module.exports = { register, login };
