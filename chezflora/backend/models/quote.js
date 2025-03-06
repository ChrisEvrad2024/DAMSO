'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Quote extends Model {
        static associate(models) {
            // Associations
            Quote.belongsTo(models.User, { foreignKey: 'user_id' });
            Quote.hasMany(models.QuoteItem, { foreignKey: 'quote_id', as: 'items' });
        }
    }

    Quote.init({
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
        status: {
            type: DataTypes.ENUM('requested', 'processing', 'sent', 'accepted', 'declined', 'expired'),
            defaultValue: 'requested'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: { msg: 'Description is required' },
                notEmpty: { msg: 'Description cannot be empty' }
            }
        },
        event_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: { msg: 'Event type is required' },
                notEmpty: { msg: 'Event type cannot be empty' }
            }
        },
        event_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        budget: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        client_comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        admin_comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        validity_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Quote',
        tableName: 'quotes',
        underscored: true
    });

    return Quote;
};