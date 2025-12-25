import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API - change this to your backend URL
// const API_BASE_URL = 'http://10.0.2.2:3000'; // For Android Emulator
// const API_BASE_URL = 'http://localhost:3000'; // For iOS Simulator
const API_BASE_URL = 'http://192.168.1.108:3000'; // For physical device on same WiFi

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      // You might want to redirect to login here
    }
    return Promise.reject(error);
  }
);

export default api;
