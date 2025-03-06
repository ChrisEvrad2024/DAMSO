// services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create reusable transporter (configured for development/testing)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'testuser',
        pass: process.env.EMAIL_PASS || 'testpassword'
    }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise}
 */
exports.sendEmail = async (options) => {
    try {
        // For development, just log the email
        if (process.env.NODE_ENV !== 'production') {
            logger.info('Email would be sent with the following details:');
            logger.info(`To: ${options.to}`);
            logger.info(`Subject: ${options.subject}`);
            return { messageId: 'dev-email-id', success: true };
        }

        // For production, send the actual email
        const mailOptions = {
            from: `"ChezFlora" <${process.env.EMAIL_FROM || 'noreply@chezflora.com'}>`,
            to: options.to,
            subject: options.subject,
            text: options.text || 'No text content provided',
            html: options.html // Optional
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error('Email sending failed:', error);
        throw error;
    }
};