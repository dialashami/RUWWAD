// Firebase configuration for Expo
// These are the same credentials as the web app

export const firebaseConfig = {
  apiKey: "AIzaSyAm8QKRVv4y2TSa4obNJeGRQHHRxyZWwFo",
  authDomain: "ruwwad-5deaa.firebaseapp.com",
  projectId: "ruwwad-5deaa",
  storageBucket: "ruwwad-5deaa.firebasestorage.app",
  messagingSenderId: "861166704979",
  appId: "1:861166704979:web:0568b32ea062e827f229a6",
  measurementId: "G-DYZQ7J2F3H"
};

// OAuth Client IDs
// You need to get these from Google Cloud Console and Facebook Developer Portal
// For now using placeholder - replace with actual values

// Google OAuth - Get from Google Cloud Console > APIs & Services > Credentials
// Create OAuth 2.0 Client IDs for:
// 1. Web application (for Expo web and auth proxy)
// 2. Android application (with your app's package name and SHA-1)
// 3. iOS application (with your app's bundle ID)
export const GOOGLE_WEB_CLIENT_ID = "861166704979-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com";
export const GOOGLE_ANDROID_CLIENT_ID = "861166704979-YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com";
export const GOOGLE_IOS_CLIENT_ID = "861166704979-YOUR_IOS_CLIENT_ID.apps.googleusercontent.com";

// Facebook OAuth - Get from Facebook Developer Portal
// Create an app at developers.facebook.com
export const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID";

// Expo proxy URL for development
// In production, use your own redirect URI
export const useProxy = true;
