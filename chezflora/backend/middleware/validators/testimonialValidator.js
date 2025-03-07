const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateSubmitTestimonial = [
    check('content')
        .trim()
        .notEmpty().withMessage('Testimonial content is required')
        .isLength({ min: 10, max: 1000 }).withMessage('Testimonial must be between 10 and 1000 characters'),

    check('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

    handleValidationErrors
];

exports.validateUpdateTestimonialStatus = [
    check('is_approved')
        .notEmpty().withMessage('Approval status is required')
        .isBoolean().withMessage('Approval status must be a boolean'),

    handleValidationErrors
];