const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct,
    deleteProduct, searchProducts } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateCreateProduct, validateUpdateProduct } = require('../middleware/validators/productValidator');
const uploadMiddleware = require('../middleware/upload');
const paginationMiddleware = require('../middleware/pagination');

// Public routes
router.get('/', paginationMiddleware, getProducts);
router.get('/search', paginationMiddleware, searchProducts);
router.get('/:id', getProduct);

// Admin routes
router.post('/',
    protect,
    adminOnly,
    uploadMiddleware.array('images', 5),
    validateCreateProduct,
    createProduct
);

router.put('/:id',
    protect,
    adminOnly,
    uploadMiddleware.array('images', 5),
    validateUpdateProduct,
    updateProduct
);

router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;