const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

// Generate quiz for a chapter (teacher only)
router.post('/generate/:chapterId', protect, quizController.generateQuiz);

// Regenerate quiz with new questions (teacher only)
router.post('/regenerate/:chapterId', protect, quizController.regenerateQuiz);

// Start a quiz attempt (student)
router.post('/start/:chapterId', protect, quizController.startQuiz);

// Submit quiz answers (student)
router.post('/submit/:attemptId', protect, quizController.submitQuiz);

// Get quiz results for a chapter (student)
router.get('/results/:chapterId', protect, quizController.getQuizResults);

module.exports = router;
