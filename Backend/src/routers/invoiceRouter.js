const express = require('express');
const router = express.Router();
const {
  getNextInvoiceNo,
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require('../controllers/invoiceController');

// GET    /api/invoices/nextno  → get next auto-generated invoice number
router.get('/nextno', getNextInvoiceNo);

// GET    /api/invoices         → fetch all invoices
router.get('/', getInvoices);

// POST   /api/invoices         → create invoice
router.post('/', createInvoice);

// PUT    /api/invoices/:id     → update invoice
router.put('/:id', updateInvoice);

// DELETE /api/invoices/:id     → delete invoice
router.delete('/:id', deleteInvoice);

module.exports = router;
