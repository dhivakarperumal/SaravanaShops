const express = require("express");
const router = express.Router();

const {
  getUserCart,
  addToCart,
  updateCartQuantity,
  deleteCartItem,
  clearCart,
} = require("../controllers/cartController");

router.get("/:userId", getUserCart);

router.post("/", addToCart);

router.put("/:cartId", updateCartQuantity);

router.delete("/:cartId", deleteCartItem);

router.delete("/clear/:userId", clearCart);

module.exports = router;