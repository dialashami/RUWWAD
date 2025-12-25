import React, { useState } from 'react';
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
import { registerUser } from '../store/authSlice';

export default function SignUpScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  const roles = [
    { label: 'Student', value: 'student' },
    { label: 'Teacher', value: 'teacher' },
    { label: 'Parent', value: 'parent' },
  ];

  const handleSignUp = () => {
    const { firstName, lastName, email, password, confirmPassword, role } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    dispatch(registerUser({ firstName, lastName, email, password, role }))
      .unwrap()
      .then(() => {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      })
      .catch((err) => {
        Alert.alert('Error', err || 'Registration failed');
      });
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.signupBox}>
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name"
              placeholderTextColor="#999"
              value={formData.firstName}
              onChangeText={(val) => updateFormData('firstName', val)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name"
              placeholderTextColor="#999"
              value={formData.lastName}
              onChangeText={(val) => updateFormData('lastName', val)}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={formData.email}
            onChangeText={(val) => updateFormData('email', val)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={formData.password}
            onChangeText={(val) => updateFormData('password', val)}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            value={formData.confirmPassword}
            onChangeText={(val) => updateFormData('confirmPassword', val)}
            secureTextEntry
          />

          <Text style={styles.roleLabel}>Select Role:</Text>
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleBtn,
                  formData.role === role.value && styles.roleBtnActive,
                ]}
                onPress={() => updateFormData('role', role.value)}
              >
                <Text
                  style={[
                    styles.roleBtnText,
                    formData.role === role.value && styles.roleBtnTextActive,
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupBtnText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
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
  signupBox: {
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  halfInput: {
    width: '48%',
  },
  roleLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  roleBtnActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  roleBtnText: {
    color: '#666',
    fontSize: 14,
  },
  roleBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  signupBtn: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  signupBtnDisabled: {
    backgroundColor: '#ccc',
  },
  signupBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
});
