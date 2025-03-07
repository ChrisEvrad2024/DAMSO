const { Product, ProductImage, Category, sequelize } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { toJSON } = require('../utils/sequelizeUtils');


const paginate = require('../utils/paginate');

// Helper function to calculate discounted price
const calculateDiscountedPrice = (product, promotions) => {
    if (!promotions || !promotions.length) return null;

    // Find active promotions
    const now = new Date();
    const activePromotions = promotions.filter(promo =>
        promo.is_active &&
        new Date(promo.start_date) <= now &&
        new Date(promo.end_date) >= now
    );

    if (!activePromotions.length) return null;

    // Find the best discount
    let bestDiscount = 0;
    let bestPromotionId = null;

    activePromotions.forEach(promotion => {
        let discountAmount = 0;

        if (promotion.discount_type === 'percentage') {
            discountAmount = (product.price * promotion.discount_value) / 100;
        } else { // fixed_amount
            discountAmount = promotion.discount_value;
        }

        if (discountAmount > bestDiscount) {
            bestDiscount = discountAmount;
            bestPromotionId = promotion.id;
        }
    });

    // Calculate final price
    const discountedPrice = Math.max(0, product.price - bestDiscount).toFixed(2);

    return {
        original_price: product.price,
        discounted_price: parseFloat(discountedPrice),
        discount_amount: bestDiscount,
        promotion_id: bestPromotionId
    };
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    try {
        const { category, search, min_price, max_price, sort } = req.query;

        // Build query conditions
        const conditions = { is_active: true };

        // Category filter
        if (category) {
            conditions.category_id = category;
        }

        // Price range filter
        if (min_price !== undefined) {
            conditions.price = { ...conditions.price, [Op.gte]: parseFloat(min_price) };
        }

        if (max_price !== undefined) {
            conditions.price = {
                ...conditions.price,
                [Op.lte]: parseFloat(max_price)
            };
        }

        // Search filter
        if (search) {
            conditions[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        // Sort options
        let order;
        switch (sort) {
            case 'price_asc':
                order = [['price', 'ASC']];
                break;
            case 'price_desc':
                order = [['price', 'DESC']];
                break;
            case 'newest':
                order = [['created_at', 'DESC']];
                break;
            case 'oldest':
                order = [['created_at', 'ASC']];
                break;
            case 'name_asc':
                order = [['name', 'ASC']];
                break;
            case 'name_desc':
                order = [['name', 'DESC']];
                break;
            default:
                order = [['created_at', 'DESC']];
        }

        // Use the paginate utility
        const result = await paginate(Product, {
            page: req.pagination.page,
            limit: req.pagination.limit,
            where: conditions,
            order,
            include: [
                {
                    model: ProductImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary'],
                    where: { is_primary: true },
                    required: false,
                    limit: 1
                },
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name']
                },
                {
                    model: Promotion,
                    as: 'promotions',
                    attributes: ['id', 'name', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active'],
                    through: { attributes: [] }
                }
            ]
        });

        // Add discounted price information
        const productsWithPricing = result.data.map(product => {
            const productJson = product.toJSON();
            const pricingInfo = calculateDiscountedPrice(productJson, productJson.promotions);

            return {
                ...productJson,
                pricing: pricingInfo
            };
        });

        res.json({
            success: true,
            data: productsWithPricing,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                {
                    model: ProductImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary', 'sort_order']
                },
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name']
                },
                {
                    model: Promotion,
                    as: 'promotions',
                    attributes: ['id', 'name', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active'],
                    through: { attributes: [] }
                }
            ]
        });

        if (!product) {
            throw new ApiError('Product not found', 404);
        }

        // Add discounted price information
        const productJson = product.toJSON();
        const pricingInfo = calculateDiscountedPrice(productJson, productJson.promotions);

        productJson.pricing = pricingInfo;

        res.json({
            success: true,
            data: productJson
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin)
exports.createProduct = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { name, description, price, stock, category_id, sku, is_active } = req.body;

        // Check if category exists
        if (category_id) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                throw new ApiError('Category not found', 404);
            }
        }

        // Check if SKU is unique if provided
        if (sku) {
            const existingProduct = await Product.findOne({ where: { sku } });
            if (existingProduct) {
                throw new ApiError('SKU already in use', 400);
            }
        }

        // Create product
        const product = await Product.create({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            category_id,
            sku,
            is_active: is_active !== undefined ? is_active : true
        }, { transaction });

        // Handle product images if provided
        if (req.files && req.files.length > 0) {
            const imagePromises = req.files.map(async (file, index) => {
                const isPrimary = index === 0; // First image is primary

                const imagePath = `/uploads/products/${file.filename}`;

                return ProductImage.create({
                    product_id: product.id,
                    image_url: imagePath,
                    is_primary: isPrimary,
                    sort_order: index
                }, { transaction });
            });

            await Promise.all(imagePromises);
        }

        await transaction.commit();

        // Fetch the complete product with images
        const newProduct = await Product.findByPk(product.id, {
            include: [
                {
                    model: ProductImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary', 'sort_order']
                },
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name']
                },
                {
                    model: Promotion,
                    as: 'promotions',
                    attributes: ['id', 'name', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active'],
                    through: { attributes: [] }
                }
            ]
        });

        // Add pricing information if there are associated promotions
        const newProductJson = newProduct.toJSON();
        const pricingInfo = calculateDiscountedPrice(newProductJson, newProductJson.promotions || []);

        if (pricingInfo) {
            newProductJson.pricing = pricingInfo;
        }

        res.status(201).json({
            success: true,
            data: newProductJson
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { name, description, price, stock, category_id, sku, is_active } = req.body;

        const product = await Product.findByPk(req.params.id);

        if (!product) {
            throw new ApiError('Product not found', 404);
        }

        // Check if category exists
        if (category_id && category_id !== product.category_id) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                throw new ApiError('Category not found', 404);
            }
        }

        // Check if SKU is unique if changed
        if (sku && sku !== product.sku) {
            const existingProduct = await Product.findOne({ where: { sku } });
            if (existingProduct) {
                throw new ApiError('SKU already in use', 400);
            }
        }

        // Update fields
        product.name = name || product.name;
        product.description = description !== undefined ? description : product.description;
        product.price = price !== undefined ? parseFloat(price) : product.price;
        product.stock = stock !== undefined ? parseInt(stock, 10) : product.stock;
        product.category_id = category_id !== undefined ? category_id : product.category_id;
        product.sku = sku || product.sku;
        product.is_active = is_active !== undefined ? is_active : product.is_active;

        await product.save({ transaction });

        // Handle image updates if files are provided
        if (req.files && req.files.length > 0) {
            // Get existing images
            const existingImages = await ProductImage.findAll({
                where: { product_id: product.id }
            });

            // Delete existing images (from DB and file system)
            for (const image of existingImages) {
                // Remove file from filesystem if exists
                const imagePath = path.join(__dirname, '..', 'public', image.image_url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }

                // Delete from database
                await image.destroy({ transaction });
            }

            // Upload new images
            const imagePromises = req.files.map(async (file, index) => {
                const isPrimary = index === 0; // First image is primary

                const imagePath = `/uploads/products/${file.filename}`;

                return ProductImage.create({
                    product_id: product.id,
                    image_url: imagePath,
                    is_primary: isPrimary,
                    sort_order: index
                }, { transaction });
            });

            await Promise.all(imagePromises);
        }

        await transaction.commit();

        // Fetch the updated product with images
        const updatedProduct = await Product.findByPk(product.id, {
            include: [
                {
                    model: ProductImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary', 'sort_order']
                },
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name']
                },
                {
                    model: Promotion,
                    as: 'promotions',
                    attributes: ['id', 'name', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active'],
                    through: { attributes: [] }
                }
            ]
        });

        // Add pricing information if there are associated promotions
        const updatedProductJson = updatedProduct.toJSON();
        const pricingInfo = calculateDiscountedPrice(updatedProductJson, updatedProductJson.promotions || []);

        if (pricingInfo) {
            updatedProductJson.pricing = pricingInfo;
        }

        res.json({
            success: true,
            data: updatedProductJson
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: ProductImage, as: 'images' }]
        });

        if (!product) {
            throw new ApiError('Product not found', 404);
        }

        // Delete all product images from file system
        for (const image of product.images) {
            const imagePath = path.join(__dirname, '..', 'public', image.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete product (cascade will delete images)
        await product.destroy({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res, next) => {
    try {
        const { query, page = 1, limit = 10 } = req.query;

        if (!query) {
            throw new ApiError('Search query is required', 400);
        }

        const offset = (page - 1) * limit;

        const { count, rows: products } = await Product.findAndCountAll({
            where: {
                is_active: true,
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { description: { [Op.like]: `%${query}%` } }
                ]
            },
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['name', 'ASC']],
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
                },
                {
                    model: Promotion,
                    as: 'promotions',
                    attributes: ['id', 'name', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active'],
                    through: { attributes: [] }
                }
            ]
        });

        // Add discounted price information
        const productsWithPricing = products.map(product => {
            const productJson = product.toJSON();
            const pricingInfo = calculateDiscountedPrice(productJson, productJson.promotions || []);

            return {
                ...productJson,
                pricing: pricingInfo
            };
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: productsWithPricing
        });
    } catch (error) {
        next(error);
    }
};