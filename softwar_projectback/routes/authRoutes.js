const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');

// Profile and token management
router.get('/auth/profile', authMiddleware, authController.getProfile);
router.put('/auth/profile', authMiddleware, authController.updateProfile);
router.get('/auth/verify-token', authMiddleware, authController.verifyToken);
router.post('/auth/refresh-token', authMiddleware, authController.refreshToken);

// Password management
router.post('/auth/change-password', authMiddleware, authController.changePassword);
router.post('/auth/forgot-password', authController.requestPasswordReset);
router.post('/auth/reset-password', authController.resetPassword);

// Two-Factor Authentication
router.post('/auth/toggle-2fa', authMiddleware, authController.toggle2FA);

// Delete account
router.delete('/auth/delete-account', authMiddleware, authController.deleteAccount);

module.exports = router;
