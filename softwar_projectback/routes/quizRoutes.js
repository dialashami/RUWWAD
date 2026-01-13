const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/auth');

// Generate quiz for a chapter (teacher only)
router.post('/generate/:chapterId', authMiddleware, quizController.generateQuiz);

// Regenerate quiz with new questions (teacher only)
router.post('/regenerate/:chapterId', authMiddleware, quizController.regenerateQuiz);

// Start a quiz attempt (student)
router.post('/start/:chapterId', authMiddleware, quizController.startQuiz);

// Submit quiz answers (student)
router.post('/submit/:attemptId', authMiddleware, quizController.submitQuiz);

// Get quiz results for a chapter (student)
router.get('/results/:chapterId', authMiddleware, quizController.getQuizResults);

module.exports = router;
