const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const courseController = require('../controllers/courseController');

// Student's courses with progress (must come BEFORE :id routes to avoid conflicts)
router.get('/courses/my-courses', authMiddleware, courseController.getStudentCourses);

// Video progress (must come BEFORE :id routes to avoid conflicts)
router.post('/courses/:id/watch-video', authMiddleware, courseController.markVideoWatched);
router.get('/courses/:id/progress', authMiddleware, courseController.getCourseWithProgress);

// Enrollment
router.post('/courses/:id/enroll', authMiddleware, courseController.enrollStudent);
router.post('/courses/:id/unenroll', authMiddleware, courseController.unenrollStudent);

// Course CRUD
router.post('/courses', authMiddleware, courseController.createCourse);
router.get('/courses', authMiddleware, courseController.getCourses);
router.get('/courses/:id', authMiddleware, courseController.getCourseById);
router.put('/courses/:id', authMiddleware, courseController.updateCourse);
router.delete('/courses/:id', authMiddleware, courseController.deleteCourse);

module.exports = router;
