import React, { useState } from 'react';
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
import { authAPI } from '../services/api';

export default function VerifyEmailScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.verifyEmail(email, code);
      setSuccess('Email verified successfully!');
      
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    Alert.alert('Info', 'Resend code feature coming soon');
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
        <View style={styles.verifyBox}>
          <Text style={styles.title}>Email Verification</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit verification code to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <Text style={styles.label}>Verification Code *</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Enter your 6-digit code"
            placeholderTextColor="#999"
            value={code}
            onChangeText={(text) => {
              setCode(text);
              setError('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendSection}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  verifyBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
  },
  successText: {
    color: '#28a745',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#d4edda',
    borderRadius: 8,
  },
  verifyBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#667eea',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyBtnDisabled: {
    opacity: 0.7,
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
});
