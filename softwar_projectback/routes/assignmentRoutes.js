const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

// Assignment CRUD
router.post('/assignments', authMiddleware, assignmentController.createAssignment);
router.get('/assignments', authMiddleware, assignmentController.getAssignments);
router.get('/assignments/:id', authMiddleware, assignmentController.getAssignmentById);
router.put('/assignments/:id', authMiddleware, assignmentController.updateAssignment);
router.delete('/assignments/:id', authMiddleware, assignmentController.deleteAssignment);

// Submissions
router.post('/assignments/:id/submit', authMiddleware, assignmentController.submitAssignment);
router.post('/assignments/:id/grade', authMiddleware, assignmentController.gradeSubmission);

module.exports = router;
