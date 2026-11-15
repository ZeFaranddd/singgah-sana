const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const kosRoutes = require('./routes/kosRoutes');
const adminRoutes = require('./routes/adminRoutes');
const favoritRoutes = require('./routes/favoritRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const notifikasiRoutes = require('./routes/notifikasiRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static folder untuk berkas foto yang diunggah
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check & Info Root
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'Singgah-sana RESTful API',
    version: '1.0.0',
    description: 'Backend Portal Kos-Kosan Terverifikasi (Tugas Akhir PAW DTETI FT UGM 2026/2027)',
    status: 'Server is running healthy',
  });
});

// Mounting Rute API
app.use('/api/auth', authRoutes);
app.use('/api/kos', kosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorit', favoritRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/notifikasi', notifikasiRoutes);
app.use('/api/laporan', laporanRoutes);

// Pada mode produksi, backend sekaligus menyajikan hasil build frontend (frontend/dist)
// sehingga seluruh aplikasi berjalan dari satu server dan satu alamat.
const frontendDist = path.join(__dirname, '../../frontend/dist');
const frontendIndex = path.join(frontendDist, 'index.html');
if (process.env.NODE_ENV !== 'test' && fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));

  // Rute SPA (mis. /kos/123, /admin/laporan) dikembalikan ke index.html.
  // Permintaan ke /api dan /uploads, atau ke berkas ber-ekstensi, tidak ikut.
  app.get(/^\/(?!api(\/|$)|uploads(\/|$)).*/, (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(frontendIndex);
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
