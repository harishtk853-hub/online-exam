const RbacModel = require('../models/rbac.model');

class ExamPolicy {
    static async canCreateExam(currentUser, examData = null) {
        if (!currentUser) return false;
        // Admins and moderators can create exams
        if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
            return true;
        }
        // Teachers must be verified to create exams
        if (currentUser.role === 'teacher') {
            return Boolean(currentUser.is_verified_teacher || currentUser.is_verified);
        }
        return false;
    }

    static async canPublishExam(currentUser, exam) {
        if (!currentUser || !exam) return false;
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'teacher') {
            return Number(exam.created_by) === Number(currentUser.id);
        }
        return false;
    }

    static async canManageExam(currentUser, exam) {
        if (!currentUser || !exam) return false;
        if (currentUser.role === 'admin') return true;
        return Number(exam.created_by) === Number(currentUser.id);
    }

    static async canViewExam(currentUser, exam) {
        if (!exam) return false;
        if (exam.is_published) return true;
        if (!currentUser) return false;
        return this.canManageExam(currentUser, exam);
    }

    static async canViewSubmissions(currentUser, exam) {
        return this.canManageExam(currentUser, exam);
    }

    static async canViewAttempt(currentUser, attempt, exam) {
        if (!currentUser || !attempt) return false;
        if (Number(attempt.user_id) === Number(currentUser.id)) return true;
        if (exam && (await this.canManageExam(currentUser, exam))) return true;
        return currentUser.role === 'admin';
    }
}

module.exports = ExamPolicy;
