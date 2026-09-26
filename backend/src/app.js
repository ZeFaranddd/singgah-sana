const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const kosRoutes = require('./routes/kosRoutes');
const adminRoutes = require('./routes/adminRoutes');
const favoritRoutes = require('./routes/favoritRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
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

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
