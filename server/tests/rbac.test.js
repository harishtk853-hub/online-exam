const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/user.model');
const RbacModel = require('../src/models/rbac.model');
const { generateToken, hashPassword } = require('../src/utils/token');

const { query } = require('../src/config/db');

describe('Phase 3 — RBAC, Permissions & Verification Isolation Tests', () => {
    let studentUser, teacherUser, adminUser, contributorUser;
    let studentToken, teacherToken, adminToken, contributorToken;

    beforeAll(async () => {
        try {
            await query('DELETE FROM users');
        } catch (e) {}
        UserModel.clearMemoryStore();
        RbacModel.clearMemoryStore();

        const pwHash = await hashPassword('Password123!');

        // 1. Student User
        studentUser = await UserModel.create({
            name: 'Sam Student',
            email: 'sam@example.com',
            passwordHash: pwHash
        });
        studentToken = generateToken({ id: studentUser.id, email: studentUser.email, role: 'student' });

        // 2. Teacher User
        teacherUser = await UserModel.create({
            name: 'Tina Teacher',
            email: 'tina@example.com',
            passwordHash: pwHash
        });
        await RbacModel.assignRole(teacherUser.id, 'teacher', true);
        teacherToken = generateToken({ id: teacherUser.id, email: teacherUser.email, role: 'teacher' });

        // 3. Admin User
        adminUser = await UserModel.create({
            name: 'Adam Admin',
            email: 'adam@example.com',
            passwordHash: pwHash
        });
        await RbacModel.assignRole(adminUser.id, 'admin', true);
        adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: 'admin' });

        // 4. Trusted Contributor User
        contributorUser = await UserModel.create({
            name: 'Carl Contributor',
            email: 'carl@example.com',
            passwordHash: pwHash
        });
        await RbacModel.assignRole(contributorUser.id, 'contributor', true);
        await UserModel.setVerificationStatus(contributorUser.id, { isTrustedContributor: true });
        contributorToken = generateToken({ id: contributorUser.id, email: contributorUser.email, role: 'contributor' });
    });

    describe('Roles & Permissions Structure', () => {
        it('identifies valid platform roles: student, teacher, admin, parent, contributor, moderator', () => {
            expect(RbacModel.validRoles).toEqual([
                'student', 'teacher', 'admin', 'parent', 'contributor', 'moderator'
            ]);
        });

        it('returns primary role and aggregated permissions for student', async () => {
            const res = await request(app)
                .get('/api/auth/permissions')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.permissions).toContain('profile.view');
            expect(res.body.data.permissions).toContain('profile.edit');
            expect(res.body.data.permissions).not.toContain('roles.manage');
            expect(res.body.data.permissions).not.toContain('moderation.manage');
        });

        it('returns primary and secondary roles on GET /api/users/:id/roles', async () => {
            // Assign secondary role 'parent' to teacher
            await RbacModel.assignRole(teacherUser.id, 'parent', false);

            const res = await request(app)
                .get(`/api/users/${teacherUser.id}/roles`)
                .set('Authorization', `Bearer ${teacherToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.roles).toHaveLength(2);
            expect(res.body.data.roles).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'teacher', is_primary: true }),
                    expect.objectContaining({ name: 'parent', is_primary: false })
                ])
            );
        });
    });

    describe('Server-Side Role & Permission Enforcement', () => {
        it('allows admin to assign roles via POST /api/users/:id/roles', async () => {
            const res = await request(app)
                .post(`/api/users/${studentUser.id}/roles`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'contributor', is_primary: false });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.roles).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'student', is_primary: true }),
                    expect.objectContaining({ name: 'contributor', is_primary: false })
                ])
            );
        });

        it('rejects non-admin/unauthorized user from assigning roles with 403 Forbidden', async () => {
            const res = await request(app)
                .post(`/api/users/${studentUser.id}/roles`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ role: 'admin', is_primary: true });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Forbidden');
        });

        it('rejects unauthenticated role assignment requests with 401 Unauthorized', async () => {
            const res = await request(app)
                .post(`/api/users/${studentUser.id}/roles`)
                .send({ role: 'admin', is_primary: true });

            expect(res.status).toBe(401);
        });
    });

    describe('Verification Isolation Rules', () => {
        it('trusted contributor does NOT automatically receive moderator permissions', async () => {
            const res = await request(app)
                .get('/api/auth/permissions')
                .set('Authorization', `Bearer ${contributorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.permissions).not.toContain('moderation.manage');
            expect(res.body.data.permissions).not.toContain('roles.manage');
        });

        it('public profile update cannot spoof verification flags', async () => {
            const res = await request(app)
                .patch('/api/auth/profile')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    name: 'Sam Student',
                    is_verified_teacher: true,
                    is_trusted_contributor: true,
                    role: 'admin'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.user.is_verified_teacher).toBe(false);
            expect(res.body.data.user.is_trusted_contributor).toBe(false);
            expect(res.body.data.user.role).toBe('student');
        });

        it('only admin can set verification status via PATCH /api/users/:id/verification', async () => {
            const adminRes = await request(app)
                .patch(`/api/users/${teacherUser.id}/verification`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ is_verified_teacher: true });

            expect(adminRes.status).toBe(200);
            expect(adminRes.body.data.user.is_verified_teacher).toBe(true);

            // Verify student cannot change verification
            const studentRes = await request(app)
                .patch(`/api/users/${studentUser.id}/verification`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ is_verified_teacher: true });

            expect(studentRes.status).toBe(403);
        });
    });
});
