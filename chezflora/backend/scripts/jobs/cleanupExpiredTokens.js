const { User } = require('../../models');
const logger = require('../../config/logger');

/**
 * Clean up expired password reset tokens
 */
const cleanupExpiredTokens = async () => {
    try {
        logger.info('Starting cleanup of expired reset tokens');

        const now = new Date();

        // Find users with expired reset tokens
        const result = await User.update(
            {
                reset_token: null,
                reset_token_expires: null
            },
            {
                where: {
                    reset_token_expires: {
                        [Op.lt]: now
                    }
                }
            }
        );

        logger.info(`Cleaned up ${result[0]} expired reset tokens`);
    } catch (error) {
        logger.error('Error during expired token cleanup:', error);
    }
};

module.exports = cleanupExpiredTokens;