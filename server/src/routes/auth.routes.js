const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    updateProfileValidator,
    changePasswordValidator
} = require('../validators/auth.validator');

// Public Authentication Routes
router.post('/register', registerValidator, validate, AuthController.register);
router.post('/login', loginValidator, validate, AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', forgotPasswordValidator, validate, AuthController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, AuthController.resetPassword);

// Protected User / Account Routes
router.get('/me', authenticate, AuthController.getMe);
router.get('/permissions', authenticate, AuthController.getPermissions);
router.patch('/profile', authenticate, updateProfileValidator, validate, AuthController.updateProfile);
router.post('/teacher-verification', authenticate, AuthController.submitTeacherVerification);
router.post('/change-password', authenticate, changePasswordValidator, validate, AuthController.changePassword);

module.exports = router;
