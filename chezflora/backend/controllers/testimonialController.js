const { Testimonial, User, sequelize } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { toJSON } = require('../utils/sequelizeUtils');

    
// @desc    Get approved testimonials
// @route   GET /api/testimonials
// @access  Public
exports.getTestimonials = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        // Get approved testimonials
        const { count, rows: testimonials } = await Testimonial.findAndCountAll({
            where: { is_approved: true },
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name']
                }
            ]
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit a testimonial
// @route   POST /api/testimonials
// @access  Private
exports.submitTestimonial = async (req, res, next) => {
    try {
        const { content, rating } = req.body;

        // Check if user already submitted a testimonial
        const existingTestimonial = await Testimonial.findOne({
            where: { user_id: req.user.id }
        });

        if (existingTestimonial) {
            throw new ApiError('You have already submitted a testimonial', 400);
        }

        // Create testimonial
        const testimonial = await Testimonial.create({
            id: uuidv4(),
            user_id: req.user.id,
            content,
            rating: parseInt(rating, 10),
            is_approved: false
        });

        res.status(201).json({
            success: true,
            message: 'Testimonial submitted successfully and waiting for approval',
            data: {
                id: testimonial.id,
                content: testimonial.content,
                rating: testimonial.rating,
                created_at: testimonial.created_at,
                is_approved: testimonial.is_approved
            }
        });
    } catch (error) {
        next(error);
    }
};

// ADMIN ENDPOINTS

// @desc    Get all testimonials (admin)
// @route   GET /api/testimonials/admin
// @access  Private (Admin)
exports.getAllTestimonials = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, is_approved } = req.query;

        const offset = (page - 1) * limit;

        // Build query conditions
        const conditions = {};

        // Filter by approval status if provided
        if (is_approved !== undefined) {
            conditions.is_approved = is_approved === 'true';
        }

        // Get testimonials
        const { count, rows: testimonials } = await Testimonial.findAndCountAll({
            where: conditions,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ]
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update testimonial (admin)
// @route   PUT /api/testimonials/admin/:id
// @access  Private (Admin)
exports.updateTestimonialStatus = async (req, res, next) => {
    try {
        const { is_approved } = req.body;

        const testimonial = await Testimonial.findByPk(req.params.id, {
            include: [{ model: User }]
        });

        if (!testimonial) {
            throw new ApiError('Testimonial not found', 404);
        }

        // Update approval status
        testimonial.is_approved = is_approved;
        await testimonial.save();

        res.json({
            success: true,
            data: testimonial
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete testimonial (admin)
// @route   DELETE /api/testimonials/admin/:id
// @access  Private (Admin)
exports.deleteTestimonial = async (req, res, next) => {
    try {
        const testimonial = await Testimonial.findByPk(req.params.id);

        if (!testimonial) {
            throw new ApiError('Testimonial not found', 404);
        }

        await testimonial.destroy();

        res.json({
            success: true,
            message: 'Testimonial deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};