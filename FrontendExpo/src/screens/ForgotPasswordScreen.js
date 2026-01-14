import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { authAPI } from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Step 1: Request password reset code
  const handleRequestCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword({ email });
      setSuccess('If an account with that email exists, a reset code has been sent.');
      setCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and move to password entry
  const handleVerifyCode = () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setError('');
    setSuccess('');
    setStep(3);
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.resetPassword({
        email,
        code,
        newPassword,
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.description}>
        Enter your email address and we'll send you a verification code to reset your password.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleRequestCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Send Reset Code</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.description}>
        We've sent a 6-digit verification code to <Text style={styles.boldText}>{email}</Text>. Please enter it below.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit code"
        placeholderTextColor="#999"
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleVerifyCode}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>Verify Code</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.secondaryBtn, (loading || cooldown > 0) && styles.btnDisabled]}
        onPress={handleRequestCode}
        disabled={loading || cooldown > 0}
      >
        <Text style={styles.secondaryBtnText}>
          {loading ? 'Sending...' : cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.description}>
        Enter your new password below.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#999"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor="#999"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const getTitle = () => {
    switch (step) {
      case 1:
        return 'Forgot Password';
      case 2:
        return 'Enter Verification Code';
      case 3:
        return 'Create New Password';
      default:
        return 'Forgot Password';
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
        <View style={styles.box}>
          <Text style={styles.title}>{getTitle()}</Text>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <View style={styles.backSection}>
            <Text style={styles.backText}>
              Remember your password?{' '}
              <Text
                style={styles.backLink}
                onPress={() => navigation.navigate('Login')}
              >
                Back to Login
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
    backgroundColor: '#3498db',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
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
    marginBottom: 20,
  },
  description: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    backgroundColor: '#2575fc',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryBtn: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryBtnText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  successText: {
    color: '#4caf50',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  backSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  backText: {
    color: '#666',
    fontSize: 14,
  },
  backLink: {
    color: '#2575fc',
    fontWeight: '500',
  },
});
