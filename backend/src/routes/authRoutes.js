const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { getCsrf, logout } = require('../middlewares/sessionMiddleware');
const { protect } = require('../middlewares/authMiddleware');

const rateLimit = require('../middlewares/authRateLimit');
const requireLoginForm = (req, res, next) => {
  if (req.sessionRecord || process.env.NODE_ENV === 'test' || process.env.ALLOW_LEGACY_BEARER_AUTH === 'true') return next();
  return res.status(403).json({ success: false, code: 'CSRF_INVALID', message: 'Muat formulir masuk sebelum melanjutkan.' });
};
router.post('/register', requireLoginForm, rateLimit, register);
router.post('/login', requireLoginForm, rateLimit, login);
router.post('/forgot-password', requireLoginForm, rateLimit, forgotPassword);
router.post('/reset-password', requireLoginForm, rateLimit, resetPassword);
router.get('/csrf', getCsrf);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, changePassword);
router.get('/notification-preferences', protect, (req, res) => {
  res.json({ success: true, data: req.user.notification_preferences });
});
router.put('/notification-preferences', protect, async (req, res, next) => {
  try {
    const fields = ['pesanPemilik', 'pembaruanFavorit', 'kabarProduk'];
    if (fields.some(field => typeof req.body[field] !== 'boolean')) return res.status(422).json({ success: false, message: 'Preferensi harus berupa pilihan aktif atau nonaktif.' });
    for (const field of fields) req.user.notification_preferences[field] = req.body[field];
    await req.user.save();
    res.json({ success: true, data: req.user.notification_preferences });
  } catch (error) { next(error); }
});

module.exports = router;
