import api from './api';

export const examService = {
  // List exams (public or created by current user)
  async getExams(params = {}) {
    return await api.get('/exams', { params });
  },

  // Get single exam details
  async getExamById(id) {
    return await api.get(`/exams/${id}`);
  },

  // Create new exam
  async createExam(data) {
    return await api.post('/exams', data);
  },

  // Update exam
  async updateExam(id, data) {
    return await api.put(`/exams/${id}`, data);
  },

  // Delete exam
  async deleteExam(id) {
    return await api.delete(`/exams/${id}`);
  },

  // Toggle publish
  async togglePublish(id) {
    return await api.post(`/exams/${id}/publish`);
  },

  // Add question
  async addQuestion(examId, data) {
    return await api.post(`/exams/${examId}/questions`, data);
  },

  // Update question
  async updateQuestion(examId, questionId, data) {
    return await api.put(`/exams/${examId}/questions/${questionId}`, data);
  },

  // Delete question
  async deleteQuestion(examId, questionId) {
    return await api.delete(`/exams/${examId}/questions/${questionId}`);
  },

  // Start exam attempt
  async startAttempt(examId) {
    return await api.post(`/exams/${examId}/attempt/start`);
  },

  // Submit exam attempt
  async submitAttempt(examId, attemptId, answers) {
    return await api.post(`/exams/${examId}/attempt/submit`, {
      attemptId,
      answers
    });
  },

  // Get attempt result / details
  async getAttemptDetails(attemptId) {
    return await api.get(`/exams/attempts/${attemptId}`);
  },

  // Get student's my attempts
  async getMyAttempts() {
    return await api.get('/exams/my-attempts');
  },

  // Get teacher submissions for an exam
  async getExamSubmissions(examId) {
    return await api.get(`/exams/${examId}/submissions`);
  },

  // Get teacher dashboard stats
  async getTeacherStats() {
    return await api.get('/exams/teacher/stats');
  }
};

export default examService;
