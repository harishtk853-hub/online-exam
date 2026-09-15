const { body } = require('express-validator');

const registerValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('password_confirmation')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),
    body('role')
        .optional()
        .trim()
];

const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email or username is required')
        .custom((value) => {
            const clean = value.toLowerCase().trim();
            if (['admin', 'teacher', 'student'].includes(clean)) return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(clean)) {
                throw new Error('Please enter a valid email address or username');
            }
            return true;
        }),
    body('password')
        .notEmpty().withMessage('Password is required')
];

const forgotPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail()
];

const resetPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    body('token')
        .trim()
        .notEmpty().withMessage('Reset token is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('password_confirmation')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        })
];

const updateProfileValidator = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('is_public')
        .optional()
        .isBoolean().withMessage('is_public must be a boolean'),
    body('role')
        .optional()
        .trim()
];

const changePasswordValidator = [
    body('current_password')
        .notEmpty().withMessage('Current password is required'),
    body('new_password')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('New password must contain at least one number'),
    body('new_password_confirmation')
        .custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('New password confirmation does not match');
            }
            return true;
        })
];

module.exports = {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    updateProfileValidator,
    changePasswordValidator
};
