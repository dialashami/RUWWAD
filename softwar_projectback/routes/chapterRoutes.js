const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const { protect } = require('../middleware/auth');

// Get all chapters for a course
router.get('/course/:courseId', protect, chapterController.getChaptersByCourse);

// Get single chapter
router.get('/:chapterId', protect, chapterController.getChapter);

// Create chapter (teacher only)
router.post('/course/:courseId', protect, chapterController.createChapter);

// Update chapter (teacher only)
router.put('/:chapterId', protect, chapterController.updateChapter);

// Add slides to chapter (teacher only)
router.post('/:chapterId/slides', protect, chapterController.addSlides);

// Add lectures to chapter (teacher only)
router.post('/:chapterId/lectures', protect, chapterController.addLectures);

// Mark slides as viewed (student)
router.post('/:chapterId/slides/viewed', protect, chapterController.markSlidesViewed);

// Mark lecture as watched (student)
router.post('/:chapterId/lectures/watched', protect, chapterController.markLectureWatched);

// Delete chapter (teacher only)
router.delete('/:chapterId', protect, chapterController.deleteChapter);

module.exports = router;
