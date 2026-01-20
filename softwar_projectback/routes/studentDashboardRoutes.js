const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const studentDashboardController = require('../controllers/studentDashboardController');

// GET /api/student/full-dashboard - ALL student data in ONE request (optimized)
router.get('/student/full-dashboard', authMiddleware, studentDashboardController.getFullDashboard);

// GET /api/student/dashboard - main dashboard data for logged-in student
router.get('/student/dashboard', authMiddleware, studentDashboardController.getDashboard);

// GET /api/student/progress - detailed progress data for logged-in student
router.get('/student/progress', authMiddleware, studentDashboardController.getProgress);

// PUT /api/student/preferences - update notification preferences
router.put('/student/preferences', authMiddleware, studentDashboardController.updatePreferences);

module.exports = router;
