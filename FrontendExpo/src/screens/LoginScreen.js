import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError, setCredentials } from '../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRole } from '../utils/getUserRole';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { makeRedirectUri } from 'expo-auth-session';
import { 
  GOOGLE_WEB_CLIENT_ID, 
  GOOGLE_ANDROID_CLIENT_ID, 
  GOOGLE_IOS_CLIENT_ID,
  FACEBOOK_APP_ID 
} from '../config/firebase.config';

// Required for web browser auth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error, isLoggedIn, token } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [socialLoading, setSocialLoading] = useState({ google: false, facebook: false });

  // Google OAuth configuration
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Facebook OAuth configuration
  const [facebookRequest, facebookResponse, facebookPromptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleAuthSuccess(googleResponse.authentication);
    } else if (googleResponse?.type === 'error') {
      setSocialLoading(prev => ({ ...prev, google: false }));
      Alert.alert('Error', 'Google login failed. Please try again.');
    } else if (googleResponse?.type === 'cancel' || googleResponse?.type === 'dismiss') {
      setSocialLoading(prev => ({ ...prev, google: false }));
    }
  }, [googleResponse]);

  // Handle Facebook OAuth response
  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      handleFacebookAuthSuccess(facebookResponse.authentication);
    } else if (facebookResponse?.type === 'error') {
      setSocialLoading(prev => ({ ...prev, facebook: false }));
      Alert.alert('Error', 'Facebook login failed. Please try again.');
    } else if (facebookResponse?.type === 'cancel' || facebookResponse?.type === 'dismiss') {
      setSocialLoading(prev => ({ ...prev, facebook: false }));
    }
  }, [facebookResponse]);

  // Redirect based on role after login
  useEffect(() => {
    if (isLoggedIn && token) {
      const role = getUserRole(token);
      navigateByRole(role);
    }
  }, [isLoggedIn, token]);

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, []);

  const navigateByRole = (role) => {
    switch (role) {
      case 'student':
        navigation.replace('StudentHome');
        break;
      case 'teacher':
        navigation.replace('TeacherHome');
        break;
      case 'parent':
        navigation.replace('ParentHome');
        break;
      case 'admin':
        navigation.replace('AdminHome');
        break;
      case 'trainee':
        navigation.replace('TraineeHome');
        break;
      default:
        navigation.replace('StudentHome');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // Fixed admin account
    if (email === 'aboodjamal684@gmail.com' && password === 'abood123456789') {
      await AsyncStorage.setItem('token', 'admin-token');
      await AsyncStorage.setItem('role', 'admin');
      await AsyncStorage.setItem('userId', 'admin');
      await AsyncStorage.setItem('user', JSON.stringify({
        _id: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'aboodjamal684@gmail.com',
        role: 'admin'
      }));
      navigation.replace('AdminHome');
      return;
    }

    // Regular login
    dispatch(loginUser({ email, password }));
  };

  // Handle successful Google authentication
  const handleGoogleAuthSuccess = async (authentication) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${authentication.accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();
      
      console.log('Google user info:', userInfo);

      // Create/login user on our backend or store locally
      await handleSocialLoginSuccess({
        provider: 'google',
        email: userInfo.email,
        firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'User',
        lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
        providerId: userInfo.id,
        accessToken: authentication.accessToken,
      });
    } catch (error) {
      console.error('Error getting Google user info:', error);
      Alert.alert('Error', 'Failed to get user information from Google');
    } finally {
      setSocialLoading(prev => ({ ...prev, google: false }));
    }
  };

  // Handle successful Facebook authentication
  const handleFacebookAuthSuccess = async (authentication) => {
    try {
      // Get user info from Facebook
      const userInfoResponse = await fetch(
        `https://graph.facebook.com/me?access_token=${authentication.accessToken}&fields=id,name,email,first_name,last_name,picture`
      );
      const userInfo = await userInfoResponse.json();
      
      console.log('Facebook user info:', userInfo);

      await handleSocialLoginSuccess({
        provider: 'facebook',
        email: userInfo.email || `${userInfo.id}@facebook.com`,
        firstName: userInfo.first_name || userInfo.name?.split(' ')[0] || 'User',
        lastName: userInfo.last_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
        providerId: userInfo.id,
        accessToken: authentication.accessToken,
      });
    } catch (error) {
      console.error('Error getting Facebook user info:', error);
      Alert.alert('Error', 'Failed to get user information from Facebook');
    } finally {
      setSocialLoading(prev => ({ ...prev, facebook: false }));
    }
  };

  // Common handler for social login success
  const handleSocialLoginSuccess = async (socialData) => {
    try {
      // For now, store user data locally and navigate
      // In production, you'd call your backend to create/verify the user
      const userData = {
        _id: `${socialData.provider}_${socialData.providerId}`,
        firstName: socialData.firstName,
        lastName: socialData.lastName,
        email: socialData.email,
        role: 'student', // Default role for social login
        provider: socialData.provider,
      };

      // Store authentication data
      await AsyncStorage.setItem('token', socialData.accessToken);
      await AsyncStorage.setItem('role', 'student');
      await AsyncStorage.setItem('userId', userData._id);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // Update Redux state
      dispatch(setCredentials({
        token: socialData.accessToken,
        user: userData,
      }));

      // Navigate to student home (default for social login)
      navigation.replace('StudentHome');
    } catch (error) {
      console.error('Error handling social login:', error);
      Alert.alert('Error', 'Failed to complete login');
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleRequest) {
      Alert.alert(
        'Configuration Required',
        'Google login requires OAuth client IDs to be configured. Please set up Google OAuth credentials in firebase.config.js'
      );
      return;
    }
    setSocialLoading(prev => ({ ...prev, google: true }));
    try {
      await googlePromptAsync();
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Google login failed');
      setSocialLoading(prev => ({ ...prev, google: false }));
    }
  };

  const handleFacebookLogin = async () => {
    if (!facebookRequest) {
      Alert.alert(
        'Configuration Required',
        'Facebook login requires App ID to be configured. Please set up Facebook OAuth credentials in firebase.config.js'
      );
      return;
    }
    setSocialLoading(prev => ({ ...prev, facebook: true }));
    try {
      await facebookPromptAsync();
    } catch (error) {
      console.error('Facebook login error:', error);
      Alert.alert('Error', 'Facebook login failed');
      setSocialLoading(prev => ({ ...prev, facebook: false }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginBox}>
          <Text style={styles.title}>Log In to your account</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.forgotPasswordSection}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Log In</Text>
            )}
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Social Login */}
          <View style={styles.socialLogin}>
            <Text style={styles.socialText}>or login with</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialBtn, styles.facebookBtn]}
                onPress={handleFacebookLogin}
                disabled={socialLoading.facebook}
              >
                {socialLoading.facebook ? (
                  <ActivityIndicator color="#4267B2" size="small" />
                ) : (
                  <Text style={styles.facebookBtnText}>Facebook</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, styles.googleBtn]}
                onPress={handleGoogleLogin}
                disabled={socialLoading.google}
              >
                {socialLoading.google ? (
                  <ActivityIndicator color="#db4437" size="small" />
                ) : (
                  <Text style={styles.googleBtnText}>Google</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Section */}
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>
              Don't have account?{' '}
              <Text
                style={styles.signupLink}
                onPress={() => navigation.navigate('SignUp')}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6a11cb',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
  },
  loginBox: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 50,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  forgotPasswordSection: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordLink: {
    color: '#2575fc',
    fontSize: 14,
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: '#2575fc',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  socialLogin: {
    marginTop: 25,
    alignItems: 'center',
  },
  socialText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  facebookBtn: {
    borderColor: '#4267B2',
  },
  facebookBtnText: {
    color: '#4267B2',
    fontSize: 14,
    fontWeight: '500',
  },
  googleBtn: {
    borderColor: '#db4437',
  },
  googleBtnText: {
    color: '#db4437',
    fontSize: 14,
    fontWeight: '500',
  },
  signupSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#2575fc',
    fontWeight: '500',
  },
});
