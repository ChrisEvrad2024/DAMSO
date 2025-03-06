'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Category extends Model {
        static associate(models) {
            // Associations
            Category.hasMany(models.Product, { foreignKey: 'category_id', as: 'products' });
            Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
            Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });
        }
    }

    Category.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: { msg: 'Category name is required' },
                notEmpty: { msg: 'Category name cannot be empty' }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        image_url: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        parent_id: {
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
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'Category',
        tableName: 'categories',
        underscored: true
    });

    return Category;
};