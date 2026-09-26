const express = require('express');
const router = express.Router();
const {
  getMyFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/favoritController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(authorize('pencari'));

router.get('/', getMyFavorites);
router.post('/:kosId', addFavorite);
router.delete('/:kosId', removeFavorite);

module.exports = router;
