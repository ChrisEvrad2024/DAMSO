const { Product, User } = require('../../models');
const { sendEmail } = require('../../services/emailService');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

/**
 * Check for low stock products and send alerts
 */
const checkLowStock = async () => {
    try {
        logger.info('Starting low stock check');

        // Find products with low stock (less than 5)
        const lowStockProducts = await Product.findAll({
            where: {
                stock: {
                    [Op.lt]: 5
                },
                is_active: true
            }
        });

        if (lowStockProducts.length === 0) {
            logger.info('No low stock products found');
            return;
        }

        // Get admin users to notify
        const adminUsers = await User.findAll({
            where: {
                role: {
                    [Op.in]: ['admin', 'super_admin']
                },
                status: 'active'
            }
        });

        if (adminUsers.length === 0) {
            logger.warn('No active admin users found to notify about low stock');
            return;
        }

        // Create list of products for email
        const productList = lowStockProducts.map(product =>
            `${product.name} (ID: ${product.id}): ${product.stock} units remaining`
        ).join('\n');

        // Send email to each admin
        for (const admin of adminUsers) {
            await sendEmail({
                to: admin.email,
                subject: 'ChezFlora: Low Stock Alert',
                template: 'lowStockAlert',
                context: {
                    firstName: admin.first_name,
                    productCount: lowStockProducts.length,
                    productList,
                    adminUrl: `${process.env.ADMIN_URL}/products`
                }
            });
        }

        logger.info(`Sent low stock alerts for ${lowStockProducts.length} products to ${adminUsers.length} admins`);
    } catch (error) {
        logger.error('Error during low stock check:', error);
    }
};

module.exports = checkLowStock;