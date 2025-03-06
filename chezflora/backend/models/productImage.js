'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class ProductImage extends Model {
        static associate(models) {
            // Associations
            ProductImage.belongsTo(models.Product, { foreignKey: 'product_id' });
        }
    }

    ProductImage.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products',
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
        modelName: 'ProductImage',
        tableName: 'product_images',
        underscored: true,
        timestamps: true,
        updatedAt: false
    });

    return ProductImage;
};