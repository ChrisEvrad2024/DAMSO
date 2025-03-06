'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class QuoteItem extends Model {
        static associate(models) {
            // Associations
            QuoteItem.belongsTo(models.Quote, { foreignKey: 'quote_id' });
        }
    }

    QuoteItem.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        quote_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'quotes',
                key: 'id'
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: { msg: 'Item description is required' },
                notEmpty: { msg: 'Item description cannot be empty' }
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'QuoteItem',
        tableName: 'quote_items',
        underscored: true
    });

    return QuoteItem;
};