const { Quote, QuoteItem, User, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { ApiError } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');
const paginate = require('../utils/paginate');
const { Op } = require('sequelize');

// @desc    Request a quote
// @route   POST /api/quotes
// @access  Private
exports.requestQuote = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { description, event_type, event_date, budget, client_comment } = req.body;

        // Create quote
        const quote = await Quote.create({
            id: uuidv4(),
            user_id: req.user.id,
            status: 'requested',
            description,
            event_type,
            event_date: event_date ? new Date(event_date) : null,
            budget: budget ? parseFloat(budget) : null,
            client_comment,
        }, { transaction });

        await transaction.commit();

        // Notify admin via email
        try {
            const user = await User.findByPk(req.user.id);

            await sendEmail({
                to: process.env.ADMIN_EMAIL || 'admin@chezflora.com',
                subject: 'New Quote Request',
                template: 'quoteRequest',
                context: {
                    customerName: `${user.first_name} ${user.last_name}`,
                    customerEmail: user.email,
                    quoteId: quote.id,
                    eventType: quote.event_type,
                    eventDate: quote.event_date ? new Date(quote.event_date).toLocaleDateString() : 'Not specified',
                    description: quote.description,
                    adminUrl: `${process.env.ADMIN_URL}/quotes/${quote.id}`
                }
            });
        } catch (error) {
            logger.error('Failed to send quote request notification email:', error);
            // Continue even if email fails
        }

        res.status(201).json({
            success: true,
            data: quote
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Get user's quotes
// @route   GET /api/quotes
// @access  Private
exports.getQuotes = async (req, res, next) => {
    try {
        const { status } = req.query;

        // Build query conditions
        const conditions = { user_id: req.user.id };

        // Filter by status if provided
        if (status) {
            conditions.status = status;
        }

        // Use the paginate utility
        const result = await paginate(Quote, {
            page: req.pagination.page,
            limit: req.pagination.limit,
            where: conditions,
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get quote details
// @route   GET /api/quotes/:id
// @access  Private
exports.getQuote = async (req, res, next) => {
    try {
        const quote = await Quote.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            include: [
                {
                    model: QuoteItem,
                    as: 'items'
                }
            ]
        });

        if (!quote) {
            throw new ApiError('Quote not found', 404);
        }

        res.json({
            success: true,
            data: quote
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update quote (client side - only for requested quotes)
// @route   PUT /api/quotes/:id
// @access  Private
exports.updateQuote = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { description, event_type, event_date, budget, client_comment } = req.body;

        const quote = await Quote.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            transaction
        });

        if (!quote) {
            throw new ApiError('Quote not found', 404);
        }

        // Only allow updates for requested quotes
        if (quote.status !== 'requested') {
            throw new ApiError('Quote can only be updated when in requested status', 400);
        }

        // Update fields
        quote.description = description || quote.description;
        quote.event_type = event_type || quote.event_type;
        quote.event_date = event_date ? new Date(event_date) : quote.event_date;
        quote.budget = budget ? parseFloat(budget) : quote.budget;
        quote.client_comment = client_comment !== undefined ? client_comment : quote.client_comment;

        await quote.save({ transaction });

        await transaction.commit();

        // Notify admin via email
        try {
            const user = await User.findByPk(req.user.id);

            await sendEmail({
                to: process.env.ADMIN_EMAIL || 'admin@chezflora.com',
                subject: 'Quote Request Updated',
                template: 'quoteUpdated',
                context: {
                    customerName: `${user.first_name} ${user.last_name}`,
                    customerEmail: user.email,
                    quoteId: quote.id,
                    eventType: quote.event_type,
                    eventDate: quote.event_date ? new Date(quote.event_date).toLocaleDateString() : 'Not specified',
                    description: quote.description,
                    adminUrl: `${process.env.ADMIN_URL}/quotes/${quote.id}`
                }
            });
        } catch (error) {
            logger.error('Failed to send quote update notification email:', error);
            // Continue even if email fails
        }

        res.json({
            success: true,
            data: quote
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Accept quote
// @route   PUT /api/quotes/:id/accept
// @access  Private
exports.acceptQuote = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const quote = await Quote.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            include: [
                {
                    model: QuoteItem,
                    as: 'items'
                }
            ],
            transaction
        });

        if (!quote) {
            throw new ApiError('Quote not found', 404);
        }

        // Only allow accepting sent quotes
        if (quote.status !== 'sent') {
            throw new ApiError('Only quotes in "sent" status can be accepted', 400);
        }

        // Check if quote has items
        if (!quote.items || quote.items.length === 0) {
            throw new ApiError('Quote does not have any items to accept', 400);
        }

        // Update quote status
        quote.status = 'accepted';
        await quote.save({ transaction });

        await transaction.commit();

        // Notify admin via email
        try {
            const user = await User.findByPk(req.user.id);

            await sendEmail({
                to: process.env.ADMIN_EMAIL || 'admin@chezflora.com',
                subject: 'Quote Accepted',
                template: 'quoteAccepted',
                context: {
                    customerName: `${user.first_name} ${user.last_name}`,
                    customerEmail: user.email,
                    quoteId: quote.id,
                    eventType: quote.event_type,
                    eventDate: quote.event_date ? new Date(quote.event_date).toLocaleDateString() : 'Not specified',
                    adminUrl: `${process.env.ADMIN_URL}/quotes/${quote.id}`
                }
            });
        } catch (error) {
            logger.error('Failed to send quote accepted notification email:', error);
            // Continue even if email fails
        }

        res.json({
            success: true,
            data: {
                id: quote.id,
                status: quote.status,
                message: 'Quote has been accepted successfully'
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Decline quote
// @route   PUT /api/quotes/:id/decline
// @access  Private
exports.declineQuote = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { decline_reason } = req.body;

        const quote = await Quote.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            transaction
        });

        if (!quote) {
            throw new ApiError('Quote not found', 404);
        }

        // Only allow declining sent quotes
        if (quote.status !== 'sent') {
            throw new ApiError('Only quotes in "sent" status can be declined', 400);
        }

        // Update quote status and add client comment
        quote.status = 'declined';
        quote.client_comment = decline_reason || quote.client_comment;
        await quote.save({ transaction });

        await transaction.commit();

        // Notify admin via email
        try {
            const user = await User.findByPk(req.user.id);

            await sendEmail({
                to: process.env.ADMIN_EMAIL || 'admin@chezflora.com',
                subject: 'Quote Declined',
                template: 'quoteDeclined',
                context: {
                    customerName: `${user.first_name} ${user.last_name}`,
                    customerEmail: user.email,
                    quoteId: quote.id,
                    eventType: quote.event_type,
                    declineReason: decline_reason || 'No reason provided',
                    adminUrl: `${process.env.ADMIN_URL}/quotes/${quote.id}`
                }
            });
        } catch (error) {
            logger.error('Failed to send quote declined notification email:', error);
            // Continue even if email fails
        }

        res.json({
            success: true,
            data: {
                id: quote.id,
                status: quote.status,
                message: 'Quote has been declined'
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// ADMIN ENDPOINTS

// @desc    Get all quotes (admin)
// @route   GET /api/quotes/admin
// @access  Private (Admin)
exports.getAllQuotes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, user_id, event_type, from_date, to_date } = req.query;

        const offset = (page - 1) * limit;

        // Build query conditions
        const conditions = {};

        // Filter by status if provided
        if (status) {
            conditions.status = status;
        }

        // Filter by user if provided
        if (user_id) {
            conditions.user_id = user_id;
        }

        // Filter by event type if provided
        if (event_type) {
            conditions.event_type = event_type;
        }

        // Filter by date range if provided
        if (from_date && to_date) {
            conditions.event_date = {
                [Op.between]: [new Date(from_date), new Date(to_date)]
            };
        } else if (from_date) {
            conditions.event_date = {
                [Op.gte]: new Date(from_date)
            };
        } else if (to_date) {
            conditions.event_date = {
                [Op.lte]: new Date(to_date)
            };
        }

        // Get quotes
        const { count, rows: quotes } = await Quote.findAndCountAll({
            where: conditions,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                }
            ]
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: quotes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get quote details (admin)
// @route   GET /api/quotes/admin/:id
// @access  Private (Admin)
exports.getQuoteAdmin = async (req, res, next) => {
    try {
        const quote = await Quote.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: QuoteItem,
                    as: 'items'
                }
            ]
        });

        if (!quote) {
            throw new ApiError('Quote not found', 404);
        }

        res.json({
            success: true,
            data: quote
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update quote (admin)
// @route   PUT /api/quotes/admin/:id
// @access  Private (Admin)
exports.updateQuoteAdmin = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { status, admin_comment, validity_date, items } = req.body;

        const quote = await Quote.findByPk(req.params.id, {
            include: [
                {
                    model: User
                },
                {
                    model: QuoteItem,
                    as: 'items'
                }
            ],
            transaction
        });

        if (!quote) {
            throw new ApiError('Quote not found', 404);
        }

        // Update quote fields
        if (status) quote.status = status;
        if (admin_comment !== undefined) quote.admin_comment = admin_comment;
        if (validity_date) quote.validity_date = new Date(validity_date);

        await quote.save({ transaction });

        // Handle items if provided
        if (items && Array.isArray(items)) {
            // Delete existing items if new items are provided
            if (quote.items && quote.items.length > 0) {
                await QuoteItem.destroy({
                    where: { quote_id: quote.id },
                    transaction
                });
            }

            // Create new items
            const itemPromises = items.map(item => {
                return QuoteItem.create({
                    id: uuidv4(),
                    quote_id: quote.id,
                    description: item.description,
                    quantity: parseInt(item.quantity, 10),
                    unit_price: parseFloat(item.unit_price)
                }, { transaction });
            });

            await Promise.all(itemPromises);
        }

        await transaction.commit();

        // Send email notification if status changed to 'sent'
        if (status === 'sent') {
            try {
                await sendEmail({
                    to: quote.User.email,
                    subject: 'Quote Ready for Review',
                    template: 'quoteSent',
                    context: {
                        firstName: quote.User.first_name,
                        quoteId: quote.id,
                        eventType: quote.event_type,
                        eventDate: quote.event_date ? new Date(quote.event_date).toLocaleDateString() : 'Not specified',
                        validUntil: quote.validity_date ? new Date(quote.validity_date).toLocaleDateString() : 'Not specified',
                        quoteUrl: `${process.env.FRONTEND_URL}/account/quotes/${quote.id}`
                    }
                });
            } catch (error) {
                logger.error('Failed to send quote notification email:', error);
                // Continue even if email fails
            }
        }

        // Fetch updated quote with items
        const updatedQuote = await Quote.findByPk(quote.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: QuoteItem,
                    as: 'items'
                }
            ]
        });

        res.json({
            success: true,
            data: updatedQuote
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};