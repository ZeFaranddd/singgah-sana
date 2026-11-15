const express = require('express');
const router = express.Router();
const {
  getAllKosAdmin,
  verifyKos,
  getDashboardStats,
  getAllUsers,
  exportKosCSV,
  getAllLaporan,
  handleLaporan,
  getAktivitas,
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/kos', getAllKosAdmin);
router.patch('/kos/:id/verifikasi', verifyKos);
router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/export/kos', exportKosCSV);
router.get('/laporan', getAllLaporan);
router.patch('/laporan/:id', handleLaporan);
router.get('/aktivitas', getAktivitas);

module.exports = router;
