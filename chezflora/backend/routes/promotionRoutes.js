const express = require('express');
const router = express.Router();
const { getActivePromotions, getPromotion, getPromotionProducts,
    createPromotion, updatePromotion, deletePromotion, getAllPromotions,
    addProductsToPromotion, removeProductsFromPromotion } = require('../controllers/promotionController');
const { protect, adminOnly } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { validateCreatePromotion, validateUpdatePromotion,
    validateAddRemoveProducts } = require('../middleware/validators/promotionValidator');

// Public routes
router.get('/', cacheMiddleware(300), getActivePromotions);
router.get('/:id', cacheMiddleware(300), getPromotion);
router.get('/:id/products', cacheMiddleware(300), getPromotionProducts);

// Admin routes
router.get('/admin', protect, adminOnly, getAllPromotions);
router.post('/admin', protect, adminOnly, validateCreatePromotion, createPromotion);
router.put('/admin/:id', protect, adminOnly, validateUpdatePromotion, updatePromotion);
router.delete('/admin/:id', protect, adminOnly, deletePromotion);
router.post('/admin/:id/products', protect, adminOnly, validateAddRemoveProducts, addProductsToPromotion);
router.delete('/admin/:id/products', protect, adminOnly, validateAddRemoveProducts, removeProductsFromPromotion);

module.exports = router;