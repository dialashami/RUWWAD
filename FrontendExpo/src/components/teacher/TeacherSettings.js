import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import * as ImagePicker from 'expo-image-picker';
import { userAPI } from '../../services/api';
import API_CONFIG from '../../config/api.config';
import { useTheme } from '../../context/ThemeContext';

export default function TeacherSettings({ navigation }) {
  const dispatch = useDispatch();
  const { isDarkMode, setDarkMode, theme, profileImage, saveProfileImage } = useTheme();
  
  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teacherType, setTeacherType] = useState('');
  const [subject, setSubject] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [gradeNotifications, setGradeNotifications] = useState(true);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifSaveSuccess, setNotifSaveSuccess] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'password', '2fa', 'delete', 'teacherType', 'subject', 'specialization'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Subject options
  const schoolSubjects = [
    { value: 'math', label: 'Mathematics' },
    { value: 'english', label: 'English' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'History' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'islamic', label: 'Islamic Studies' },
    { value: 'biology', label: 'Biology' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
  ];

  const universitySpecializations = [
    { value: 'Computer Engineering', label: 'Computer Engineering' },
    { value: 'Architectural Engineering', label: 'Architectural Engineering' },
    { value: 'Civil Engineering', label: 'Civil Engineering' },
    { value: 'Electrical Engineering', label: 'Electrical Engineering' },
    { value: 'Industrial Engineering', label: 'Industrial Engineering' },
    { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
    { value: 'Mechatronics Engineering', label: 'Mechatronics Engineering' },
    { value: 'Chemical Engineering', label: 'Chemical Engineering' },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  useEffect(() => {
    if (notifSaveSuccess) {
      const timer = setTimeout(() => setNotifSaveSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [notifSaveSuccess]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setBio(user.bio || '');
        setTeacherType(user.teacherType || '');
        setSubject(user.subject || '');
        setSpecialization(user.specialization || '');
        setAvatarUrl(user.profileImage || null);
        
        if (user.preferences) {
          setEmailNotifications(user.preferences.emailNotifications ?? true);
          setPushNotifications(user.preferences.pushNotifications ?? true);
          setAssignmentReminders(user.preferences.assignmentReminders ?? true);
          setGradeNotifications(user.preferences.gradeNotifications ?? true);
        }
        if (user.twoFactorEnabled !== undefined) {
          setTwoFAEnabled(user.twoFactorEnabled);
        }
      }

      // Fetch fresh data from API
      const token = await AsyncStorage.getItem('token');
      if (token && token !== 'admin-token') {
        try {
          const response = await userAPI.getProfile();
          if (response.data) {
            const data = response.data;
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setBio(data.bio || '');
            setTeacherType(data.teacherType || '');
            setSubject(data.subject || '');
            setSpecialization(data.specialization || '');
            setAvatarUrl(data.profileImage || null);
            
            if (data.preferences) {
              setEmailNotifications(data.preferences.emailNotifications ?? true);
              setPushNotifications(data.preferences.pushNotifications ?? true);
              setAssignmentReminders(data.preferences.assignmentReminders ?? true);
              setGradeNotifications(data.preferences.gradeNotifications ?? true);
            }
            if (data.twoFactorEnabled !== undefined) {
              setTwoFAEnabled(data.twoFactorEnabled);
            }
          }
        } catch (err) {
          console.log('Could not refresh profile from API');
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is required to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setAvatarUrl(imageUri);
      // Save to ThemeContext for persistence
      await saveProfileImage(imageUri);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    // Remove from ThemeContext as well
    await saveProfileImage(null);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const response = await fetch(API_CONFIG.TEACHER.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          bio,
          subject,
          teacherType,
          specialization,
          profileImage: avatarUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to save changes');
        return;
      }

      // Update local storage
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.phone = phone;
        user.bio = bio;
        user.subject = subject;
        user.teacherType = teacherType;
        user.specialization = specialization;
        user.profileImage = avatarUrl;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Error saving changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    setSavingNotifications(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const response = await fetch(API_CONFIG.TEACHER.PREFERENCES, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
          assignmentReminders,
          gradeNotifications,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to save notification preferences');
        return;
      }

      setNotifSaveSuccess(true);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      Alert.alert('Error', 'Error saving preferences. Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setModalVisible(true);
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalType(null);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both current and new password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Not authenticated. Please log in again.');
        return;
      }

      const response = await fetch(API_CONFIG.AUTH.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.message || 'Failed to change password.');
        return;
      }

      Alert.alert('Success', 'Password changed successfully!');
      handleCloseModal();
    } catch (err) {
      console.error('Error changing password:', err);
      Alert.alert('Error', 'Error changing password. Please try again.');
    }
  };

  const handleToggle2FA = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Not authenticated. Please log in again.');
        return;
      }

      const newStatus = !twoFAEnabled;
      const response = await fetch(API_CONFIG.USER.TOGGLE_2FA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.message || 'Failed to update 2FA settings.');
        return;
      }

      setTwoFAEnabled(newStatus);
      Alert.alert('Success', data.message || `2FA ${newStatus ? 'enabled' : 'disabled'} successfully.`);
      handleCloseModal();
    } catch (err) {
      console.error('Error toggling 2FA:', err);
      Alert.alert('Error', 'Error updating 2FA settings. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Error', 'Not authenticated. Please log in again.');
                return;
              }

              const response = await fetch(API_CONFIG.USER.ACCOUNT, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (!response.ok) {
                Alert.alert('Error', data.message || 'Failed to delete account.');
                return;
              }

              Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('user');
              navigation.replace('Welcome');
            } catch (err) {
              console.error('Error deleting account:', err);
              Alert.alert('Error', 'Error deleting account. Please try again.');
            }
          },
        },
      ]
    );
    handleCloseModal();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutUser());
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const getInitials = () => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'T';
  };

  const getSubjectLabel = (value) => {
    const found = schoolSubjects.find(s => s.value === value);
    return found ? found.label : value || 'Select Subject';
  };

  const getSpecializationLabel = (value) => {
    const found = universitySpecializations.find(s => s.value === value);
    return found ? found.label : value || 'Select Specialization';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: isDarkMode ? theme.background : '#f5f5f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={[styles.container, isDarkMode && { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header Banner */}
        <LinearGradient
          colors={['#3498db', '#2c3e50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBanner}
        >
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorSquare} />
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Settings</Text>
              <Text style={styles.bannerSubtitle}>Manage your account and preferences</Text>
            </View>
          </View>
        </LinearGradient>

      {/* Profile Section */}
      <View style={[styles.card, isDarkMode && { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>👤</Text>
          <Text style={[styles.cardTitle, isDarkMode && { color: theme.text }]}>Profile Information</Text>
        </View>

        {/* Avatar Row */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarCircle}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            )}
          </View>
          <View style={styles.avatarActions}>
            <Text style={[styles.avatarName, isDarkMode && { color: theme.text }]}>{`${firstName} ${lastName}`.trim() || 'Teacher'}</Text>
            <View style={styles.avatarButtons}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handlePickImage}>
                <Text style={styles.btnPrimaryText}>📷 Change Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline} onPress={handleRemoveAvatar}>
                <Text style={styles.btnOutlineText}>🗑 Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formFields}>
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={[styles.label, isDarkMode && { color: theme.text }]}>First Name</Text>
              <TextInput
                style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={isDarkMode ? theme.textSecondary : "#9ca3af"}
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={[styles.label, isDarkMode && { color: theme.text }]}>Last Name</Text>
              <TextInput
                style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={isDarkMode ? theme.textSecondary : "#9ca3af"}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isDarkMode && { color: theme.text }]}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isDarkMode && { color: theme.text }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={isDarkMode ? theme.textSecondary : "#9ca3af"}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isDarkMode && { color: theme.text }]}>Teacher Type</Text>
            <TouchableOpacity
              style={[styles.selectButton, isDarkMode && { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              onPress={() => handleOpenModal('teacherType')}
            >
              <Text style={[styles.selectText, isDarkMode && { color: theme.text }]}>
                {teacherType === 'school' ? 'School Teacher' : teacherType === 'university' ? 'University Teacher' : 'Select Type'}
              </Text>
              <Text style={[styles.selectArrow, isDarkMode && { color: theme.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          {teacherType === 'school' && (
            <View style={styles.field}>
              <Text style={[styles.label, isDarkMode && { color: theme.text }]}>Subject</Text>
              <TouchableOpacity
                style={[styles.selectButton, isDarkMode && { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                onPress={() => handleOpenModal('subject')}
              >
                <Text style={[styles.selectText, isDarkMode && { color: theme.text }]}>{getSubjectLabel(subject)}</Text>
                <Text style={[styles.selectArrow, isDarkMode && { color: theme.textSecondary }]}>▼</Text>
              </TouchableOpacity>
            </View>
          )}

          {teacherType === 'university' && (
            <View style={styles.field}>
              <Text style={[styles.label, isDarkMode && { color: theme.text }]}>Specialization</Text>
              <TouchableOpacity
                style={[styles.selectButton, isDarkMode && { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                onPress={() => handleOpenModal('specialization')}
              >
                <Text style={[styles.selectText, isDarkMode && { color: theme.text }]}>{getSpecializationLabel(specialization)}</Text>
                <Text style={[styles.selectArrow, isDarkMode && { color: theme.textSecondary }]}>▼</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, isDarkMode && { color: theme.text }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={isDarkMode ? theme.textSecondary : "#9ca3af"}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.saveRow}>
            <TouchableOpacity
              style={[styles.btnSave, saving && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              <Text style={styles.btnSaveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
            {saveSuccess && (
              <View style={styles.saveToast}>
                <Text style={styles.saveToastText}>✓ Saved</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Notification Preferences */}
      <View style={[styles.card, isDarkMode && { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🔔</Text>
          <Text style={[styles.cardTitle, isDarkMode && { color: theme.text }]}>Notification Preferences</Text>
        </View>

        <View style={styles.toggleList}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>📧</Text>
              <View>
                <Text style={[styles.toggleTitle, isDarkMode && { color: theme.text }]}>Email Notifications</Text>
                <Text style={[styles.toggleDesc, isDarkMode && { color: theme.textSecondary }]}>Receive email updates about your courses</Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>🔔</Text>
              <View>
                <Text style={[styles.toggleTitle, isDarkMode && { color: theme.text }]}>Push Notifications</Text>
                <Text style={[styles.toggleDesc, isDarkMode && { color: theme.textSecondary }]}>Get push notifications on your device</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View>
                <Text style={[styles.toggleTitle, isDarkMode && { color: theme.text }]}>Assignment Reminders</Text>
                <Text style={[styles.toggleDesc, isDarkMode && { color: theme.textSecondary }]}>Get reminded about upcoming deadlines</Text>
              </View>
            </View>
            <Switch
              value={assignmentReminders}
              onValueChange={setAssignmentReminders}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View>
                <Text style={[styles.toggleTitle, isDarkMode && { color: theme.text }]}>Grade Notifications</Text>
                <Text style={[styles.toggleDesc, isDarkMode && { color: theme.textSecondary }]}>Be notified when grades are posted</Text>
              </View>
            </View>
            <Switch
              value={gradeNotifications}
              onValueChange={setGradeNotifications}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.saveRow}>
            <TouchableOpacity
              style={[styles.btnSave, savingNotifications && styles.btnDisabled]}
              onPress={handleSaveNotificationPreferences}
              disabled={savingNotifications}
            >
              <Text style={styles.btnSaveText}>{savingNotifications ? 'Saving...' : 'Save Preferences'}</Text>
            </TouchableOpacity>
            {notifSaveSuccess && (
              <View style={styles.saveToast}>
                <Text style={styles.saveToastText}>✓ Saved</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={[styles.card, isDarkMode && { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🎨</Text>
          <Text style={[styles.cardTitle, isDarkMode && { color: theme.text }]}>Appearance</Text>
        </View>

        <View style={styles.toggleList}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
              <View>
                <Text style={[styles.toggleTitle, isDarkMode && { color: theme.text }]}>Dark Mode</Text>
                <Text style={[styles.toggleDesc, isDarkMode && { color: theme.textSecondary }]}>Switch to dark theme for comfortable viewing</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* Privacy & Security */}
      <View style={[styles.card, isDarkMode && { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🛡️</Text>
          <Text style={[styles.cardTitle, isDarkMode && { color: theme.text }]}>Privacy & Security</Text>
        </View>

        <View style={styles.privacyList}>
          <TouchableOpacity style={styles.privacyButton} onPress={() => handleOpenModal('password')}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={[styles.privacyText, isDarkMode && { color: theme.text }]}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.privacyButton} onPress={() => handleOpenModal('2fa')}>
            <Text style={styles.privacyIcon}>🛡️</Text>
            <Text style={[styles.privacyText, isDarkMode && { color: theme.text }]}>Two-Factor Authentication</Text>
            {twoFAEnabled && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>ON</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.privacyButton, styles.dangerButton]} onPress={() => handleOpenModal('delete')}>
            <Text style={styles.privacyIcon}>⚠️</Text>
            <Text style={styles.dangerText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDarkMode && { backgroundColor: theme.card }, modalType === 'delete' && styles.modalDanger]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {modalType === 'password' && (
                  <>
                    <Text style={styles.modalIcon}>🔒</Text>
                    <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Change Password</Text>
                  </>
                )}
                {modalType === '2fa' && (
                  <>
                    <Text style={styles.modalIcon}>🛡️</Text>
                    <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Two-Factor Authentication</Text>
                  </>
                )}
                {modalType === 'delete' && (
                  <>
                    <Text style={styles.modalIcon}>⚠️</Text>
                    <Text style={[styles.modalTitle, styles.dangerTitle]}>Delete Account</Text>
                  </>
                )}
                {modalType === 'teacherType' && (
                  <>
                    <Text style={styles.modalIcon}>👨‍🏫</Text>
                    <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Select Teacher Type</Text>
                  </>
                )}
                {modalType === 'subject' && (
                  <>
                    <Text style={styles.modalIcon}>📚</Text>
                    <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Select Subject</Text>
                  </>
                )}
                {modalType === 'specialization' && (
                  <>
                    <Text style={styles.modalIcon}>🎓</Text>
                    <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Select Specialization</Text>
                  </>
                )}
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={handleCloseModal}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {modalType === 'password' && (
                <>
                  <View style={styles.field}>
                    <Text style={[styles.label, isDarkMode && { color: theme.text }]}>Current Password</Text>
                    <TextInput
                      style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      placeholder="Enter current password"
                      placeholderTextColor={isDarkMode ? theme.textSecondary : "#9ca3af"}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={[styles.label, isDarkMode && { color: theme.text }]}>New Password</Text>
                    <TextInput
                      style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      placeholder="Enter new password"
                      placeholderTextColor={isDarkMode ? theme.textSecondary : "#9ca3af"}
                    />
                  </View>
                </>
              )}

              {modalType === '2fa' && (
                <>
                  <Text style={[styles.modalText, isDarkMode && { color: theme.textSecondary }]}>
                    Two-factor authentication adds an extra layer of security to your account. You will be asked for a verification code when you sign in.
                  </Text>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Text style={styles.toggleIcon}>🛡️</Text>
                      <View>
                        <Text style={[styles.toggleTitle, isDarkMode && { color: theme.text }]}>Enable 2FA</Text>
                        <Text style={[styles.toggleDesc, isDarkMode && { color: theme.textSecondary }]}>Require a code on sign in</Text>
                      </View>
                    </View>
                    <Switch
                      value={twoFAEnabled}
                      onValueChange={setTwoFAEnabled}
                      trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                      thumbColor="#fff"
                    />
                  </View>
                </>
              )}

              {modalType === 'delete' && (
                <Text style={styles.modalTextDanger}>
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </Text>
              )}

              {modalType === 'teacherType' && (
                <View style={styles.optionsList}>
                  {[
                    { value: 'school', label: 'School Teacher' },
                    { value: 'university', label: 'University Teacher' },
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.optionItem, isDarkMode && { backgroundColor: theme.surface }, teacherType === option.value && styles.optionItemActive]}
                      onPress={() => {
                        setTeacherType(option.value);
                        setSubject('');
                        setSpecialization('');
                        handleCloseModal();
                      }}
                    >
                      <Text style={[styles.optionText, isDarkMode && { color: theme.text }, teacherType === option.value && styles.optionTextActive]}>
                        {option.label}
                      </Text>
                      {teacherType === option.value && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {modalType === 'subject' && (
                <ScrollView style={styles.optionsScroll}>
                  <View style={styles.optionsList}>
                    {schoolSubjects.map(option => (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.optionItem, isDarkMode && { backgroundColor: theme.surface }, subject === option.value && styles.optionItemActive]}
                        onPress={() => {
                          setSubject(option.value);
                          handleCloseModal();
                        }}
                      >
                        <Text style={[styles.optionText, isDarkMode && { color: theme.text }, subject === option.value && styles.optionTextActive]}>
                          {option.label}
                        </Text>
                        {subject === option.value && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              {modalType === 'specialization' && (
                <ScrollView style={styles.optionsScroll}>
                  <View style={styles.optionsList}>
                    {universitySpecializations.map(option => (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.optionItem, isDarkMode && { backgroundColor: theme.surface }, specialization === option.value && styles.optionItemActive]}
                        onPress={() => {
                          setSpecialization(option.value);
                          handleCloseModal();
                        }}
                      >
                        <Text style={[styles.optionText, isDarkMode && { color: theme.text }, specialization === option.value && styles.optionTextActive]}>
                          {option.label}
                        </Text>
                        {specialization === option.value && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            {(modalType === 'password' || modalType === '2fa' || modalType === 'delete') && (
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.btnModalCancel} onPress={handleCloseModal}>
                  <Text style={styles.btnModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnModalConfirm, modalType === 'delete' && styles.btnDanger]}
                  onPress={() => {
                    if (modalType === 'password') handleChangePassword();
                    else if (modalType === '2fa') handleToggle2FA();
                    else if (modalType === 'delete') handleDeleteAccount();
                  }}
                >
                  <Text style={styles.btnModalConfirmText}>
                    {modalType === 'delete' ? 'Yes, Delete' : modalType === 'password' ? 'Save Password' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBanner: {
    margin: 15,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#3498db',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#2c3e50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  decorCircle1: {
    position: 'absolute',
    top: -20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorSquare: {
    position: 'absolute',
    top: '40%',
    right: '25%',
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarActions: {
    flex: 1,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  btnOutline: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  btnOutlineText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  formFields: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    marginBottom: 16,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 14,
    color: '#1f2937',
  },
  selectArrow: {
    fontSize: 12,
    color: '#9ca3af',
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  btnSave: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnSaveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveToast: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveToastText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleList: {
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleIcon: {
    fontSize: 20,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  privacyList: {
    gap: 12,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  privacyIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  privacyText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  dangerButton: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  dangerText: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '500',
    flex: 1,
  },
  badge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalDanger: {
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  dangerTitle: {
    color: '#dc2626',
  },
  modalClose: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalTextDanger: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  btnModalCancel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  btnModalCancelText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  btnModalConfirm: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnModalConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnDanger: {
    backgroundColor: '#dc2626',
  },
  optionsList: {
    gap: 8,
  },
  optionsScroll: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionItemActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  optionText: {
    fontSize: 15,
    color: '#1f2937',
  },
  optionTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: 'bold',
  },
});
