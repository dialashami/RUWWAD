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
