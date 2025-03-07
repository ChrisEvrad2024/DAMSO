const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateCreateAddress = [
    check('first_name')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 100 }).withMessage('First name must be between 2 and 100 characters'),

    check('last_name')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Last name must be between 2 and 100 characters'),

    check('address_line1')
        .trim()
        .notEmpty().withMessage('Address line 1 is required')
        .isLength({ min: 5, max: 255 }).withMessage('Address line 1 must be between 5 and 255 characters'),

    check('address_line2')
        .optional()
        .trim(),

    check('city')
        .trim()
        .notEmpty().withMessage('City is required')
        .isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters'),

    check('postal_code')
        .trim()
        .notEmpty().withMessage('Postal code is required')
        .isLength({ min: 2, max: 20 }).withMessage('Postal code must be between 2 and 20 characters'),

    check('country')
        .trim()
        .notEmpty().withMessage('Country is required')
        .isLength({ min: 2, max: 100 }).withMessage('Country must be between 2 and 100 characters'),

    check('phone')
        .optional()
        .trim()
        .isMobilePhone().withMessage('Please provide a valid phone number'),

    check('address_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Address name must be less than 100 characters'),

    check('is_default')
        .optional()
        .isBoolean().withMessage('is_default must be a boolean value'),

    handleValidationErrors
];

exports.validateUpdateAddress = [
    check('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('First name must be between 2 and 100 characters'),

    check('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Last name must be between 2 and 100 characters'),

    check('address_line1')
        .optional()
        .trim()
        .isLength({ min: 5, max: 255 }).withMessage('Address line 1 must be between 5 and 255 characters'),

    check('address_line2')
        .optional()
        .trim(),

    check('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('City must be between 2 and 100 characters'),

    check('postal_code')
        .optional()
        .trim()
        .isLength({ min: 2, max: 20 }).withMessage('Postal code must be between 2 and 20 characters'),

    check('country')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Country must be between 2 and 100 characters'),

    check('phone')
        .optional()
        .trim()
        .isMobilePhone().withMessage('Please provide a valid phone number'),

    check('address_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Address name must be less than 100 characters'),

    check('is_default')
        .optional()
        .isBoolean().withMessage('is_default must be a boolean value'),

    handleValidationErrors
];