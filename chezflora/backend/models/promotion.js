'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Promotion extends Model {
        static associate(models) {
            // Associations
            Promotion.belongsToMany(models.Product, {
                through: 'promotion_products',
                foreignKey: 'promotion_id',
                otherKey: 'product_id',
                as: 'products'
            });
        }
    }

    Promotion.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: 'Promotion name is required' },
                notEmpty: { msg: 'Promotion name cannot be empty' }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        discount_type: {
            type: DataTypes.ENUM('percentage', 'fixed_amount'),
            allowNull: false
        },
        discount_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                notNull: { msg: 'Discount value is required' },
                min: {
                    args: [0],
                    msg: 'Discount value must be greater than or equal to 0'
                }
            }
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'Promotion',
        tableName: 'promotions',
        underscored: true
    });

    return Promotion;
};