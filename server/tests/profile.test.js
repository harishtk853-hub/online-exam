const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/user.model');
const RbacModel = require('../src/models/rbac.model');
const { generateToken, hashPassword } = require('../src/utils/token');

const { query } = require('../src/config/db');

describe('Phase 3 — User Profiles & Resource Privacy Tests', () => {
    let publicUser, privateUser, otherUser, adminUser;
    let publicToken, privateToken, otherToken, adminToken;

    beforeAll(async () => {
        try {
            await query('DELETE FROM users');
        } catch (e) {}
        UserModel.clearMemoryStore();
        RbacModel.clearMemoryStore();

        const pwHash = await hashPassword('Password123!');

        // Public User
        publicUser = await UserModel.create({
            name: 'Public User',
            email: 'public@example.com',
            passwordHash: pwHash
        });
        await UserModel.updateProfile(publicUser.id, { isPublic: true, bio: 'I love biology' });
        publicToken = generateToken({ id: publicUser.id, email: publicUser.email, role: 'student' });

        // Private User
        privateUser = await UserModel.create({
            name: 'Private User',
            email: 'private@example.com',
            passwordHash: pwHash
        });
        await UserModel.updateProfile(privateUser.id, { isPublic: false, bio: 'Secret private notes' });
        privateToken = generateToken({ id: privateUser.id, email: privateUser.email, role: 'student' });

        // Another Normal User
        otherUser = await UserModel.create({
            name: 'Other Student',
            email: 'other@example.com',
            passwordHash: pwHash
        });
        otherToken = generateToken({ id: otherUser.id, email: otherUser.email, role: 'student' });

        // Admin User
        adminUser = await UserModel.create({
            name: 'System Admin',
            email: 'sysadmin@example.com',
            passwordHash: pwHash
        });
        await RbacModel.assignRole(adminUser.id, 'admin', true);
        adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: 'admin' });
    });

    describe('Profile Visibility & Privacy Controls', () => {
        it('allows anyone (including unauthenticated guests) to view a public profile', async () => {
            const res = await request(app).get(`/api/users/${publicUser.id}/profile`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.profile.name).toBe('Public User');
            expect(res.body.data.profile.bio).toBe('I love biology');
            expect(res.body.data.profile).not.toHaveProperty('password_hash');
            expect(res.body.data.profile).not.toHaveProperty('email'); // Email is omitted from public profile
        });

        it('rejects unauthenticated guests from viewing a private profile with 403', async () => {
            const res = await request(app).get(`/api/users/${privateUser.id}/profile`);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('private');
        });

        it('rejects another normal student from viewing a private profile with 403', async () => {
            const res = await request(app)
                .get(`/api/users/${privateUser.id}/profile`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('allows owner to view their own private profile via GET /api/users/:id/profile', async () => {
            const res = await request(app)
                .get(`/api/users/${privateUser.id}/profile`)
                .set('Authorization', `Bearer ${privateToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.profile.name).toBe('Private User');
            expect(res.body.data.profile.bio).toBe('Secret private notes');
        });

        it('allows admin to view a private profile', async () => {
            const res = await request(app)
                .get(`/api/users/${privateUser.id}/profile`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.profile.name).toBe('Private User');
        });

        it('returns 404 when requested profile ID does not exist', async () => {
            const res = await request(app).get('/api/users/99999/profile');
            expect(res.status).toBe(404);
        });
    });

    describe('Profile Updates & Privacy Toggling', () => {
        it('allows authenticated user to toggle profile visibility from public to private and back', async () => {
            // Set to private
            const res1 = await request(app)
                .patch('/api/auth/profile')
                .set('Authorization', `Bearer ${publicToken}`)
                .send({ is_public: false });

            expect(res1.status).toBe(200);
            expect(res1.body.data.user.is_public).toBe(false);

            // Verify other user now cannot see it
            const res2 = await request(app)
                .get(`/api/users/${publicUser.id}/profile`)
                .set('Authorization', `Bearer ${otherToken}`);
            expect(res2.status).toBe(403);

            // Revert back to public
            const res3 = await request(app)
                .patch('/api/auth/profile')
                .set('Authorization', `Bearer ${publicToken}`)
                .send({ is_public: true });

            expect(res3.status).toBe(200);
            expect(res3.body.data.user.is_public).toBe(true);

            // Other user can now see it again
            const res4 = await request(app)
                .get(`/api/users/${publicUser.id}/profile`)
                .set('Authorization', `Bearer ${otherToken}`);
            expect(res4.status).toBe(200);
        });
    });
});
