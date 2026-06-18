const db = require("../config/db");

// Get All Reviews
exports.getReviews = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM reviews ORDER BY id DESC"
    );

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Review
exports.addReview = async (req, res) => {
  try {
    const {
      title,
      category,
      user,
      rating,
      desc,
      image,
      tick,
    } = req.body;

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const [result] = await db.query(
      `INSERT INTO reviews
      (title, category, user, rating, reviews, rate, \`desc\`, image, tick, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        user,
        rating,
        1,
        rating,
        desc,
        image,
        tick || false,
        currentDate,
      ]
    );

    res.status(201).json({
      message: "Review added successfully",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      category,
      user,
      rating,
      desc,
      image,
      tick,
    } = req.body;

    await db.query(
      `UPDATE reviews
       SET title=?,
           category=?,
           user=?,
           rating=?,
           rate=?,
           \`desc\`=?,
           image=?,
           tick=?
       WHERE id=?`,
      [
        title,
        category,
        user,
        rating,
        rating,
        desc,
        image,
        tick,
        id,
      ]
    );

    res.json({
      message: "Review updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM reviews WHERE id=?",
      [id]
    );

    res.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Tick
exports.toggleTick = async (req, res) => {
  try {
    const { id } = req.params;

    const [review] = await db.query(
      "SELECT tick FROM reviews WHERE id=?",
      [id]
    );

    const newTick = !review[0].tick;

    await db.query(
      "UPDATE reviews SET tick=? WHERE id=?",
      [newTick, id]
    );

    res.json({
      message: "Tick updated",
      tick: newTick,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a specific product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC",
      [productId]
    );
    res.status(200).json({ success: true, reviews: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add product-specific review
exports.addProductReview = async (req, res) => {
  try {
    const { product_id, user_id, userName, rating, review } = req.body;
    if (!product_id || !review) {
      return res.status(400).json({ success: false, message: 'product_id and review are required.' });
    }
    const [result] = await db.query(
      `INSERT INTO product_reviews (product_id, user_id, userName, rating, review) VALUES (?, ?, ?, ?, ?)`,
      [product_id, user_id || null, userName || null, rating || 0, review]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};