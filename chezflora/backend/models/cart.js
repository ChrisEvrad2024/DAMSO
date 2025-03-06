'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Cart extends Model {
        static associate(models) {
            // Associations
            Cart.belongsTo(models.User, { foreignKey: 'user_id' });
            Cart.hasMany(models.CartItem, { foreignKey: 'cart_id', as: 'items' });
        }
    }

    Cart.init({
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
        }
    }, {
        sequelize,
        modelName: 'Cart',
        tableName: 'carts',
        underscored: true
    });

    return Cart;
};