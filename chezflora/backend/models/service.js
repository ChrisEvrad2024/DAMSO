'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Service extends Model {
        static associate(models) {
            // Associations
            Service.hasMany(models.ServiceImage, { foreignKey: 'service_id', as: 'images' });
        }
    }

    Service.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: 'Service name is required' },
                notEmpty: { msg: 'Service name cannot be empty' }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        base_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                notNull: { msg: 'Base price is required' },
                isDecimal: { msg: 'Base price must be a valid decimal number' },
                min: {
                    args: [0],
                    msg: 'Base price must be greater than or equal to 0'
                }
            }
        },
        is_available: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'Service',
        tableName: 'services',
        underscored: true
    });

    return Service;
};