const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const { requireRole, requirePermission } = require('../middleware/authorize');

// Profile Resource Route
router.get('/:id/profile', optionalAuthenticate, UserController.getUserProfile);

// Roles Routes
router.get('/:id/roles', authenticate, UserController.getUserRoles);
router.post('/:id/roles', authenticate, requirePermission('roles.manage'), UserController.assignRole);
router.delete('/:id/roles', authenticate, requirePermission('roles.manage'), UserController.removeRole);

// Verification Status Route (Admin only)
router.patch('/:id/verification', authenticate, requireRole('admin'), UserController.setVerification);

module.exports = router;
