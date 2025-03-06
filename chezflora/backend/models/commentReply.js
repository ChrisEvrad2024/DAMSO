'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class CommentReply extends Model {
        static associate(models) {
            // Associations
            CommentReply.belongsTo(models.Comment, { foreignKey: 'comment_id' });
            CommentReply.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }

    CommentReply.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        comment_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'comments',
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
                notNull: { msg: 'Reply content is required' },
                notEmpty: { msg: 'Reply content cannot be empty' }
            }
        }
    }, {
        sequelize,
        modelName: 'CommentReply',
        tableName: 'comment_replies',
        underscored: true,
        timestamps: true,
        updatedAt: false
    });

    return CommentReply;
};