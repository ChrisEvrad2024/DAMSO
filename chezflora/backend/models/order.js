'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Order extends Model {
        static associate(models) {
            // Associations
            Order.belongsTo(models.User, { foreignKey: 'user_id' });
            Order.belongsTo(models.Address, { foreignKey: 'shipping_address_id', as: 'shippingAddress' });
            Order.belongsTo(models.Address, { foreignKey: 'billing_address_id', as: 'billingAddress' });
            Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
        }
    }

    Order.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        order_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
            defaultValue: 'pending'
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        shipping_address_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'addresses',
                key: 'id'
            }
        },
        billing_address_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'addresses',
                key: 'id'
            }
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        payment_status: {
            type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
            defaultValue: 'pending'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
        underscored: true
    });

    return Order;
};