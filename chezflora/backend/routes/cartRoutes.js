const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { validateAddToCart, validateUpdateCartItem } = require('../middleware/validators/cartValidator');

// All cart routes are protected
router.use(protect);

router.get('/', getCart);
router.post('/items', validateAddToCart, addToCart);
router.put('/items/:id', validateUpdateCartItem, updateCartItem);
router.delete('/items/:id', removeCartItem);
router.delete('/', clearCart);

module.exports = router;