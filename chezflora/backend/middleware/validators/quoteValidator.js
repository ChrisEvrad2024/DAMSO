const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateRequestQuote = [
    check('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),

    check('event_type')
        .trim()
        .notEmpty().withMessage('Event type is required')
        .isLength({ min: 2 }).withMessage('Event type must be at least 2 characters'),

    check('event_date')
        .optional()
        .isISO8601().withMessage('Event date must be a valid date'),

    check('budget')
        .optional()
        .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

    check('client_comment')
        .optional()
        .trim(),

    handleValidationErrors
];

exports.validateUpdateQuote = [
    check('description')
        .optional()
        .trim()
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),

    check('event_type')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Event type must be at least 2 characters'),

    check('event_date')
        .optional()
        .isISO8601().withMessage('Event date must be a valid date'),

    check('budget')
        .optional()
        .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),

    check('client_comment')
        .optional()
        .trim(),

    handleValidationErrors
];

exports.validateDeclineQuote = [
    check('decline_reason')
        .optional()
        .trim(),

    handleValidationErrors
];

exports.validateUpdateQuoteAdmin = [
    check('status')
        .optional()
        .isIn(['requested', 'processing', 'sent', 'accepted', 'declined', 'expired'])
        .withMessage('Invalid quote status'),

    check('admin_comment')
        .optional()
        .trim(),

    check('validity_date')
        .optional()
        .isISO8601().withMessage('Validity date must be a valid date'),

    check('items')
        .optional()
        .isArray().withMessage('Items must be an array'),

    check('items.*.description')
        .optional()
        .trim()
        .notEmpty().withMessage('Item description is required'),

    check('items.*.quantity')
        .optional()
        .isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),

    check('items.*.unit_price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Item unit price must be a positive number'),

    handleValidationErrors
];