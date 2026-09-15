const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/user.model');
const RbacModel = require('../src/models/rbac.model');
const { generateToken, hashPassword } = require('../src/utils/token');

const { query } = require('../src/config/db');

describe('Exam Creation, Management & Student Assessment Engine', () => {
    let teacherUser, studentUser, otherTeacherUser;
    let teacherToken, studentToken, otherTeacherToken;
    let createdExamId;
    let question1Id, question2Id;

    beforeAll(async () => {
        try {
            await query('DELETE FROM users');
            await query('DELETE FROM exams');
        } catch (e) {}
        UserModel.clearMemoryStore();
        RbacModel.clearMemoryStore();

        const pwHash = await hashPassword('Password123!');

        // 1. Teacher User (Verified Faculty)
        teacherUser = await UserModel.create({
            name: 'Prof. Harish',
            email: 'teacher.harish@example.com',
            passwordHash: pwHash,
            role: 'teacher'
        });
        await RbacModel.assignRole(teacherUser.id, 'teacher', true);
        await UserModel.setVerificationStatus(teacherUser.id, { isVerifiedTeacher: true });
        teacherToken = generateToken({ id: teacherUser.id, email: teacherUser.email, role: 'teacher' });

        // 2. Student User
        studentUser = await UserModel.create({
            name: 'Alex Student',
            email: 'alex.student@example.com',
            passwordHash: pwHash,
            role: 'student'
        });
        await RbacModel.assignRole(studentUser.id, 'student', true);
        studentToken = generateToken({ id: studentUser.id, email: studentUser.email, role: 'student' });

        // 3. Other Teacher User
        otherTeacherUser = await UserModel.create({
            name: 'Prof. Other',
            email: 'other.teacher@example.com',
            passwordHash: pwHash,
            role: 'teacher'
        });
        await RbacModel.assignRole(otherTeacherUser.id, 'teacher', true);
        otherTeacherToken = generateToken({ id: otherTeacherUser.id, email: otherTeacherUser.email, role: 'teacher' });
    });

    describe('Exam Creation & Authorization', () => {
        it('rejects unauthenticated user from creating an exam with 401', async () => {
            const res = await request(app)
                .post('/api/exams')
                .send({ title: 'Physics Midterm' });

            expect(res.status).toBe(401);
        });

        it('rejects student from creating an exam with 403 Forbidden', async () => {
            const res = await request(app)
                .post('/api/exams')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    title: 'Student Attempting Exam Creation',
                    duration_minutes: 45
                });

            expect(res.status).toBe(403);
        });

        it('rejects unverified teacher from creating an exam with 403 Forbidden', async () => {
            const res = await request(app)
                .post('/api/exams')
                .set('Authorization', `Bearer ${otherTeacherToken}`)
                .send({
                    title: 'Unverified Teacher Attempting Exam Creation',
                    duration_minutes: 45
                });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Unverified teachers cannot create exams/i);
        });

        it('allows verified teacher to create a draft exam', async () => {
            const res = await request(app)
                .post('/api/exams')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'Advanced Computer Networks 101',
                    description: 'Comprehensive exam on TCP/IP, DNS, and HTTP/3',
                    category: 'Computer Science',
                    duration_minutes: 30,
                    pass_percentage: 60,
                    is_published: false
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.title).toBe('Advanced Computer Networks 101');
            expect(res.body.data.is_published).toBe(false);
            expect(res.body.data).toHaveProperty('code');

            createdExamId = res.body.data.id;
        });
    });

    describe('Question Builder & Publishing', () => {
        it('allows teacher to add an MCQ question with options', async () => {
            const res = await request(app)
                .post(`/api/exams/${createdExamId}/questions`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    question_text: 'Which transport layer protocol provides reliable, connection-oriented data transfer?',
                    question_type: 'mcq',
                    points: 5.0,
                    explanation: 'TCP (Transmission Control Protocol) is connection-oriented and guarantees delivery.',
                    options: [
                        { option_text: 'UDP', is_correct: false },
                        { option_text: 'TCP', is_correct: true },
                        { option_text: 'IP', is_correct: false },
                        { option_text: 'ICMP', is_correct: false }
                    ]
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.questions).toHaveLength(1);
            expect(res.body.data.questions[0].options).toHaveLength(4);

            question1Id = res.body.data.questions[0].id;
        });

        it('allows teacher to add a True/False question', async () => {
            const res = await request(app)
                .post(`/api/exams/${createdExamId}/questions`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    question_text: 'HTTP/3 runs over QUIC instead of TCP.',
                    question_type: 'true_false',
                    points: 5.0,
                    explanation: 'QUIC runs on UDP and powers HTTP/3.',
                    options: [
                        { option_text: 'True', is_correct: true },
                        { option_text: 'False', is_correct: false }
                    ]
                });

            expect(res.status).toBe(201);
            expect(res.body.data.questions).toHaveLength(2);
            question2Id = res.body.data.questions[1].id;
        });

        it('prevents another teacher from modifying this exam', async () => {
            const res = await request(app)
                .put(`/api/exams/${createdExamId}`)
                .set('Authorization', `Bearer ${otherTeacherToken}`)
                .send({ title: 'Hacked Title' });

            expect(res.status).toBe(403);
        });

        it('allows teacher to publish the exam', async () => {
            const res = await request(app)
                .post(`/api/exams/${createdExamId}/publish`)
                .set('Authorization', `Bearer ${teacherToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.is_published).toBe(true);
        });
    });

    describe('Student Exam Taking & Auto-Grading Engine', () => {
        let attemptId;

        it('allows student to fetch exam details without seeing is_correct flags in options', async () => {
            const res = await request(app)
                .get(`/api/exams/${createdExamId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.questions).toHaveLength(2);
            // Verify options do NOT leak is_correct to student
            const firstOption = res.body.data.questions[0].options[0];
            expect(firstOption).not.toHaveProperty('is_correct');
        });

        it('allows student to start an exam attempt', async () => {
            const res = await request(app)
                .post(`/api/exams/${createdExamId}/attempt/start`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('attemptId');
            attemptId = res.body.data.attemptId;
        });

        it('submits exam answers and automatically computes scores and percentage', async () => {
            // Find the correct option IDs for testing from teacher view
            const teacherExamRes = await request(app)
                .get(`/api/exams/${createdExamId}`)
                .set('Authorization', `Bearer ${teacherToken}`);

            const q1 = teacherExamRes.body.data.questions[0];
            const q2 = teacherExamRes.body.data.questions[1];

            const q1CorrectOpt = q1.options.find(o => o.is_correct);
            const q2WrongOpt = q2.options.find(o => !o.is_correct);

            // Student answers Q1 correctly (+5 pts) and Q2 incorrectly (0 pts) -> 5 / 10 = 50%
            const res = await request(app)
                .post(`/api/exams/${createdExamId}/attempt/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    attemptId,
                    answers: [
                        { question_id: q1.id, selected_option_id: q1CorrectOpt.id },
                        { question_id: q2.id, selected_option_id: q2WrongOpt.id }
                    ]
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.score).toBe('5.00');
            expect(res.body.data.total_points).toBe('10.00');
            expect(res.body.data.percentage).toBe('50.00');
            expect(res.body.data.status).toBe('completed');
        });

        it('allows student to view their completed attempt breakdown', async () => {
            const res = await request(app)
                .get(`/api/exams/attempts/${attemptId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.score).toBe('5.00');
            expect(res.body.data.answers).toHaveLength(2);
        });

        it('allows teacher to view all student submissions and statistics', async () => {
            const res = await request(app)
                .get(`/api/exams/${createdExamId}/submissions`)
                .set('Authorization', `Bearer ${teacherToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.submissions).toHaveLength(1);
            expect(res.body.data.submissions[0].student_name).toBe('Alex Student');
            expect(res.body.data.submissions[0].percentage).toBe('50.00');
        });

        it('allows teacher to view dashboard stats', async () => {
            const res = await request(app)
                .get('/api/exams/teacher/stats')
                .set('Authorization', `Bearer ${teacherToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.stats.total_exams).toBeGreaterThanOrEqual(1);
            expect(res.body.data.stats.total_submissions).toBeGreaterThanOrEqual(1);
        });

        it('excludes group exams from the public Exams Catalog list', async () => {
            // Create a group exam
            const groupExamRes = await request(app)
                .post('/api/exams')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'Private Group Exam Alpha',
                    group_id: 10,
                    is_published: true,
                    duration_minutes: 20
                });

            expect(groupExamRes.status).toBe(201);
            const groupExamId = groupExamRes.body.data.id;

            // 1. Fetch public catalog (student / unauthenticated view)
            const catalogRes = await request(app)
                .get('/api/exams')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(catalogRes.status).toBe(200);
            const foundInCatalog = catalogRes.body.data.some(e => e.id === groupExamId);
            expect(foundInCatalog).toBe(false);

            // 2. Fetch via group_id filter
            const groupSpecificRes = await request(app)
                .get('/api/exams?group_id=10')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(groupSpecificRes.status).toBe(200);
            const foundInGroup = groupSpecificRes.body.data.some(e => e.id === groupExamId);
            expect(foundInGroup).toBe(true);
        });
    });
});
