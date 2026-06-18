const express = require('express');
const router = express.Router();
const { getAddresses, getAddressesByUserId, addAddress, updateAddress, deleteAddress } = require('../controllers/addressController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAddresses);
// Get addresses for a specific user (used by frontend at /addresses/:userId)
router.get('/:userId', verifyToken, getAddressesByUserId);
router.post('/', verifyToken, addAddress);
router.put('/:id', verifyToken, updateAddress);
router.delete('/:id', verifyToken, deleteAddress);

module.exports = router;
