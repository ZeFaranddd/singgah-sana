require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Hubungkan ke MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Server Singgah-sana berjalan pada port: ${PORT}`);
    console.log(`📍 Mode Lingkungan : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Base API URL    : http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
});
