const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateCreatePromotion = [
    check('name')
        .trim()
        .notEmpty().withMessage('Promotion name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),

    check('discount_type')
        .trim()
        .notEmpty().withMessage('Discount type is required')
        .isIn(['percentage', 'fixed_amount']).withMessage('Discount type must be either percentage or fixed_amount'),

    check('discount_value')
        .notEmpty().withMessage('Discount value is required')
        .isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),

    check('start_date')
        .notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Start date must be a valid date'),

    check('end_date')
        .notEmpty().withMessage('End date is required')
        .isISO8601().withMessage('End date must be a valid date')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.start_date)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    check('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean value'),

    check('product_ids')
        .optional()
        .isArray().withMessage('product_ids must be an array'),

    check('product_ids.*')
        .optional()
        .isUUID(4).withMessage('Each product ID must be a valid UUID'),

    handleValidationErrors
];

exports.validateUpdatePromotion = [
    check('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),

    check('discount_type')
        .optional()
        .trim()
        .isIn(['percentage', 'fixed_amount']).withMessage('Discount type must be either percentage or fixed_amount'),

    check('discount_value')
        .optional()
        .isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),

    check('start_date')
        .optional()
        .isISO8601().withMessage('Start date must be a valid date'),

    check('end_date')
        .optional()
        .isISO8601().withMessage('End date must be a valid date')
        .custom((value, { req }) => {
            if (req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    check('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean value'),

    check('product_ids')
        .optional()
        .isArray().withMessage('product_ids must be an array'),

    check('product_ids.*')
        .optional()
        .isUUID(4).withMessage('Each product ID must be a valid UUID'),

    handleValidationErrors
];

exports.validateAddRemoveProducts = [
    check('product_ids')
        .notEmpty().withMessage('product_ids is required')
        .isArray().withMessage('product_ids must be an array')
        .custom(arr => arr.length > 0).withMessage('product_ids array cannot be empty'),

    check('product_ids.*')
        .isUUID(4).withMessage('Each product ID must be a valid UUID'),

    handleValidationErrors
];