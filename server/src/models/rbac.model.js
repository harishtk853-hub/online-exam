const { query } = require('../config/db');

// Standard default permissions per role
const DEFAULT_ROLE_PERMISSIONS = {
    student: ['profile.view', 'profile.edit'],
    teacher: ['profile.view', 'profile.edit', 'groups.create', 'groups.manage'],
    parent: ['profile.view', 'profile.edit'],
    contributor: ['profile.view', 'profile.edit'], // Trusted contributor does NOT receive moderation.manage
    moderator: ['profile.view', 'profile.edit', 'users.view', 'moderation.manage'],
    admin: [
        'profile.view',
        'profile.edit',
        'users.view',
        'users.manage',
        'roles.manage',
        'groups.create',
        'groups.manage',
        'moderation.manage'
    ]
};

const VALID_ROLES = ['student', 'teacher', 'admin', 'parent', 'contributor', 'moderator'];

// In-memory fallback RBAC store for test isolation
const memoryUserRoles = []; // { userId, roleName, isPrimary }

class RbacModel {
    static get validRoles() {
        return VALID_ROLES;
    }

    static async getUserRoles(userId) {
        try {
            const results = await query(
                `SELECT r.name, ur.is_primary 
                 FROM user_roles ur
                 JOIN roles r ON ur.role_id = r.id
                 WHERE ur.user_id = ?
                 ORDER BY ur.is_primary DESC, r.name ASC`,
                [userId]
            );
            if (results.length > 0) {
                return results.map(r => ({
                    name: r.name,
                    is_primary: Boolean(r.is_primary)
                }));
            }
        } catch (err) {
            // fallback to memory
        }

        const userAssignments = memoryUserRoles.filter(ur => ur.userId === Number(userId));
        if (userAssignments.length > 0) {
            return userAssignments.map(ur => ({
                name: ur.roleName,
                is_primary: ur.isPrimary
            }));
        }

        // Default to student primary role if not explicitly in table
        return [{ name: 'student', is_primary: true }];
    }

    static async getUserPermissions(userId) {
        const roles = await this.getUserRoles(userId);
        const permissionSet = new Set();

        for (const roleObj of roles) {
            const perms = DEFAULT_ROLE_PERMISSIONS[roleObj.name] || [];
            perms.forEach(p => permissionSet.add(p));
        }

        return Array.from(permissionSet);
    }

    static async assignRole(userId, roleName, isPrimary = false) {
        if (!VALID_ROLES.includes(roleName)) {
            throw new Error(`Invalid role: ${roleName}`);
        }

        try {
            // Get role_id
            const roleRows = await query('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);
            if (roleRows.length > 0) {
                const roleId = roleRows[0].id;
                if (isPrimary) {
                    await query('DELETE FROM user_roles WHERE user_id = ? AND is_primary = TRUE', [userId]);
                    await query('UPDATE users SET role = ? WHERE id = ?', [roleName, userId]);
                }
                await query(
                    `INSERT INTO user_roles (user_id, role_id, is_primary) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE is_primary = ?`,
                    [userId, roleId, isPrimary, isPrimary]
                );
                return true;
            }
        } catch (err) {
            // fallback to memory store
        }

        const numericUserId = Number(userId);
        if (isPrimary) {
            // Remove previous primary role from memory store
            const prevPrimaryIndex = memoryUserRoles.findIndex(
                ur => ur.userId === numericUserId && ur.isPrimary
            );
            if (prevPrimaryIndex !== -1) {
                memoryUserRoles.splice(prevPrimaryIndex, 1);
            }
        }

        const existingIndex = memoryUserRoles.findIndex(
            ur => ur.userId === numericUserId && ur.roleName === roleName
        );

        if (existingIndex !== -1) {
            memoryUserRoles[existingIndex].isPrimary = isPrimary;
        } else {
            memoryUserRoles.push({
                userId: numericUserId,
                roleName,
                isPrimary
            });
        }

        return true;
    }

    static async removeRole(userId, roleName) {
        const numericUserId = Number(userId);
        try {
            await query(
                `DELETE ur FROM user_roles ur
                 JOIN roles r ON ur.role_id = r.id
                 WHERE ur.user_id = ? AND r.name = ? AND ur.is_primary = FALSE`,
                [numericUserId, roleName]
            );
            return true;
        } catch (err) {
            const index = memoryUserRoles.findIndex(
                ur => ur.userId === numericUserId && ur.roleName === roleName && !ur.isPrimary
            );
            if (index !== -1) {
                memoryUserRoles.splice(index, 1);
                return true;
            }
            return false;
        }
    }

    static async hasRole(userId, allowedRoles) {
        const roles = await this.getUserRoles(userId);
        const roleNames = roles.map(r => r.name);
        return allowedRoles.some(allowed => roleNames.includes(allowed));
    }

    static async hasPermission(userId, requiredPermissions) {
        const userPermissions = await this.getUserPermissions(userId);
        return requiredPermissions.some(p => userPermissions.includes(p));
    }

    static clearMemoryStore() {
        memoryUserRoles.length = 0;
    }
}

module.exports = RbacModel;
