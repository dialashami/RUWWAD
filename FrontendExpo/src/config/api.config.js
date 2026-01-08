// API Configuration
// This file centralizes all API configuration settings
// IP is now AUTO-DETECTED from Expo - no manual configuration needed!

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================
// CONFIGURATION
// ============================================

// Backend server port
const PORT = 3000;

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
const ENVIRONMENT = 'local';

// ============================================
// Auto-detect IP from Expo
// ============================================

const getExpoHostIP = () => {
  try {
    // Method 1: Get from debuggerHost (most reliable in Expo Go)
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost') {
        console.log('🔍 Auto-detected IP from Expo:', ip);
        return ip;
      }
    }

    // Method 2: Try manifest2 for newer Expo versions
    const manifest2Host = Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (manifest2Host) {
      const ip = manifest2Host.split(':')[0];
      if (ip && ip !== 'localhost') {
        console.log('🔍 Auto-detected IP from manifest2:', ip);
        return ip;
      }
    }

    // Method 3: Try expoConfig.extra if set
    const extraHost = Constants.expoConfig?.extra?.apiHost;
    if (extraHost) {
      console.log('🔍 Using configured API host:', extraHost);
      return extraHost;
    }

    console.log('⚠️ Could not auto-detect IP, using localhost');
    return 'localhost';
  } catch (error) {
    console.log('⚠️ Error detecting IP:', error.message);
    return 'localhost';
  }
};

// ============================================
// URL Generation
// ============================================

const getBaseUrl = () => {
  if (ENVIRONMENT === 'production') {
    return PRODUCTION_URL;
  }

  if (ENVIRONMENT === 'tunnel') {
    return TUNNEL_URL;
  }

  // For local development - auto-detect IP
  if (__DEV__) {
    const detectedIP = getExpoHostIP();
    
    if (Platform.OS === 'web') {
      // Web can use localhost
      return `http://localhost:${PORT}`;
    }
    
    // For Android/iOS physical devices and emulators
    return `http://${detectedIP}:${PORT}`;
  }

  // Fallback for non-dev builds
  return PRODUCTION_URL;
};

// Get the base URL once at startup
const BASE_URL = getBaseUrl();

// ============================================
// Exports
// ============================================

export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 15000,
  PORT,
  TUNNEL_URL,
  PRODUCTION_URL,
  ENVIRONMENT,
  // Expose the detection function for debugging
  getExpoHostIP,
};

export default API_CONFIG;
