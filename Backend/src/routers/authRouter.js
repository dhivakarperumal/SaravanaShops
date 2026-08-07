const express = require('express');
const { register, login, getProfile, googleLogin, sendWhatsAppOtp, verifyWhatsAppOtp } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/send-whatsapp-otp', sendWhatsAppOtp);
router.post('/verify-whatsapp-otp', verifyWhatsAppOtp);

// Protected routes
router.get('/profile', verifyToken, getProfile);

module.exports = router;
