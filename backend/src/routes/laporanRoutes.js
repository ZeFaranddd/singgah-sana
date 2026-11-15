const express = require('express');
const router = express.Router();
const { sendLaporan, getMyLaporan } = require('../controllers/laporanController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(authorize('pencari'));

router.post('/', sendLaporan);
router.get('/my', getMyLaporan);

module.exports = router;
