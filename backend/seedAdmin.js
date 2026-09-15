// Jalankan sekali saja: node seedAdmin.js
// Skrip ini membuat satu akun admin pertama, karena endpoint /api/auth/register
// hanya mengizinkan role "pemilik" atau "pencari" (admin tidak boleh dibuat publik).

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@kosportal.com";
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin sudah ada:", email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  await User.create({
    nama: "Admin",
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin berhasil dibuat. Email:", email, "Password: admin123");
  process.exit(0);
}

seed();
