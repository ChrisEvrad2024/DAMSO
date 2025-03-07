const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateCreateBlogPost = [
    check('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),

    check('content')
        .notEmpty().withMessage('Content is required'),

    check('excerpt')
        .optional()
        .isLength({ max: 500 }).withMessage('Excerpt must be less than 500 characters'),

    check('category')
        .optional()
        .isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),

    check('status')
        .optional()
        .isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),

    handleValidationErrors
];

exports.validateUpdateBlogPost = [
    check('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),

    check('content')
        .optional(),

    check('excerpt')
        .optional()
        .isLength({ max: 500 }).withMessage('Excerpt must be less than 500 characters'),

    check('category')
        .optional()
        .isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),

    check('status')
        .optional()
        .isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),

    handleValidationErrors
];

exports.validateCreateComment = [
    check('content')
        .trim()
        .notEmpty().withMessage('Comment content is required')
        .isLength({ min: 2, max: 1000 }).withMessage('Comment must be between 2 and 1000 characters'),

    handleValidationErrors
];

exports.validateUpdateCommentStatus = [
    check('status')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),

    handleValidationErrors
];

exports.validateReplyToComment = [
    check('content')
        .trim()
        .notEmpty().withMessage('Reply content is required')
        .isLength({ min: 2, max: 1000 }).withMessage('Reply must be between 2 and 1000 characters'),

    handleValidationErrors
];