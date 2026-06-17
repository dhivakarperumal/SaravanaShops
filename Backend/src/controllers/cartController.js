const db = require("../config/db");

// ===============================
// GET USER CART
// ===============================
exports.getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const [cart] = await db.query(
      `
      SELECT *
      FROM cart
      WHERE user_id = ?
      ORDER BY id DESC
      `,
      [userId]
    );

    res.status(200).json(cart);
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
};

// ===============================
// ADD TO CART
// ===============================
exports.addToCart = async (req, res) => {
  try {
    const {
      user_id,
      product_id,
      product_name,
      image,
      mrp,
      sellingprice,
      quantity,
      size,
      color,
    } = req.body;

    const [existing] = await db.query(
      `
  SELECT *
  FROM cart
  WHERE user_id = ?
  AND product_id = ?
  AND COALESCE(size,'') = ?
  AND COALESCE(color,'') = ?
  `,
      [
        user_id,
        product_id,
        size || "",
        color || "",
      ]
    );

    if (existing.length > 0) {
      const newQty =
        Number(existing[0].quantity) + Number(quantity || 1);

      await db.query(
        `
  UPDATE cart
  SET quantity = ?
  WHERE id = ?
  `,
        [newQty, existing[0].id]
      );

      return res.status(200).json({
        success: true,
        message: "Cart updated",
      });
    }

    await db.query(
      `
      INSERT INTO cart
      (
        user_id,
        product_id,
        product_name,
        image,
        mrp,
        sellingprice,
        quantity,
        size,
        color
      )
      VALUES (?,?,?,?,?,?,?,?,?)
      `,
      [
        user_id,
        product_id,
        product_name,
        image,
        mrp,
        sellingprice,
        quantity || 1,
        size || null,
        color || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Added to cart",
    });
  } catch (error) {
    console.error("Add Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add cart",
    });
  }
};

// ===============================
// UPDATE QUANTITY
// ===============================
exports.updateCartQuantity = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { quantity } = req.body;

    await db.query(
      `
      UPDATE cart
      SET quantity = ?
      WHERE id = ?
      `,
      [quantity, cartId]
    );

    res.status(200).json({
      success: true,
      message: "Quantity updated",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update quantity",
    });
  }
};

// ===============================
// DELETE CART ITEM
// ===============================
exports.deleteCartItem = async (req, res) => {
  try {
    const { cartId } = req.params;

    await db.query(
      `
      DELETE FROM cart
      WHERE id = ?
      `,
      [cartId]
    );

    res.status(200).json({
      success: true,
      message: "Item removed",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete item",
    });
  }
};

// ===============================
// CLEAR CART
// ===============================
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    await db.query(
      `
      DELETE FROM cart
      WHERE user_id = ?
      `,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};