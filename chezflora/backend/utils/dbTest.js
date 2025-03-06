const { sequelize } = require('../models');
const logger = require('../config/logger');

const testDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
        return true;
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        return false;
    }
};

module.exports = testDatabaseConnection;