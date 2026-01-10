// features/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_CONFIG } from "../config/api.config";

// Async login thunk
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_CONFIG.AUTH.LOGIN, {
        email,
        password,
      });

      // Handle API success
      if (response.data.status === "success") {
        const { token, userId, user } = response.data;
        
        // Save to localStorage for persistence
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return {
          token,
          userId,
          user,
        };
      } else {
        // Handle API failure
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      // Network or server error
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (token && userId) {
      return {
        token,
        userId,
        user,
        isLoggedIn: true,
        loading: false,
        error: null,
      };
    }
  } catch (e) {
    console.error('Error loading auth state from localStorage:', e);
  }
  
  return {
    token: null,
    userId: null,
    user: null,
    isLoggedIn: false,
    loading: false,
    error: null,
  };
};

const initialState = loadInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Clear localStorage on logout
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      
      state.token = null;
      state.userId = null;
      state.user = null;
      state.isLoggedIn = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.user = action.payload.user || null;
        state.isLoggedIn = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
