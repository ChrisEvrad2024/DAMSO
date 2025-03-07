const { check } = require('express-validator');
const { handleValidationErrors } = require('./validationHandler');

exports.validateCreateOrder = [
    check('shipping_address_id')
        .trim()
        .notEmpty().withMessage('Shipping address ID is required')
        .isUUID(4).withMessage('Invalid shipping address ID format'),

    check('billing_address_id')
        .optional()
        .isUUID(4).withMessage('Invalid billing address ID format'),

    check('payment_method')
        .trim()
        .notEmpty().withMessage('Payment method is required')
        .isIn(['credit_card', 'paypal', 'stripe', 'bank_transfer', 'cash_on_delivery'])
        .withMessage('Invalid payment method'),

    check('notes')
        .optional()
        .trim(),

    handleValidationErrors
];

exports.validateUpdateOrderStatus = [
    check('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
        .withMessage('Invalid order status'),

    check('payment_status')
        .optional()
        .isIn(['pending', 'paid', 'failed', 'refunded'])
        .withMessage('Invalid payment status'),

    handleValidationErrors
];