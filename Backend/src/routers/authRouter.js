const express = require('express');
const { register, login, getProfile, googleLogin } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Protected routes
router.get('/profile', verifyToken, getProfile);

module.exports = router;
