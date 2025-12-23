const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const teacherDashboardController = require('../controllers/teacherDashboardController');

// GET /api/teacher/dashboard - main dashboard data for logged-in teacher
router.get('/teacher/dashboard', authMiddleware, teacherDashboardController.getDashboard);

module.exports = router;
