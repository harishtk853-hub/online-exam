const ExamService = require('../services/exam.service');
const ExamModel = require('../models/exam.model');
const ExamPolicy = require('../policies/exam.policy');
const { successResponse, errorResponse } = require('../utils/response');

class ExamController {
    /**
     * Create a new exam
     */
    static async createExam(req, res, next) {
        try {
            const canCreate = await ExamPolicy.canCreateExam(req.user, req.body);
            if (!canCreate) {
                if (req.user && req.user.role === 'teacher' && !req.user.is_verified_teacher && !req.user.is_verified) {
                    return errorResponse(res, 'Unverified teachers cannot create exams. Please complete teacher verification on your profile first.', 403);
                }
                return errorResponse(res, 'You do not have permission to create exams', 403);
            }

            const exam = await ExamService.createExam(req.body, req.user.id);
            return successResponse(res, exam, 'Exam created successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update an exam
     */
    static async updateExam(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const existingExam = await ExamModel.getExamById(examId, true);
            if (!existingExam) {
                return errorResponse(res, 'Exam not found', 404);
            }

            const canManage = await ExamPolicy.canManageExam(req.user, existingExam);
            if (!canManage) {
                return errorResponse(res, 'Forbidden: You cannot modify this exam', 403);
            }

            const updatedExam = await ExamService.updateExam(examId, req.body);
            return successResponse(res, updatedExam, 'Exam updated successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Delete an exam
     */
    static async deleteExam(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const existingExam = await ExamModel.getExamById(examId, true);
            if (!existingExam) {
                return errorResponse(res, 'Exam not found', 404);
            }

            const canManage = await ExamPolicy.canManageExam(req.user, existingExam);
            if (!canManage) {
                return errorResponse(res, 'Forbidden: You cannot delete this exam', 403);
            }

            await ExamService.deleteExam(examId);
            return successResponse(res, null, 'Exam deleted successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Toggle exam published status
     */
    static async togglePublish(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const existingExam = await ExamModel.getExamById(examId, true);
            if (!existingExam) {
                return errorResponse(res, 'Exam not found', 404);
            }

            const canPublish = await ExamPolicy.canPublishExam(req.user, existingExam);
            if (!canPublish) {
                return errorResponse(res, 'Forbidden: You cannot publish this exam', 403);
            }

            const newPublishState = !existingExam.is_published;
            const updated = await ExamService.updateExam(examId, {
                is_published: newPublishState,
                status: newPublishState ? 'published' : 'draft'
            });

            return successResponse(res, updated, `Exam ${newPublishState ? 'published' : 'unpublished'} successfully`);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get single exam details
     */
    static async getExamById(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const canManage = req.user ? await ExamPolicy.canManageExam(req.user, { created_by: null, id: examId }) : false;
            
            // Check ownership to decide whether to include answer keys
            const rawExam = await ExamModel.getExamById(examId, true);
            if (!rawExam) {
                return errorResponse(res, 'Exam not found', 404);
            }

            const isOwnerOrAdmin = req.user ? await ExamPolicy.canManageExam(req.user, rawExam) : false;

            if (!rawExam.is_published && !isOwnerOrAdmin) {
                return errorResponse(res, 'Exam is not publicly accessible', 403);
            }

            const exam = isOwnerOrAdmin
                ? rawExam
                : await ExamModel.getExamById(examId, false);

            return successResponse(res, exam, 'Exam retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * List exams (public or created by current teacher)
     */
    static async listExams(req, res, next) {
        try {
            const { category, search, mine, group_id, public_only, page = 1, limit = 50 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            const filters = {
                category,
                search,
                limit: Number(limit),
                offset
            };

            if (mine === 'true' && req.user) {
                filters.created_by = req.user.id;
            } else if (group_id) {
                filters.group_id = Number(group_id);
            } else {
                // By default in the Exams Catalog (public exploration), only show public exams (group_id IS NULL)
                filters.public_only = true;
                if (!req.user || req.user.role === 'student') {
                    filters.is_published = true;
                }
            }

            if (public_only === 'true') {
                filters.public_only = true;
            }

            const exams = await ExamService.listExams(filters);
            return successResponse(res, exams, 'Exams retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Add question to exam
     */
    static async addQuestion(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const existingExam = await ExamModel.getExamById(examId, true);
            if (!existingExam) {
                return errorResponse(res, 'Exam not found', 404);
            }

            const canManage = await ExamPolicy.canManageExam(req.user, existingExam);
            if (!canManage) {
                return errorResponse(res, 'Forbidden', 403);
            }

            const updatedExam = await ExamService.addQuestion(examId, req.body);
            return successResponse(res, updatedExam, 'Question added successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update question
     */
    static async updateQuestion(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const questionId = Number(req.params.questionId);
            const existingExam = await ExamModel.getExamById(examId, true);
            if (!existingExam) {
                return errorResponse(res, 'Exam not found', 404);
            }

            const canManage = await ExamPolicy.canManageExam(req.user, existingExam);
            if (!canManage) {
                return errorResponse(res, 'Forbidden', 403);
            }

            const updatedExam = await ExamService.updateQuestion(examId, questionId, req.body);
            return successResponse(res, updatedExam, 'Question updated successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Delete question
     */
    static async deleteQuestion(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const questionId = Number(req.params.questionId);
            const existingExam = await ExamModel.getExamById(examId, true);
            if (!existingExam) {
                return errorResponse(res, 'Exam not found', 404);
            }

            const canManage = await ExamPolicy.canManageExam(req.user, existingExam);
            if (!canManage) {
                return errorResponse(res, 'Forbidden', 403);
            }

            await ExamService.deleteQuestion(questionId);
            const updatedExam = await ExamModel.getExamById(examId, true);
            return successResponse(res, updatedExam, 'Question deleted successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Start exam attempt
     */
    static async startAttempt(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const result = await ExamService.startAttempt(examId, req.user.id);
            return successResponse(res, result, 'Exam started', 201);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Submit exam attempt
     */
    static async submitAttempt(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const { attemptId, answers } = req.body;
            if (!attemptId) {
                return errorResponse(res, 'attemptId is required', 400);
            }

            const result = await ExamService.submitAttempt(examId, attemptId, answers || [], req.user.id);
            return successResponse(res, result, 'Exam submitted and graded successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get attempt details / result
     */
    static async getAttemptDetails(req, res, next) {
        try {
            const attemptId = Number(req.params.attemptId);
            const attempt = await ExamModel.getAttemptDetails(attemptId, true);
            if (!attempt) {
                return errorResponse(res, 'Attempt not found', 404);
            }

            const exam = await ExamModel.getExamById(attempt.exam_id, true);
            const canView = await ExamPolicy.canViewAttempt(req.user, attempt, exam);
            if (!canView) {
                return errorResponse(res, 'Forbidden: Cannot view this attempt', 403);
            }

            return successResponse(res, attempt, 'Attempt retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get student's my-attempts list
     */
    static async getMyAttempts(req, res, next) {
        try {
            const attempts = await ExamModel.getUserAttempts(req.user.id);
            return successResponse(res, attempts, 'Attempts retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Staff view submissions for an exam
     */
    static async getExamSubmissions(req, res, next) {
        try {
            const examId = Number(req.params.id);
            const existingExam = await ExamModel.getExamById(examId, true);
            if (!existingExam) {
                return errorResponse(res, 'Exam not found', 404);
            }

            const canView = await ExamPolicy.canViewSubmissions(req.user, existingExam);
            if (!canView) {
                return errorResponse(res, 'Forbidden', 403);
            }

            const submissions = await ExamModel.getExamSubmissions(examId);
            return successResponse(res, { exam: existingExam, submissions }, 'Submissions retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Teacher dashboard statistics
     */
    static async getTeacherStats(req, res, next) {
        try {
            const isTeacher = await ExamPolicy.canCreateExam(req.user);
            if (!isTeacher) {
                return errorResponse(res, 'Teacher permissions required', 403);
            }

            const data = await ExamService.getTeacherDashboard(req.user.id);
            return successResponse(res, data, 'Teacher dashboard stats loaded');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ExamController;
