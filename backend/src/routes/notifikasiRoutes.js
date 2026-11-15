const express = require('express');
const router = express.Router();
const {
  getMyNotifikasi,
  getJumlahBelumDibaca,
  tandaiDibaca,
  tandaiSemuaDibaca,
  hapusNotifikasi,
} = require('../controllers/notifikasiController');
const { protect } = require('../middlewares/authMiddleware');

// Semua role (admin, pemilik, pencari) memiliki notifikasi sendiri
router.use(protect);

router.get('/', getMyNotifikasi);
router.get('/jumlah', getJumlahBelumDibaca);
router.patch('/baca-semua', tandaiSemuaDibaca);
router.patch('/:id/baca', tandaiDibaca);
router.delete('/:id', hapusNotifikasi);

module.exports = router;
