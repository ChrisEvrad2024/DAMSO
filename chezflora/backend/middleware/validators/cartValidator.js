const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateAddToCart = [
    check('product_id')
        .trim()
        .notEmpty().withMessage('Product ID is required')
        .isUUID(4).withMessage('Invalid product ID format'),

    check('quantity')
        .optional()
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

    handleValidationErrors
];

exports.validateUpdateCartItem = [
    check('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),

    handleValidationErrors
];