const { Address } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const paginateUtil = require('../utils/paginate');

// @desc    Get user addresses
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res, next) => {
    try {
        const result = await paginateUtil(Address, {
            page: req.pagination?.page || 1,
            limit: req.pagination?.limit || 10,
            where: { user_id: req.user.id },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']]
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

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
exports.createAddress = async (req, res, next) => {
    try {
        const { address_name, first_name, last_name, address_line1, address_line2,
            city, postal_code, country, phone, is_default } = req.body;

        // If setting as default, unset any existing default
        if (is_default) {
            await Address.update(
                { is_default: false },
                { where: { user_id: req.user.id, is_default: true } }
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
        });

        res.status(201).json({
            success: true,
            data: address
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res, next) => {
    try {
        const { address_name, first_name, last_name, address_line1, address_line2,
            city, postal_code, country, phone, is_default } = req.body;

        // Find address
        const address = await Address.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!address) {
            throw new ApiError('Address not found', 404);
        }

        // If setting as default, unset any existing default
        if (is_default && !address.is_default) {
            await Address.update(
                { is_default: false },
                { where: { user_id: req.user.id, is_default: true } }
            );
        }

        // Update fields
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

        await address.save();

        res.json({
            success: true,
            data: address
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res, next) => {
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

        // Check if this is default address
        if (address.is_default) {
            throw new ApiError('Cannot delete default address', 400);
        }

        await address.destroy();

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private
exports.setDefaultAddress = async (req, res, next) => {
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

        // Unset any existing default
        await Address.update(
            { is_default: false },
            { where: { user_id: req.user.id, is_default: true } }
        );

        // Set new default
        address.is_default = true;
        await address.save();

        res.json({
            success: true,
            data: address,
            message: 'Address set as default successfully'
        });
    } catch (error) {
        next(error);
    }
};