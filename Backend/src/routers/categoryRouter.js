const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getNextCategoryId,
} = require('../controllers/categoryController');

// GET /api/categories        → fetch all categories
router.get('/', getCategories);

// GET /api/categories/nextid → get next auto-generated catId
router.get('/nextid', getNextCategoryId);

// POST /api/categories       → create a category
router.post('/', createCategory);

// PUT /api/categories/:id    → update a category
router.put('/:id', updateCategory);

// DELETE /api/categories/:id → delete a category
router.delete('/:id', deleteCategory);

module.exports = router;
