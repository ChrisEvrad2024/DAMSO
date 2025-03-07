const { Cart, CartItem, Product, ProductImage, Category, sequelize } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
    try {
        // Find user's cart or create if it doesn't exist
        let [cart, created] = await Cart.findOrCreate({
            where: { user_id: req.user.id },
            include: [
                {
                    model: CartItem,
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
                }
            ]
        });

        // Calculate total
        let total = 0;
        if (cart.items && cart.items.length > 0) {
            total = cart.items.reduce((sum, item) => {
                return sum + (item.unit_price * item.quantity);
            }, 0);
        }

        res.json({
            success: true,
            data: {
                id: cart.id,
                items: cart.items,
                total: total.toFixed(2),
                item_count: cart.items.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addToCart = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { product_id, quantity = 1 } = req.body;

        // Validate product
        const product = await Product.findByPk(product_id);
        if (!product) {
            throw new ApiError('Product not found', 404);
        }

        if (!product.is_active) {
            throw new ApiError('Product is not available', 400);
        }

        if (product.stock < quantity) {
            throw new ApiError('Not enough product in stock', 400);
        }

        // Find or create user's cart
        const [cart, created] = await Cart.findOrCreate({
            where: { user_id: req.user.id },
            transaction
        });

        // Check if item already exists in cart
        let cartItem = await CartItem.findOne({
            where: {
                cart_id: cart.id,
                product_id
            },
            transaction
        });

        if (cartItem) {
            // Update quantity if item exists
            cartItem.quantity += parseInt(quantity, 10);

            // Check if requested quantity is available
            if (cartItem.quantity > product.stock) {
                throw new ApiError(`Only ${product.stock} items available in stock`, 400);
            }

            await cartItem.save({ transaction });
        } else {
            // Create new cart item
            cartItem = await CartItem.create({
                cart_id: cart.id,
                product_id,
                quantity: parseInt(quantity, 10),
                unit_price: product.price
            }, { transaction });
        }

        // Update cart's updatedAt timestamp
        await cart.update(
            { updated_at: new Date() },
            { transaction }
        );

        await transaction.commit();

        // Fetch the updated cart with items
        const updatedCart = await Cart.findByPk(cart.id, {
            include: [
                {
                    model: CartItem,
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
                }
            ]
        });

        // Calculate total
        let total = 0;
        if (updatedCart.items && updatedCart.items.length > 0) {
            total = updatedCart.items.reduce((sum, item) => {
                return sum + (item.unit_price * item.quantity);
            }, 0);
        }

        res.status(201).json({
            success: true,
            data: {
                id: updatedCart.id,
                items: updatedCart.items,
                total: total.toFixed(2),
                item_count: updatedCart.items.length
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:id
// @access  Private
exports.updateCartItem = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { quantity } = req.body;
        const { id } = req.params;

        // Find the cart item
        const cartItem = await CartItem.findByPk(id, {
            include: [
                {
                    model: Cart,
                    where: { user_id: req.user.id } // Ensure cart belongs to user
                }
            ],
            transaction
        });

        if (!cartItem) {
            throw new ApiError('Cart item not found', 404);
        }

        // If quantity is 0, remove the item
        if (parseInt(quantity, 10) <= 0) {
            await cartItem.destroy({ transaction });
        } else {
            // Check product stock
            const product = await Product.findByPk(cartItem.product_id, { transaction });

            if (parseInt(quantity, 10) > product.stock) {
                throw new ApiError(`Only ${product.stock} items available in stock`, 400);
            }

            // Update quantity
            cartItem.quantity = parseInt(quantity, 10);
            await cartItem.save({ transaction });
        }

        // Update cart's timestamp
        await cartItem.Cart.update(
            { updated_at: new Date() },
            { transaction }
        );

        await transaction.commit();

        // Fetch the updated cart
        const updatedCart = await Cart.findOne({
            where: { user_id: req.user.id },
            include: [
                {
                    model: CartItem,
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
                }
            ]
        });

        // Calculate total
        let total = 0;
        if (updatedCart.items && updatedCart.items.length > 0) {
            total = updatedCart.items.reduce((sum, item) => {
                return sum + (item.unit_price * item.quantity);
            }, 0);
        }

        res.json({
            success: true,
            data: {
                id: updatedCart.id,
                items: updatedCart.items,
                total: total.toFixed(2),
                item_count: updatedCart.items.length
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:id
// @access  Private
exports.removeCartItem = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;

        // Find the cart item
        const cartItem = await CartItem.findByPk(id, {
            include: [
                {
                    model: Cart,
                    where: { user_id: req.user.id } // Ensure cart belongs to user
                }
            ],
            transaction
        });

        if (!cartItem) {
            throw new ApiError('Cart item not found', 404);
        }

        // Remove the item
        await cartItem.destroy({ transaction });

        // Update cart's timestamp
        await cartItem.Cart.update(
            { updated_at: new Date() },
            { transaction }
        );

        await transaction.commit();

        // Fetch the updated cart
        const updatedCart = await Cart.findOne({
            where: { user_id: req.user.id },
            include: [
                {
                    model: CartItem,
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
                }
            ]
        });

        // Calculate total
        let total = 0;
        if (updatedCart.items && updatedCart.items.length > 0) {
            total = updatedCart.items.reduce((sum, item) => {
                return sum + (item.unit_price * item.quantity);
            }, 0);
        }

        res.json({
            success: true,
            data: {
                id: updatedCart.id,
                items: updatedCart.items || [],
                total: total.toFixed(2),
                item_count: updatedCart.items ? updatedCart.items.length : 0
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        // Find user's cart
        const cart = await Cart.findOne({
            where: { user_id: req.user.id },
            transaction
        });

        if (!cart) {
            throw new ApiError('Cart not found', 404);
        }

        // Delete all cart items
        await CartItem.destroy({
            where: { cart_id: cart.id },
            transaction
        });

        // Update cart's timestamp
        await cart.update(
            { updated_at: new Date() },
            { transaction }
        );

        await transaction.commit();

        res.json({
            success: true,
            data: {
                id: cart.id,
                items: [],
                total: "0.00",
                item_count: 0
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};