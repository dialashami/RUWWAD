const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminDashboardController = require('../controllers/adminDashboardController');

// GET /api/admin/dashboard - main dashboard data for admin
router.get('/admin/dashboard', authMiddleware, adminDashboardController.getDashboard);

// GET /api/admin/users - get all users with filtering
router.get('/admin/users', authMiddleware, adminDashboardController.getUsers);

// PUT /api/admin/users/:id - update a user
router.put('/admin/users/:id', authMiddleware, adminDashboardController.updateUser);

// DELETE /api/admin/users/:id - delete a user
router.delete('/admin/users/:id', authMiddleware, adminDashboardController.deleteUser);

// PATCH /api/admin/users/:id/status - update user status
router.patch('/admin/users/:id/status', authMiddleware, adminDashboardController.updateUserStatus);

// GET /api/admin/reports - get system reports
router.get('/admin/reports', authMiddleware, adminDashboardController.getReports);

// POST /api/admin/notifications - send system-wide notification
router.post('/admin/notifications', authMiddleware, adminDashboardController.sendSystemNotification);

module.exports = router;
