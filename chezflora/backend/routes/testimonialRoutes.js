const express = require('express');
const router = express.Router();
const { getTestimonials, submitTestimonial, getAllTestimonials, 
        updateTestimonialStatus, deleteTestimonial } = require('../controllers/testimonialController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateSubmitTestimonial, validateUpdateTestimonialStatus } = require('../middleware/validators/testimonialValidator');

// Public routes
router.get('/', getTestimonials);

// Protected routes
router.post('/', protect, validateSubmitTestimonial, submitTestimonial);

// Admin routes
router.get('/admin', protect, adminOnly, getAllTestimonials);
router.put('/admin/:id', protect, adminOnly, validateUpdateTestimonialStatus, updateTestimonialStatus);
router.delete('/admin/:id', protect, adminOnly, deleteTestimonial);

module.exports = router;