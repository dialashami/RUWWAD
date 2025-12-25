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
import { Picker } from '@react-native-picker/picker';
import { authAPI } from '../services/api';

const grades = [...Array(12)].map((_, i) => ({ label: `Grade ${i + 1}`, value: `grade${i + 1}` }));

const universityMajors = [
  { label: 'Select Major', value: '' },
  { label: 'Computer Engineering', value: 'Computer Engineering' },
  { label: 'Architectural Engineering', value: 'Architectural Engineering' },
  { label: 'Civil Engineering', value: 'Civil Engineering' },
  { label: 'Electrical Engineering', value: 'Electrical Engineering' },
  { label: 'Industrial Engineering', value: 'Industrial Engineering' },
  { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
  { label: 'Mechatronics Engineering', value: 'Mechatronics Engineering' },
  { label: 'Chemical Engineering', value: 'Chemical Engineering' },
];

const trainingFields = [
  { label: 'Select Training Field', value: '' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Legal', value: 'legal' },
  { label: 'Languages', value: 'languages' },
  { label: 'Information Technology', value: 'it' },
  { label: 'Business', value: 'business' },
  { label: 'Medical', value: 'medical' },
  { label: 'Education', value: 'education' },
];

export default function SignUpScreen({ navigation, route }) {
  const roleFromParams = route?.params?.role || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roleFromParams,
    studentType: '',
    schoolGrade: '',
    universityMajor: '',
    trainingField: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (roleFromParams) {
      setFormData(prev => ({ ...prev, role: roleFromParams }));
    }
  }, [roleFromParams]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) newErrors.role = 'Please select your role';

    if (formData.role === 'student') {
      if (!formData.studentType) newErrors.studentType = 'Please select student type';
      if (formData.studentType === 'school' && !formData.schoolGrade) {
        newErrors.schoolGrade = 'Please select school grade';
      }
      if (formData.studentType === 'university' && !formData.universityMajor) {
        newErrors.universityMajor = 'Please select university major';
      }
    }

    if (formData.role === 'trainee' && !formData.trainingField) {
      newErrors.trainingField = 'Please select training field';
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        const userData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role,
          studentType: formData.studentType || null,
          schoolGrade: formData.schoolGrade || null,
          universityMajor: formData.universityMajor || null,
          trainingField: formData.trainingField || null,
        };

        await authAPI.signup(userData);
        
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email for verification code.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('VerifyEmail', { email: formData.email }),
            },
          ]
        );
      } catch (error) {
        let message = 'Failed to create account. Please try again.';
        if (error.response?.data?.message) {
          message = error.response.data.message;
        } else if (error.response?.data?.errors) {
          message = error.response.data.errors.map(e => e.msg).join('\n');
        }
        setErrors({ submit: message });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'student':
        return (
          <>
            <Text style={styles.label}>Student Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.studentType}
                onValueChange={(value) => handleChange('studentType', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Student Type" value="" />
                <Picker.Item label="School Student" value="school" />
                <Picker.Item label="University Student" value="university" />
              </Picker>
            </View>
            {errors.studentType && <Text style={styles.fieldError}>{errors.studentType}</Text>}

            {formData.studentType === 'school' && (
              <>
                <Text style={styles.label}>School Grade *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.schoolGrade}
                    onValueChange={(value) => handleChange('schoolGrade', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Grade" value="" />
                    {grades.map((grade) => (
                      <Picker.Item key={grade.value} label={grade.label} value={grade.value} />
                    ))}
                  </Picker>
                </View>
                {errors.schoolGrade && <Text style={styles.fieldError}>{errors.schoolGrade}</Text>}
              </>
            )}

            {formData.studentType === 'university' && (
              <>
                <Text style={styles.label}>University Major *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.universityMajor}
                    onValueChange={(value) => handleChange('universityMajor', value)}
                    style={styles.picker}
                  >
                    {universityMajors.map((major) => (
                      <Picker.Item key={major.value} label={major.label} value={major.value} />
                    ))}
                  </Picker>
                </View>
                {errors.universityMajor && <Text style={styles.fieldError}>{errors.universityMajor}</Text>}
              </>
            )}
          </>
        );

      case 'trainee':
        return (
          <>
            <Text style={styles.label}>Training Field *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.trainingField}
                onValueChange={(value) => handleChange('trainingField', value)}
                style={styles.picker}
              >
                {trainingFields.map((field) => (
                  <Picker.Item key={field.value} label={field.label} value={field.value} />
                ))}
              </Picker>
            </View>
            {errors.trainingField && <Text style={styles.fieldError}>{errors.trainingField}</Text>}
          </>
        );

      default:
        return null;
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
        <View style={styles.signupBox}>
          <View style={styles.signupHeader}>
            <Text style={styles.title}>Create your Account</Text>
            <Text style={styles.subtitle}>Join our platform</Text>
            {formData.role && (
              <View style={styles.selectedRoleNotice}>
                <Text style={styles.selectedRoleText}>
                  You're signing up as a <Text style={styles.boldText}>{formData.role}</Text>
                </Text>
              </View>
            )}
          </View>

          {errors.submit && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.submit}</Text>
            </View>
          )}

          {/* Name Row */}
          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                placeholder="First name"
                placeholderTextColor="#999"
                value={formData.firstName}
                onChangeText={(value) => handleChange('firstName', value)}
              />
              {errors.firstName && <Text style={styles.fieldError}>{errors.firstName}</Text>}
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                placeholder="Last name"
                placeholderTextColor="#999"
                value={formData.lastName}
                onChangeText={(value) => handleChange('lastName', value)}
              />
              {errors.lastName && <Text style={styles.fieldError}>{errors.lastName}</Text>}
            </View>
          </View>

          {/* Email */}
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="email@example.com"
            placeholderTextColor="#999"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

          {/* Role */}
          <Text style={styles.label}>Role *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.role}
              onValueChange={(value) => handleChange('role', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Role" value="" />
              <Picker.Item label="Student" value="student" />
              <Picker.Item label="Parent" value="parent" />
              <Picker.Item label="Teacher" value="teacher" />
              <Picker.Item label="Trainee" value="trainee" />
            </Picker>
          </View>
          {errors.role && <Text style={styles.fieldError}>{errors.role}</Text>}

          {/* Role-specific fields */}
          {renderRoleSpecificFields()}

          {/* Password */}
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Create password"
            placeholderTextColor="#999"
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            secureTextEntry
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Confirm password"
            placeholderTextColor="#999"
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            secureTextEntry
          />
          {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.signupBtn, isSubmitting && styles.signupBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.signupBtnText}> Creating Account...</Text>
              </View>
            ) : (
              <Text style={styles.signupBtnText}>Create your Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.signupFooter}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                Log In
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
    backgroundColor: '#00fefe',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  signupBox: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  signupHeader: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 10,
  },
  selectedRoleNotice: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3182ce',
  },
  selectedRoleText: {
    fontSize: 13,
    color: '#2d3748',
  },
  boldText: {
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fed7d7',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#e53e3e',
    marginBottom: 15,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 13,
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 5,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#f7fafc',
  },
  inputError: {
    borderColor: '#e53e3e',
    backgroundColor: '#fff5f5',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    backgroundColor: '#f7fafc',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  fieldError: {
    color: '#e53e3e',
    fontSize: 11,
    marginTop: 4,
  },
  signupBtn: {
    backgroundColor: '#2d3748',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  signupBtnDisabled: {
    opacity: 0.7,
  },
  signupBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#718096',
  },
  loginLink: {
    color: '#3182ce',
    fontWeight: '500',
  },
});
