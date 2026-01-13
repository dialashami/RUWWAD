import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';

// Base URL is now configured in src/config/api.config.js
// Update LOCAL_IP in that file when your network IP changes
// Set ENVIRONMENT to 'local' or 'tunnel' as needed

console.log('🔗 API connecting to:', API_CONFIG.BASE_URL);

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
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
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  verifyToken: () => api.get('/api/auth/verify-token'),
  refreshToken: () => api.post('/api/auth/refresh-token'),
  changePassword: (data) => api.post('/api/auth/change-password', data),
};

// ========= User API =========
export const userAPI = {
  getProfile: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('No token found for getProfile');
      return { data: null };
    }
    return api.get('/api/users/profile');
  },
  updateProfile: (data) => api.put('/api/users/profile', data),
  getUsers: () => api.get('/api/users'),
  getUserById: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
  // Preferences
  updatePreferences: (data) => api.put('/api/users/preferences', data),
  // Password
  changePassword: (data) => api.put('/api/users/change-password', data),
  // Two-Factor Authentication
  toggle2FA: (data) => api.put('/api/users/toggle-2fa', data),
  // Account deletion
  deleteAccount: () => api.delete('/api/users/account'),
};

// ========= Course API =========
export const courseAPI = {
  getCourses: () => api.get('/api/courses'),
  getCourse: (id) => api.get(`/api/courses/${id}`),
  getCourseWithProgress: (id, studentId) => {
    const url = studentId 
      ? `/api/courses/${id}/progress?studentId=${studentId}`
      : `/api/courses/${id}/progress`;
    return api.get(url);
  },
  createCourse: (data) => api.post('/api/courses', data),
  updateCourse: (id, data) => api.put(`/api/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/api/courses/${id}`),
  getMyCourses: () => api.get('/api/courses/my-courses'),
  enrollCourse: (id, studentId) => api.post(`/api/courses/${id}/enroll`, { studentId }),
  unenrollCourse: (id, studentId) => api.post(`/api/courses/${id}/unenroll`, { studentId }),
  markVideoWatched: (id, data) => api.post(`/api/courses/${id}/watch-video`, data),
};

// ========= Chapter API =========
export const chapterAPI = {
  // Get all chapters for a course
  getChaptersByCourse: (courseId, studentId) => {
    const url = studentId
      ? `/api/chapters/course/${courseId}?studentId=${studentId}`
      : `/api/chapters/course/${courseId}`;
    return api.get(url);
  },
  // Get single chapter
  getChapter: (chapterId) => api.get(`/api/chapters/${chapterId}`),
  // Create chapter (teacher only)
  createChapter: (courseId, data) => api.post(`/api/chapters/course/${courseId}`, data),
  // Update chapter (teacher only)
  updateChapter: (chapterId, data) => api.put(`/api/chapters/${chapterId}`, data),
  // Add slides to chapter (teacher only)
  addSlides: (chapterId, data) => api.post(`/api/chapters/${chapterId}/slides`, data),
  // Add lectures to chapter (teacher only)
  addLectures: (chapterId, data) => api.post(`/api/chapters/${chapterId}/lectures`, data),
  // Mark slides as viewed (student)
  markSlidesViewed: (chapterId, studentId) => 
    api.post(`/api/chapters/${chapterId}/slides/viewed`, { studentId }),
  // Mark lecture as watched (student)
  markLectureWatched: (chapterId, studentId, lectureUrl) => 
    api.post(`/api/chapters/${chapterId}/lectures/watched`, { studentId, lectureUrl }),
  // Delete chapter (teacher only)
  deleteChapter: (chapterId) => api.delete(`/api/chapters/${chapterId}`),
};

// ========= Quiz API =========
export const quizAPI = {
  // Generate quiz for a chapter (teacher only)
  generateQuiz: (chapterId) => api.post(`/api/quiz/generate/${chapterId}`),
  // Regenerate quiz with new questions (teacher only)
  regenerateQuiz: (chapterId) => api.post(`/api/quiz/regenerate/${chapterId}`),
  // Start a quiz attempt (student)
  startQuiz: (chapterId, studentId) => 
    api.post(`/api/quiz/start/${chapterId}`, { studentId }),
  // Submit quiz answers (student)
  submitQuiz: (attemptId, studentId, answers) => 
    api.post(`/api/quiz/submit/${attemptId}`, { studentId, answers }),
  // Get quiz results for a chapter (student)
  getQuizResults: (chapterId) => api.get(`/api/quiz/results/${chapterId}`),
};

// ========= Assignment API =========
export const assignmentAPI = {
  getAssignments: () => api.get('/api/assignments'),
  getMyAssignments: () => api.get('/api/assignments'), // Same endpoint, backend filters by user
  getTeacherAssignments: () => api.get('/api/assignments'), // Teacher's assignments
  getAssignment: (id) => api.get(`/api/assignments/${id}`),
  createAssignment: (data) => api.post('/api/assignments', data),
  updateAssignment: (id, data) => api.put(`/api/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/api/assignments/${id}`),
  submitAssignment: (id, data) => api.post(`/api/assignments/${id}/submit`, data),
  gradeAssignment: (id, data) => api.post(`/api/assignments/${id}/grade`, data),
};

// ========= Message API =========
export const messageAPI = {
  getConversations: async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      console.log('No userId found for getConversations');
      return { data: [] };
    }
    return api.get(`/api/messages/conversations/${userId}`);
  },
  getMessages: async (partnerId) => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      console.log('No userId found for getMessages');
      return { data: [] };
    }
    return api.get(`/api/messages/conversation/${userId}/${partnerId}`);
  },
  sendMessage: (recipientId, content) => 
    api.post('/api/messages', { receiver: recipientId, content }),
  markAsRead: (messageId) => api.patch(`/api/messages/${messageId}/read`),
  markConversationAsRead: async (partnerId) => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return { data: null };
    return api.put(`/api/messages/read/${userId}/${partnerId}`);
  },
};

// ========= Notification API =========
export const notificationAPI = {
  getNotifications: async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      console.log('No userId found for getNotifications');
      return { data: [] };
    }
    return api.get(`/api/notifications/user/${userId}`);
  },
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return { data: null };
    return api.patch(`/api/notifications/user/${userId}/read-all`);
  },
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  sendNotification: (data) => api.post('/api/notifications', data),
  sendAssignmentReminder: (customMessage) => api.post('/api/notifications/assignment-reminder', { customMessage }),
  getAdminNotifications: () => api.get('/api/notifications/admin'),
  getSentNotifications: () => api.get('/api/notifications/sent'),
  // Bulk email for Communication Center
  sendBulkEmail: (data) => api.post('/api/notifications/bulk-email', data),
};

// ========= Feedback API =========
export const feedbackAPI = {
  createFeedback: (data) => api.post('/api/feedback', data),
  getFeedback: () => api.get('/api/feedback'),
  getMyFeedback: () => api.get('/api/feedback/mine'),
  getRandomFeedback: (limit = 3) => api.get(`/api/feedback/random?limit=${limit}`),
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
};

export const parentDashboardAPI = {
  getDashboard: () => api.get('/api/parent/dashboard'),
  // Use /api/users/children endpoints for parent-child management
  getChildren: () => api.get('/api/users/children'),
  addChild: (childEmail) => api.post('/api/users/children', { childEmail }),
  removeChild: (childId) => api.delete(`/api/users/children/${childId}`),
  getChildProgress: (childId) => api.get(`/api/users/children/${childId}/dashboard`),
};

export const adminDashboardAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getUsers: () => api.get('/api/admin/users'),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/api/admin/users/${id}/status`, { status }),
  getReports: () => api.get('/api/admin/reports'),
  sendNotification: (data) => api.post('/api/admin/notifications', data),
};

// ========= AI Conversation API =========
// export const aiAPI = {
//   // Create a new conversation and send message
//   sendMessage: async (message, conversationId) => {
//     if (conversationId) {
//       // Add message to existing conversation - backend expects { type, text }
//       return api.post(`/api/ai-conversations/${conversationId}/messages`, { type: 'user', text: message });
//     } else {
//       // Create new conversation
//       const res = await api.post('/api/ai-conversations', { title: 'New Chat' });
//       const newConvId = res.data._id;
//       // Then add the message - backend expects { type, text }
//       return api.post(`/api/ai-conversations/${newConvId}/messages`, { type: 'user', text: message });
//     }
//   },
//   getConversations: () => api.get('/api/ai-conversations'),
//   getConversation: (id) => api.get(`/api/ai-conversations/${id}`),
//   deleteConversation: (id) => api.delete(`/api/ai-conversations/${id}`),
// };

// // ========= AI Conversation API =========
// export const aiAPI = {
//   // Send a message (create conversation if needed) and RETURN { conversationId, message }
//   sendMessage: async (message, conversationId) => {
//     let convId = conversationId;

//     // 1) Create conversation if doesn't exist
//     if (!convId) {
//       const res = await api.post('/api/ai-conversations', { title: 'New Chat' });
//       convId = res.data?._id || res.data?.id; // دعم لأي شكل
//     }

//     // 2) Add message to conversation
//     const msgRes = await api.post(`/api/ai-conversations/${convId}/messages`, {
//       type: 'user',
//       text: message,
//     });

//     // بعض الباكندات بترجع { message: {..} } أو بترجع الرسالة مباشرة
//     const returnedMessage = msgRes.data?.message || msgRes.data;

//     return {
//       conversationId: convId,
//       message: returnedMessage,
//     };
//   },

//   getConversations: () => api.get('/api/ai-conversations'),
//   getConversation: (id) => api.get(`/api/ai-conversations/${id}`),
//   deleteConversation: (id) => api.delete(`/api/ai-conversations/${id}`),
// };




// ========= AI Conversation API =========
// export const aiAPI = {
//   // Send a message (create conversation if needed)
//   sendMessage: async (message, conversationId) => {
//     if (conversationId) {
//       // Add message to existing conversation
//       const response = await api.post(`/ai/conversations/${conversationId}/messages`, {
//         type: 'user',
//         text: message
//       });
//       return response.data;
//     } else {
//       // Create new conversation with first message
//       const response = await api.post('/ai/conversations', {
//         messages: [{ type: 'user', text: message }],
//         title: message.substring(0, 30) + '...',
//         preview: message.length > 50 ? message.substring(0, 50) + '...' : message
//       });
//       return response.data;
//     }
//   },

//   // Get conversation details
//   getConversation: (id) => api.get(`/ai/conversations/${id}`),
  
//   // Get all conversations
//   getConversations: () => api.get('/ai/conversations'),
  
//   // Delete conversation
//   deleteConversation: (id) => api.delete(`/ai/conversations/${id}`),
  
//   // Update conversation (optional)
//   updateConversation: (id, data) => api.put(`/ai/conversations/${id}`, data),
// };


// export const aiAPI = {
//   sendMessage: async (message, conversationId) => {
//     if (conversationId) {
//       const response = await api.post(`/api/ai-conversations/${conversationId}/messages`, {
//         type: 'user',
//         text: message
//       });
//       return response.data;
//     } else {
//       const response = await api.post('/api/ai-conversations', {
//         messages: [{ type: 'user', text: message }],
//         title: message.substring(0, 30) + '...',
//         preview: message.length > 50 ? message.substring(0, 50) + '...' : message
//       });
//       return response.data;
//     }
//   },

//   getConversation: (id) => api.get(`/api/ai-conversations/${id}`),
//   getConversations: () => api.get('/api/ai-conversations'),
//   deleteConversation: (id) => api.delete(`/api/ai-conversations/${id}`),
// };


 export const aiAPI = {
  sendMessage: async (message, conversationId) => {
    let convId = conversationId;

    // 1) create if needed
    if (!convId) {
      const createRes = await api.post('/api/ai-conversations', {
        title: 'New Chat',
        preview: message.length > 50 ? message.substring(0, 50) + '...' : message,
        messages: [],
      });

      convId = createRes.data?._id || createRes.data?.id;
    }

    // 2) add message (this generates AI reply in your backend)
    const msgRes = await api.post(`/api/ai-conversations/${convId}/messages`, {
      type: 'user',
      text: message,
    });

    return msgRes.data; // { conversationId, message, conversation }
  },

  getConversation: (id) => api.get(`/api/ai-conversations/${id}`),
  getConversations: () => api.get('/api/ai-conversations'),
  deleteConversation: (id) => api.delete(`/api/ai-conversations/${id}`),
};


// ========= System Settings API (Admin) =========
export const systemSettingsAPI = {
  getSettings: () => api.get('/api/system-settings'),
  updateSettings: (data) => api.put('/api/system-settings', data),
};

// ========= Zoom API =========
export const zoomAPI = {
  createMeeting: (data) => api.post('/api/zoom/create-meeting', data),
};

// Export the base axios instance as default
export default api;

// Export the API_BASE_URL for components that need it
export { API_CONFIG };
