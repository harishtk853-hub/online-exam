const express = require('express');
const router = express.Router();

const ExamController = require('../controllers/exam.controller');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const { requireRole } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
    createExamValidator,
    updateExamValidator,
    questionValidator,
    submitAttemptValidator
} = require('../validators/exam.validator');

// Teacher dashboard analytics
router.get('/teacher/stats', authenticate, requireRole('teacher', 'admin', 'moderator'), ExamController.getTeacherStats);

// Student attempts history
router.get('/my-attempts', authenticate, ExamController.getMyAttempts);

// Attempt breakdown & result
router.get('/attempts/:attemptId', authenticate, ExamController.getAttemptDetails);

// List exams (public or filter)
router.get('/', optionalAuthenticate, ExamController.listExams);

// Create new exam
router.post(
    '/',
    authenticate,
    requireRole('teacher', 'admin', 'moderator'),
    createExamValidator,
    validate,
    ExamController.createExam
);

// Get single exam details
router.get('/:id', optionalAuthenticate, ExamController.getExamById);

// Update exam
router.put(
    '/:id',
    authenticate,
    updateExamValidator,
    validate,
    ExamController.updateExam
);

// Delete exam
router.delete('/:id', authenticate, ExamController.deleteExam);

// Toggle publish status
router.post('/:id/publish', authenticate, ExamController.togglePublish);

// Question routes
router.post(
    '/:id/questions',
    authenticate,
    questionValidator,
    validate,
    ExamController.addQuestion
);

router.put(
    '/:id/questions/:questionId',
    authenticate,
    questionValidator,
    validate,
    ExamController.updateQuestion
);

router.delete('/:id/questions/:questionId', authenticate, ExamController.deleteQuestion);

// Student Exam Taking
router.post('/:id/attempt/start', authenticate, ExamController.startAttempt);
router.post(
    '/:id/attempt/submit',
    authenticate,
    submitAttemptValidator,
    validate,
    ExamController.submitAttempt
);

// Staff view submissions
router.get('/:id/submissions', authenticate, ExamController.getExamSubmissions);

module.exports = router;
