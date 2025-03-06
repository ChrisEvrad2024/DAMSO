const express = require('express');
const router = express.Router();
const { getCategories, getCategory, createCategory, updateCategory,
    deleteCategory, getCategoryTree, getCategoryProducts } = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateCreateCategory, validateUpdateCategory } = require('../middleware/validators/categoryValidator');
const paginationMiddleware = require('../middleware/pagination');

// Public routes
router.get('/', paginationMiddleware, getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);
router.get('/:id/products', paginationMiddleware, getCategoryProducts);

// Admin routes
router.post('/', protect, adminOnly, validateCreateCategory, createCategory);
router.put('/:id', protect, adminOnly, validateUpdateCategory, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;