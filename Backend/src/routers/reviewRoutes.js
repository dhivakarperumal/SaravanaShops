const express = require("express");
const router = express.Router();

const {
  getReviews,
  addReview,
  updateReview,
  deleteReview,
  toggleTick,
  getProductReviews,
  addProductReview,
} = require("../controllers/reviewController");

router.get("/", getReviews);

// product-specific reviews
router.get('/product/:productId', getProductReviews);
router.post('/product', addProductReview);

router.post("/", addReview);

router.put("/:id", updateReview);

router.delete("/:id", deleteReview);

router.patch("/toggle/:id", toggleTick);

module.exports = router;