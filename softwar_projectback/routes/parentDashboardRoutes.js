const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const parentDashboardController = require('../controllers/parentDashboardController');

// GET /api/parent/dashboard - main dashboard data for logged-in parent
router.get('/parent/dashboard', authMiddleware, parentDashboardController.getDashboard);

// GET /api/parent/children - get children's progress
router.get('/parent/children', authMiddleware, parentDashboardController.getChildrenProgress);

module.exports = router;
