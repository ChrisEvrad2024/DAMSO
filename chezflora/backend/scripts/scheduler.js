const cron = require('node-cron');
const cleanupExpiredTokens = require('./jobs/cleanupExpiredTokens');
const checkLowStock = require('./jobs/checkLowStock');
const logger = require('../config/logger');

// Initialize scheduled tasks
const initScheduler = () => {
    logger.info('Initializing scheduled tasks');

    // Run cleanupExpiredTokens everyday at midnight
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running scheduled task: cleanupExpiredTokens');
        await cleanupExpiredTokens();
    });

    // Run checkLowStock every day at 9 AM
    cron.schedule('0 9 * * *', async () => {
        logger.info('Running scheduled task: checkLowStock');
        await checkLowStock();
    });

    logger.info('Scheduled tasks initialized successfully');
};

module.exports = { initScheduler };