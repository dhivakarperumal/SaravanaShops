const pool = require('../config/db');

// ── Helper: generate next CAT ID ──────────────────────────
async function generateCategoryId() {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM categories');
  const count = rows[0].cnt + 1;
  return `CAT${String(count).padStart(3, '0')}`;
}

// ── GET all categories ─────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories ORDER BY created_at DESC'
    );
    // Parse JSON fields
    const categories = rows.map((row) => ({
      ...row,
      cimgs: safeParseJSON(row.cimgs, []),
      subcategories: safeParseJSON(row.subcategories, []),
    }));
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
};

// ── POST create category ───────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const { catId, cname, cdescription, cimgs, subcategories, productType } = req.body;
    if (!cname) return res.status(400).json({ success: false, message: 'cname required' });

    const id = catId || (await generateCategoryId());
    await pool.query(
      'INSERT INTO categories (catId, cname, cdescription, cimgs, subcategories, productType) VALUES (?, ?, ?, ?, ?, ?)',
      [id, cname, cdescription, JSON.stringify(cimgs || []), JSON.stringify(subcategories || []), productType || null]
    );

    res.status(201).json({ success: true, message: 'Category created!', catId: id });
  } catch (err) {
    console.error('createCategory error:', err);
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};

// ── PUT update category ────────────────────────────────────
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { cname, cdescription, cimgs, subcategories, productType } = req.body;
    if (!cname) return res.status(400).json({ success: false, message: 'cname required' });

    const [result] = await pool.query(
      'UPDATE categories SET cname=?, cdescription=?, cimgs=?, subcategories=?, productType=?, updated_at=NOW() WHERE id=?',
      [cname, cdescription, JSON.stringify(cimgs || []), JSON.stringify(subcategories || []), productType || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category updated!' });
  } catch (err) {
    console.error('updateCategory error:', err);
    res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
};

// ── DELETE category ────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
};

// ── GET next category ID ───────────────────────────────────
exports.getNextCategoryId = async (req, res) => {
  try {
    const id = await generateCategoryId();
    res.json({ success: true, catId: id });
  } catch (err) {
    console.error('getNextCategoryId error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate ID.' });
  }
};

// ── Utility ───────────────────────────────────────────────
function safeParseJSON(val, fallback) {
  try {
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}
