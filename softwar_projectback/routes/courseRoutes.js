const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const courseController = require('../controllers/courseController');

// Course CRUD
router.post('/courses', authMiddleware, courseController.createCourse);
router.get('/courses', authMiddleware, courseController.getCourses);
router.get('/courses/:id', authMiddleware, courseController.getCourseById);
router.put('/courses/:id', authMiddleware, courseController.updateCourse);
router.delete('/courses/:id', authMiddleware, courseController.deleteCourse);

// Enrollment
router.post('/courses/:id/enroll', authMiddleware, courseController.enrollStudent);
router.post('/courses/:id/unenroll', authMiddleware, courseController.unenrollStudent);

module.exports = router;
