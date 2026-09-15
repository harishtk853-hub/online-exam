const { errorResponse } = require('../utils/response');
const RbacModel = require('../models/rbac.model');

function requireRole(...allowedRoles) {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required.', 401);
        }

        const hasRole = await RbacModel.hasRole(req.user.id, allowedRoles);
        if (!hasRole) {
            return errorResponse(
                res,
                `Forbidden: You do not have the required role privileges (${allowedRoles.join(', ')}).`,
                403
            );
        }

        next();
    };
}

function requirePermission(...requiredPermissions) {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required.', 401);
        }

        const hasPerm = await RbacModel.hasPermission(req.user.id, requiredPermissions);
        if (!hasPerm) {
            return errorResponse(
                res,
                `Forbidden: You do not have the required permission (${requiredPermissions.join(', ')}).`,
                403
            );
        }

        next();
    };
}

module.exports = {
    requireRole,
    requirePermission
};
