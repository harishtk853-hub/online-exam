const GroupModel = require('../models/group.model');
const { successResponse, errorResponse } = require('../utils/response');

class GroupController {
    // ==================== SCHOOLS ====================
    static async createSchool(req, res, next) {
        try {
            const { name, code, description, address } = req.body;
            if (!name || !name.trim()) {
                return errorResponse(res, 'School name is required', 422);
            }

            const school = await GroupModel.createSchool({
                name,
                code,
                description,
                address,
                created_by: req.user.id
            });

            return successResponse(res, school, 'School created successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    static async listSchools(req, res, next) {
        try {
            const schools = await GroupModel.listSchools();
            return successResponse(res, schools, 'Schools retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    // ==================== GROUPS ====================
    static async createGroup(req, res, next) {
        try {
            const { name, description, school_id, visibility } = req.body;
            if (!name || !name.trim()) {
                return errorResponse(res, 'Group name is required', 422);
            }

            const group = await GroupModel.createGroup({
                name,
                description,
                school_id,
                visibility: visibility || 'public',
                created_by: req.user.id
            });

            return successResponse(res, group, 'Group created successfully. Share the join code with students and faculty.', 201);
        } catch (err) {
            next(err);
        }
    }

    static async listGroups(req, res, next) {
        try {
            const { school_id, search } = req.query;
            const groups = await GroupModel.listGroups({
                userId: req.user?.id || null,
                schoolId: school_id,
                search
            });
            return successResponse(res, groups, 'Groups retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getGroupById(req, res, next) {
        try {
            const groupId = Number(req.params.id);
            const group = await GroupModel.getGroupById(groupId);
            if (!group) return errorResponse(res, 'Group not found', 404);

            const members = await GroupModel.getGroupMembers(groupId);
            return successResponse(res, { ...group, members }, 'Group retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async joinGroupByCode(req, res, next) {
        try {
            const { code } = req.body;
            if (!code || !code.trim()) {
                return errorResponse(res, 'Please provide a valid Group Join Code', 422);
            }

            const result = await GroupModel.joinGroupByCode(req.user.id, code.trim());
            if (!result.success) {
                return errorResponse(res, result.message, 400);
            }

            return successResponse(res, result.group, result.message);
        } catch (err) {
            next(err);
        }
    }

    static async getGroupMembers(req, res, next) {
        try {
            const groupId = Number(req.params.id);
            const members = await GroupModel.getGroupMembers(groupId);
            return successResponse(res, members, 'Group members retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async leaveGroup(req, res, next) {
        try {
            const groupId = Number(req.params.id);
            await GroupModel.leaveGroup(groupId, req.user.id);
            return successResponse(res, null, 'Left group successfully');
        } catch (err) {
            next(err);
        }
    }

    // ==================== GROUP EXAMS ====================
    static async getGroupExams(req, res, next) {
        try {
            const groupId = Number(req.params.id);
            const group = await GroupModel.getGroupById(groupId);
            if (!group) return errorResponse(res, 'Group not found', 404);

            const exams = await GroupModel.getGroupExams(groupId, req.user?.id || null);
            return successResponse(res, exams, 'Group exams retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    // ==================== GROUP MESSAGES (CHAT) ====================
    static async getGroupMessages(req, res, next) {
        try {
            const groupId = Number(req.params.id);
            const group = await GroupModel.getGroupById(groupId);
            if (!group) return errorResponse(res, 'Group not found', 404);

            const messages = await GroupModel.getGroupMessages(groupId);
            return successResponse(res, messages, 'Group messages retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async postGroupMessage(req, res, next) {
        try {
            const groupId = Number(req.params.id);
            const { message } = req.body;
            if (!message || !message.trim()) {
                return errorResponse(res, 'Message text cannot be empty', 422);
            }

            const group = await GroupModel.getGroupById(groupId);
            if (!group) return errorResponse(res, 'Group not found', 404);

            const newMessage = await GroupModel.postGroupMessage({
                groupId,
                userId: req.user.id,
                message: message.trim()
            });

            return successResponse(res, newMessage, 'Message posted successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    static async deleteGroupMessage(req, res, next) {
        try {
            const groupId = Number(req.params.id);
            const messageId = Number(req.params.messageId);

            const group = await GroupModel.getGroupById(groupId);
            if (!group) return errorResponse(res, 'Group not found', 404);

            const isOwnerOrAdmin = req.user.role === 'admin' || group.created_by === req.user.id;
            const success = await GroupModel.deleteGroupMessage(messageId, req.user.id, isOwnerOrAdmin);

            if (!success) {
                return errorResponse(res, 'Unable to delete message or not authorized', 403);
            }

            return successResponse(res, null, 'Message deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = GroupController;
