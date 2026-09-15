const RbacModel = require('../models/rbac.model');

class ProfilePolicy {
    static async canViewProfile(currentUser, targetProfile) {
        // Public profiles can be viewed by anyone
        if (targetProfile.is_public) {
            return true;
        }

        // Unauthenticated guests cannot view private profiles
        if (!currentUser) {
            return false;
        }

        // Users can always view their own profile
        if (currentUser.id === targetProfile.id) {
            return true;
        }

        // Administrators or users with 'users.view' can inspect private profiles
        const hasPrivilege = await RbacModel.hasPermission(currentUser.id, ['users.view']);
        return hasPrivilege;
    }

    static async canEditProfile(currentUser, targetUserId) {
        if (!currentUser) {
            return false;
        }

        // Users can edit their own profile
        if (currentUser.id === Number(targetUserId)) {
            return true;
        }

        // Administrators or users with 'users.manage' can manage profiles
        const hasPrivilege = await RbacModel.hasPermission(currentUser.id, ['users.manage']);
        return hasPrivilege;
    }
}

module.exports = ProfilePolicy;
