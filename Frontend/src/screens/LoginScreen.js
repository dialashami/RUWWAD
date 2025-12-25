import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/authSlice';
import { getUserRole } from '../utils/getUserRole';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error, isLoggedIn, token } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [socialLoading, setSocialLoading] = useState({ google: false, facebook: false });

  // Redirect based on role
  useEffect(() => {
    if (isLoggedIn && token) {
      const role = getUserRole(token);

      if (role === 'student') navigation.replace('StudentHome');
      else if (role === 'teacher') navigation.replace('TeacherHome');
      else if (role === 'parent') navigation.replace('ParentHome');
      else if (role === 'admin') navigation.replace('AdminHome');
      else navigation.replace('Home');
    }
  }, [isLoggedIn, navigation, token]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    // Admin account check
    if (email === 'aboodjamal684@gmail.com' && password === 'abood123456789') {
      navigation.replace('AdminHome');
      return;
    }

    dispatch(loginUser({ email, password }));
  };

  const handleGoogleLogin = async () => {
    // TODO: Implement Google Sign-In for React Native
    Alert.alert('Info', 'Google Sign-In coming soon');
  };

  const handleFacebookLogin = async () => {
    // TODO: Implement Facebook Sign-In for React Native
    Alert.alert('Info', 'Facebook Sign-In coming soon');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.socialBtn, styles.googleBtn]}
            onPress={handleGoogleLogin}
            disabled={socialLoading.google}
          >
            {socialLoading.google ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialBtn, styles.facebookBtn]}
            onPress={handleFacebookLogin}
            disabled={socialLoading.facebook}
          >
            {socialLoading.facebook ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.socialBtnText}>Continue with Facebook</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#007bff',
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginBtnDisabled: {
    backgroundColor: '#ccc',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  socialBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleBtn: {
    backgroundColor: '#db4437',
  },
  facebookBtn: {
    backgroundColor: '#4267b2',
  },
  socialBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
});
