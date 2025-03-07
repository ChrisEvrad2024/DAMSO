const express = require('express');
const router = express.Router();
const { getServices, getService, createService, updateService, deleteService } = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const { validateCreateService, validateUpdateService } = require('../middleware/validators/serviceValidator');

// Public routes
router.get('/', getServices);
router.get('/:id', getService);

// Admin routes
router.post('/admin',
    protect,
    adminOnly,
    uploadMiddleware.array('images', 5),
    validateCreateService,
    createService
);

router.put('/admin/:id',
    protect,
    adminOnly,
    uploadMiddleware.array('images', 5),
    validateUpdateService,
    updateService
);

router.delete('/admin/:id', protect, adminOnly, deleteService);

module.exports = router;