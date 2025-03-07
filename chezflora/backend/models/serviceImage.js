'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class ServiceImage extends Model {
        static associate(models) {
            // Associations
            ServiceImage.belongsTo(models.Service, { foreignKey: 'service_id' });
        }
    }

    ServiceImage.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        service_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'services',
                key: 'id'
            }
        },
        image_url: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: 'Image URL is required' },
                notEmpty: { msg: 'Image URL cannot be empty' }
            }
        },
        is_primary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'ServiceImage',
        tableName: 'service_images',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        // Options pour eviter les problèmes de sérialisation
        toJSON: {
            virtuals: true,
            // Exclure les champs qui peuvent causer des problèmes
            getterMethods: true
        }
    });

    return ServiceImage;
};