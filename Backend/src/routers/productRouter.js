const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getNextProductId,
} = require('../controllers/productController');

// GET /api/products        → fetch all products
router.get('/', getProducts);

// GET /api/products/related/:category/:currentId → fetch related products
router.get('/related/:category/:currentId', getRelatedProducts);

// GET /api/products/:id    → fetch a single product
router.get('/:id', getProductById);

// GET /api/products/nextid → get next auto-generated productId
router.get('/nextid', getNextProductId);

// POST /api/products       → create a product
router.post('/', createProduct);

// PUT /api/products/:id    → update a product
router.put('/:id', updateProduct);

// DELETE /api/products/:id → delete a product
router.delete('/:id', deleteProduct);

module.exports = router;
