const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrder, cancelOrder,
    getAllOrders, updateOrderStatus, getOrderAdmin } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../middleware/validators/orderValidator');
const paginationMiddleware = require('../middleware/pagination');

// Public routes - None

// Customer routes
router.use(protect);
router.post('/', validateCreateOrder, createOrder);
router.get('/', paginationMiddleware, getOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.get('/admin', protect, adminOnly, getAllOrders);
router.get('/admin/:id', protect, adminOnly, getOrderAdmin);
router.put('/admin/:id/status', protect, adminOnly, validateUpdateOrderStatus, updateOrderStatus);

module.exports = router;