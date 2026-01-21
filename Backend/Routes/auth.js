const express = require('express');
const {
  signup,
  login,
  resendOtp,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  checkOtpStatus,
  getProfile,
  updateProfile,
  deleteUser,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/resend-otp', resendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/check-otp-status', checkOtpStatus);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.delete('/profile', authMiddleware, deleteUser); // Add delete user route

module.exports = router;