const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const authMiddleware = require('../middleware/auth');

// Get all chapters for a course
router.get('/course/:courseId', authMiddleware, chapterController.getChaptersByCourse);

// Get single chapter
router.get('/:chapterId', authMiddleware, chapterController.getChapter);

// Create chapter (teacher only)
router.post('/course/:courseId', authMiddleware, chapterController.createChapter);

// Update chapter (teacher only)
router.put('/:chapterId', authMiddleware, chapterController.updateChapter);

// Add slides to chapter (teacher only)
router.post('/:chapterId/slides', authMiddleware, chapterController.addSlides);

// Add lectures to chapter (teacher only)
router.post('/:chapterId/lectures', authMiddleware, chapterController.addLectures);

// Mark slides as viewed (student)
router.post('/:chapterId/slides/viewed', authMiddleware, chapterController.markSlidesViewed);

// Mark lecture as watched (student)
router.post('/:chapterId/lectures/watched', authMiddleware, chapterController.markLectureWatched);

// Extract text from PDF slide (teacher only)
router.post('/:chapterId/extract-pdf-text', authMiddleware, chapterController.extractPdfText);

// Delete chapter (teacher only)
router.delete('/:chapterId', authMiddleware, chapterController.deleteChapter);

module.exports = router;
