const pool = require('../config/db');

// ── Helper: generate next Dealer ID ─────────────────────────────────────────
async function generateDealerId() {
  const [rows] = await pool.query(
    `SELECT dealerId FROM dealers ORDER BY id DESC LIMIT 1`
  );
  if (rows.length === 0) {
    return 'SD001';
  }
  const last = rows[0].dealerId || '';
  const match = last.match(/(\d+)$/);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  return `SD${String(next).padStart(3, '0')}`;
}

// ── GET next dealer ID ─────────────────────────────────────────────────────
exports.getNextDealerId = async (req, res) => {
  try {
    const dealerId = await generateDealerId();
    res.json({ success: true, dealerId });
  } catch (err) {
    console.error('getNextDealerId error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate dealer ID.' });
  }
};

// ── GET all dealers ────────────────────────────────────────────────────────
exports.getDealers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dealers ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getDealers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dealers.' });
  }
};

// ── POST create dealer ─────────────────────────────────────────────────────
exports.createDealer = async (req, res) => {
  try {
    const {
      dealerName,
      gstNumber,
      phone,
      email,
      address,
      invoiceNumber,
    } = req.body;

    if (!dealerName) {
      return res.status(400).json({ success: false, message: 'Dealer Name is required.' });
    }

    const dealerId = await generateDealerId();

    const [result] = await pool.query(
      `INSERT INTO dealers
        (dealerId, dealerName, gstNumber, phone, email, address, invoiceNumber)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dealerId,
        dealerName,
        gstNumber || null,
        phone || null,
        email || null,
        address || null,
        invoiceNumber || null,
      ]
    );

    res.status(201).json({ success: true, message: 'Dealer created!', id: result.insertId });
  } catch (err) {
    console.error('createDealer error:', err);
    res.status(500).json({ success: false, message: 'Failed to create dealer.' });
  }
};

// ── PUT update dealer ──────────────────────────────────────────────────────
exports.updateDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dealerName,
      gstNumber,
      phone,
      email,
      address,
      invoiceNumber,
    } = req.body;

    if (!dealerName) {
      return res.status(400).json({ success: false, message: 'Dealer Name is required.' });
    }

    const [result] = await pool.query(
      `UPDATE dealers SET
        dealerName=?, gstNumber=?, phone=?, email=?, address=?, invoiceNumber=?, updated_at=NOW()
       WHERE id=?`,
      [
        dealerName,
        gstNumber || null,
        phone || null,
        email || null,
        address || null,
        invoiceNumber || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Dealer not found.' });
    }

    res.json({ success: true, message: 'Dealer updated!' });
  } catch (err) {
    console.error('updateDealer error:', err);
    res.status(500).json({ success: false, message: 'Failed to update dealer.' });
  }
};

// ── DELETE dealer ──────────────────────────────────────────────────────────
exports.deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM dealers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Dealer not found.' });
    }

    res.json({ success: true, message: 'Dealer deleted.' });
  } catch (err) {
    console.error('deleteDealer error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete dealer.' });
  }
};
