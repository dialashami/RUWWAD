// API Configuration
// This file centralizes all API configuration settings

import { Platform } from 'react-native';

// ============================================
// CONFIGURATION - Update these values as needed
// ============================================

// Your computer's local IP address (find with 'ipconfig' on Windows or 'ifconfig' on Mac/Linux)
// Update this when your IP changes
const LOCAL_IP = '192.168.1.115';

// Backend server port
const PORT = 3000;

// Localtunnel URL (if using tunnel for external access)
const TUNNEL_URL = 'https://olive-coats-report.loca.lt';

// ============================================
// Environment Detection
// ============================================

// Set to 'local' for local development, 'tunnel' for localtunnel access
// 'local' - Uses your computer's IP (works when phone/emulator is on same WiFi)
// 'tunnel' - Uses localtunnel URL (works from anywhere but may be slower)
const ENVIRONMENT = 'local'; // Change to 'tunnel' if you need external access

// ============================================
// URL Generation
// ============================================

const getBaseUrl = () => {
  if (ENVIRONMENT === 'tunnel') {
    return TUNNEL_URL;
  }
  
  // For local development
  if (Platform.OS === 'android') {
    // Check if running on emulator or physical device
    // For Android Emulator, 10.0.2.2 points to host machine's localhost
    // For physical devices, use the local IP
    return __DEV__ 
      ? `http://${LOCAL_IP}:${PORT}` // Use local IP for both (works on physical devices)
      : `http://${LOCAL_IP}:${PORT}`;
  }
  
  if (Platform.OS === 'ios') {
    // iOS Simulator can use localhost, physical devices need IP
    return __DEV__
      ? `http://${LOCAL_IP}:${PORT}` // Use local IP for consistency
      : `http://${LOCAL_IP}:${PORT}`;
  }
  
  // Web
  return `http://localhost:${PORT}`;
};

// ============================================
// Exports
// ============================================

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 15000,
  LOCAL_IP,
  PORT,
  TUNNEL_URL,
  ENVIRONMENT,
};

export default API_CONFIG;
