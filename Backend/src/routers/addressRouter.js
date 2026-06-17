const express = require('express');
const router = express.Router();
const { getAddresses, addAddress, updateAddress, deleteAddress } = require('../controllers/addressController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAddresses);
router.post('/', verifyToken, addAddress);
router.put('/:id', verifyToken, updateAddress);
router.delete('/:id', verifyToken, deleteAddress);

module.exports = router;
