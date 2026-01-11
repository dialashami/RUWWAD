// API Configuration and Service for Web Frontend
// Connects to the RUWWAD backend server

import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================

// Backend API URL - change this based on your environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('🔗 Web API connecting to:', API_BASE_URL);

// ============================================
// Axios Instance with Interceptors
// ============================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      // Optionally redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================

export const authAPI = {
  login: (email, password) => api.post('/api/login', { email, password }),
  signup: (userData) => api.post('/api/signup', userData),
  verifyEmail: (email, code) => api.post('/api/verify-email', { email, code }),
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  verifyToken: () => api.get('/api/auth/verify-token'),
  refreshToken: () => api.post('/api/auth/refresh-token'),
  changePassword: (data) => api.post('/api/auth/change-password', data),
};

// ============================================
// User API
// ============================================

export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  getUsers: () => api.get('/api/users'),
  getUserById: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
  updatePreferences: (data) => api.put('/api/users/preferences', data),
  changePassword: (data) => api.put('/api/users/change-password', data),
  toggle2FA: (data) => api.put('/api/users/toggle-2fa', data),
  deleteAccount: () => api.delete('/api/users/account'),
};

// ============================================
// Course API
// ============================================

export const courseAPI = {
  getCourses: () => api.get('/api/courses'),
  getCourseById: (id) => api.get(`/api/courses/${id}`),
  createCourse: (data) => api.post('/api/courses', data),
  updateCourse: (id, data) => api.put(`/api/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/api/courses/${id}`),
  getMyCourses: () => api.get('/api/courses/my-courses'),
  enrollCourse: (id) => api.post(`/api/courses/${id}/enroll`),
  getLessons: (courseId) => api.get(`/api/courses/${courseId}/lessons`),
  createLesson: (courseId, data) => api.post(`/api/courses/${courseId}/lessons`, data),
  updateLesson: (courseId, lessonId, data) => api.put(`/api/courses/${courseId}/lessons/${lessonId}`, data),
  deleteLesson: (courseId, lessonId) => api.delete(`/api/courses/${courseId}/lessons/${lessonId}`),
};

// ============================================
// Assignment API
// ============================================

export const assignmentAPI = {
  getAssignments: () => api.get('/api/assignments'),
  getAssignmentById: (id) => api.get(`/api/assignments/${id}`),
  createAssignment: (data) => api.post('/api/assignments', data),
  updateAssignment: (id, data) => api.put(`/api/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/api/assignments/${id}`),
  submitAssignment: (id, data) => api.post(`/api/assignments/${id}/submit`, data),
  gradeAssignment: (id, submissionId, data) => api.post(`/api/assignments/${id}/submissions/${submissionId}/grade`, data),
  getSubmissions: (id) => api.get(`/api/assignments/${id}/submissions`),
  getMyAssignments: () => api.get('/api/assignments/my-assignments'),
};

// ============================================
// Message API
// ============================================

export const messageAPI = {
  getConversations: () => api.get('/api/messages/conversations'),
  getMessages: (conversationId) => api.get(`/api/messages/${conversationId}`),
  sendMessage: (conversationId, data) => api.post(`/api/messages/${conversationId}`, data),
  startConversation: (data) => api.post('/api/messages/start', data),
  markAsRead: (conversationId) => api.put(`/api/messages/${conversationId}/read`),
  deleteMessage: (conversationId, messageId) => api.delete(`/api/messages/${conversationId}/${messageId}`),
};

// ============================================
// Notification API
// ============================================

export const notificationAPI = {
  getNotifications: () => api.get('/api/notifications'),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

// ============================================
// Feedback API
// ============================================

export const feedbackAPI = {
  submitFeedback: (data) => api.post('/api/feedback', data),
  getFeedback: () => api.get('/api/feedback'),
  getFeedbackById: (id) => api.get(`/api/feedback/${id}`),
  respondToFeedback: (id, data) => api.put(`/api/feedback/${id}/respond`, data),
};

// ============================================
// Dashboard APIs
// ============================================

export const teacherDashboardAPI = {
  getStats: () => api.get('/api/teacher/dashboard/stats'),
  getSchedule: () => api.get('/api/teacher/dashboard/schedule'),
  getRecentActivity: () => api.get('/api/teacher/dashboard/activity'),
  getStudentProgress: () => api.get('/api/teacher/dashboard/student-progress'),
};

export const studentDashboardAPI = {
  getStats: () => api.get('/api/student/dashboard/stats'),
  getSchedule: () => api.get('/api/student/dashboard/schedule'),
  getRecentActivity: () => api.get('/api/student/dashboard/activity'),
  getProgress: () => api.get('/api/student/dashboard/progress'),
};

export const parentDashboardAPI = {
  getChildren: () => api.get('/api/parent/dashboard/children'),
  getChildProgress: (childId) => api.get(`/api/parent/dashboard/children/${childId}/progress`),
  getChildSchedule: (childId) => api.get(`/api/parent/dashboard/children/${childId}/schedule`),
};

export const adminDashboardAPI = {
  getStats: () => api.get('/api/admin/dashboard/stats'),
  getUsers: () => api.get('/api/admin/users'),
  updateUserStatus: (id, data) => api.put(`/api/admin/users/${id}/status`, data),
  getSystemHealth: () => api.get('/api/admin/system-health'),
};

// ============================================
// AI Chat API
// ============================================

export const aiAPI = {
  sendMessage: (question) => api.post('/api/chat', { question }),
};

// ============================================
// System Settings API (Admin)
// ============================================

export const systemSettingsAPI = {
  getSettings: () => api.get('/api/system-settings'),
  updateSettings: (data) => api.put('/api/system-settings', data),
};

// ============================================
// Zoom API
// ============================================

export const zoomAPI = {
  createMeeting: (data) => api.post('/api/zoom/create-meeting', data),
};

// Export the base axios instance as default
export default api;

// Export the API_BASE_URL for components that need it
export { API_BASE_URL };
