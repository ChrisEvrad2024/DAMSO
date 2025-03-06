const { validationResult } = require('express-validator');
const { ApiError } = require('../errorHandler');

// Handle validation results
exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        throw new ApiError(errorMessages.join(', '), 400);
    }
    next();
};