const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/user.model');
const PasswordResetModel = require('../src/models/passwordReset.model');

const { query } = require('../src/config/db');

describe('Phase 2 — Authentication & Accounts Integration Tests', () => {
    beforeAll(async () => {
        try {
            await query('DELETE FROM users');
        } catch (e) {}
        UserModel.clearMemoryStore();
        PasswordResetModel.clearMemoryStore();
    });

    const testUser = {
        name: 'Alice Student',
        email: 'alice@example.com',
        password: 'Password123!',
        password_confirmation: 'Password123!'
    };

    let authToken = null;

    describe('POST /api/auth/register', () => {
        it('registers a new user as a student and returns 201 with token', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user).toMatchObject({
                name: 'Alice Student',
                email: 'alice@example.com',
                role: 'student',
                status: 'active'
            });
            authToken = res.body.data.token;
        });

        it('disallows role escalation: registering with role="admin" still creates role="student"', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Hacker Bob',
                    email: 'bob@example.com',
                    password: 'Password123!',
                    password_confirmation: 'Password123!',
                    role: 'admin' // Attempted privilege escalation
                });

            expect(res.status).toBe(201);
            expect(res.body.data.user.role).toBe('student');
            expect(res.body.data.user.role).not.toBe('admin');
        });

        it('rejects duplicate email registrations with 409 Conflict', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already exists');
        });

        it('validates password requirements and confirmation match with 422', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Charlie',
                    email: 'charlie@example.com',
                    password: 'weak',
                    password_confirmation: 'different'
                });

            expect(res.status).toBe(422);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    describe('POST /api/auth/login', () => {
        it('authenticates valid credentials and returns 200 with JWT', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'alice@example.com',
                    password: 'Password123!'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user.email).toBe('alice@example.com');
        });

        it('rejects incorrect password with 401 Unauthorized', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'alice@example.com',
                    password: 'WrongPassword999!'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid email or password');
        });

        it('rejects non-existent email with 401 Unauthorized', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Password123!'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        it('returns user profile when provided valid Bearer token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toHaveProperty('email', 'alice@example.com');
            expect(res.body.data.user).not.toHaveProperty('password_hash');
        });

        it('rejects request without token with 401', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('rejects malformed token with 401', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid.token.payload');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Password Recovery Workflow', () => {
        let devResetToken = null;

        it('processes forgot password request and issues reset token', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'alice@example.com' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('dev_reset_token');
            devResetToken = res.body.data.dev_reset_token;
        });

        it('rejects password reset with invalid token with 400', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: 'alice@example.com',
                    token: 'invalid-token-12345',
                    password: 'NewPassword456!',
                    password_confirmation: 'NewPassword456!'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('resets password successfully with valid token and allows login with new password', async () => {
            const resetRes = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: 'alice@example.com',
                    token: devResetToken,
                    password: 'NewPassword456!',
                    password_confirmation: 'NewPassword456!'
                });

            expect(resetRes.status).toBe(200);
            expect(resetRes.body.success).toBe(true);

            // Verify login with new password succeeds
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'alice@example.com',
                    password: 'NewPassword456!'
                });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.success).toBe(true);
            authToken = loginRes.body.data.token;
        });
    });

    describe('Account Profile & Security Management', () => {
        it('updates user profile details successfully', async () => {
            const res = await request(app)
                .patch('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Alice Academic',
                    bio: 'Studying Computer Science'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.name).toBe('Alice Academic');
            expect(res.body.data.user.bio).toBe('Studying Computer Science');
        });

        it('changes password successfully when current password is valid', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    current_password: 'NewPassword456!',
                    new_password: 'FinalPassword789!',
                    new_password_confirmation: 'FinalPassword789!'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('rejects password change when current password is wrong', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    current_password: 'WrongCurrentPassword!',
                    new_password: 'AnotherPassword123!',
                    new_password_confirmation: 'AnotherPassword123!'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
