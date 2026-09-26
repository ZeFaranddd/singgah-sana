const express = require('express');
const router = express.Router();
const {
  getAllKosPublic,
  getKosById,
  createKos,
  getMyKos,
  updateKos,
  deleteKos,
} = require('../controllers/kosController');
const { protect, optionalProtect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', getAllKosPublic);
router.get('/owner/my-kos', protect, authorize('pemilik'), getMyKos);
router.get('/:id', optionalProtect, getKosById);
router.post(
  '/',
  protect,
  authorize('pemilik'),
  upload.array('foto', 5),
  createKos
);
router.put('/:id', protect, authorize('pemilik', 'admin'), updateKos);
router.delete('/:id', protect, authorize('pemilik', 'admin'), deleteKos);

module.exports = router;
