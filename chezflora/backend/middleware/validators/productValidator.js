// middleware/validators/productValidator.js
const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateCreateProduct = [
    check('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),

    check('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    check('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),

    check('category_id')
        .optional()
        .isUUID(4).withMessage('Invalid category ID'),

    check('sku')
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters'),

    check('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean value'),

    handleValidationErrors
];

exports.validateUpdateProduct = [
    check('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),

    check('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    check('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),

    check('category_id')
        .optional()
        .isUUID(4).withMessage('Invalid category ID'),

    check('sku')
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters'),

    check('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean value'),

    handleValidationErrors
];