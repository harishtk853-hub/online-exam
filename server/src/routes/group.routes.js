const express = require('express');
const router = express.Router();
const GroupController = require('../controllers/group.controller');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');

// Schools
router.get('/schools', GroupController.listSchools);
router.post('/schools', authenticate, GroupController.createSchool);

// Groups
router.get('/', optionalAuthenticate, GroupController.listGroups);
router.post('/', authenticate, GroupController.createGroup);
router.post('/join', authenticate, GroupController.joinGroupByCode);
router.get('/:id', optionalAuthenticate, GroupController.getGroupById);
router.get('/:id/members', optionalAuthenticate, GroupController.getGroupMembers);
router.post('/:id/leave', authenticate, GroupController.leaveGroup);

// Group Exams & Chat
router.get('/:id/exams', optionalAuthenticate, GroupController.getGroupExams);
router.get('/:id/messages', optionalAuthenticate, GroupController.getGroupMessages);
router.post('/:id/messages', authenticate, GroupController.postGroupMessage);
router.delete('/:id/messages/:messageId', authenticate, GroupController.deleteGroupMessage);

module.exports = router;
