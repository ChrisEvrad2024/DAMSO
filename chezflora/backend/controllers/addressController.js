const { Address, sequelize } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { toJSON } = require('../utils/sequelizeUtils');

// @desc    Get user addresses
// @route   GET /api/addresses
// @access  Private
exports.getUserAddresses = async (req, res, next) => {
    try {
        const addresses = await Address.findAll({
            where: { user_id: req.user.id },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: addresses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get address by ID
// @route   GET /api/addresses/:id
// @access  Private
exports.getAddress = async (req, res, next) => {
    try {
        const address = await Address.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!address) {
            throw new ApiError('Address not found', 404);
        }

        res.json({
            success: true,
            data: address
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create address
// @route   POST /api/addresses
// @access  Private
exports.createAddress = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            address_name,
            first_name,
            last_name,
            address_line1,
            address_line2,
            city,
            postal_code,
            country,
            phone,
            is_default
        } = req.body;

        // If this address is set as default, unset any other default addresses
        if (is_default) {
            await Address.update(
                { is_default: false },
                {
                    where: { user_id: req.user.id },
                    transaction
                }
            );
        }

        // Create new address
        const address = await Address.create({
            id: uuidv4(),
            user_id: req.user.id,
            address_name,
            first_name,
            last_name,
            address_line1,
            address_line2,
            city,
            postal_code,
            country,
            phone,
            is_default: is_default || false
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            data: address
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            address_name,
            first_name,
            last_name,
            address_line1,
            address_line2,
            city,
            postal_code,
            country,
            phone,
            is_default
        } = req.body;

        const address = await Address.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            transaction
        });

        if (!address) {
            throw new ApiError('Address not found', 404);
        }

        // If this address is set as default, unset any other default addresses
        if (is_default && !address.is_default) {
            await Address.update(
                { is_default: false },
                {
                    where: { user_id: req.user.id },
                    transaction
                }
            );
        }

        // Update address
        address.address_name = address_name || address.address_name;
        address.first_name = first_name || address.first_name;
        address.last_name = last_name || address.last_name;
        address.address_line1 = address_line1 || address.address_line1;
        address.address_line2 = address_line2 !== undefined ? address_line2 : address.address_line2;
        address.city = city || address.city;
        address.postal_code = postal_code || address.postal_code;
        address.country = country || address.country;
        address.phone = phone || address.phone;
        address.is_default = is_default !== undefined ? is_default : address.is_default;

        await address.save({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            data: address
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const address = await Address.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            transaction
        });

        if (!address) {
            throw new ApiError('Address not found', 404);
        }

        // Check if this is the only address
        const addressCount = await Address.count({
            where: { user_id: req.user.id },
            transaction
        });

        // Check if it's the default address
        const wasDefault = address.is_default;

        // Delete the address
        await address.destroy({ transaction });

        // If it was the default address and there are other addresses, set a new default
        if (wasDefault && addressCount > 1) {
            const anotherAddress = await Address.findOne({
                where: { user_id: req.user.id },
                order: [['created_at', 'DESC']],
                transaction
            });

            if (anotherAddress) {
                anotherAddress.is_default = true;
                await anotherAddress.save({ transaction });
            }
        }

        await transaction.commit();

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private
exports.setDefaultAddress = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const address = await Address.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            transaction
        });

        if (!address) {
            throw new ApiError('Address not found', 404);
        }

        // Unset any other default addresses
        await Address.update(
            { is_default: false },
            {
                where: { user_id: req.user.id },
                transaction
            }
        );

        // Set this address as default
        address.is_default = true;
        await address.save({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            data: address
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};