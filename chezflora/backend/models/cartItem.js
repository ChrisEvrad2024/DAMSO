'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class CartItem extends Model {
        static associate(models) {
            // Associations
            CartItem.belongsTo(models.Cart, { foreignKey: 'cart_id' });
            CartItem.belongsTo(models.Product, { foreignKey: 'product_id' });
        }
    }

    CartItem.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        cart_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'carts',
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: {
                    args: [1],
                    msg: 'Quantity must be at least 1'
                }
            }
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'CartItem',
        tableName: 'cart_items',
        underscored: true
    });

    return CartItem;
};