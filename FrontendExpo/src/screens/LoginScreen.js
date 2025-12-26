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
import { loginUser, clearError } from '../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRole } from '../utils/getUserRole';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error, isLoggedIn, token } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [socialLoading, setSocialLoading] = useState({ google: false, facebook: false });

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

  const handleGoogleLogin = async () => {
    setSocialLoading(prev => ({ ...prev, google: true }));
    try {
      // Google login would be implemented with expo-auth-session
      Alert.alert('Info', 'Google login not implemented for mobile yet');
    } catch (error) {
      Alert.alert('Error', 'Google login failed');
    } finally {
      setSocialLoading(prev => ({ ...prev, google: false }));
    }
  };

  const handleFacebookLogin = async () => {
    setSocialLoading(prev => ({ ...prev, facebook: true }));
    try {
      // Facebook login would be implemented with expo-auth-session
      Alert.alert('Info', 'Facebook login not implemented for mobile yet');
    } catch (error) {
      Alert.alert('Error', 'Facebook login failed');
    } finally {
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
