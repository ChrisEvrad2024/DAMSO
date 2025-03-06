'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    class BlogPost extends Model {
        static associate(models) {
            // Associations
            BlogPost.belongsTo(models.User, { foreignKey: 'author_id', as: 'author' });
            BlogPost.hasMany(models.Comment, { foreignKey: 'blog_post_id', as: 'comments' });
        }
    }

    BlogPost.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: () => uuidv4()
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: 'Title is required' },
                notEmpty: { msg: 'Title cannot be empty' }
            }
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: { msg: 'Content is required' },
                notEmpty: { msg: 'Content cannot be empty' }
            }
        },
        excerpt: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        author_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        featured_image: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            defaultValue: 'draft'
        },
        category: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        tags: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        published_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'BlogPost',
        tableName: 'blog_posts',
        underscored: true,
        hooks: {
            beforeCreate: (post) => {
                if (!post.slug) {
                    // Generate slug from title
                    post.slug = post.title
                        .toLowerCase()
                        .replace(/[^\w ]+/g, '')
                        .replace(/ +/g, '-') + '-' + Date.now().toString().slice(-4);
                }
            }
        }
    });

    return BlogPost;
};