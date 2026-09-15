const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// Protect all admin endpoints with authentication and admin role check
router.use(authenticate, requireRole('admin'));

// Platform Stats
router.get('/stats', AdminController.getStats);

// User Management & Verification
router.get('/users', AdminController.listUsers);
router.get('/teachers/:id/id-card', AdminController.getTeacherIdCard);
router.patch('/users/:id/verification', AdminController.setTeacherVerification);
router.patch('/users/:id/status', AdminController.setUserStatus);
router.patch('/users/:id/role', AdminController.setUserRole);

module.exports = router;
