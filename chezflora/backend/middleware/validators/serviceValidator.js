const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateCreateService = [
    check('name')
        .trim()
        .notEmpty().withMessage('Service name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),

    check('description')
        .optional()
        .trim(),

    check('base_price')
        .notEmpty().withMessage('Base price is required')
        .isFloat({ min: 0 }).withMessage('Base price must be a positive number'),

    check('is_available')
        .optional()
        .isBoolean().withMessage('is_available must be a boolean value'),

    handleValidationErrors
];

exports.validateUpdateService = [
    check('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),

    check('description')
        .optional()
        .trim(),

    check('base_price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Base price must be a positive number'),

    check('is_available')
        .optional()
        .isBoolean().withMessage('is_available must be a boolean value'),

    handleValidationErrors
];