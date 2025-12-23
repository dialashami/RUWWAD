const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Notifications
router.post('/notifications', authMiddleware, notificationController.createNotification);
router.get('/notifications/unread-count', authMiddleware, notificationController.getUnreadCount);
router.get('/notifications/admin', authMiddleware, notificationController.getAdminNotifications);
router.get('/notifications/user/:userId', authMiddleware, notificationController.getNotificationsForUser);
router.patch('/notifications/:id/read', authMiddleware, notificationController.markNotificationRead);
router.patch('/notifications/user/:userId/read-all', authMiddleware, notificationController.markAllNotificationsRead);
router.delete('/notifications/:id', authMiddleware, notificationController.deleteNotification);
router.post('/notifications/assignment-reminder', authMiddleware, notificationController.sendAssignmentReminder);
router.get('/notifications/sent', authMiddleware, notificationController.getSentNotifications);
router.post('/notifications/sent', authMiddleware, notificationController.saveSentNotification);
router.post('/notifications/bulk-email', authMiddleware, notificationController.sendBulkEmailNotification);
router.post('/notifications/reply', authMiddleware, notificationController.replyToNotification);

module.exports = router;
