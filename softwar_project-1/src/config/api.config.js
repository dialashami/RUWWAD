/**
 * API Configuration for Web Frontend
 * 
 * This centralized config ensures the frontend can connect to the backend
 * in both development and production environments.
 * 
 * Environment Variables:
 * - REACT_APP_API_BASE_URL: Override the default API URL (e.g., http://localhost:5000)
 * - NODE_ENV: Automatically set by Create React App (development, production, etc.)
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Get API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
  (isDevelopment ? 'http://localhost:5000' : window.location.origin);

export const API_CONFIG = {
  // Base URL for all API calls
  BASE_URL: API_BASE_URL,
  
  // API endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/login`,
    SIGNUP: `${API_BASE_URL}/api/signup`,
    VERIFY_EMAIL: `${API_BASE_URL}/api/verify-email`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    VERIFY_TOKEN: `${API_BASE_URL}/api/auth/verify-token`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  },
  
  USER: {
    PROFILE: `${API_BASE_URL}/api/users/profile`,
    USERS: `${API_BASE_URL}/api/users`,
    CHILDREN: `${API_BASE_URL}/api/users/children`,
    PREFERENCES: `${API_BASE_URL}/api/users/preferences`,
    TOGGLE_2FA: `${API_BASE_URL}/api/users/toggle-2fa`,
    ACCOUNT: `${API_BASE_URL}/api/users/account`,
  },
  
  STUDENT: {
    TYPE: `${API_BASE_URL}/api/studentType`,
    DASHBOARD: `${API_BASE_URL}/api/student/dashboard`,
  },
  
  TEACHER: {
    PROFILE: `${API_BASE_URL}/api/teacher/profile`,
    PREFERENCES: `${API_BASE_URL}/api/teacher/preferences`,
    DASHBOARD: `${API_BASE_URL}/api/teacher/dashboard`,
  },
  
  FEEDBACK: {
    BASE: `${API_BASE_URL}/api/feedback`,
    RANDOM: `${API_BASE_URL}/api/feedback/random`,
  },
  
  NOTIFICATIONS: {
    BASE: `${API_BASE_URL}/api/notifications`,
    UNREAD_COUNT: `${API_BASE_URL}/api/notifications/unread-count`,
  },
  
  COURSES: {
    BASE: `${API_BASE_URL}/api/courses`,
  },
  
  ASSIGNMENTS: {
    BASE: `${API_BASE_URL}/api/assignments`,
  },
};

// Helper function to build dynamic URLs
export const getApiUrl = (path) => {
  if (path.startsWith('http')) {
    return path; // Already a full URL
  }
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Log configuration in development
if (isDevelopment) {
  console.log('🔗 API Configuration:');
  console.log(`   Base URL: ${API_BASE_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
}

export default API_CONFIG;
