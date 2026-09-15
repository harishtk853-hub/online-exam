const UserModel = require('../models/user.model');
const RbacModel = require('../models/rbac.model');
const ProfilePolicy = require('../policies/profile.policy');
const { successResponse, errorResponse } = require('../utils/response');

class UserController {
    static async getUserProfile(req, res, next) {
        try {
            const targetId = Number(req.params.id);
            if (isNaN(targetId)) {
                return errorResponse(res, 'Invalid user ID parameter.', 400);
            }

            const targetProfile = await UserModel.getPublicProfile(targetId);
            if (!targetProfile) {
                return errorResponse(res, 'User profile not found.', 404);
            }

            const canView = await ProfilePolicy.canViewProfile(req.user, targetProfile);
            if (!canView) {
                return errorResponse(res, 'This profile is private and cannot be viewed.', 403);
            }

            return successResponse(res, { profile: targetProfile }, 'User profile retrieved');
        } catch (err) {
            next(err);
        }
    }

    static async getUserRoles(req, res, next) {
        try {
            const targetId = Number(req.params.id);
            if (isNaN(targetId)) {
                return errorResponse(res, 'Invalid user ID parameter.', 400);
            }

            const targetUser = await UserModel.findById(targetId);
            if (!targetUser) {
                return errorResponse(res, 'User not found.', 404);
            }

            const roles = await RbacModel.getUserRoles(targetId);
            return successResponse(res, { userId: targetId, roles }, 'User roles retrieved');
        } catch (err) {
            next(err);
        }
    }

    static async assignRole(req, res, next) {
        try {
            const targetId = Number(req.params.id);
            const { role, is_primary } = req.body;

            if (isNaN(targetId)) {
                return errorResponse(res, 'Invalid user ID parameter.', 400);
            }

            if (!role || !RbacModel.validRoles.includes(role)) {
                return errorResponse(
                    res,
                    `Invalid role specified. Valid roles are: ${RbacModel.validRoles.join(', ')}`,
                    422
                );
            }

            const targetUser = await UserModel.findById(targetId);
            if (!targetUser) {
                return errorResponse(res, 'User not found.', 404);
            }

            await RbacModel.assignRole(targetId, role, Boolean(is_primary));
            const updatedRoles = await RbacModel.getUserRoles(targetId);

            return successResponse(
                res,
                { userId: targetId, roles: updatedRoles },
                `Role '${role}' assigned successfully.`
            );
        } catch (err) {
            next(err);
        }
    }

    static async removeRole(req, res, next) {
        try {
            const targetId = Number(req.params.id);
            const { role } = req.body;

            if (isNaN(targetId)) {
                return errorResponse(res, 'Invalid user ID parameter.', 400);
            }

            const targetUser = await UserModel.findById(targetId);
            if (!targetUser) {
                return errorResponse(res, 'User not found.', 404);
            }

            const success = await RbacModel.removeRole(targetId, role);
            if (!success) {
                return errorResponse(res, `Cannot remove primary role '${role}' or role not assigned.`, 400);
            }

            const updatedRoles = await RbacModel.getUserRoles(targetId);
            return successResponse(
                res,
                { userId: targetId, roles: updatedRoles },
                `Role '${role}' removed successfully.`
            );
        } catch (err) {
            next(err);
        }
    }

    static async setVerification(req, res, next) {
        try {
            const targetId = Number(req.params.id);
            const { is_verified_teacher, is_trusted_contributor } = req.body;

            if (isNaN(targetId)) {
                return errorResponse(res, 'Invalid user ID parameter.', 400);
            }

            const targetUser = await UserModel.findById(targetId);
            if (!targetUser) {
                return errorResponse(res, 'User not found.', 404);
            }

            const updatedUser = await UserModel.setVerificationStatus(targetId, {
                isVerifiedTeacher: is_verified_teacher,
                isTrustedContributor: is_trusted_contributor
            });

            return successResponse(res, { user: updatedUser }, 'User verification status updated successfully.');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = UserController;
