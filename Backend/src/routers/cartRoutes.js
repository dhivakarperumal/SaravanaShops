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
router.delete("/user/:userId", clearCart); // alias for compatibility with older frontend paths

router.get("/:userId", getUserCart);

router.put("/:cartId", updateCartQuantity);

router.delete("/:cartId", deleteCartItem);

module.exports = router;