const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, changePassword,
    forgotPassword, resetPassword, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validateUpdateProfile,
    validateChangePassword, validateForgotPassword, validateResetPassword,
    validateRefreshToken } = require('../middleware/validators/authValidator');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/refresh-token', validateRefreshToken, refreshToken);

// Protected routes
router.use(protect); // Apply auth middleware to all routes below

router.get('/me', getMe);
router.put('/me', validateUpdateProfile, updateMe);
router.put('/change-password', validateChangePassword, changePassword);
router.post('/logout', logout);

module.exports = router;