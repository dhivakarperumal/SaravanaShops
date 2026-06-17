const express = require('express');
const router = express.Router();
const {
  getNextDealerId,
  getDealers,
  createDealer,
  updateDealer,
  deleteDealer,
} = require('../controllers/dealerController');

// GET    /api/dealers/nextid  → get next auto-generated dealer ID
router.get('/nextid', getNextDealerId);

// GET    /api/dealers         → fetch all dealers
router.get('/', getDealers);

// POST   /api/dealers         → create dealer
router.post('/', createDealer);

// PUT    /api/dealers/:id     → update dealer
router.put('/:id', updateDealer);

// DELETE /api/dealers/:id     → delete dealer
router.delete('/:id', deleteDealer);

module.exports = router;
