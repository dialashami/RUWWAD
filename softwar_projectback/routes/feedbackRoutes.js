const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

// Feedback
router.post('/feedback', authMiddleware, feedbackController.createFeedback);
router.get('/feedback', authMiddleware, feedbackController.getFeedbacks);
router.get('/feedback/mine', authMiddleware, feedbackController.getMyFeedback); // Get current user's feedback
router.get('/feedback/random', feedbackController.getRandomFeedbacks); // Public endpoint for welcome page
router.get('/feedback/:id', authMiddleware, feedbackController.getFeedbackById);
router.put('/feedback/:id', authMiddleware, feedbackController.updateFeedback);
router.delete('/feedback/:id', authMiddleware, feedbackController.deleteFeedback);

module.exports = router;
