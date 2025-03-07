const express = require('express');
const router = express.Router();
const { requestQuote, getQuotes, getQuote, updateQuote, acceptQuote, declineQuote,
    getAllQuotes, getQuoteAdmin, updateQuoteAdmin } = require('../controllers/quoteController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateRequestQuote, validateUpdateQuote, validateDeclineQuote,
    validateUpdateQuoteAdmin } = require('../middleware/validators/quoteValidator');
const paginationMiddleware = require('../middleware/pagination');

// Customer routes
router.use(protect);
router.post('/', validateRequestQuote, requestQuote);
router.get('/', paginationMiddleware, getQuotes);
router.get('/:id', getQuote);
router.put('/:id', validateUpdateQuote, updateQuote);
router.put('/:id/accept', acceptQuote);
router.put('/:id/decline', validateDeclineQuote, declineQuote);

// Admin routes
router.get('/admin', protect, adminOnly, getAllQuotes);
router.get('/admin/:id', protect, adminOnly, getQuoteAdmin);
router.put('/admin/:id', protect, adminOnly, validateUpdateQuoteAdmin, updateQuoteAdmin);

module.exports = router;