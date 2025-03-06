const app = require('./app');
const logger = require('./config/logger');
const testDatabaseConnection = require('./utils/dbTest');

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
const startServer = async () => {
    const isConnected = await testDatabaseConnection();

    if (isConnected) {
        app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } else {
        logger.error('Failed to connect to the database. Server not started.');
        process.exit(1);
    }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});