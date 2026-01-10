import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { userAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const GRADE_OPTIONS = [
  { label: 'Grade 1', value: '1' },
  { label: 'Grade 2', value: '2' },
  { label: 'Grade 3', value: '3' },
  { label: 'Grade 4', value: '4' },
  { label: 'Grade 5', value: '5' },
  { label: 'Grade 6', value: '6' },
  { label: 'Grade 7', value: '7' },
  { label: 'Grade 8', value: '8' },
  { label: 'Grade 9', value: '9' },
  { label: 'Grade 10', value: '10' },
  { label: 'Grade 11', value: '11' },
  { label: 'Grade 12', value: '12' },
  { label: 'University', value: 'University' },
];

const UNIVERSITY_MAJORS = [
  { label: 'Select specialization', value: '' },
  { label: 'Computer Engineering', value: 'Computer Engineering' },
  { label: 'Architectural Engineering', value: 'Architectural Engineering' },
  { label: 'Civil Engineering', value: 'Civil Engineering' },
  { label: 'Electrical Engineering', value: 'Electrical Engineering' },
  { label: 'Industrial Engineering', value: 'Industrial Engineering' },
  { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
  { label: 'Mechatronics Engineering', value: 'Mechatronics Engineering' },
  { label: 'Chemical Engineering', value: 'Chemical Engineering' },
];

export default function StudentSettings({ navigation }) {
  const dispatch = useDispatch();
  const { isDarkMode, setDarkMode, theme, profileImage, saveProfileImage } = useTheme();
  
  // User data
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [gradeLevel, setGradeLevel] = useState('10');
  const [universityMajor, setUniversityMajor] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Show grade picker modal
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [gradeNotifications, setGradeNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notifSaveSuccess, setNotifSaveSuccess] = useState(false);
  
  // Security
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  
  // Modal state
  const [modalType, setModalType] = useState(null); // 'password', '2fa', 'delete'
  const [showModal, setShowModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Sync profile image from context
  useEffect(() => {
    if (profileImage && !avatarUrl) {
      setAvatarUrl(profileImage);
    }
  }, [profileImage]);

  // Auto-clear success messages
  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  useEffect(() => {
    if (notifSaveSuccess) {
      const t = setTimeout(() => setNotifSaveSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [notifSaveSuccess]);

  const loadData = async () => {
    try {
      // Load user data from storage
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setBio(userData.bio || '');
        // Use profile image from context if available, otherwise from userData
        setAvatarUrl(profileImage || userData.profilePicture || userData.profileImage || null);
        
        // Handle grade level
        if (userData.studentType === 'university' || userData.grade === 'University') {
          setGradeLevel('University');
          setUniversityMajor(userData.universityMajor || '');
        } else if (userData.grade) {
          const gradeNum = userData.grade.toString().replace(/\D/g, '');
          setGradeLevel(gradeNum || '10');
        } else if (userData.schoolGrade) {
          const gradeNum = userData.schoolGrade.toString().replace(/\D/g, '');
          setGradeLevel(gradeNum || '10');
        }
      }

      // Fetch profile from API for latest data
      try {
        const profileRes = await userAPI.getProfile();
        if (profileRes.data) {
          const data = profileRes.data;
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName) setLastName(data.lastName);
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
          if (data.bio) setBio(data.bio);
          if (data.profilePicture) setAvatarUrl(data.profilePicture);
          
          // Handle grade from API
          if (data.studentType === 'university' || data.grade === 'University') {
            setGradeLevel('University');
            setUniversityMajor(data.universityMajor || '');
          } else if (data.grade) {
            const gradeNum = data.grade.toString().replace(/\D/g, '');
            setGradeLevel(gradeNum || '10');
          }
          
          // Load notification preferences
          if (data.preferences) {
            setEmailNotifications(data.preferences.emailNotifications ?? true);
            setPushNotifications(data.preferences.pushNotifications ?? true);
            setAssignmentReminders(data.preferences.assignmentReminders ?? true);
            setGradeNotifications(data.preferences.gradeNotifications ?? true);
          }
          
          // Load 2FA status
          if (data.twoFactorEnabled !== undefined) {
            setTwoFAEnabled(data.twoFactorEnabled);
          }
        }
      } catch (err) {
        console.log('Error fetching profile from API:', err);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Avatar handling
  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to change your photo.');
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
      // Save to ThemeContext for persistence across app
      await saveProfileImage(imageUri);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    // Remove from ThemeContext as well
    await saveProfileImage(null);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await userAPI.updateProfile({
        firstName,
        lastName,
        email,
        phone,
        bio,
        profilePicture: avatarUrl,
        grade: gradeLevel === 'University' ? 'University' : `Grade ${gradeLevel}`,
        studentType: gradeLevel === 'University' ? 'university' : 'school',
        universityMajor: gradeLevel === 'University' ? universityMajor : null,
      });

      if (response.data) {
        // Update AsyncStorage
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.firstName = firstName;
          userData.lastName = lastName;
          userData.email = email;
          userData.phone = phone;
          userData.bio = bio;
          userData.profilePicture = avatarUrl;
          userData.grade = gradeLevel === 'University' ? 'University' : gradeLevel;
          userData.studentType = gradeLevel === 'University' ? 'university' : 'school';
          userData.universityMajor = gradeLevel === 'University' ? universityMajor : null;
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Also save to ThemeContext for persistence
        await saveProfileImage(avatarUrl);
        
        setSaveSuccess(true);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save notification preferences
  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const response = await userAPI.updatePreferences({
        emailNotifications,
        pushNotifications,
        assignmentReminders,
        gradeNotifications,
      });

      if (response.data) {
        setNotifSaveSuccess(true);
        Alert.alert('Success', 'Notification preferences saved!');
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  };

  // Modal handlers
  const handleOpenModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setModalLoading(false);
  };

  const handleConfirmAction = async () => {
    setModalLoading(true);
    
    if (modalType === 'password') {
      if (!currentPass || !newPass) {
        Alert.alert('Error', 'Please fill in both current and new password fields.');
        setModalLoading(false);
        return;
      }
      if (newPass.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters.');
        setModalLoading(false);
        return;
      }
      if (newPass !== confirmPass) {
        Alert.alert('Error', 'New passwords do not match.');
        setModalLoading(false);
        return;
      }

      try {
        await userAPI.changePassword({
          currentPassword: currentPass,
          newPassword: newPass,
        });
        Alert.alert('Success', 'Password changed successfully!');
        handleCloseModal();
      } catch (err) {
        console.error('Error changing password:', err);
        Alert.alert('Error', err.response?.data?.message || 'Failed to change password.');
        setModalLoading(false);
      }
      return;
    }
    
    if (modalType === '2fa') {
      try {
        await userAPI.toggle2FA({ enabled: !twoFAEnabled });
        setTwoFAEnabled(!twoFAEnabled);
        Alert.alert('Success', `Two-factor authentication ${!twoFAEnabled ? 'enabled' : 'disabled'}.`);
        handleCloseModal();
      } catch (err) {
        console.error('Error toggling 2FA:', err);
        Alert.alert('Error', 'Failed to update 2FA settings.');
        setModalLoading(false);
      }
      return;
    }
    
    if (modalType === 'delete') {
      Alert.alert(
        'Final Confirmation',
        'This action is PERMANENT and cannot be undone. Are you absolutely sure?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setModalLoading(false) },
          {
            text: 'Delete Forever',
            style: 'destructive',
            onPress: async () => {
              try {
                await userAPI.deleteAccount();
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                handleCloseModal();
                await dispatch(logoutUser());
                navigation.replace('Login');
              } catch (err) {
                console.error('Error deleting account:', err);
                Alert.alert('Error', 'Failed to delete account. Please try again.');
                setModalLoading(false);
              }
            },
          },
        ]
      );
      return;
    }
    
    handleCloseModal();
  };

  // Logout handler
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

  // Get initials for avatar fallback
  const getInitials = () => {
    const first = firstName ? firstName[0].toUpperCase() : '';
    const last = lastName ? lastName[0].toUpperCase() : '';
    return first + last || 'ST';
  };

  // Get grade display text
  const getGradeDisplayText = () => {
    const selected = GRADE_OPTIONS.find(g => g.value === gradeLevel);
    return selected ? selected.label : 'Select Grade';
  };

  // Get major display text
  const getMajorDisplayText = () => {
    const selected = UNIVERSITY_MAJORS.find(m => m.value === universityMajor);
    return selected && selected.value ? selected.label : 'Select specialization';
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, isDarkMode && { color: theme.text }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: isDarkMode ? theme.background : '#f5f7fa' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={[styles.container, isDarkMode && { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={[styles.sectionTitle, isDarkMode && { color: theme.text }]}>Profile Information</Text>
          </View>
          
          <View style={[styles.card, isDarkMode && { backgroundColor: theme.card }]}>
            {/* Avatar Row */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{getInitials()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.avatarActions}>
                <Text style={[styles.avatarName, isDarkMode && { color: theme.text }]}>{firstName} {lastName}</Text>
                <View style={styles.avatarButtons}>
                  <TouchableOpacity style={styles.btnPrimary} onPress={handleChangeAvatar}>
                    <Text style={styles.btnPrimaryText}>📷 Change Photo</Text>
                  </TouchableOpacity>
                  {avatarUrl && (
                    <TouchableOpacity style={styles.btnOutline} onPress={handleRemoveAvatar}>
                      <Text style={styles.btnOutlineText}>🗑️ Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.label, isDarkMode && { color: theme.textSecondary }]}>First Name</Text>
                  <TextInput
                    style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor={isDarkMode ? theme.textMuted : '#9ca3af'}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={[styles.label, isDarkMode && { color: theme.textSecondary }]}>Last Name</Text>
                  <TextInput
                    style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter last name"
                    placeholderTextColor={isDarkMode ? theme.textMuted : '#9ca3af'}
                  />
                </View>
              </View>

              <View style={styles.formFieldFull}>
                <Text style={[styles.label, isDarkMode && { color: theme.textSecondary }]}>Email</Text>
                <TextInput
                  style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email"
                  placeholderTextColor={isDarkMode ? theme.textMuted : '#9ca3af'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formFieldFull}>
                <Text style={[styles.label, isDarkMode && { color: theme.textSecondary }]}>Phone Number</Text>
                <TextInput
                  style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={isDarkMode ? theme.textMuted : '#9ca3af'}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formFieldFull}>
                <Text style={[styles.label, isDarkMode && { color: theme.textSecondary }]}>Grade Level</Text>
                <TouchableOpacity 
                  style={styles.pickerButton} 
                  onPress={() => setShowGradePicker(true)}
                >
                  <Text style={styles.pickerButtonText}>{getGradeDisplayText()}</Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {gradeLevel === 'University' && (
                <View style={styles.formFieldFull}>
                  <Text style={styles.label}>Specialization</Text>
                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={() => setShowMajorPicker(true)}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      !universityMajor && styles.pickerPlaceholder
                    ]}>
                      {getMajorDisplayText()}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.formFieldFull}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity 
                style={[styles.btnSave, savingProfile && styles.btnDisabled]} 
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              
              {saveSuccess && (
                <View style={styles.successBadge}>
                  <Text style={styles.successDot}>●</Text>
                  <Text style={styles.successText}>Saved</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={[styles.sectionTitle, isDarkMode && { color: theme.text }]}>Notification Preferences</Text>
          </View>
          
          <View style={[styles.card, isDarkMode && { backgroundColor: theme.card }]}>
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
                trackColor={{ false: '#e5e7eb', true: '#007bff' }}
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
                trackColor={{ false: '#e5e7eb', true: '#007bff' }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.separator, isDarkMode && { backgroundColor: theme.border }]} />

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
                trackColor={{ false: '#e5e7eb', true: '#007bff' }}
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
                trackColor={{ false: '#e5e7eb', true: '#007bff' }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity 
              style={[styles.btnSave, savingNotifications && styles.btnDisabled]} 
              onPress={handleSaveNotifications}
              disabled={savingNotifications}
            >
              {savingNotifications ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnSaveText}>Save Preferences</Text>
              )}
            </TouchableOpacity>
            
            {notifSaveSuccess && (
              <View style={styles.successBadge}>
                <Text style={styles.successDot}>●</Text>
                <Text style={styles.successText}>Saved</Text>
              </View>
            )}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={[styles.section]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎨</Text>
            <Text style={[styles.sectionTitle, isDarkMode && { color: theme.text }]}>Appearance</Text>
          </View>
          
          <View style={[styles.card, isDarkMode && { backgroundColor: theme.card }]}>
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
                trackColor={{ false: '#e5e7eb', true: '#007bff' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛡️</Text>
            <Text style={[styles.sectionTitle, isDarkMode && { color: theme.text }]}>Privacy & Security</Text>
          </View>
          
          <View style={[styles.card, isDarkMode && { backgroundColor: theme.card }]}>
            <TouchableOpacity 
              style={styles.securityBtn} 
              onPress={() => handleOpenModal('password')}
            >
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={[styles.securityText, isDarkMode && { color: theme.text }]}>Change Password</Text>
              <Text style={[styles.securityArrow, isDarkMode && { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.securityBtn} 
              onPress={() => handleOpenModal('2fa')}
            >
              <Text style={styles.securityIcon}>🛡️</Text>
              <Text style={[styles.securityText, isDarkMode && { color: theme.text }]}>Two-Factor Authentication</Text>
              {twoFAEnabled && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>ON</Text>
                </View>
              )}
              <Text style={[styles.securityArrow, isDarkMode && { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.securityBtn, styles.dangerBtn]} 
              onPress={() => handleOpenModal('delete')}
            >
              <Text style={styles.securityIcon}>⚠️</Text>
              <Text style={styles.dangerText}>Delete Account</Text>
              <Text style={[styles.securityArrow, isDarkMode && { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutBtn, isDarkMode && { backgroundColor: theme.card }]} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={[styles.logoutText, isDarkMode && { color: theme.text }]}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />

        {/* Grade Picker Modal */}
        <Modal
          visible={showGradePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGradePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, isDarkMode && { backgroundColor: theme.card }]}>
              <View style={styles.pickerModalHeader}>
                <Text style={[styles.pickerModalTitle, isDarkMode && { color: theme.text }]}>Select Grade Level</Text>
                <TouchableOpacity onPress={() => setShowGradePicker(false)}>
                  <Text style={styles.pickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={gradeLevel}
                onValueChange={(value) => {
                  setGradeLevel(value);
                  if (value !== 'University') {
                    setUniversityMajor('');
                  }
                }}
                style={styles.picker}
              >
                {GRADE_OPTIONS.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>

        {/* Major Picker Modal */}
        <Modal
          visible={showMajorPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMajorPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Select Specialization</Text>
                <TouchableOpacity onPress={() => setShowMajorPicker(false)}>
                  <Text style={styles.pickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={universityMajor}
                onValueChange={setUniversityMajor}
                style={styles.picker}
              >
                {UNIVERSITY_MAJORS.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>

        {/* Security Modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.securityModal,
              modalType === 'delete' && styles.dangerModal,
              isDarkMode && { backgroundColor: theme.card }
            ]}>
              {/* Modal Header */}
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
                </View>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Text style={[styles.modalClose, isDarkMode && { color: theme.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <View style={styles.modalBody}>
                {modalType === 'password' && (
                  <>
                    <View style={styles.modalField}>
                      <Text style={[styles.label, isDarkMode && { color: theme.textSecondary }]}>Current Password</Text>
                      <TextInput
                        style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                        value={currentPass}
                        onChangeText={setCurrentPass}
                        secureTextEntry
                        placeholder="Enter current password"
                        placeholderTextColor={isDarkMode ? theme.textMuted : '#9ca3af'}
                      />
                    </View>
                    <View style={styles.modalField}>
                      <Text style={[styles.label, isDarkMode && { color: theme.textSecondary }]}>New Password</Text>
                      <TextInput
                        style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                        value={newPass}
                        onChangeText={setNewPass}
                        secureTextEntry
                        placeholder="Enter new password"
                        placeholderTextColor={isDarkMode ? theme.textMuted : '#9ca3af'}
                      />
                    </View>
                    <View style={styles.modalField}>
                      <Text style={[styles.label, isDarkMode && { color: theme.textSecondary }]}>Confirm New Password</Text>
                      <TextInput
                        style={[styles.input, isDarkMode && { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                        value={confirmPass}
                        onChangeText={setConfirmPass}
                        secureTextEntry
                        placeholder="Confirm new password"
                        placeholderTextColor={isDarkMode ? theme.textMuted : '#9ca3af'}
                      />
                    </View>
                  </>
                )}

                {modalType === '2fa' && (
                  <>
                    <Text style={[styles.modalText, isDarkMode && { color: theme.textSecondary }]}>
                      Two-factor authentication adds an extra layer of security to your account. 
                      You will be asked for a verification code when you sign in.
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
                        trackColor={{ false: '#e5e7eb', true: '#007bff' }}
                        thumbColor="#fff"
                      />
                    </View>
                  </>
                )}

                {modalType === 'delete' && (
                  <Text style={[styles.modalText, styles.dangerModalText]}>
                    This will permanently delete your account and all associated data. 
                    This action cannot be undone.
                  </Text>
                )}
              </View>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn} 
                  onPress={handleCloseModal}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.modalConfirmBtn,
                    modalType === 'delete' && styles.modalDangerBtn,
                    modalLoading && styles.btnDisabled
                  ]} 
                  onPress={handleConfirmAction}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmText}>
                      {modalType === 'delete' 
                        ? 'Yes, Delete' 
                        : modalType === 'password'
                        ? 'Save Password'
                        : 'Save'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
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
    marginTop: 10,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 5,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0369a1',
  },
  avatarActions: {
    flex: 1,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnOutlineText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
  },
  formFieldFull: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#1f2937',
  },
  pickerPlaceholder: {
    color: '#9ca3af',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  btnSave: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  successDot: {
    color: '#10b981',
    marginRight: 6,
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  toggleIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  toggleDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  securityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  securityArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  dangerBtn: {
    borderBottomWidth: 0,
  },
  dangerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#dc2626',
  },
  badge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    marginHorizontal: 15,
    marginTop: 25,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomSpacer: {
    height: 40,
  },
  // Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerModalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  picker: {
    width: '100%',
  },
  // Security Modal
  securityModal: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  dangerModal: {
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    fontSize: 20,
    color: '#6b7280',
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalField: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  dangerModalText: {
    color: '#991b1b',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  modalConfirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalDangerBtn: {
    backgroundColor: '#dc2626',
  },
});
