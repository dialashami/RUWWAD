import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API - change this to your backend URL
// For Android Emulator use: 'http://10.0.2.2:3000'
// For iOS Simulator use: 'http://localhost:3000'
// For physical device on same WiFi, use your computer's local IP
const API_BASE_URL = 'http://192.168.1.158:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ========= Auth API =========
export const authAPI = {
  login: (email, password) => api.post('/api/login', { email, password }),
  signup: (userData) => api.post('/api/signup', userData),
  verifyEmail: (email, code) => api.post('/api/verify-email', { email, code }),
  forgotPassword: (email) => api.post('/api/forgot-password', { email }),
  resetPassword: (email, code, newPassword) => 
    api.post('/api/reset-password', { email, code, newPassword }),
};

// ========= User API =========
export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  getUsers: () => api.get('/api/users'),
  getUserById: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};

// ========= Course API =========
export const courseAPI = {
  getCourses: () => api.get('/api/courses'),
  getCourse: (id) => api.get(`/api/courses/${id}`),
  createCourse: (data) => api.post('/api/courses', data),
  updateCourse: (id, data) => api.put(`/api/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/api/courses/${id}`),
  getMyCourses: () => api.get('/api/courses/my-courses'),
  enrollCourse: (id) => api.post(`/api/courses/${id}/enroll`),
};

// ========= Assignment API =========
export const assignmentAPI = {
  getAssignments: () => api.get('/api/assignments'),
  getAssignment: (id) => api.get(`/api/assignments/${id}`),
  createAssignment: (data) => api.post('/api/assignments', data),
  updateAssignment: (id, data) => api.put(`/api/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/api/assignments/${id}`),
  submitAssignment: (id, data) => api.post(`/api/assignments/${id}/submit`, data),
  gradeAssignment: (id, data) => api.post(`/api/assignments/${id}/grade`, data),
};

// ========= Message API =========
export const messageAPI = {
  getConversations: () => api.get('/api/messages/conversations'),
  getMessages: (recipientId) => api.get(`/api/messages/${recipientId}`),
  sendMessage: (recipientId, content) => 
    api.post('/api/messages', { recipientId, content }),
  markAsRead: (messageId) => api.put(`/api/messages/${messageId}/read`),
};

// ========= Notification API =========
export const notificationAPI = {
  getNotifications: () => api.get('/api/notifications'),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  sendNotification: (data) => api.post('/api/notifications', data),
};

// ========= Feedback API =========
export const feedbackAPI = {
  submitFeedback: (data) => api.post('/api/feedback', data),
  getFeedback: () => api.get('/api/feedback'),
};

// ========= Dashboard APIs =========
export const studentDashboardAPI = {
  getDashboard: () => api.get('/api/student/dashboard'),
  getProgress: () => api.get('/api/student/progress'),
  getLessons: () => api.get('/api/student/lessons'),
  getAssignments: () => api.get('/api/student/assignments'),
};

export const teacherDashboardAPI = {
  getDashboard: () => api.get('/api/teacher/dashboard'),
  getStudents: () => api.get('/api/teacher/students'),
  getCourses: () => api.get('/api/teacher/courses'),
  getAnalytics: () => api.get('/api/teacher/analytics'),
};

export const parentDashboardAPI = {
  getDashboard: () => api.get('/api/parent/dashboard'),
  getChildren: () => api.get('/api/parent/children'),
  getChildProgress: (childId) => api.get(`/api/parent/children/${childId}/progress`),
};

export const adminDashboardAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getStats: () => api.get('/api/admin/stats'),
  getRecentUsers: () => api.get('/api/admin/recent-users'),
  getSystemAlerts: () => api.get('/api/admin/alerts'),
};

// ========= AI Conversation API =========
export const aiAPI = {
  sendMessage: (message, conversationId) => 
    api.post('/api/ai/chat', { message, conversationId }),
  getConversations: () => api.get('/api/ai/conversations'),
  getConversation: (id) => api.get(`/api/ai/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/api/ai/conversations/${id}`),
};

// ========= System Settings API (Admin) =========
export const systemSettingsAPI = {
  getSettings: () => api.get('/api/system-settings'),
  updateSettings: (data) => api.put('/api/system-settings', data),
};

export default api;
