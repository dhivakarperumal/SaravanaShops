const express = require("express");
const router = express.Router();

const {
  getReviews,
  addReview,
  updateReview,
  deleteReview,
  toggleTick,
} = require("../controllers/reviewController");

router.get("/", getReviews);

router.post("/", addReview);

router.put("/:id", updateReview);

router.delete("/:id", deleteReview);

router.patch("/toggle/:id", toggleTick);

module.exports = router;