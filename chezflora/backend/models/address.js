'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Address extends Model {
        static associate(models) {
            // Associations
            Address.belongsTo(models.User, { foreignKey: 'user_id' });
            Address.hasMany(models.Order, { foreignKey: 'shipping_address_id', as: 'shippingOrders' });
            Address.hasMany(models.Order, { foreignKey: 'billing_address_id', as: 'billingOrders' });
        }
    }

    Address.init({
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
        address_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        first_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: { msg: 'First name is required' },
                notEmpty: { msg: 'First name cannot be empty' }
            }
        },
        last_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: { msg: 'Last name is required' },
                notEmpty: { msg: 'Last name cannot be empty' }
            }
        },
        address_line1: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: 'Address line 1 is required' },
                notEmpty: { msg: 'Address line 1 cannot be empty' }
            }
        },
        address_line2: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: { msg: 'City is required' },
                notEmpty: { msg: 'City cannot be empty' }
            }
        },
        postal_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                notNull: { msg: 'Postal code is required' },
                notEmpty: { msg: 'Postal code cannot be empty' }
            }
        },
        country: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: { msg: 'Country is required' },
                notEmpty: { msg: 'Country cannot be empty' }
            }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'Address',
        tableName: 'addresses',
        underscored: true
    });

    return Address;
};