import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { authAPI } from '../services/api';

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      
      // Backend returns: { status, token, userId, user }
      if (response.data.status === 'success') {
        const { token, userId, user } = response.data;
        
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('userId', userId);
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
        
        return { token, userId, user };
      } else {
        return rejectWithValue(response.data.message || 'Login failed');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  }
);

// Async thunk for registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup(userData);
      return response.data;
    } catch (error) {
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(e => e.msg).join(', ');
        return rejectWithValue(errorMessages);
      }
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

// Async thunk for email verification
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyEmail(email, code);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Verification failed'
      );
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('userId');
  await AsyncStorage.removeItem('user');
  return null;
});

// Async thunk to check auth status
export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const token = await AsyncStorage.getItem('token');
  const userId = await AsyncStorage.getItem('userId');
  const userStr = await AsyncStorage.getItem('user');
  
  if (token && userId) {
    return { 
      token, 
      userId,
      user: userStr ? JSON.parse(userStr) : null 
    };
  }
  return null;
});

const initialState = {
  user: null,
  userId: null,
  token: null,
  isLoggedIn: false,
  loading: false,
  error: null,
  registrationSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.registrationSuccess = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.registrationSuccess = false;
      })
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.userId = null;
        state.token = null;
        state.isLoggedIn = false;
      })
      // Check Auth
      .addCase(checkAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload.token;
          state.userId = action.payload.userId;
          state.user = action.payload.user;
          state.isLoggedIn = true;
        }
      });
  },
});

export const { clearError, clearRegistrationSuccess } = authSlice.actions;
export default authSlice.reducer;
