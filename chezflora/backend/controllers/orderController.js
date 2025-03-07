const { Order, OrderItem, Cart, CartItem, Product, ProductImage, Category,
    Address, sequelize, User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { ApiError } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');
const paginate = require('../utils/paginate');
const logger = require('../config/logger');

// Generate unique order number
const generateOrderNumber = () => {
    // Format: FL-YYMMDD-XXXX (FL for ChezFlora, date, random 4 chars)
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `FL-${year}${month}${day}-${random}`;
};

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { shipping_address_id, billing_address_id = shipping_address_id,
            payment_method, notes } = req.body;

        // Validate addresses
        const shippingAddress = await Address.findOne({
            where: {
                id: shipping_address_id,
                user_id: req.user.id
            },
            transaction
        });

        if (!shippingAddress) {
            throw new ApiError('Shipping address not found', 404);
        }

        const billingAddress = await Address.findOne({
            where: {
                id: billing_address_id,
                user_id: req.user.id
            },
            transaction
        });

        if (!billingAddress) {
            throw new ApiError('Billing address not found', 404);
        }

        // Get user's cart
        const cart = await Cart.findOne({
            where: { user_id: req.user.id },
            include: [
                {
                    model: CartItem,
                    as: 'items',
                    include: [{ model: Product }]
                }
            ],
            transaction
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            throw new ApiError('Your cart is empty', 400);
        }

        // Validate all items are in stock
        for (const item of cart.items) {
            if (item.quantity > item.Product.stock) {
                throw new ApiError(`Not enough stock for ${item.Product.name}`, 400);
            }
        }

        // Calculate total amount
        let totalAmount = 0;
        for (const item of cart.items) {
            totalAmount += item.unit_price * item.quantity;
        }

        // Create order
        const order = await Order.create({
            id: uuidv4(),
            user_id: req.user.id,
            order_number: generateOrderNumber(),
            status: 'pending',
            total_amount: totalAmount,
            shipping_address_id,
            billing_address_id,
            payment_method,
            payment_status: 'pending',
            notes,
        }, { transaction });

        // Create order items from cart items
        const orderItems = [];
        for (const item of cart.items) {
            const orderItem = await OrderItem.create({
                id: uuidv4(),
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            }, { transaction });

            // Reduce product stock
            await item.Product.update({
                stock: item.Product.stock - item.quantity
            }, { transaction });

            orderItems.push(orderItem);
        }

        // Clear cart after order is created
        await CartItem.destroy({
            where: { cart_id: cart.id },
            transaction
        });

        await transaction.commit();

        // Send order confirmation email
        try {
            const user = await User.findByPk(req.user.id);

            await sendEmail({
                to: user.email,
                subject: `Order Confirmation - ${order.order_number}`,
                template: 'orderConfirmation',
                context: {
                    firstName: user.first_name,
                    orderNumber: order.order_number,
                    orderDate: new Date().toLocaleDateString(),
                    totalAmount: order.total_amount.toFixed(2),
                    paymentMethod: order.payment_method,
                    shippingAddress: `${shippingAddress.address_line1}, ${shippingAddress.city}, ${shippingAddress.postal_code}`,
                    orderUrl: `${process.env.FRONTEND_URL}/account/orders/${order.id}`
                }
            });
        } catch (error) {
            logger.error('Failed to send order confirmation email:', error);
            // Continue even if email fails
        }

        // Return newly created order
        const createdOrder = await Order.findByPk(order.id, {
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            include: [
                                {
                                    model: ProductImage,
                                    as: 'images',
                                    where: { is_primary: true },
                                    required: false,
                                    limit: 1
                                }
                            ]
                        }
                    ]
                },
                { model: Address, as: 'shippingAddress' },
                { model: Address, as: 'billingAddress' }
            ]
        });

        res.status(201).json({
            success: true,
            data: createdOrder
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
    try {
        const { status } = req.query;

        // Build query conditions
        const conditions = { user_id: req.user.id };

        // Filter by status if provided
        if (status) {
            conditions.status = status;
        }

        // Use the paginate utility
        const result = await paginate(Order, {
            page: req.pagination.page,
            limit: req.pagination.limit,
            where: conditions,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: ProductImage,
                                    as: 'images',
                                    where: { is_primary: true },
                                    required: false,
                                    limit: 1,
                                    attributes: ['image_url']
                                }
                            ]
                        }
                    ]
                }
            ]
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

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            include: [
                                {
                                    model: ProductImage,
                                    as: 'images',
                                    where: { is_primary: true },
                                    required: false,
                                    limit: 1
                                },
                                {
                                    model: Category,
                                    as: 'category',
                                    attributes: ['id', 'name']
                                }
                            ]
                        }
                    ]
                },
                { model: Address, as: 'shippingAddress' },
                { model: Address, as: 'billingAddress' }
            ]
        });

        if (!order) {
            throw new ApiError('Order not found', 404);
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const order = await Order.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Product }]
                }
            ],
            transaction
        });

        if (!order) {
            throw new ApiError('Order not found', 404);
        }

        // Check if order can be cancelled
        if (order.status !== 'pending' && order.status !== 'processing') {
            throw new ApiError('Order cannot be cancelled at this stage', 400);
        }

        // Update order status
        order.status = 'cancelled';
        await order.save({ transaction });

        // Restore product stock
        for (const item of order.items) {
            await item.Product.update({
                stock: item.Product.stock + item.quantity
            }, { transaction });
        }

        await transaction.commit();

        // Send cancellation email
        try {
            const user = await User.findByPk(req.user.id);

            await sendEmail({
                to: user.email,
                subject: `Order Cancelled - ${order.order_number}`,
                template: 'orderCancelled',
                context: {
                    firstName: user.first_name,
                    orderNumber: order.order_number,
                    cancellationDate: new Date().toLocaleDateString(),
                    supportEmail: process.env.SUPPORT_EMAIL || 'support@chezflora.com'
                }
            });
        } catch (error) {
            logger.error('Failed to send order cancellation email:', error);
            // Continue even if email fails
        }

        res.json({
            success: true,
            data: {
                id: order.id,
                status: order.status,
                message: 'Order has been cancelled successfully'
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// ADMIN ENDPOINTS

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin
// @access  Private (Admin)
exports.getAllOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, user_id, order_number } = req.query;

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

        // Filter by order number if provided
        if (order_number) {
            conditions.order_number = { [Op.like]: `%${order_number}%` };
        }

        // Get orders
        const { count, rows: orders } = await Order.findAndCountAll({
            where: conditions,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: OrderItem,
                    as: 'items'
                }
            ]
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private (Admin)
exports.updateOrderStatus = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { status, payment_status } = req.body;

        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User },
                { model: OrderItem, as: 'items' }
            ],
            transaction
        });

        if (!order) {
            throw new ApiError('Order not found', 404);
        }

        // Update order status if provided
        if (status) {
            order.status = status;
        }

        // Update payment status if provided
        if (payment_status) {
            order.payment_status = payment_status;
        }

        await order.save({ transaction });

        await transaction.commit();

        // Send status update email to customer
        try {
            await sendEmail({
                to: order.User.email,
                subject: `Order Update - ${order.order_number}`,
                template: 'orderStatusUpdate',
                context: {
                    firstName: order.User.first_name,
                    orderNumber: order.order_number,
                    status: order.status,
                    paymentStatus: order.payment_status,
                    updateDate: new Date().toLocaleDateString(),
                    orderUrl: `${process.env.FRONTEND_URL}/account/orders/${order.id}`
                }
            });
        } catch (error) {
            logger.error('Failed to send order status update email:', error);
            // Continue even if email fails
        }

        res.json({
            success: true,
            data: {
                id: order.id,
                status: order.status,
                payment_status: order.payment_status,
                message: 'Order status updated successfully'
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Get order details (admin)
// @route   GET /api/orders/admin/:id
// @access  Private (Admin)
exports.getOrderAdmin = async (req, res, next) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            include: [
                                {
                                    model: ProductImage,
                                    as: 'images',
                                    where: { is_primary: true },
                                    required: false,
                                    limit: 1
                                }
                            ]
                        }
                    ]
                },
                { model: Address, as: 'shippingAddress' },
                { model: Address, as: 'billingAddress' }
            ]
        });

        if (!order) {
            throw new ApiError('Order not found', 404);
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};