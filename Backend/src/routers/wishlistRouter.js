const express = require('express');
const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/wishlistController');

router.get('/:userId', getWishlist);
router.post('/', addToWishlist);
router.delete('/:itemId', removeFromWishlist);

module.exports = router;
