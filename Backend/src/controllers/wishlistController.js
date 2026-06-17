const pool = require('../config/db');

exports.getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    const [rows] = await pool.query('SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getWishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { user_id, product_id, product_name, image, mrp, sellingprice } = req.body;
    if (!user_id || !product_id) {
      return res.status(400).json({ success: false, message: 'user_id and product_id are required' });
    }

    // Check if already in wishlist
    const [existing] = await pool.query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    await pool.query(
      `INSERT INTO wishlist (user_id, product_id, product_name, image, mrp, sellingprice) VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, product_id, product_name || null, image || null, mrp || 0.00, sellingprice || 0.00]
    );

    res.status(201).json({ success: true, message: 'Product added to wishlist' });
  } catch (error) {
    console.error('addToWishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!itemId) return res.status(400).json({ success: false, message: 'Item ID is required' });

    await pool.query('DELETE FROM wishlist WHERE id = ?', [itemId]);
    res.status(200).json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('removeFromWishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
