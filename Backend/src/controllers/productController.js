const pool = require('../config/db');

// ── Helper: generate next Product ID ──────────────────────
async function generateProductId() {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM products');
  const count = rows[0].cnt + 1;
  return `SP${String(count).padStart(3, '0')}`;
}

// ── GET all products ───────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    // Parse JSON fields
    const products = rows.map((row) => ({
      ...row,
      sellingpriceManually: !!row.sellingpriceManually,
      colors: safeParseJSON(row.colors, []),
      images: safeParseJSON(row.images, []),
      fabricdetails: safeParseJSON(row.fabricdetails, []),
      list_of_items: safeParseJSON(row.list_of_items, []),
      reviews: safeParseJSON(row.reviews, []),
    }));
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

// ── GET single product by numeric id or productId ─────────────
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const whereClause = isNumeric ? 'WHERE id = ?' : 'WHERE productId = ?';
    const [rows] = await pool.query(`SELECT * FROM products ${whereClause} LIMIT 1`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const row = rows[0];
    const product = {
      ...row,
      sellingpriceManually: !!row.sellingpriceManually,
      colors: safeParseJSON(row.colors, []),
      images: safeParseJSON(row.images, []),
      fabricdetails: safeParseJSON(row.fabricdetails, []),
      list_of_items: safeParseJSON(row.list_of_items, []),
      reviews: safeParseJSON(row.reviews, []),
    };

    res.json({ success: true, product });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
};

// ── GET related products by category excluding current product ──
exports.getRelatedProducts = async (req, res) => {
  try {
    const { category, currentId } = req.params;
    const isNumeric = /^\d+$/.test(currentId);
    const whereClause = isNumeric ? 'id != ?' : 'productId != ?';
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE category = ? AND ${whereClause} ORDER BY created_at DESC LIMIT 10`,
      [category, currentId]
    );

    const products = rows.map((row) => ({
      ...row,
      sellingpriceManually: !!row.sellingpriceManually,
      colors: safeParseJSON(row.colors, []),
      images: safeParseJSON(row.images, []),
      fabricdetails: safeParseJSON(row.fabricdetails, []),
      list_of_items: safeParseJSON(row.list_of_items, []),
      reviews: safeParseJSON(row.reviews, []),
    }));

    res.json({ success: true, products });
  } catch (err) {
    console.error('getRelatedProducts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch related products.' });
  }
};

// ── POST create product ────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const {
      productId, name, description, notes, mrp, offer, sellingprice, sellingpriceManually,
      rating, category, subcategory, productType, count, stock,
      colors = [], images = [], fabricdetails = [], list_of_items = [], reviews = []
    } = req.body;

    if (!name || !productType) {
      return res.status(400).json({ success: false, message: 'Name and productType are required.' });
    }

    const id = productId || (await generateProductId());

    await pool.query(
      `INSERT INTO products (
        productId, name, description, notes, mrp, offer, sellingprice, sellingpriceManually,
        rating, category, subcategory, productType, count, stock,
        colors, images, fabricdetails, list_of_items, reviews
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, description, notes, mrp || null, offer || null, sellingprice || null,
        sellingpriceManually ? 1 : 0, rating || 0.0, category, subcategory, productType, count, stock || null,
        JSON.stringify(colors), JSON.stringify(images), JSON.stringify(fabricdetails), JSON.stringify(list_of_items), JSON.stringify(reviews)
      ]
    );

    res.status(201).json({ success: true, message: 'Product created!', productId: id });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

// ── PUT update product ─────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, notes, mrp, offer, sellingprice, sellingpriceManually,
      rating, category, subcategory, productType, count, stock,
      colors = [], images = [], fabricdetails = [], list_of_items = [], reviews = []
    } = req.body;

    if (!name || !productType) {
      return res.status(400).json({ success: false, message: 'Name and productType are required.' });
    }

    // Support lookup by either numeric id or productId string (e.g. "SP003")
    const isNumeric = /^\d+$/.test(id);
    const whereClause = isNumeric ? 'WHERE id=?' : 'WHERE productId=?';

    const [result] = await pool.query(
      `UPDATE products SET
        name=?, description=?, notes=?, mrp=?, offer=?, sellingprice=?, sellingpriceManually=?,
        rating=?, category=?, subcategory=?, productType=?, count=?, stock=?,
        colors=?, images=?, fabricdetails=?, list_of_items=?, reviews=?, updated_at=NOW()
       ${whereClause}`,
      [
        name, description, notes, mrp || null, offer || null, sellingprice || null,
        sellingpriceManually ? 1 : 0, rating || 0.0, category, subcategory, productType, count, stock || null,
        JSON.stringify(colors), JSON.stringify(images), JSON.stringify(fabricdetails), JSON.stringify(list_of_items), JSON.stringify(reviews),
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, message: 'Product updated!' });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// ── DELETE product ─────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const whereClause = isNumeric ? 'WHERE id = ?' : 'WHERE productId = ?';
    const [result] = await pool.query(`DELETE FROM products ${whereClause}`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

// ── GET next product ID ────────────────────────────────────
exports.getNextProductId = async (req, res) => {
  try {
    const id = await generateProductId();
    res.json({ success: true, productId: id });
  } catch (err) {
    console.error('getNextProductId error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate ID.' });
  }
};

// ── POST add product review ─────────────────────────────────
exports.addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, user_name, rating, review } = req.body;

    const isNumeric = /^\d+$/.test(id);
    const whereClause = isNumeric ? 'WHERE id = ?' : 'WHERE productId = ?';
    
    // Get existing reviews
    const [rows] = await pool.query(`SELECT reviews FROM products ${whereClause} LIMIT 1`, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const existingReviews = safeParseJSON(rows[0].reviews, []);
    
    const newReview = {
      id: Date.now().toString(),
      user_id,
      user_name,
      rating: Number(rating),
      review,
      created_at: new Date().toISOString()
    };
    
    existingReviews.push(newReview);

    // Update reviews column
    await pool.query(
      `UPDATE products SET reviews = ?, updated_at = NOW() ${whereClause}`,
      [JSON.stringify(existingReviews), id]
    );

    res.json({ success: true, message: 'Review added successfully!', review: newReview });
  } catch (err) {
    console.error('addProductReview error:', err);
    res.status(500).json({ success: false, message: 'Failed to add review.' });
  }
};

// ── Utility ────────────────────────────────────────────────
function safeParseJSON(val, fallback) {
  try {
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}
