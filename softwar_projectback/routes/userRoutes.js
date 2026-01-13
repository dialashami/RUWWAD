const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');

// Profile routes (must come BEFORE :id routes)
router.get('/users/profile', authMiddleware, userController.getProfile);
router.put('/users/profile', authMiddleware, userController.updateProfile);
router.put('/users/preferences', authMiddleware, userController.updatePreferences);
router.put('/users/change-password', authMiddleware, userController.changePassword);
router.put('/users/toggle-2fa', authMiddleware, userController.toggle2FA);
router.delete('/users/account', authMiddleware, userController.deleteAccount);

// Get student count by grade (for teachers)
router.get('/users/student-count', authMiddleware, userController.getStudentCountByGrade);

// Parent-child linking routes
router.get('/users/children', authMiddleware, userController.getChildren);
router.post('/users/children', authMiddleware, userController.addChild);
router.delete('/users/children/:childId', authMiddleware, userController.removeChild);
router.get('/users/children/:childId/dashboard', authMiddleware, userController.getChildDashboard);

// Admin / authenticated user management
router.get('/users', authMiddleware, userController.getUsers);
router.get('/users/:id', authMiddleware, userController.getUserById);
router.put('/users/:id', authMiddleware, userController.updateUser);
router.delete('/users/:id', authMiddleware, userController.deleteUser);

module.exports = router;
