// API Configuration
// This file centralizes all API configuration settings
// IP is now AUTO-DETECTED from Expo - no manual configuration needed!

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================
// CONFIGURATION
// ============================================

// Backend server port
const PORT = 5000;

// Localtunnel URL (if using tunnel for external access)
const TUNNEL_URL = 'https://olive-coats-report.loca.lt';

// Production API URL (update this when you deploy your backend)
const PRODUCTION_URL = 'https://your-production-api.com';

// ============================================
// Environment Detection
// ============================================

// Set to 'local' for local development, 'tunnel' for localtunnel access, 'production' for deployed backend
// 'local' - Auto-detects your computer's IP from Expo (works when phone/emulator is on same WiFi)
// 'tunnel' - Uses localtunnel URL (works from anywhere but may be slower)
// 'production' - Uses production URL
const ENVIRONMENT = 'local'; // Change to 'tunnel' or 'production' as needed

// ============================================
// Auto-detect IP from Expo
// ============================================

const getExpoHostIP = () => {
  try {
    // Method 1: Get from debuggerHost (most reliable in Expo Go)
    // Works on both Expo Go and Eas/Prebuild
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip.trim()) {
        console.log('✅ Auto-detected IP from Expo debuggerHost:', ip);
        return ip;
      }
    }

    // Method 2: Try manifest2 for newer Expo versions (SDK 51+)
    const manifest2Host = Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (manifest2Host) {
      const ip = manifest2Host.split(':')[0];
      if (ip && ip !== 'localhost' && ip.trim()) {
        console.log('✅ Auto-detected IP from manifest2:', ip);
        return ip;
      }
    }

    // Method 3: Try Constants.deviceName for Expo Go
    if (Constants.sessionId) {
      console.log('📱 Detected Expo Go session, attempting auto-detection...');
    }

    // Method 4: Try expoConfig.extra if manually set
    const extraHost = Constants.expoConfig?.extra?.apiHost;
    if (extraHost) {
      console.log('✅ Using manually configured API host:', extraHost);
      return extraHost;
    }

    console.warn('⚠️ Could not auto-detect IP from Expo');
    console.warn('   Falling back to localhost');
    console.warn('   If running on physical device, ensure WiFi is enabled');
    console.warn('   Detected Constants:', {
      hostUri: Constants.expoConfig?.hostUri,
      debuggerHost: Constants.manifest?.debuggerHost,
      sessionId: Constants.sessionId ? 'Present' : 'Not found',
    });
    return 'localhost';
  } catch (error) {
    console.error('❌ Error detecting IP:', error.message);
    console.error('   Falling back to localhost');
    return 'localhost';
  }
};

// ============================================
// URL Generation
// ============================================

const getBaseUrl = () => {
  console.log('🔧 Building API base URL...');
  console.log(`   Environment: ${ENVIRONMENT}`);
  console.log(`   Platform: ${Platform.OS}`);
  
  if (ENVIRONMENT === 'production') {
    console.log(`   Using PRODUCTION_URL: ${PRODUCTION_URL}`);
    return PRODUCTION_URL;
  }

  if (ENVIRONMENT === 'tunnel') {
    console.log(`   Using TUNNEL_URL: ${TUNNEL_URL}`);
    return TUNNEL_URL;
  }

  // For local development - auto-detect IP
  // Check if we're in development mode
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  
  if (isDev || ENVIRONMENT === 'local') {
    const detectedIP = getExpoHostIP();
    
    if (Platform.OS === 'web') {
      // Web can use localhost
      const url = `http://localhost:${PORT}`;
      console.log(`   Using Web localhost: ${url}`);
      return url;
    }
    
    // For Android/iOS physical devices and emulators
    const url = `http://${detectedIP}:${PORT}`;
    console.log(`   Using local IP: ${url}`);
    return url;
  }

  // Fallback for production builds
  console.warn('   Falling back to PRODUCTION_URL');
  return PRODUCTION_URL;
};

// Get the base URL once at startup
const BASE_URL = getBaseUrl();

// ============================================
// Exports
// ============================================

export const API_CONFIG = {
  // Base configuration
  BASE_URL,
  TIMEOUT: 15000,
  PORT,
  TUNNEL_URL,
  PRODUCTION_URL,
  ENVIRONMENT,
  // Expose the detection function for debugging
  getExpoHostIP,
  
  // API endpoints (matching web frontend structure)
  AUTH: {
    LOGIN: `${BASE_URL}/api/login`,
    SIGNUP: `${BASE_URL}/api/signup`,
    VERIFY_EMAIL: `${BASE_URL}/api/verify-email`,
    FORGOT_PASSWORD: `${BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/api/auth/reset-password`,
    VERIFY_TOKEN: `${BASE_URL}/api/auth/verify-token`,
    REFRESH_TOKEN: `${BASE_URL}/api/auth/refresh-token`,
    CHANGE_PASSWORD: `${BASE_URL}/api/auth/change-password`,
  },
  
  USER: {
    PROFILE: `${BASE_URL}/api/users/profile`,
    USERS: `${BASE_URL}/api/users`,
    CHILDREN: `${BASE_URL}/api/users/children`,
    PREFERENCES: `${BASE_URL}/api/users/preferences`,
    TOGGLE_2FA: `${BASE_URL}/api/users/toggle-2fa`,
    ACCOUNT: `${BASE_URL}/api/users/account`,
  },
  
  STUDENT: {
    TYPE: `${BASE_URL}/api/studentType`,
    DASHBOARD: `${BASE_URL}/api/student/dashboard`,
  },
  
  TEACHER: {
    PROFILE: `${BASE_URL}/api/teacher/profile`,
    PREFERENCES: `${BASE_URL}/api/teacher/preferences`,
    DASHBOARD: `${BASE_URL}/api/teacher/dashboard`,
  },
  
  FEEDBACK: {
    BASE: `${BASE_URL}/api/feedback`,
    RANDOM: `${BASE_URL}/api/feedback/random`,
  },
  
  NOTIFICATIONS: {
    BASE: `${BASE_URL}/api/notifications`,
    UNREAD_COUNT: `${BASE_URL}/api/notifications/unread-count`,
  },
  
  COURSES: {
    BASE: `${BASE_URL}/api/courses`,
  },
  
  CHAPTERS: {
    BASE: `${BASE_URL}/api/chapters`,
    BY_COURSE: (courseId) => `${BASE_URL}/api/chapters/course/${courseId}`,
    SINGLE: (chapterId) => `${BASE_URL}/api/chapters/${chapterId}`,
    SLIDES_VIEWED: (chapterId) => `${BASE_URL}/api/chapters/${chapterId}/slides/viewed`,
    LECTURE_WATCHED: (chapterId) => `${BASE_URL}/api/chapters/${chapterId}/lectures/watched`,
  },
  
  QUIZ: {
    GENERATE: (chapterId) => `${BASE_URL}/api/quiz/generate/${chapterId}`,
    REGENERATE: (chapterId) => `${BASE_URL}/api/quiz/regenerate/${chapterId}`,
    START: (chapterId) => `${BASE_URL}/api/quiz/start/${chapterId}`,
    SUBMIT: (attemptId) => `${BASE_URL}/api/quiz/submit/${attemptId}`,
    RESULTS: (chapterId) => `${BASE_URL}/api/quiz/results/${chapterId}`,
  },
  
  ASSIGNMENTS: {
    BASE: `${BASE_URL}/api/assignments`,
  },
  
  MESSAGES: {
    BASE: `${BASE_URL}/api/messages`,
    CONVERSATIONS: `${BASE_URL}/api/messages/conversations`,
  },
  
  ADMIN: {
    DASHBOARD: `${BASE_URL}/api/admin/dashboard`,
    USERS: `${BASE_URL}/api/admin/users`,
  },
  
  PARENT: {
    DASHBOARD: `${BASE_URL}/api/parent/dashboard`,
  },
  
  AI: {
    CONVERSATIONS: `${BASE_URL}/api/ai-conversations`,
    CHAT: `${BASE_URL}/api/chat`,
  },
  
  SYSTEM: {
    SETTINGS: `${BASE_URL}/api/system-settings`,
  },
  
  ZOOM: {
    CREATE_MEETING: `${BASE_URL}/api/zoom/create-meeting`,
  },
};

// Helper function to build dynamic URLs (matching web frontend)
export const getApiUrl = (path) => {
  if (path.startsWith('http')) {
    return path; // Already a full URL
  }
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default API_CONFIG;
