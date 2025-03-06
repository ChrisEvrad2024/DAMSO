const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ApiError } = require('./errorHandler');

// Protect routes - Verify JWT token and attach user to request
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            throw new ApiError('Not authorized to access this route', 401);
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user
            const user = await User.findByPk(decoded.id);

            if (!user) {
                throw new ApiError('User not found', 404);
            }

            if (user.status !== 'active') {
                throw new ApiError('Your account has been deactivated', 403);
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (err) {
            if (err.name === 'JsonWebTokenError') {
                throw new ApiError('Invalid token', 401);
            } else if (err.name === 'TokenExpiredError') {
                throw new ApiError('Token expired', 401);
            } else {
                throw err;
            }
        }
    } catch (error) {
        next(error);
    }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        return next(new ApiError('Not authorized as an admin', 403));
    }
    next();
};

// Super admin only middleware
exports.superAdminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return next(new ApiError('Not authorized as a super admin', 403));
    }
    next();
};