const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const teacherProfileController = require('../controllers/teacherProfileController');

// GET /api/teacher/profile - get teacher profile
router.get('/teacher/profile', authMiddleware, teacherProfileController.getProfile);

// PUT /api/teacher/profile - update teacher profile
router.put('/teacher/profile', authMiddleware, teacherProfileController.updateProfile);

// PUT /api/teacher/preferences - update teacher preferences
router.put('/teacher/preferences', authMiddleware, teacherProfileController.updatePreferences);

module.exports = router;
