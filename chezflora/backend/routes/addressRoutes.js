const express = require('express');
const router = express.Router();
const { getUserAddresses, getAddress, createAddress, updateAddress,
    deleteAddress, setDefaultAddress } = require('../controllers/addressController');
const { protect } = require('../middleware/auth');
const { validateCreateAddress, validateUpdateAddress } = require('../middleware/validators/addressValidator');

// All address routes require authentication
router.use(protect);

router.get('/', getUserAddresses);
router.get('/:id', getAddress);
router.post('/', validateCreateAddress, createAddress);
router.put('/:id', validateUpdateAddress, updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);

module.exports = router;