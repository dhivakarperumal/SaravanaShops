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
    }));
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

// ── POST create product ────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const {
      productId, name, description, notes, mrp, offer, sellingprice, sellingpriceManually,
      rating, category, subcategory, productType, count, stock,
      colors = [], images = [], fabricdetails = [], list_of_items = []
    } = req.body;

    if (!name || !productType) {
      return res.status(400).json({ success: false, message: 'Name and productType are required.' });
    }

    const id = productId || (await generateProductId());

    await pool.query(
      `INSERT INTO products (
        productId, name, description, notes, mrp, offer, sellingprice, sellingpriceManually,
        rating, category, subcategory, productType, count, stock,
        colors, images, fabricdetails, list_of_items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, description, notes, mrp || null, offer || null, sellingprice || null,
        sellingpriceManually ? 1 : 0, rating || 0.0, category, subcategory, productType, count, stock || null,
        JSON.stringify(colors), JSON.stringify(images), JSON.stringify(fabricdetails), JSON.stringify(list_of_items)
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
      colors = [], images = [], fabricdetails = [], list_of_items = []
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
        colors=?, images=?, fabricdetails=?, list_of_items=?, updated_at=NOW()
       ${whereClause}`,
      [
        name, description, notes, mrp || null, offer || null, sellingprice || null,
        sellingpriceManually ? 1 : 0, rating || 0.0, category, subcategory, productType, count, stock || null,
        JSON.stringify(colors), JSON.stringify(images), JSON.stringify(fabricdetails), JSON.stringify(list_of_items),
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

// ── Utility ────────────────────────────────────────────────
function safeParseJSON(val, fallback) {
  try {
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}
