const { User } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ApiError } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');

// Generate access token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1h'
    });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new ApiError('Email already in use', 400);
        }

        // Create new user
        const user = await User.create({
            first_name,
            last_name,
            email,
            password, // will be hashed by the model hook
            phone,
            role: 'client',
            status: 'active'
        });

        // Generate tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Send welcome email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Welcome to ChezFlora',
                text: `Dear ${user.first_name},\n\nThank you for registering with ChezFlora!`,
                html: `<p>Dear ${user.first_name},</p><p>Thank you for registering with ChezFlora!</p>`
            });
        } catch (error) {
            logger.error('Failed to send welcome email:', error);
            // Don't throw error, continue with registration
        }

        // Return user data and tokens
        res.status(201).json({
            success: true,
            data: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                token,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            throw new ApiError('Please provide email and password', 400);
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new ApiError('Invalid credentials', 401);
        }

        // Check if user is active
        if (user.status !== 'active') {
            throw new ApiError('Your account has been deactivated. Please contact support.', 403);
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new ApiError('Invalid credentials', 401);
        }

        // Update last login timestamp
        user.last_login = new Date();
        await user.save();

        // Generate tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Return user data and tokens
        res.json({
            success: true,
            data: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                token,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'role', 'status', 'created_at']
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res, next) => {
    try {
        const { first_name, last_name, phone } = req.body;

        // Find user
        const user = await User.findByPk(req.user.id);

        // Update fields
        user.first_name = first_name || user.first_name;
        user.last_name = last_name || user.last_name;
        user.phone = phone || user.phone;

        await user.save();

        res.json({
            success: true,
            data: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Find user
        const user = await User.findByPk(req.user.id);

        // Check if current password matches
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw new ApiError('Current password is incorrect', 401);
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });

        // Always return success even if email doesn't exist (for security)
        if (!user) {
            return res.json({
                success: true,
                message: 'Password reset email sent if account exists'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save to database
        user.reset_token = resetToken;
        user.reset_token_expires = resetTokenExpiry;
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Send email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request',
                template: 'passwordReset',
                context: {
                    firstName: user.first_name,
                    resetUrl,
                    expiryHours: 1
                }
            });
        } catch (error) {
            // Reset token fields if email fails
            user.reset_token = null;
            user.reset_token_expires = null;
            await user.save();

            logger.error('Failed to send password reset email:', error);
            throw new ApiError('Failed to send password reset email', 500);
        }

        res.json({
            success: true,
            message: 'Password reset email sent if account exists'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        // Find user with valid token
        const user = await User.findOne({
            where: {
                reset_token: token,
                reset_token_expires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            throw new ApiError('Invalid or expired token', 400);
        }

        // Update password and clear token
        user.password = password;
        user.reset_token = null;
        user.reset_token_expires = null;
        await user.save();

        // Send notification email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Your password has been changed',
                template: 'passwordChanged',
                context: {
                    firstName: user.first_name
                }
            });
        } catch (error) {
            logger.error('Failed to send password changed email:', error);
            // Continue even if email fails
        }

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new ApiError('Refresh token is required', 400);
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            throw new ApiError('Invalid or expired refresh token', 401);
        }

        // Find user
        const user = await User.findByPk(decoded.id);
        if (!user || user.status !== 'active') {
            throw new ApiError('User not found or inactive', 404);
        }

        // Generate new tokens
        const newToken = generateToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        res.json({
            success: true,
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    // Note: Client-side should remove tokens
    // Server-side doesn't need to do anything special for JWT-based auth
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};