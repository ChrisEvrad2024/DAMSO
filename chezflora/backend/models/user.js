'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // Associations will be defined here
            User.hasMany(models.Address, { foreignKey: 'user_id', as: 'addresses' });
            User.hasOne(models.Cart, { foreignKey: 'user_id', as: 'cart' });
            User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
            User.hasMany(models.Quote, { foreignKey: 'user_id', as: 'quotes' });
            User.hasMany(models.BlogPost, { foreignKey: 'author_id', as: 'blogPosts' });
            User.hasMany(models.Comment, { foreignKey: 'user_id', as: 'comments' });
            User.hasMany(models.CommentReply, { foreignKey: 'user_id', as: 'commentReplies' });
            User.hasMany(models.Testimonial, { foreignKey: 'user_id', as: 'testimonials' });
        }

        // Compare password method
        async comparePassword(candidatePassword) {
            return await bcrypt.compare(candidatePassword, this.password);
        }
    }

    User.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        first_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: { msg: 'First name is required' },
                notEmpty: { msg: 'First name cannot be empty' }
            }
        },
        last_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: { msg: 'Last name is required' },
                notEmpty: { msg: 'Last name cannot be empty' }
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: {
                args: true,
                msg: 'Email address already in use'
            },
            validate: {
                notNull: { msg: 'Email is required' },
                isEmail: { msg: 'Please provide a valid email address' }
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: 'Password is required' },
                len: {
                    args: [6, 100],
                    msg: 'Password must be between 6 and 100 characters long'
                }
            }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('client', 'admin', 'super_admin'),
            defaultValue: 'client'
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        },
        reset_token: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        reset_token_expires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'banned'),
            defaultValue: 'active'
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    });

    return User;
};