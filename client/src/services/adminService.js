import api from './api';

export const adminService = {
  // Get aggregated admin stats & metrics
  async getStats() {
    return await api.get('/admin/stats');
  },

  // List users with search/role/verification filter
  async listUsers(params = {}) {
    return await api.get('/admin/users', { params });
  },

  // Verify / unverify / reject a teacher with optional notes
  async setTeacherVerification(userId, options) {
    const payload = typeof options === 'boolean'
      ? { is_verified_teacher: options }
      : options;
    return await api.patch(`/admin/users/${userId}/verification`, payload);
  },

  // Get teacher ID card file or stream URL
  getTeacherIdCardUrl(userId) {
    const baseURL = (api.defaults?.baseURL || '/api').replace(/\/$/, '');
    return `${baseURL}/admin/teachers/${userId}/id-card`;
  },

  // Update user status (active / suspended)
  async setUserStatus(userId, status) {
    return await api.patch(`/admin/users/${userId}/status`, { status });
  },

  // Update user role
  async setUserRole(userId, role) {
    return await api.patch(`/admin/users/${userId}/role`, { role });
  }
};

export default adminService;
