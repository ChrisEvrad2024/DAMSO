const { BlogPost, User, Comment, CommentReply, sequelize } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const slugify = require('slugify');
const logger = require('../config/logger');
const { toJSON } = require('../utils/sequelizeUtils');


// Helper function to generate slug
const generateSlug = (title) => {
    const baseSlug = slugify(title, {
        lower: true,      // Convert to lowercase
        strict: true,     // Strip special characters
        remove: /[*+~.()'"!:@]/g // Remove specific characters
    });

    return `${baseSlug}-${Date.now().toString().slice(-4)}`;
};

// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Public
exports.getBlogPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;

        const offset = (page - 1) * limit;

        // Build query conditions
        const conditions = {
            status: 'published'
        };

        // Filter by category if provided
        if (category) {
            conditions.category = category;
        }

        // Search filter
        if (search) {
            conditions[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        // Get blog posts
        const { count, rows: posts } = await BlogPost.findAndCountAll({
            where: conditions,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['published_at', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'first_name', 'last_name']
                }
            ],
            attributes: {
                exclude: ['content'] // Exclude content to reduce payload size
            }
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: posts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get blog post by slug
// @route   GET /api/blog/:slug
// @access  Public
// Correction pour la fonction getBlogPostBySlug également
exports.getBlogPostBySlug = async (req, res, next) => {
    try {
        const post = await BlogPost.findOne({
            where: {
                slug: req.params.slug,
                status: 'published'
            },
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Comment,
                    as: 'comments',
                    where: { status: 'approved' },
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'user', // Utiliser l'alias correct 'user' défini dans le modèle Comment
                            attributes: ['id', 'first_name', 'last_name']
                        },
                        {
                            model: CommentReply,
                            as: 'replies',
                            include: [{
                                model: User,
                                as: 'user', // Utiliser l'alias correct 'user' défini dans le modèle CommentReply
                                attributes: ['id', 'first_name', 'last_name']
                            }]
                        }
                    ]
                }
            ]
        });

        if (!post) {
            throw new ApiError('Blog post not found', 404);
        }

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get blog categories
// @route   GET /api/blog/categories
// @access  Public
exports.getBlogCategories = async (req, res, next) => {
    try {
        // Get distinct categories from published posts
        const categories = await BlogPost.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
            where: { status: 'published' },
            raw: true
        });

        res.json({
            success: true,
            data: categories.map(item => item.category).filter(Boolean) // Filter out null categories
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a comment
// @route   POST /api/blog/:id/comments
// @access  Private
exports.createComment = async (req, res, next) => {
    try {
        const { content } = req.body;

        // Check if post exists
        const post = await BlogPost.findByPk(req.params.id);
        if (!post) {
            throw new ApiError('Blog post not found', 404);
        }

        // Create comment with pending status
        const comment = await Comment.create({
            id: uuidv4(),
            blog_post_id: req.params.id,
            user_id: req.user.id,
            content,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Comment submitted successfully and waiting for approval',
            data: {
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                status: comment.status
            }
        });
    } catch (error) {
        next(error);
    }
};

// ADMIN ENDPOINTS

// @desc    Create blog post (admin)
// @route   POST /api/blog/admin
// @access  Private (Admin)
exports.createBlogPost = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { title, content, excerpt, category, tags, status } = req.body;

        // Generate slug from title
        const slug = generateSlug(title);

        // Prepare tags as JSON string if provided
        const processedTags = tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null;

        // Create blog post
        const post = await BlogPost.create({
            id: uuidv4(),
            title,
            slug,
            content,
            excerpt: excerpt || content.substring(0, 150) + '...',
            author_id: req.user.id,
            featured_image: req.file ? `/uploads/blog/${req.file.filename}` : null,
            status: status || 'draft',
            category,
            tags: processedTags,
            published_at: status === 'published' ? new Date() : null
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            data: post
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Update blog post (admin)
// @route   PUT /api/blog/admin/:id
// @access  Private (Admin)
exports.updateBlogPost = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { title, content, excerpt, category, tags, status } = req.body;

        const post = await BlogPost.findByPk(req.params.id, {
            transaction
        });

        if (!post) {
            throw new ApiError('Blog post not found', 404);
        }

        // Check if title was changed, if so generate new slug
        let slug = post.slug;
        if (title && title !== post.title) {
            slug = generateSlug(title);
        }

        // Process tags if provided
        let processedTags = post.tags;
        if (tags) {
            processedTags = JSON.stringify(Array.isArray(tags) ? tags : [tags]);
        }

        // Handle status change to published
        let publishedAt = post.published_at;
        if (status === 'published' && post.status !== 'published') {
            publishedAt = new Date();
        }

        // Handle featured image
        let featuredImage = post.featured_image;
        if (req.file) {
            // Delete old image if exists
            if (post.featured_image) {
                const oldImagePath = path.join(__dirname, '..', 'public', post.featured_image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            featuredImage = `/uploads/blog/${req.file.filename}`;
        }

        // Update post
        post.title = title || post.title;
        post.slug = slug;
        post.content = content || post.content;
        post.excerpt = excerpt || post.excerpt;
        post.category = category || post.category;
        post.tags = processedTags;
        post.featured_image = featuredImage;
        post.status = status || post.status;
        post.published_at = publishedAt;

        await post.save({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Delete blog post (admin)
// @route   DELETE /api/blog/admin/:id
// @access  Private (Admin)
exports.deleteBlogPost = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const post = await BlogPost.findByPk(req.params.id, {
            transaction
        });

        if (!post) {
            throw new ApiError('Blog post not found', 404);
        }

        // Delete featured image if exists
        if (post.featured_image) {
            const imagePath = path.join(__dirname, '..', 'public', post.featured_image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete post (cascade will delete comments)
        await post.destroy({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Blog post deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Get all blog posts (admin)
// @route   GET /api/blog/admin
// @access  Private (Admin)
exports.getAllBlogPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;

        const offset = (page - 1) * limit;

        // Build query conditions
        const conditions = {};

        // Filter by status if provided
        if (status) {
            conditions.status = status;
        }

        // Search filter
        if (search) {
            conditions[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        // Get blog posts
        const { count, rows: posts } = await BlogPost.findAndCountAll({
            where: conditions,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Comment,
                    as: 'comments',
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'user', // Utiliser l'alias correct 'user' défini dans le modèle Comment
                            attributes: ['id', 'first_name', 'last_name']
                        },
                        {
                            model: CommentReply,
                            as: 'replies',
                            required: false,
                            include: [{
                                model: User,
                                as: 'user', // Utiliser l'alias correct 'user' défini dans le modèle CommentReply
                                attributes: ['id', 'first_name', 'last_name']
                            }]
                        }
                    ]
                }
            ]
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: posts
        });
    } catch (error) {
        logger.error(error.message, error);
        next(error);
    }
};

// @desc    Manage comments (admin)
// @route   PUT /api/blog/admin/comments/:id
// @access  Private (Admin)
exports.updateCommentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const comment = await Comment.findByPk(req.params.id);

        if (!comment) {
            throw new ApiError('Comment not found', 404);
        }

        // Update status
        comment.status = status;
        await comment.save();

        res.json({
            success: true,
            data: comment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reply to comment (admin)
// @route   POST /api/blog/admin/comments/:id/reply
// @access  Private (Admin)
exports.replyToComment = async (req, res, next) => {
    try {
        const { content } = req.body;

        const comment = await Comment.findByPk(req.params.id);

        if (!comment) {
            throw new ApiError('Comment not found', 404);
        }

        // Create reply
        const reply = await CommentReply.create({
            id: uuidv4(),
            comment_id: comment.id,
            user_id: req.user.id,
            content
        });

        // Include user info in response
        const replyWithUser = await CommentReply.findByPk(reply.id, {
            include: [{
                model: User,
                attributes: ['id', 'first_name', 'last_name']
            }]
        });

        res.status(201).json({
            success: true,
            data: replyWithUser
        });
    } catch (error) {
        next(error);
    }
};