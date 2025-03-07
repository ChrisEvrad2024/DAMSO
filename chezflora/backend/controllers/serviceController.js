const { Service, ServiceImage, sequelize } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { toJSON } = require('../utils/sequelizeUtils');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res, next) => {
    try {
        const services = await Service.findAll({
            where: { is_available: true },
            include: [
                {
                    model: ServiceImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary', 'sort_order']
                }
            ],
            order: [
                ['base_price', 'ASC'],
                [{ model: ServiceImage, as: 'images' }, 'sort_order', 'ASC']
            ]
        });

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res, next) => {
    try {
        const service = await Service.findByPk(req.params.id, {
            include: [
                {
                    model: ServiceImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary', 'sort_order']
                }
            ]
        });

        if (!service) {
            throw new ApiError('Service not found', 404);
        }

        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        next(error);
    }
};

// ADMIN ENDPOINTS

// @desc    Create service (admin)
// @route   POST /api/services/admin
// @access  Private (Admin)
exports.createService = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { name, description, base_price, is_available } = req.body;

        // Create service
        const service = await Service.create({
            id: uuidv4(),
            name,
            description,
            base_price: parseFloat(base_price),
            is_available: is_available !== undefined ? is_available : true
        }, { transaction });

        // Handle service images if provided
        if (req.files && req.files.length > 0) {
            const imagePromises = req.files.map(async (file, index) => {
                const isPrimary = index === 0; // First image is primary

                const imagePath = `/uploads/services/${file.filename}`;

                return ServiceImage.create({
                    id: uuidv4(),
                    service_id: service.id,
                    image_url: imagePath,
                    is_primary: isPrimary,
                    sort_order: index
                }, { transaction });
            });

            await Promise.all(imagePromises);
        }

        await transaction.commit();

        // Fetch the complete service with images
        const newService = await Service.findByPk(service.id, {
            include: [
                {
                    model: ServiceImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary', 'sort_order']
                }
            ]
        });

        res.status(201).json({
            success: true,
            data: newService
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Update service (admin)
// @route   PUT /api/services/admin/:id
// @access  Private (Admin)
exports.updateService = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { name, description, base_price, is_available } = req.body;

        const service = await Service.findByPk(req.params.id, {
            transaction
        });

        if (!service) {
            throw new ApiError('Service not found', 404);
        }

        // Update service
        service.name = name || service.name;
        service.description = description !== undefined ? description : service.description;
        service.base_price = base_price !== undefined ? parseFloat(base_price) : service.base_price;
        service.is_available = is_available !== undefined ? is_available : service.is_available;

        await service.save({ transaction });

        // Handle image updates if files are provided
        if (req.files && req.files.length > 0) {
            // Get existing images
            const existingImages = await ServiceImage.findAll({
                where: { service_id: service.id }
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

                const imagePath = `/uploads/services/${file.filename}`;

                return ServiceImage.create({
                    id: uuidv4(),
                    service_id: service.id,
                    image_url: imagePath,
                    is_primary: isPrimary,
                    sort_order: index
                }, { transaction });
            });

            await Promise.all(imagePromises);
        }

        await transaction.commit();

        // Fetch the updated service with images
        const updatedService = await Service.findByPk(service.id, {
            include: [
                {
                    model: ServiceImage,
                    as: 'images',
                    attributes: ['id', 'image_url', 'is_primary', 'sort_order']
                }
            ]
        });

        res.json({
            success: true,
            data: updatedService
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Delete service (admin)
// @route   DELETE /api/services/admin/:id
// @access  Private (Admin)
exports.deleteService = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const service = await Service.findByPk(req.params.id, {
            include: [{ model: ServiceImage, as: 'images' }],
            transaction
        });

        if (!service) {
            throw new ApiError('Service not found', 404);
        }

        // Delete all service images from file system
        for (const image of service.images) {
            const imagePath = path.join(__dirname, '..', 'public', image.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete service (cascade will delete images)
        await service.destroy({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};