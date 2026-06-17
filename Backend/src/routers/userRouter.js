const express = require('express');
const { getAllUsers, deleteUser, updateUserStatus, updateUser, updateProfile, changePassword } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

router.get('/', getAllUsers);
router.delete('/:id', deleteUser);
router.put('/:id/status', updateUserStatus);
router.put('/:id', updateUser);

module.exports = router;
