'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Product extends Model {
        static associate(models) {
            // Associations
            Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
            Product.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'images' });
            Product.hasMany(models.CartItem, { foreignKey: 'product_id' });
            Product.hasMany(models.OrderItem, { foreignKey: 'product_id' });
            Product.belongsToMany(models.Promotion, {
                through: 'promotion_products',
                foreignKey: 'product_id',
                otherKey: 'promotion_id',
                as: 'promotions'
            });
        }
    }

    Product.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: 'Product name is required' },
                notEmpty: { msg: 'Product name cannot be empty' }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                notNull: { msg: 'Price is required' },
                isDecimal: { msg: 'Price must be a valid decimal number' },
                min: {
                    args: [0],
                    msg: 'Price must be greater than or equal to 0'
                }
            }
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                isInt: { msg: 'Stock must be an integer' },
                min: {
                    args: [0],
                    msg: 'Stock cannot be negative'
                }
            }
        },
        category_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        sku: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'Product',
        tableName: 'products',
        underscored: true,
        hooks: {
            beforeCreate: (product) => {
                if (!product.sku) {
                    // Generate SKU if not provided
                    product.sku = 'P' + Date.now().toString().slice(-8);
                }
            }
        }
    });

    return Product;
};