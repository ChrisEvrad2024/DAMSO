'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class Comment extends Model {
        static associate(models) {
            // Associations
            Comment.belongsTo(models.BlogPost, { foreignKey: 'blog_post_id' });
            Comment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            Comment.hasMany(models.CommentReply, { foreignKey: 'comment_id', as: 'replies' });
        }
    }

    Comment.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        blog_post_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'blog_posts',
                key: 'id'
            }
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
                notNull: { msg: 'Comment content is required' },
                notEmpty: { msg: 'Comment content cannot be empty' }
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        }
    }, {
        sequelize,
        modelName: 'Comment',
        tableName: 'comments',
        underscored: true
    });

    return Comment;
};