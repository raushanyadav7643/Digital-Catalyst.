const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyOTP, forgotPassword, resetPassword } = require('../controllers/authController.js');
const { protect } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
