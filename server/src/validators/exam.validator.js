const { body, param } = require('express-validator');

const createExamValidator = [
    body('title')
        .trim()
        .notEmpty().withMessage('Exam title is required')
        .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional({ nullable: true })
        .trim(),
    body('instructions')
        .optional({ nullable: true })
        .trim(),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Category must not exceed 100 characters'),
    body('duration_minutes')
        .optional()
        .isInt({ min: 1, max: 600 }).withMessage('Duration must be between 1 and 600 minutes'),
    body('total_marks')
        .optional()
        .isFloat({ min: 0.5, max: 10000 }).withMessage('Total marks must be between 0.5 and 10000'),
    body('pass_percentage')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Pass percentage must be between 0 and 100'),
    body('is_published')
        .optional()
        .isBoolean().withMessage('is_published must be a boolean'),
    body('shuffle_questions')
        .optional()
        .isBoolean().withMessage('shuffle_questions must be a boolean'),
    body('allow_review')
        .optional()
        .isBoolean().withMessage('allow_review must be a boolean')
];

const updateExamValidator = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional({ nullable: true })
        .trim(),
    body('instructions')
        .optional({ nullable: true })
        .trim(),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Category must not exceed 100 characters'),
    body('duration_minutes')
        .optional()
        .isInt({ min: 1, max: 600 }).withMessage('Duration must be between 1 and 600 minutes'),
    body('total_marks')
        .optional()
        .isFloat({ min: 0.5, max: 10000 }).withMessage('Total marks must be between 0.5 and 10000'),
    body('pass_percentage')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Pass percentage must be between 0 and 100'),
    body('is_published')
        .optional()
        .isBoolean().withMessage('is_published must be a boolean'),
    body('shuffle_questions')
        .optional()
        .isBoolean().withMessage('shuffle_questions must be a boolean'),
    body('allow_review')
        .optional()
        .isBoolean().withMessage('allow_review must be a boolean')
];

const questionValidator = [
    body('question_text')
        .trim()
        .notEmpty().withMessage('Question text is required'),
    body('question_type')
        .optional()
        .isIn(['mcq', 'true_false', 'short_answer']).withMessage('Invalid question type'),
    body('points')
        .optional()
        .isFloat({ min: 0.25, max: 100 }).withMessage('Points must be between 0.25 and 100'),
    body('explanation')
        .optional({ nullable: true })
        .trim(),
    body('options')
        .optional()
        .isArray().withMessage('Options must be an array')
];

const submitAttemptValidator = [
    body('answers')
        .isArray().withMessage('Answers array is required')
];

module.exports = {
    createExamValidator,
    updateExamValidator,
    questionValidator,
    submitAttemptValidator
};
