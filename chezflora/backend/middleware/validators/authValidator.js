const { check, validationResult } = require('express-validator');
const { ApiError } = require('../errorHandler');

// Handle validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        throw new ApiError(errorMessages.join(', '), 400);
    }
    next();
};

// Validate user registration
exports.validateRegister = [
    check('first_name')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),

    check('last_name')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),

    check('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address'),

    check('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    check('phone')
        .optional()
        .trim()
        .isMobilePhone().withMessage('Please provide a valid phone number'),

    handleValidationErrors
];

// Validate login
exports.validateLogin = [
    check('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address'),

    check('password')
        .trim()
        .notEmpty().withMessage('Password is required'),

    handleValidationErrors
];

// Validate profile update
exports.validateUpdateProfile = [
    check('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),

    check('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),

    check('phone')
        .optional()
        .trim()
        .isMobilePhone().withMessage('Please provide a valid phone number'),

    handleValidationErrors
];

// Validate change password
exports.validateChangePassword = [
    check('currentPassword')
        .trim()
        .notEmpty().withMessage('Current password is required'),

    check('newPassword')
        .trim()
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),

    handleValidationErrors
];

// Validate forgot password
exports.validateForgotPassword = [
    check('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address'),

    handleValidationErrors
];

// Validate reset password
exports.validateResetPassword = [
    check('token')
        .trim()
        .notEmpty().withMessage('Token is required'),

    check('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    handleValidationErrors
];

// Validate refresh token
exports.validateRefreshToken = [
    check('refreshToken')
        .trim()
        .notEmpty().withMessage('Refresh token is required'),

    handleValidationErrors
];