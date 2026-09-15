const ExamModel = require('../models/exam.model');
const { AppError } = require('../middleware/errorHandler');

class ExamService {
    /**
     * Create a new exam
     */
    static async createExam(examData, userId) {
        const exam = await ExamModel.createExam({
            ...examData,
            created_by: userId
        });
        return exam;
    }

    /**
     * Update an exam
     */
    static async updateExam(examId, examData) {
        return ExamModel.updateExam(examId, examData);
    }

    /**
     * Delete an exam
     */
    static async deleteExam(examId) {
        return ExamModel.deleteExam(examId);
    }

    /**
     * Get exam by ID
     */
    static async getExamById(examId, includeAnswers = false) {
        const exam = await ExamModel.getExamById(examId, includeAnswers);
        if (!exam) {
            throw new AppError('Exam not found', 404);
        }
        return exam;
    }

    /**
     * List exams
     */
    static async listExams(filters = {}) {
        return ExamModel.listExams(filters);
    }

    /**
     * Add question to an exam
     */
    static async addQuestion(examId, questionData) {
        const exam = await ExamModel.getExamById(examId);
        if (!exam) {
            throw new AppError('Exam not found', 404);
        }

        // Validate MCQ has at least one correct option
        if (['mcq', 'true_false'].includes(questionData.question_type) && questionData.options) {
            const hasCorrect = questionData.options.some(opt => Boolean(opt.is_correct));
            if (!hasCorrect && questionData.options.length > 0) {
                // Default first option as correct if none selected
                questionData.options[0].is_correct = true;
            }
        }

        const questionId = await ExamModel.addQuestion(examId, questionData);
        return ExamModel.getExamById(examId, true);
    }

    /**
     * Update a question
     */
    static async updateQuestion(examId, questionId, questionData) {
        await ExamModel.updateQuestion(questionId, questionData);
        return ExamModel.getExamById(examId, true);
    }

    /**
     * Delete a question
     */
    static async deleteQuestion(questionId) {
        return ExamModel.deleteQuestion(questionId);
    }

    /**
     * Start exam attempt for a student
     */
    static async startAttempt(examId, userId) {
        const exam = await ExamModel.getExamById(examId, false);
        if (!exam) {
            throw new AppError('Exam not found', 404);
        }
        if (!exam.is_published) {
            throw new AppError('This exam is not yet published', 400);
        }
        if (!exam.questions || exam.questions.length === 0) {
            throw new AppError('This exam does not have any questions yet', 400);
        }

        const attemptId = await ExamModel.startAttempt(examId, userId);
        return {
            attemptId,
            exam
        };
    }

    /**
     * Submit and auto-grade student attempt
     */
    static async submitAttempt(examId, attemptId, studentAnswers, userId) {
        // Retrieve full exam with answer keys for evaluation
        const exam = await ExamModel.getExamById(examId, true);
        if (!exam) {
            throw new AppError('Exam not found', 404);
        }

        const questions = exam.questions || [];
        let totalScore = 0;
        let totalMaxPoints = 0;
        const evaluatedAnswers = [];

        const answersMap = {};
        for (const ans of studentAnswers) {
            answersMap[ans.question_id] = ans;
        }

        for (const question of questions) {
            const maxPoints = Number(question.points || 1);
            totalMaxPoints += maxPoints;

            const studentAns = answersMap[question.id];
            let isCorrect = false;
            let awardedPoints = 0;
            let selectedOptionId = studentAns ? studentAns.selected_option_id : null;
            let textAnswer = studentAns ? studentAns.text_answer : null;

            if (['mcq', 'true_false'].includes(question.question_type)) {
                if (selectedOptionId) {
                    const matchedOption = question.options.find(
                        opt => Number(opt.id) === Number(selectedOptionId)
                    );
                    if (matchedOption && Boolean(matchedOption.is_correct)) {
                        isCorrect = true;
                        awardedPoints = maxPoints;
                    }
                }
            } else if (question.question_type === 'short_answer') {
                if (textAnswer && question.options && question.options.length > 0) {
                    // Check if text matches any correct answer option
                    const cleanAnswer = textAnswer.trim().toLowerCase();
                    const matched = question.options.some(
                        opt => Boolean(opt.is_correct) && opt.option_text.trim().toLowerCase() === cleanAnswer
                    );
                    if (matched) {
                        isCorrect = true;
                        awardedPoints = maxPoints;
                    }
                }
            }

            totalScore += awardedPoints;

            evaluatedAnswers.push({
                question_id: question.id,
                selected_option_id: selectedOptionId,
                text_answer: textAnswer,
                is_correct: isCorrect,
                points_awarded: awardedPoints
            });
        }

        const percentage = totalMaxPoints > 0 ? (totalScore / totalMaxPoints) * 100 : 0;

        await ExamModel.submitAttempt(attemptId, {
            score: totalScore,
            total_points: totalMaxPoints,
            percentage: Number(percentage.toFixed(2)),
            status: 'completed',
            answers: evaluatedAnswers
        });

        const attemptSummary = await ExamModel.getAttemptDetails(attemptId, exam.allow_review);
        return attemptSummary;
    }

    /**
     * Get teacher dashboard stats
     */
    static async getTeacherDashboard(teacherId) {
        const stats = await ExamModel.getTeacherStats(teacherId);
        const myExams = await ExamModel.listExams({ created_by: teacherId, limit: 10 });
        return {
            stats,
            recentExams: myExams
        };
    }
}

module.exports = ExamService;
