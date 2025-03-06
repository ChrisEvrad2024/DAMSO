'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Testimonial extends Model {
        static associate(models) {
            // Associations
            Testimonial.belongsTo(models.User, { foreignKey: 'user_id' });
        }
    }

    Testimonial.init({
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
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: { msg: 'Testimonial content is required' },
                notEmpty: { msg: 'Testimonial content cannot be empty' }
            }
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [1],
                    msg: 'Rating must be at least 1'
                },
                max: {
                    args: [5],
                    msg: 'Rating must be at most 5'
                }
            }
        },
        is_approved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'Testimonial',
        tableName: 'testimonials',
        underscored: true,
        timestamps: true,
        updatedAt: false
    });

    return Testimonial;
};