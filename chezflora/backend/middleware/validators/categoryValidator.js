const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateCreateCategory = [
    check('name')
        .trim()
        .notEmpty().withMessage('Category name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    check('parent_id')
        .optional()
        .isUUID(4).withMessage('Invalid parent category ID'),

    check('image_url')
        .optional()
        .isURL().withMessage('Image URL must be a valid URL'),

    check('sort_order')
        .optional()
        .isInt({ min: 0 }).withMessage('Sort order must be a positive integer'),

    check('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean value'),

    handleValidationErrors
];

exports.validateUpdateCategory = [
    check('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    check('parent_id')
        .optional()
        .isUUID(4).withMessage('Invalid parent category ID'),

    check('image_url')
        .optional()
        .isURL().withMessage('Image URL must be a valid URL'),

    check('sort_order')
        .optional()
        .isInt({ min: 0 }).withMessage('Sort order must be a positive integer'),

    check('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean value'),

    handleValidationErrors
];