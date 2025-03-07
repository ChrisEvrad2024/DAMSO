const express = require('express');
const router = express.Router();
const { getAddresses, getAddress, createAddress, updateAddress,
    deleteAddress, setDefaultAddress } = require('../controllers/addressController');
const { protect } = require('../middleware/auth');
const { validateCreateAddress, validateUpdateAddress } = require('../middleware/validators/addressValidator');
const paginationMiddleware = require('../middleware/pagination');

// All address routes are protected
router.use(protect);

router.get('/', paginationMiddleware, getAddresses);
router.get('/:id', getAddress);
router.post('/', validateCreateAddress, createAddress);
router.put('/:id', validateUpdateAddress, updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);

module.exports = router;