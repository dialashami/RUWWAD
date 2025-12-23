const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// Messaging
router.post('/messages', authMiddleware, messageController.sendMessage);
router.get('/messages/user/:userId', authMiddleware, messageController.getMessagesForUser);
router.get('/messages/conversations/:userId', authMiddleware, messageController.getConversations);
router.get('/messages/conversation/:userId1/:userId2', authMiddleware, messageController.getConversation);
router.patch('/messages/:id/read', authMiddleware, messageController.markAsRead);
router.put('/messages/read/:userId/:partnerId', authMiddleware, messageController.markConversationAsRead);
router.delete('/messages/:id', authMiddleware, messageController.deleteMessage);

module.exports = router;
