const express = require('express');
const router = express.Router();
const {
  getAllKosAdmin,
  verifyKos,
  getDashboardStats,
  getAllUsers,
  exportKosCSV,
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

module.exports = router;
