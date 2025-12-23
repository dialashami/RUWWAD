const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const aiConversationController = require('../controllers/aiConversationController');

// GET /api/ai-conversations - get all conversations for user
router.get('/ai-conversations', authMiddleware, aiConversationController.getConversations);

// GET /api/ai-conversations/:id - get single conversation with messages
router.get('/ai-conversations/:id', authMiddleware, aiConversationController.getConversation);

// POST /api/ai-conversations - create new conversation
router.post('/ai-conversations', authMiddleware, aiConversationController.createConversation);

// PUT /api/ai-conversations/:id - update conversation
router.put('/ai-conversations/:id', authMiddleware, aiConversationController.updateConversation);

// DELETE /api/ai-conversations/:id - delete conversation
router.delete('/ai-conversations/:id', authMiddleware, aiConversationController.deleteConversation);

// POST /api/ai-conversations/:id/messages - add message to conversation
router.post('/ai-conversations/:id/messages', authMiddleware, aiConversationController.addMessage);

module.exports = router;
