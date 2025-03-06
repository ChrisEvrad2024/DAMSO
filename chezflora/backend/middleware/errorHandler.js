const logger = require('../config/logger');

class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 - Not Found middleware
const notFound = (req, res, next) => {
    const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(err.stack);

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        const message = err.errors.map(e => e.message).join(', ');
        error = new ApiError(message, 400);
    }

    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = err.errors.map(e => e.message).join(', ');
        error = new ApiError(message, 400);
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError('Invalid token. Please log in again.', 401);
    }

    // JWT expired error
    if (err.name === 'TokenExpiredError') {
        error = new ApiError('Your token has expired. Please log in again.', 401);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = { ApiError, errorHandler, notFound };