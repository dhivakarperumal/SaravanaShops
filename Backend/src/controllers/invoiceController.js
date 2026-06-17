const pool = require('../config/db');

// ── Helper: generate next Invoice Number ───────────────────────────────────
async function generateInvoiceNo() {
  const [rows] = await pool.query(
    `SELECT invoiceNo FROM invoices ORDER BY id DESC LIMIT 1`
  );
  if (rows.length === 0) {
    return 'INV-001';
  }
  const last = rows[0].invoiceNo || '';
  const match = last.match(/(\d+)$/);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  return `INV-${String(next).padStart(3, '0')}`;
}

// ── GET next invoice number ────────────────────────────────────────────────
exports.getNextInvoiceNo = async (req, res) => {
  try {
    const invoiceNo = await generateInvoiceNo();
    res.json({ success: true, invoiceNo });
  } catch (err) {
    console.error('getNextInvoiceNo error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate invoice number.' });
  }
};

// ── GET all invoices ───────────────────────────────────────────────────────
exports.getInvoices = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getInvoices error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices.' });
  }
};

// ── POST create invoice ────────────────────────────────────────────────────
exports.createInvoice = async (req, res) => {
  try {
    const {
      invoiceNo,
      invoiceDate,
      invoiceValue,
      invoiceGSTValue,
      invoiceTotalValue,
      transportAmount,
      billPdfBase64,
      billPdfName,
    } = req.body;

    if (!invoiceNo) {
      return res.status(400).json({ success: false, message: 'Invoice Number is required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO invoices
        (invoiceNo, invoiceDate, invoiceValue, invoiceGSTValue, invoiceTotalValue, transportAmount, billPdfBase64, billPdfName)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNo,
        invoiceDate || null,
        invoiceValue || null,
        invoiceGSTValue || null,
        invoiceTotalValue || null,
        transportAmount || null,
        billPdfBase64 || null,
        billPdfName || null,
      ]
    );

    res.status(201).json({ success: true, message: 'Invoice created!', id: result.insertId });
  } catch (err) {
    console.error('createInvoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to create invoice.' });
  }
};

// ── PUT update invoice ─────────────────────────────────────────────────────
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      invoiceNo,
      invoiceDate,
      invoiceValue,
      invoiceGSTValue,
      invoiceTotalValue,
      transportAmount,
      billPdfBase64,
      billPdfName,
    } = req.body;

    if (!invoiceNo) {
      return res.status(400).json({ success: false, message: 'Invoice Number is required.' });
    }

    const [result] = await pool.query(
      `UPDATE invoices SET
        invoiceNo=?, invoiceDate=?, invoiceValue=?, invoiceGSTValue=?,
        invoiceTotalValue=?, transportAmount=?, billPdfBase64=?, billPdfName=?,
        updated_at=NOW()
       WHERE id=?`,
      [
        invoiceNo,
        invoiceDate || null,
        invoiceValue || null,
        invoiceGSTValue || null,
        invoiceTotalValue || null,
        transportAmount || null,
        billPdfBase64 || null,
        billPdfName || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    res.json({ success: true, message: 'Invoice updated!' });
  } catch (err) {
    console.error('updateInvoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to update invoice.' });
  }
};

// ── DELETE invoice ─────────────────────────────────────────────────────────
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM invoices WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    res.json({ success: true, message: 'Invoice deleted.' });
  } catch (err) {
    console.error('deleteInvoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete invoice.' });
  }
};
