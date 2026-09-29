require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error(`\n====================================================`);
    console.error(`⚠️  PERINGATAN KONEKSI DATABASE:`);
    console.error(`   Server tetap aktif, namun MongoDB belum terhubung.`);
    console.error(`👉 Jika memakai MongoDB Atlas:`);
    console.error(`   1. Buka cloud.mongodb.com -> Network Access`);
    console.error(`   2. Tambahkan IP Anda atau pilih 'Allow Access from Anywhere' (0.0.0.0/0).`);
    console.error(`👉 Jika memakai MongoDB Lokal:`);
    console.error(`   Pastikan service mongod sudah berjalan di port 27017.`);
    console.error(`====================================================\n`);
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Server Singgah-sana berjalan pada port: ${PORT}`);
    console.log(`📍 Mode Lingkungan : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Base API URL    : http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
};

startServer();
