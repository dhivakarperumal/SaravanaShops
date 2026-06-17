const express = require("express");
const router = express.Router();

const {
  getUserCart,
  addToCart,
  updateCartQuantity,
  deleteCartItem,
  clearCart,
} = require("../controllers/cartController");

router.post("/", addToCart);

router.delete("/clear/:userId", clearCart);

router.get("/:userId", getUserCart);

router.put("/:cartId", updateCartQuantity);

router.delete("/:cartId", deleteCartItem);

module.exports = router;