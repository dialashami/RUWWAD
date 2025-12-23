const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const systemSettingsController = require('../controllers/systemSettingsController');

router.get('/system-settings', authMiddleware, systemSettingsController.getSystemSettings);
router.put('/system-settings', authMiddleware, systemSettingsController.updateSystemSettings);

module.exports = router;
