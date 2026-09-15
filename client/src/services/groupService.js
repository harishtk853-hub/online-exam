import api from './api';

export const groupService = {
  // Get list of groups
  async getGroups(params = {}) {
    return await api.get('/groups', { params });
  },

  // Get single group details with members
  async getGroupById(id) {
    return await api.get(`/groups/${id}`);
  },

  // Create a new group (returns unique join code)
  async createGroup(data) {
    return await api.post('/groups', data);
  },

  // Join group by entering a shareable code
  async joinGroupByCode(code) {
    return await api.post('/groups/join', { code });
  },

  // Leave group
  async leaveGroup(id) {
    return await api.post(`/groups/${id}/leave`);
  },

  // Group Exams
  async getGroupExams(groupId) {
    return await api.get(`/groups/${groupId}/exams`);
  },

  // Group Messages / Discussion Chat
  async getGroupMessages(groupId) {
    return await api.get(`/groups/${groupId}/messages`);
  },

  async sendGroupMessage(groupId, message) {
    return await api.post(`/groups/${groupId}/messages`, { message });
  },

  async deleteGroupMessage(groupId, messageId) {
    return await api.delete(`/groups/${groupId}/messages/${messageId}`);
  },

  // Schools
  async getSchools() {
    return await api.get('/groups/schools');
  },

  async createSchool(data) {
    return await api.post('/groups/schools', data);
  }
};

export default groupService;
