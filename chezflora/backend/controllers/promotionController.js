const { Promotion, Product, sequelize } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const { invalidateCache } = require('../middleware/cache');
const { toJSON } = require('../utils/sequelizeUtils');


// @desc    Get active promotions
// @route   GET /api/promotions
// @access  Public
// @desc    Get active promotions
// @route   GET /api/promotions
// @access  Public
exports.getActivePromotions = async (req, res, next) => {
    try {
        const now = new Date();

        // Changer la façon dont les produits sont inclus
        const promotions = await Promotion.findAll({
            where: {
                is_active: true,
                start_date: { [Op.lte]: now },
                end_date: { [Op.gte]: now }
            },
            include: [
                {
                    model: Product,
                    as: 'products',
                    attributes: ['id', 'name', 'price', 'stock'], // Limitez les attributs 
                    through: { attributes: [] } // Exclure la table de jonction
                }
            ]
        });

        // Convertir en objets JSON simples avant de les envoyer
        const plainPromotions = promotions.map(promo => {
            const plainPromo = promo.get({ plain: true });
            return plainPromo;
        });

        res.json({
            success: true,
            data: plainPromotions
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get promotion by ID
// @route   GET /api/promotions/:id
// @access  Public
exports.getPromotion = async (req, res, next) => {
    try {
        // Utiliser findByPk avec des options d'inclusion simplifiées
        const promotion = await Promotion.findByPk(req.params.id, {
            include: [
                {
                    model: Product,
                    as: 'products',
                    attributes: ['id', 'name', 'price', 'stock'], // Limiter les champs
                    through: { attributes: [] } // Ne pas inclure la table de jonction
                }
            ]
        });

        if (!promotion) {
            throw new ApiError('Promotion not found', 404);
        }

        // Convertir en objet JavaScript simple (sans références circulaires)
        const plainPromotion = promotion.get({ plain: true });

        res.json({
            success: true,
            data: plainPromotion
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get products with promotion
// @route   GET /api/promotions/:id/products
// @access  Public
exports.getPromotionProducts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        const promotion = await Promotion.findByPk(req.params.id);

        if (!promotion) {
            throw new ApiError('Promotion not found', 404);
        }

        const { count, rows: products } = await Product.findAndCountAll({
            include: [
                {
                    model: Promotion,
                    as: 'promotions',
                    where: { id: req.params.id },
                    through: { attributes: [] }
                }
            ],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: products
        });
    } catch (error) {
        next(error);
    }
};

// ADMIN ENDPOINTS

// @desc    Create promotion (admin)
// @route   POST /api/promotions/admin
// @access  Private (Admin)
exports.createPromotion = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { name, description, discount_type, discount_value,
            start_date, end_date, is_active, product_ids } = req.body;

        // Create promotion
        const promotion = await Promotion.create({
            id: uuidv4(),
            name,
            description,
            discount_type,
            discount_value: parseFloat(discount_value),
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            is_active: is_active !== undefined ? is_active : true
        }, { transaction });

        // Associate products if provided
        if (product_ids && product_ids.length > 0) {
            await promotion.setProducts(product_ids, { transaction });
        }

        await transaction.commit();

        // Invalidate cache
        invalidateCache('/products');
        invalidateCache('/promotions');

        // Fetch complete promotion with products
        const newPromotion = await Promotion.findByPk(promotion.id, {
            include: [
                {
                    model: Product,
                    as: 'products',
                    through: { attributes: [] }
                }
            ]
        });

        res.status(201).json({
            success: true,
            data: newPromotion
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Update promotion (admin)
// @route   PUT /api/promotions/admin/:id
// @access  Private (Admin)
exports.updatePromotion = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { name, description, discount_type, discount_value,
            start_date, end_date, is_active, product_ids } = req.body;

        const promotion = await Promotion.findByPk(req.params.id, {
            transaction
        });

        if (!promotion) {
            throw new ApiError('Promotion not found', 404);
        }

        // Update promotion fields
        if (name) promotion.name = name;
        if (description !== undefined) promotion.description = description;
        if (discount_type) promotion.discount_type = discount_type;
        if (discount_value !== undefined) promotion.discount_value = parseFloat(discount_value);
        if (start_date) promotion.start_date = new Date(start_date);
        if (end_date) promotion.end_date = new Date(end_date);
        if (is_active !== undefined) promotion.is_active = is_active;

        await promotion.save({ transaction });

        // Update product associations if provided
        if (product_ids) {
            await promotion.setProducts(product_ids, { transaction });
        }

        await transaction.commit();

        // Invalidate cache
        invalidateCache('/products');
        invalidateCache('/promotions');

        // Fetch updated promotion with products
        const updatedPromotion = await Promotion.findByPk(promotion.id, {
            include: [
                {
                    model: Product,
                    as: 'products',
                    through: { attributes: [] }
                }
            ]
        });

        res.json({
            success: true,
            data: updatedPromotion
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Delete promotion (admin)
// @route   DELETE /api/promotions/admin/:id
// @access  Private (Admin)
exports.deletePromotion = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const promotion = await Promotion.findByPk(req.params.id, {
            transaction
        });

        if (!promotion) {
            throw new ApiError('Promotion not found', 404);
        }

        await promotion.destroy({ transaction });

        await transaction.commit();

        // Invalidate cache
        invalidateCache('/products');
        invalidateCache('/promotions');

        res.json({
            success: true,
            message: 'Promotion deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Get all promotions (admin)
// @route   GET /api/promotions/admin
// @access  Private (Admin)
exports.getAllPromotions = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, is_active } = req.query;

        const offset = (page - 1) * limit;

        // Build query conditions
        const conditions = {};

        // Filter by active status if provided
        if (is_active !== undefined) {
            conditions.is_active = is_active === 'true';
        }

        // Get promotions
        const { count, rows: promotions } = await Promotion.findAndCountAll({
            where: conditions,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Product,
                    as: 'products',
                    through: { attributes: [] }
                }
            ]
        });

        res.json({
            success: true,
            count,
            total_pages: Math.ceil(count / limit),
            current_page: parseInt(page, 10),
            data: promotions
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add products to promotion (admin)
// @route   POST /api/promotions/admin/:id/products
// @access  Private (Admin)
exports.addProductsToPromotion = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { product_ids } = req.body;

        if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
            throw new ApiError('Product IDs array is required', 400);
        }

        const promotion = await Promotion.findByPk(req.params.id, {
            transaction
        });

        if (!promotion) {
            throw new ApiError('Promotion not found', 404);
        }

        // Add products to promotion
        await promotion.addProducts(product_ids, { transaction });

        await transaction.commit();

        // Invalidate cache
        invalidateCache('/products');
        invalidateCache('/promotions');

        // Fetch updated promotion with products
        const updatedPromotion = await Promotion.findByPk(promotion.id, {
            include: [
                {
                    model: Product,
                    as: 'products',
                    through: { attributes: [] }
                }
            ]
        });

        res.json({
            success: true,
            data: updatedPromotion
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Remove products from promotion (admin)
// @route   DELETE /api/promotions/admin/:id/products
// @access  Private (Admin)
exports.removeProductsFromPromotion = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { product_ids } = req.body;

        if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
            throw new ApiError('Product IDs array is required', 400);
        }

        const promotion = await Promotion.findByPk(req.params.id, {
            transaction
        });

        if (!promotion) {
            throw new ApiError('Promotion not found', 404);
        }

        // Remove products from promotion
        await promotion.removeProducts(product_ids, { transaction });

        await transaction.commit();

        // Invalidate cache
        invalidateCache('/products');
        invalidateCache('/promotions');

        // Fetch updated promotion with products
        const updatedPromotion = await Promotion.findByPk(promotion.id, {
            include: [
                {
                    model: Product,
                    as: 'products',
                    through: { attributes: [] }
                }
            ]
        });

        res.json({
            success: true,
            data: updatedPromotion
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};