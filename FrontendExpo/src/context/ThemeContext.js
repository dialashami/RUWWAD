import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const THEME_STORAGE_KEY = '@app_theme';
export const PROFILE_IMAGE_KEY = '@profile_image';

// Dark mode color palette
export const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2D2D2D',
  primary: '#3498db',
  primaryLight: '#5dade2',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#808080',
  border: '#404040',
  inputBackground: '#2D2D2D',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// Light mode color palette
export const lightTheme = {
  background: '#f5f7fa',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#007bff',
  primaryLight: '#3498db',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  inputBackground: '#f3f4f6',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [savedTheme, savedImage] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(PROFILE_IMAGE_KEY),
      ]);
      
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
      
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setDarkMode = async (enabled) => {
    try {
      setIsDarkMode(enabled);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, enabled ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const saveProfileImage = async (imageUri) => {
    try {
      setProfileImage(imageUri);
      if (imageUri) {
        await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUri);
      } else {
        await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  };

  const value = {
    isDarkMode,
    theme,
    toggleDarkMode,
    setDarkMode,
    profileImage,
    saveProfileImage,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
