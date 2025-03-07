const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./config/logger');
const { initScheduler } = require('./scripts/scheduler');

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');

        // Start server
        app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });

        // Initialize scheduled tasks
        if (process.env.NODE_ENV === 'production') {
            initScheduler();
        }
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
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