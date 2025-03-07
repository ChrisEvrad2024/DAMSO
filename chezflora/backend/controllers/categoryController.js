const { Category, Product } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const paginate = require('../utils/paginate');
const logger = require('../config/logger');
const { toJSON } = require('../utils/sequelizeUtils');

// Dans vos contrôleurs:
// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
    try {
        // Use the paginate utility with custom sort order
        const result = await paginate(Category, {
            page: req.pagination.page,
            limit: req.pagination.limit,
            where: { is_active: true },
            order: [['sort_order', 'ASC']]
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

// @desc    Get a single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            throw new ApiError('Category not found', 404);
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res, next) => {
    try {
        const { name, description, parent_id, image_url, sort_order, is_active } = req.body;

        // Check if parent category exists if provided
        if (parent_id) {
            const parentCategory = await Category.findByPk(parent_id);
            if (!parentCategory) {
                throw new ApiError('Parent category not found', 404);
            }
        }

        const category = await Category.create({
            name,
            description,
            parent_id,
            image_url,
            sort_order: sort_order || 0,
            is_active: is_active !== undefined ? is_active : true
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res, next) => {
    try {
        const { name, description, parent_id, image_url, sort_order, is_active } = req.body;

        const category = await Category.findByPk(req.params.id);

        if (!category) {
            throw new ApiError('Category not found', 404);
        }

        // Check if parent category exists if provided
        if (parent_id && parent_id !== category.parent_id) {
            // Prevent setting a category as its own parent
            if (parent_id === category.id) {
                throw new ApiError('A category cannot be its own parent', 400);
            }

            const parentCategory = await Category.findByPk(parent_id);
            if (!parentCategory) {
                throw new ApiError('Parent category not found', 404);
            }
        }

        // Update fields
        category.name = name || category.name;
        category.description = description !== undefined ? description : category.description;
        category.parent_id = parent_id !== undefined ? parent_id : category.parent_id;
        category.image_url = image_url || category.image_url;
        category.sort_order = sort_order !== undefined ? sort_order : category.sort_order;
        category.is_active = is_active !== undefined ? is_active : category.is_active;

        await category.save();

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            throw new ApiError('Category not found', 404);
        }

        // Check for sub-categories
        const subcategories = await Category.findAll({ where: { parent_id: category.id } });
        if (subcategories.length > 0) {
            throw new ApiError('Cannot delete category with subcategories', 400);
        }

        // Check for products in this category
        const products = await Product.findAll({ where: { category_id: category.id } });
        if (products.length > 0) {
            throw new ApiError('Cannot delete category with products', 400);
        }

        await category.destroy();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get category tree (hierarchical)
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = async (req, res, next) => {
    try {
        // Get all categories
        const allCategories = await Category.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC']]
        });

        // Build tree structure
        const buildTree = (categories, parentId = null) => {
            return categories
                .filter(category => category.parent_id === parentId)
                .map(category => ({
                    ...category.toJSON(),
                    children: buildTree(categories, category.id)
                }));
        };

        const categoryTree = buildTree(allCategories);

        res.json({
            success: true,
            data: categoryTree
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get products by category
// @route   GET /api/categories/:id/products
// @access  Public
exports.getCategoryProducts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        // Verify category exists
        const category = await Category.findByPk(id);
        if (!category) {
            throw new ApiError('Category not found', 404);
        }

        // Get products
        const { count, rows: products } = await Product.findAndCountAll({
            where: { category_id: id, is_active: true },
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [['created_at', 'DESC']],
            include: [{
                model: ProductImage,
                as: 'images',
                where: { is_primary: true },
                required: false,
                limit: 1
            }]
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