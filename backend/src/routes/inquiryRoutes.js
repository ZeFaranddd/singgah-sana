const express = require('express');
const router = express.Router();
const {
  sendInquiry,
  getMyInquiries,
  getOwnerInquiries,
  replyInquiry,
} = require('../controllers/inquiryController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

router.post('/', authorize('pencari'), sendInquiry);
router.get('/my', authorize('pencari'), getMyInquiries);

router.get('/owner', authorize('pemilik'), getOwnerInquiries);
router.patch('/:id/reply', authorize('pemilik'), replyInquiry);

module.exports = router;
