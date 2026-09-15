const { query, getPool } = require('../config/db');
const UserModel = require('./user.model');
const crypto = require('crypto');

// In-memory fallback store when MySQL is offline
const memoryExams = [];
const memoryQuestions = [];
const memoryOptions = [];
const memoryAttempts = [];
const memoryAnswers = [];
let nextExamId = 1;
let nextQuestionId = 1;
let nextOptionId = 1;
let nextAttemptId = 1;
let nextAnswerId = 1;

function seedSampleExams() {
    if (memoryExams.length === 0) {
        const seedExamId = nextExamId++;
        memoryExams.push({
            id: seedExamId,
            title: 'General Computer Science & Programming Fundamentals',
            code: 'EXM-CS101',
            description: 'Core concepts including data structures, algorithmic complexity, web architectures, and relational databases.',
            instructions: 'Answer all multiple choice and true/false questions. Instant automated evaluation will be generated upon submission.',
            category: 'Computer Science',
            duration_minutes: 30,
            total_marks: 10,
            pass_percentage: 50,
            status: 'published',
            is_published: true,
            shuffle_questions: false,
            allow_review: true,
            created_by: 1,
            school_id: null,
            group_id: null,
            created_at: new Date(),
            updated_at: new Date()
        });

        // Question 1
        const q1Id = nextQuestionId++;
        memoryQuestions.push({
            id: q1Id,
            exam_id: seedExamId,
            question_text: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
            question_type: 'mcq',
            points: 5,
            explanation: 'A balanced BST divides the search space in half at each step, yielding O(log n) time complexity.',
            order_index: 0,
            created_at: new Date()
        });
        memoryOptions.push(
            { id: nextOptionId++, question_id: q1Id, option_text: 'O(1)', is_correct: false, order_index: 0 },
            { id: nextOptionId++, question_id: q1Id, option_text: 'O(log n)', is_correct: true, order_index: 1 },
            { id: nextOptionId++, question_id: q1Id, option_text: 'O(n)', is_correct: false, order_index: 2 },
            { id: nextOptionId++, question_id: q1Id, option_text: 'O(n log n)', is_correct: false, order_index: 3 }
        );

        // Question 2
        const q2Id = nextQuestionId++;
        memoryQuestions.push({
            id: q2Id,
            exam_id: seedExamId,
            question_text: 'HTTP status code 201 indicates that a new resource has been successfully created on the server.',
            question_type: 'true_false',
            points: 5,
            explanation: 'HTTP 201 Created is the standard REST status code returned for successful resource creation (e.g. POST requests).',
            order_index: 1,
            created_at: new Date()
        });
        memoryOptions.push(
            { id: nextOptionId++, question_id: q2Id, option_text: 'True', is_correct: true, order_index: 0 },
            { id: nextOptionId++, question_id: q2Id, option_text: 'False', is_correct: false, order_index: 1 }
        );
    }
}
seedSampleExams();

class ExamModel {
    /**
     * Generate a unique short code for an exam
     */
    static generateCode() {
        return 'EXM-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    }

    /**
     * Create a new exam
     */
    static async createExam({
        title,
        description = null,
        instructions = null,
        category = 'General',
        duration_minutes = 60,
        total_marks = 100.00,
        pass_percentage = 50.00,
        status = 'draft',
        is_published = false,
        shuffle_questions = false,
        allow_review = true,
        created_by,
        school_id = null,
        group_id = null,
        questions = []
    }) {
        let pool = null;
        try {
            pool = getPool();
            const connection = await pool.getConnection();

            try {
                await connection.beginTransaction();

                const code = this.generateCode();
                const sql = `
                    INSERT INTO exams (
                        title, code, description, instructions, category,
                        duration_minutes, total_marks, pass_percentage, status,
                        is_published, shuffle_questions, allow_review,
                        created_by, school_id, group_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const [result] = await connection.query(sql, [
                    title,
                    code,
                    description,
                    instructions,
                    category,
                    Number(duration_minutes),
                    Number(total_marks),
                    Number(pass_percentage),
                    is_published ? 'published' : status,
                    Boolean(is_published),
                    Boolean(shuffle_questions),
                    Boolean(allow_review),
                    created_by,
                    school_id,
                    group_id
                ]);

                const examId = result.insertId;

                // Insert nested questions and options if provided
                if (questions && Array.isArray(questions) && questions.length > 0) {
                    for (let i = 0; i < questions.length; i++) {
                        const q = questions[i];
                        if (!q.question_text || !q.question_text.trim()) continue;

                        const [qResult] = await connection.query(`
                            INSERT INTO questions (exam_id, question_text, question_type, points, explanation, order_index)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `, [
                            examId,
                            q.question_text.trim(),
                            q.question_type || 'mcq',
                            Number(q.points || 1),
                            q.explanation || null,
                            q.order_index !== undefined ? q.order_index : i
                        ]);

                        const questionId = qResult.insertId;

                        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
                            for (let j = 0; j < q.options.length; j++) {
                                const opt = q.options[j];
                                if (opt.option_text !== undefined && opt.option_text !== null) {
                                    await connection.query(`
                                        INSERT INTO question_options (question_id, option_text, is_correct, order_index)
                                        VALUES (?, ?, ?, ?)
                                    `, [
                                        questionId,
                                        String(opt.option_text).trim(),
                                        Boolean(opt.is_correct),
                                        opt.order_index !== undefined ? opt.order_index : j
                                    ]);
                                }
                            }
                        }
                    }
                }

                await connection.commit();
                return this.getExamById(examId, true);
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (dbErr) {
            // Fallback in-memory store
            const examId = nextExamId++;
            const code = this.generateCode();
            const exam = {
                id: examId,
                title,
                code,
                description,
                instructions,
                category,
                duration_minutes: Number(duration_minutes),
                total_marks: Number(total_marks),
                pass_percentage: Number(pass_percentage),
                status: is_published ? 'published' : status,
                is_published: Boolean(is_published),
                shuffle_questions: Boolean(shuffle_questions),
                allow_review: Boolean(allow_review),
                created_by: Number(created_by),
                school_id,
                group_id,
                created_at: new Date(),
                updated_at: new Date()
            };
            memoryExams.push(exam);

            if (questions && Array.isArray(questions) && questions.length > 0) {
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    if (!q.question_text || !q.question_text.trim()) continue;

                    const qId = nextQuestionId++;
                    memoryQuestions.push({
                        id: qId,
                        exam_id: examId,
                        question_text: q.question_text.trim(),
                        question_type: q.question_type || 'mcq',
                        points: Number(q.points || 1),
                        explanation: q.explanation || null,
                        order_index: q.order_index !== undefined ? q.order_index : i,
                        created_at: new Date()
                    });

                    if (q.options && Array.isArray(q.options) && q.options.length > 0) {
                        for (let j = 0; j < q.options.length; j++) {
                            const opt = q.options[j];
                            if (opt.option_text !== undefined && opt.option_text !== null) {
                                memoryOptions.push({
                                    id: nextOptionId++,
                                    question_id: qId,
                                    option_text: String(opt.option_text).trim(),
                                    is_correct: Boolean(opt.is_correct),
                                    order_index: opt.order_index !== undefined ? opt.order_index : j
                                });
                            }
                        }
                    }
                }
            }

            return this.getExamById(examId, true);
        }
    }

    /**
     * Update an exam
     */
    static async updateExam(id, fields) {
        try {
            const allowed = [
                'title', 'description', 'instructions', 'category',
                'duration_minutes', 'total_marks', 'pass_percentage',
                'status', 'is_published', 'shuffle_questions', 'allow_review'
            ];

            const setClauses = [];
            const values = [];

            for (const [key, value] of Object.entries(fields)) {
                if (allowed.includes(key) && value !== undefined) {
                    setClauses.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (fields.is_published !== undefined) {
                setClauses.push('status = ?');
                values.push(fields.is_published ? 'published' : 'draft');
            }

            if (setClauses.length === 0) return this.getExamById(id, true);

            values.push(id);
            const sql = `UPDATE exams SET ${setClauses.join(', ')} WHERE id = ?`;
            await query(sql, values);

            return this.getExamById(id, true);
        } catch (dbErr) {
            const exam = memoryExams.find(e => e.id === Number(id));
            if (exam) {
                Object.assign(exam, fields);
                if (fields.is_published !== undefined) {
                    exam.status = fields.is_published ? 'published' : 'draft';
                }
                return this.getExamById(id, true);
            }
            return null;
        }
    }

    /**
     * Delete an exam
     */
    static async deleteExam(id) {
        try {
            const result = await query('DELETE FROM exams WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (dbErr) {
            const idx = memoryExams.findIndex(e => e.id === Number(id));
            if (idx !== -1) {
                memoryExams.splice(idx, 1);
                return true;
            }
            return false;
        }
    }

    /**
     * Find an exam by ID
     */
    static async getExamById(id, includeAnswers = false) {
        try {
            const rows = await query(`
                SELECT e.*, u.name AS creator_name, u.email AS creator_email
                FROM exams e
                JOIN users u ON e.created_by = u.id
                WHERE e.id = ?
            `, [id]);

            if (!rows || rows.length === 0) return null;
            const exam = rows[0];

            exam.is_published = Boolean(exam.is_published);
            exam.shuffle_questions = Boolean(exam.shuffle_questions);
            exam.allow_review = Boolean(exam.allow_review);
            exam.questions = await this.getExamQuestions(id, includeAnswers);
            exam.question_count = exam.questions.length;
            const sumPoints = exam.questions.reduce((acc, q) => acc + Number(q.points || 0), 0);
            if (sumPoints > 0) exam.total_marks = sumPoints;

            return exam;
        } catch (dbErr) {
            const exam = memoryExams.find(e => e.id === Number(id));
            if (!exam) return null;

            const creator = await UserModel.findById(exam.created_by);
            const questions = await this.getExamQuestions(id, includeAnswers);
            const sumPoints = questions.reduce((acc, q) => acc + Number(q.points || 0), 0);

            return {
                ...exam,
                creator_name: creator?.name || 'Instructor',
                creator_email: creator?.email || 'instructor@examify.org',
                is_published: Boolean(exam.is_published),
                shuffle_questions: Boolean(exam.shuffle_questions),
                allow_review: Boolean(exam.allow_review),
                questions,
                question_count: questions.length,
                total_marks: sumPoints > 0 ? sumPoints : exam.total_marks
            };
        }
    }

    /**
     * List exams with filtering
     */
    static async listExams({
        created_by = null,
        is_published = null,
        category = null,
        group_id = null,
        public_only = false,
        search = null,
        limit = 50,
        offset = 0
    } = {}) {
        try {
            let sql = `
                SELECT e.*, u.name AS creator_name,
                       (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) AS question_count,
                       (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = e.id) AS attempt_count
                FROM exams e
                JOIN users u ON e.created_by = u.id
                WHERE 1=1
            `;
            const params = [];

            if (created_by) {
                sql += ' AND e.created_by = ?';
                params.push(created_by);
            }

            if (public_only) {
                sql += ' AND e.group_id IS NULL';
            } else if (group_id !== null && group_id !== undefined) {
                sql += ' AND e.group_id = ?';
                params.push(Number(group_id));
            }

            if (is_published !== null && is_published !== undefined) {
                sql += ' AND e.is_published = ?';
                params.push(Boolean(is_published));
            }

            if (category) {
                sql += ' AND e.category = ?';
                params.push(category);
            }

            if (search) {
                sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.code LIKE ?)';
                const term = `%${search}%`;
                params.push(term, term, term);
            }

            sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
            params.push(Number(limit), Number(offset));

            const rows = await query(sql, params);
            return rows.map(r => ({
                ...r,
                is_published: Boolean(r.is_published),
                shuffle_questions: Boolean(r.shuffle_questions),
                allow_review: Boolean(r.allow_review)
            }));
        } catch (dbErr) {
            let list = [...memoryExams];

            if (created_by) {
                list = list.filter(e => e.created_by === Number(created_by));
            }
            if (public_only) {
                list = list.filter(e => !e.group_id);
            } else if (group_id !== null && group_id !== undefined) {
                list = list.filter(e => Number(e.group_id) === Number(group_id));
            }
            if (is_published !== null && is_published !== undefined) {
                list = list.filter(e => e.is_published === Boolean(is_published));
            }
            if (category) {
                list = list.filter(e => e.category?.toLowerCase() === category.toLowerCase());
            }
            if (search) {
                const s = search.toLowerCase();
                list = list.filter(e => 
                    e.title?.toLowerCase().includes(s) || 
                    e.description?.toLowerCase().includes(s) || 
                    e.code?.toLowerCase().includes(s)
                );
            }

            return list.map(e => {
                const qCount = memoryQuestions.filter(q => q.exam_id === e.id).length;
                const attCount = memoryAttempts.filter(a => a.exam_id === e.id).length;
                return {
                    ...e,
                    creator_name: 'Instructor',
                    question_count: qCount,
                    attempt_count: attCount
                };
            });
        }
    }

    /**
     * Get questions for an exam
     */
    static async getExamQuestions(examId, includeAnswers = false) {
        try {
            const questions = await query(`
                SELECT id, exam_id, question_text, question_type, points, explanation, order_index, created_at
                FROM questions
                WHERE exam_id = ?
                ORDER BY order_index ASC, id ASC
            `, [examId]);

            if (questions.length === 0) return [];

            const questionIds = questions.map(q => q.id);
            const options = await query(`
                SELECT id, question_id, option_text, is_correct, order_index
                FROM question_options
                WHERE question_id IN (${questionIds.map(() => '?').join(',')})
                ORDER BY order_index ASC, id ASC
            `, questionIds);

            const optionsByQuestion = {};
            for (const opt of options) {
                if (!optionsByQuestion[opt.question_id]) {
                    optionsByQuestion[opt.question_id] = [];
                }
                optionsByQuestion[opt.question_id].push({
                    id: opt.id,
                    question_id: opt.question_id,
                    option_text: opt.option_text,
                    order_index: opt.order_index,
                    ...(includeAnswers ? { is_correct: Boolean(opt.is_correct) } : {})
                });
            }

            return questions.map(q => ({
                ...q,
                points: Number(q.points),
                explanation: includeAnswers ? q.explanation : null,
                options: optionsByQuestion[q.id] || []
            }));
        } catch (dbErr) {
            const questions = memoryQuestions
                .filter(q => q.exam_id === Number(examId))
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

            return questions.map(q => {
                const options = memoryOptions
                    .filter(o => o.question_id === q.id)
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map(o => ({
                        id: o.id,
                        question_id: o.question_id,
                        option_text: o.option_text,
                        order_index: o.order_index,
                        ...(includeAnswers ? { is_correct: Boolean(o.is_correct) } : {})
                    }));

                return {
                    ...q,
                    points: Number(q.points),
                    explanation: includeAnswers ? q.explanation : null,
                    options
                };
            });
        }
    }

    /**
     * Add question with options
     */
    static async addQuestion(examId, {
        question_text,
        question_type = 'mcq',
        points = 1.00,
        explanation = null,
        order_index = 0,
        options = []
    }) {
        try {
            const pool = getPool();
            const connection = await pool.getConnection();

            try {
                await connection.beginTransaction();

                const [qResult] = await connection.query(`
                    INSERT INTO questions (exam_id, question_text, question_type, points, explanation, order_index)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [examId, question_text, question_type, points, explanation, order_index]);

                const questionId = qResult.insertId;

                if (options && options.length > 0) {
                    for (let i = 0; i < options.length; i++) {
                        const opt = options[i];
                        await connection.query(`
                            INSERT INTO question_options (question_id, option_text, is_correct, order_index)
                            VALUES (?, ?, ?, ?)
                        `, [
                            questionId,
                            opt.option_text,
                            Boolean(opt.is_correct),
                            opt.order_index !== undefined ? opt.order_index : i
                        ]);
                    }
                }

                await connection.commit();
                return questionId;
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (dbErr) {
            const questionId = nextQuestionId++;
            memoryQuestions.push({
                id: questionId,
                exam_id: Number(examId),
                question_text,
                question_type,
                points: Number(points),
                explanation,
                order_index,
                created_at: new Date()
            });

            if (options && options.length > 0) {
                for (let i = 0; i < options.length; i++) {
                    const opt = options[i];
                    memoryOptions.push({
                        id: nextOptionId++,
                        question_id: questionId,
                        option_text: opt.option_text,
                        is_correct: Boolean(opt.is_correct),
                        order_index: opt.order_index !== undefined ? opt.order_index : i
                    });
                }
            }

            return questionId;
        }
    }

    /**
     * Start an exam attempt
     */
    static async startAttempt(examId, userId) {
        try {
            const result = await query(`
                INSERT INTO exam_attempts (exam_id, user_id, status)
                VALUES (?, ?, 'in_progress')
            `, [examId, userId]);

            return result.insertId;
        } catch (dbErr) {
            const attemptId = nextAttemptId++;
            memoryAttempts.push({
                id: attemptId,
                exam_id: Number(examId),
                user_id: Number(userId),
                status: 'in_progress',
                score: '0.00',
                total_points: '0.00',
                percentage: '0.00',
                started_at: new Date(),
                created_at: new Date()
            });
            return attemptId;
        }
    }

    /**
     * Submit an exam attempt and record answers
     */
    static async submitAttempt(attemptId, {
        score,
        total_points,
        percentage,
        status = 'completed',
        answers = []
    }) {
        try {
            const pool = getPool();
            const connection = await pool.getConnection();

            try {
                await connection.beginTransaction();

                await connection.query(`
                    UPDATE exam_attempts
                    SET submitted_at = CURRENT_TIMESTAMP,
                        score = ?,
                        total_points = ?,
                        percentage = ?,
                        status = ?
                    WHERE id = ?
                `, [score, total_points, percentage, status, attemptId]);

                for (const ans of answers) {
                    await connection.query(`
                        INSERT INTO attempt_answers (attempt_id, question_id, selected_option_id, text_answer, is_correct, points_awarded)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        attemptId,
                        ans.question_id,
                        ans.selected_option_id || null,
                        ans.text_answer || null,
                        ans.is_correct !== undefined ? ans.is_correct : null,
                        ans.points_awarded || 0
                    ]);
                }

                await connection.commit();
                return true;
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (dbErr) {
            const attempt = memoryAttempts.find(a => a.id === Number(attemptId));
            if (attempt) {
                attempt.submitted_at = new Date();
                attempt.score = Number(score).toFixed(2);
                attempt.total_points = Number(total_points).toFixed(2);
                attempt.percentage = Number(percentage).toFixed(2);
                attempt.status = status;
            }

            for (const ans of answers) {
                memoryAnswers.push({
                    id: nextAnswerId++,
                    attempt_id: Number(attemptId),
                    question_id: ans.question_id,
                    selected_option_id: ans.selected_option_id || null,
                    text_answer: ans.text_answer || null,
                    is_correct: ans.is_correct !== undefined ? ans.is_correct : null,
                    points_awarded: ans.points_awarded || 0
                });
            }

            return true;
        }
    }

    /**
     * Get attempt by ID
     */
    static async getAttemptById(attemptId) {
        try {
            const rows = await query(`
                SELECT ea.*, e.title AS exam_title, e.code AS exam_code,
                       e.duration_minutes, e.pass_percentage, e.allow_review,
                       u.name AS student_name, u.email AS student_email
                FROM exam_attempts ea
                JOIN exams e ON ea.exam_id = e.id
                JOIN users u ON ea.user_id = u.id
                WHERE ea.id = ?
            `, [attemptId]);

            return rows.length > 0 ? rows[0] : null;
        } catch (dbErr) {
            const attempt = memoryAttempts.find(a => a.id === Number(attemptId));
            if (!attempt) return null;

            const exam = memoryExams.find(e => e.id === attempt.exam_id) || {};
            const student = await UserModel.findById(attempt.user_id);
            return {
                ...attempt,
                exam_title: exam.title || 'Exam',
                exam_code: exam.code || 'EXM',
                duration_minutes: exam.duration_minutes || 45,
                pass_percentage: exam.pass_percentage || 50,
                allow_review: Boolean(exam.allow_review),
                student_name: student?.name || 'Student Candidate',
                student_email: student?.email || 'student@examify.org'
            };
        }
    }

    /**
     * Get attempt detailed breakdown (questions, chosen answers, correct answers)
     */
    static async getAttemptDetails(attemptId, includeCorrectAnswers = true) {
        try {
            const attempt = await this.getAttemptById(attemptId);
            if (!attempt) return null;

            const answers = await query(`
                SELECT aa.*, q.question_text, q.question_type, q.points AS max_points, q.explanation
                FROM attempt_answers aa
                JOIN questions q ON aa.question_id = q.id
                WHERE aa.attempt_id = ?
                ORDER BY q.order_index ASC, q.id ASC
            `, [attemptId]);

            if (answers.length > 0) {
                const questionIds = answers.map(a => a.question_id);
                const options = await query(`
                    SELECT id, question_id, option_text, is_correct
                    FROM question_options
                    WHERE question_id IN (${questionIds.map(() => '?').join(',')})
                    ORDER BY order_index ASC
                `, questionIds);

                const optionsMap = {};
                for (const opt of options) {
                    if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
                    optionsMap[opt.question_id].push({
                        id: opt.id,
                        option_text: opt.option_text,
                        ...(includeCorrectAnswers ? { is_correct: Boolean(opt.is_correct) } : {})
                    });
                }

                attempt.answers = answers.map(a => ({
                    ...a,
                    is_correct: Boolean(a.is_correct),
                    options: optionsMap[a.question_id] || []
                }));
            } else {
                attempt.answers = [];
            }

            return attempt;
        } catch (dbErr) {
            const attempt = await this.getAttemptById(attemptId);
            if (!attempt) return null;

            const answers = memoryAnswers.filter(a => a.attempt_id === Number(attemptId));
            attempt.answers = answers.map(a => {
                const q = memoryQuestions.find(q => q.id === a.question_id) || {};
                const options = memoryOptions
                    .filter(o => o.question_id === a.question_id)
                    .map(o => ({
                        id: o.id,
                        option_text: o.option_text,
                        ...(includeCorrectAnswers ? { is_correct: Boolean(o.is_correct) } : {})
                    }));

                return {
                    ...a,
                    question_text: q.question_text || '',
                    question_type: q.question_type || 'mcq',
                    max_points: q.points || 1,
                    explanation: q.explanation || null,
                    is_correct: Boolean(a.is_correct),
                    options
                };
            });

            return attempt;
        }
    }

    /**
     * Get student attempts
     */
    static async getUserAttempts(userId) {
        try {
            return await query(`
                SELECT ea.*, e.title AS exam_title, e.code AS exam_code, e.category, e.pass_percentage
                FROM exam_attempts ea
                JOIN exams e ON ea.exam_id = e.id
                WHERE ea.user_id = ?
                ORDER BY ea.created_at DESC
            `, [userId]);
        } catch (dbErr) {
            const attempts = memoryAttempts.filter(a => a.user_id === Number(userId));
            return attempts.map(a => {
                const exam = memoryExams.find(e => e.id === a.exam_id) || {};
                return {
                    ...a,
                    exam_title: exam.title || 'Exam',
                    exam_code: exam.code || 'EXM',
                    category: exam.category || 'General',
                    pass_percentage: exam.pass_percentage || 50
                };
            });
        }
    }

    /**
     * Get submissions for an exam (Staff view)
     */
    static async getExamSubmissions(examId) {
        try {
            return await query(`
                SELECT ea.*, u.name AS student_name, u.email AS student_email, u.avatar_url
                FROM exam_attempts ea
                JOIN users u ON ea.user_id = u.id
                WHERE ea.exam_id = ?
                ORDER BY ea.submitted_at DESC, ea.created_at DESC
            `, [examId]);
        } catch (dbErr) {
            const attempts = memoryAttempts.filter(a => a.exam_id === Number(examId));
            const results = [];
            for (const a of attempts) {
                const student = await UserModel.findById(a.user_id);
                results.push({
                    ...a,
                    student_name: student?.name || 'Student Candidate',
                    student_email: student?.email || 'student@examify.org',
                    avatar_url: student?.avatar_url || null
                });
            }
            return results;
        }
    }

    /**
     * Get teacher dashboard analytics overview
     */
    static async getTeacherStats(teacherId) {
        try {
            const exams = await query(`
                SELECT 
                    COUNT(*) AS total_exams,
                    SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS active_exams
                FROM exams
                WHERE created_by = ?
            `, [teacherId]);

            const submissions = await query(`
                SELECT 
                    COUNT(ea.id) AS total_submissions,
                    AVG(ea.percentage) AS avg_score,
                    SUM(CASE WHEN ea.percentage >= e.pass_percentage THEN 1 ELSE 0 END) AS passed_count
                FROM exam_attempts ea
                JOIN exams e ON ea.exam_id = e.id
                WHERE e.created_by = ? AND ea.status = 'completed'
            `, [teacherId]);

            return {
                total_exams: Number(exams[0]?.total_exams || 0),
                active_exams: Number(exams[0]?.active_exams || 0),
                total_submissions: Number(submissions[0]?.total_submissions || 0),
                avg_score: Number(submissions[0]?.avg_score || 0).toFixed(1),
                pass_rate: submissions[0]?.total_submissions > 0
                    ? ((Number(submissions[0]?.passed_count || 0) / Number(submissions[0]?.total_submissions)) * 100).toFixed(1)
                    : 0
            };
        } catch (dbErr) {
            const myExams = memoryExams.filter(e => e.created_by === Number(teacherId));
            const myExamIds = myExams.map(e => e.id);
            const myAttempts = memoryAttempts.filter(a => myExamIds.includes(a.exam_id) && a.status === 'completed');

            const totalExams = myExams.length;
            const activeExams = myExams.filter(e => e.is_published).length;
            const totalSubmissions = myAttempts.length;
            const avgScore = totalSubmissions > 0
                ? (myAttempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) / totalSubmissions).toFixed(1)
                : '0.0';
            const passedCount = myAttempts.filter(a => {
                const exam = myExams.find(e => e.id === a.exam_id);
                return Number(a.percentage) >= (exam?.pass_percentage || 50);
            }).length;

            return {
                total_exams: totalExams,
                active_exams: activeExams,
                total_submissions: totalSubmissions,
                avg_score: avgScore,
                pass_rate: totalSubmissions > 0 ? ((passedCount / totalSubmissions) * 100).toFixed(1) : 0
            };
        }
    }

    static clearMemoryStore() {
        memoryExams.length = 0;
        memoryQuestions.length = 0;
        memoryOptions.length = 0;
        memoryAttempts.length = 0;
        memoryAnswers.length = 0;
        nextExamId = 1;
        nextQuestionId = 1;
        nextOptionId = 1;
        nextAttemptId = 1;
        nextAnswerId = 1;
    }
}

module.exports = ExamModel;
