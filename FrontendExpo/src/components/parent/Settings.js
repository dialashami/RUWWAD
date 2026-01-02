import React, { useState, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { userAPI, parentDashboardAPI } from '../../services/api';

export default function ParentSettings({ navigation }) {
  // User data
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [gradeNotifications, setGradeNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notifSaveSuccess, setNotifSaveSuccess] = useState(false);
  
  // Appearance
  const [darkMode, setDarkMode] = useState(false);
  
  // Children management
  const [children, setChildren] = useState([]);
  const [newChildEmail, setNewChildEmail] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [childError, setChildError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Security
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  
  // Modal state
  const [modalType, setModalType] = useState(null); // 'password', '2fa', 'delete', 'editProfile'
  const [showModal, setShowModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
        setAvatarUrl(userData.profileImage || null);
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
          if (data.profileImage) setAvatarUrl(data.profileImage);
          
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

      // Fetch linked children
      await fetchChildren();
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await parentDashboardAPI.getChildren();
      if (response.data) {
        setChildren(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error fetching children:', err);
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
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
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
        profileImage: avatarUrl,
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
          userData.profileImage = avatarUrl;
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
        setSaveSuccess(true);
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
      await userAPI.updatePreferences({
        emailNotifications,
        pushNotifications,
        assignmentReminders,
        gradeNotifications,
      });
      setNotifSaveSuccess(true);
    } catch (err) {
      console.error('Error saving notifications:', err);
      Alert.alert('Error', 'Failed to save notification preferences.');
    } finally {
      setSavingNotifications(false);
    }
  };

  // Children management
  const handleAddChild = async () => {
    if (!newChildEmail.trim()) {
      setChildError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newChildEmail.trim())) {
      setChildError('Please enter a valid email address');
      return;
    }

    setAddingChild(true);
    setChildError('');

    try {
      const response = await parentDashboardAPI.addChild(newChildEmail.trim().toLowerCase());
      
      if (response.data?.child) {
        setChildren(prev => [...prev, response.data.child]);
        setNewChildEmail('');
        Alert.alert('Success', 'Child linked successfully!');
      }
    } catch (err) {
      console.error('Error adding child:', err);
      const errorMsg = err.response?.data?.message || 'Error adding child. Please try again.';
      setChildError(errorMsg);
    } finally {
      setAddingChild(false);
    }
  };

  const handleRemoveChild = (childId, childName) => {
    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${childName} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await parentDashboardAPI.removeChild(childId);
              setChildren(prev => prev.filter(c => c._id !== childId));
              Alert.alert('Success', 'Child removed successfully');
            } catch (err) {
              console.error('Error removing child:', err);
              Alert.alert('Error', 'Failed to remove child');
            }
          },
        },
      ]
    );
  };

  // Modal handlers
  const handleOpenModal = (type) => {
    setModalType(type);
    setShowModal(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handleConfirmAction = async () => {
    setModalLoading(true);
    
    try {
      if (modalType === 'password') {
        if (!currentPass || !newPass) {
          Alert.alert('Error', 'Please fill in all password fields');
          setModalLoading(false);
          return;
        }
        if (newPass !== confirmPass) {
          Alert.alert('Error', 'New passwords do not match');
          setModalLoading(false);
          return;
        }
        if (newPass.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters');
          setModalLoading(false);
          return;
        }
        
        await userAPI.changePassword({
          currentPassword: currentPass,
          newPassword: newPass,
        });
        Alert.alert('Success', 'Password changed successfully!');
        handleCloseModal();
      } else if (modalType === '2fa') {
        await userAPI.toggle2FA({ enabled: !twoFAEnabled });
        setTwoFAEnabled(!twoFAEnabled);
        Alert.alert('Success', `Two-factor authentication ${!twoFAEnabled ? 'enabled' : 'disabled'}`);
        handleCloseModal();
      } else if (modalType === 'delete') {
        Alert.alert(
          'Final Confirmation',
          'This will permanently delete your account and all data. This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Forever',
              style: 'destructive',
              onPress: async () => {
                try {
                  await userAPI.deleteAccount();
                  await AsyncStorage.multiRemove(['token', 'user', 'userId']);
                  navigation.replace('Welcome');
                } catch (err) {
                  console.error('Error deleting account:', err);
                  Alert.alert('Error', 'Failed to delete account');
                }
              },
            },
          ]
        );
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error in modal action:', err);
      const errorMsg = err.response?.data?.message || 'An error occurred';
      Alert.alert('Error', errorMsg);
    } finally {
      setModalLoading(false);
    }
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
            await AsyncStorage.multiRemove(['token', 'user', 'userId']);
            navigation.replace('Welcome');
          },
        },
      ]
    );
  };

  // Toggle component
  const ToggleRow = ({ icon, title, description, value, onToggle }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <View style={styles.toggleIconContainer}>
          <Text style={styles.toggleIcon}>{icon}</Text>
        </View>
        <View style={styles.toggleTextContainer}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e5e7eb', true: '#9333ea' }}
        thumbColor="#fff"
      />
    </View>
  );

  // Button component
  const ActionButton = ({ icon, title, subtitle, onPress, danger }) => (
    <TouchableOpacity 
      style={[styles.actionButton, danger && styles.actionButtonDanger]} 
      onPress={onPress}
    >
      <View style={[styles.actionIconContainer, danger && styles.actionIconDanger]}>
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>
      <View style={styles.actionTextContainer}>
        <Text style={[styles.actionTitle, danger && styles.actionTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.actionArrow}>›</Text>
    </TouchableOpacity>
  );

  const userName = `${firstName} ${lastName}`.trim() || 'Parent';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'P';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9333ea']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile Information</Text>
          <View style={styles.card}>
            {/* Avatar Row */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </View>
              <View style={styles.avatarInfo}>
                <Text style={styles.avatarName}>{userName}</Text>
                <View style={styles.avatarActions}>
                  <TouchableOpacity style={styles.avatarBtn} onPress={handleChangeAvatar}>
                    <Text style={styles.avatarBtnText}>📷 Change Photo</Text>
                  </TouchableOpacity>
                  {avatarUrl && (
                    <TouchableOpacity style={styles.avatarBtnOutline} onPress={handleRemoveAvatar}>
                      <Text style={styles.avatarBtnOutlineText}>🗑️ Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>First Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Last Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter last name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.formFieldFull}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formFieldFull}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formFieldFull}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.saveRow}>
                <TouchableOpacity 
                  style={[styles.saveBtn, savingProfile && styles.saveBtnDisabled]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
                {saveSuccess && (
                  <View style={styles.savedBadge}>
                    <Text style={styles.savedBadgeText}>✓ Saved</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* My Children Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 My Children</Text>
          <View style={styles.card}>
            <Text style={styles.cardDescription}>
              Link your children's accounts to view their academic progress, courses, and grades.
            </Text>

            {/* Existing children list */}
            {children.length > 0 && (
              <View style={styles.childrenList}>
                {children.map((child) => (
                  <View key={child._id} style={styles.childItem}>
                    <View style={styles.childAvatar}>
                      <Text style={styles.childInitials}>
                        {child.firstName?.charAt(0)}{child.lastName?.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>
                        {child.firstName} {child.lastName}
                      </Text>
                      <Text style={styles.childEmail}>{child.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveChild(child._id, `${child.firstName} ${child.lastName}`)}
                    >
                      <Text style={styles.removeBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {children.length === 0 && (
              <View style={styles.noChildrenBox}>
                <Text style={styles.noChildrenIcon}>👶</Text>
                <Text style={styles.noChildrenText}>No children linked yet</Text>
                <Text style={styles.noChildrenSubtext}>Add your child's email below to get started</Text>
              </View>
            )}

            {/* Add new child */}
            <View style={styles.addChildSection}>
              <Text style={styles.addChildLabel}>Add Child by Email</Text>
              <View style={styles.addChildRow}>
                <TextInput
                  style={styles.addChildInput}
                  placeholder="Enter child's email address"
                  placeholderTextColor="#9ca3af"
                  value={newChildEmail}
                  onChangeText={(text) => {
                    setNewChildEmail(text);
                    setChildError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.addChildBtn, addingChild && styles.addChildBtnDisabled]}
                  onPress={handleAddChild}
                  disabled={addingChild}
                >
                  {addingChild ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addChildBtnText}>+ Add</Text>
                  )}
                </TouchableOpacity>
              </View>
              {childError ? (
                <Text style={styles.errorText}>{childError}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notification Preferences</Text>
          <View style={styles.card}>
            <ToggleRow
              icon="📧"
              title="Email Notifications"
              description="Receive email updates about your children's courses"
              value={emailNotifications}
              onToggle={setEmailNotifications}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon="🔔"
              title="Push Notifications"
              description="Get push notifications on your device"
              value={pushNotifications}
              onToggle={setPushNotifications}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon="📅"
              title="Assignment Reminders"
              description="Get reminded about upcoming deadlines"
              value={assignmentReminders}
              onToggle={setAssignmentReminders}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon="📊"
              title="Grade Notifications"
              description="Be notified when grades are posted"
              value={gradeNotifications}
              onToggle={setGradeNotifications}
            />

            <View style={[styles.saveRow, { marginTop: 16 }]}>
              <TouchableOpacity 
                style={[styles.saveBtn, savingNotifications && styles.saveBtnDisabled]}
                onPress={handleSaveNotifications}
                disabled={savingNotifications}
              >
                {savingNotifications ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Preferences</Text>
                )}
              </TouchableOpacity>
              {notifSaveSuccess && (
                <View style={styles.savedBadge}>
                  <Text style={styles.savedBadgeText}>✓ Saved</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Appearance</Text>
          <View style={styles.card}>
            <ToggleRow
              icon={darkMode ? '🌙' : '☀️'}
              title="Dark Mode"
              description="Switch to dark theme for comfortable viewing"
              value={darkMode}
              onToggle={setDarkMode}
            />
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Privacy & Security</Text>
          <View style={styles.card}>
            <ActionButton
              icon="🔒"
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => handleOpenModal('password')}
            />
            <View style={styles.divider} />
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleOpenModal('2fa')}
            >
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>🛡️</Text>
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Two-Factor Authentication</Text>
                <Text style={styles.actionSubtitle}>Add extra security to your account</Text>
              </View>
              {twoFAEnabled && (
                <View style={styles.badge2FA}>
                  <Text style={styles.badge2FAText}>ON</Text>
                </View>
              )}
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <ActionButton
              icon="🗑️"
              title="Delete Account"
              subtitle="Permanently delete your account and data"
              onPress={() => handleOpenModal('delete')}
              danger
            />
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, modalType === 'delete' && styles.modalCardDanger]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalIcon}>
                  {modalType === 'password' ? '🔒' : modalType === '2fa' ? '🛡️' : '⚠️'}
                </Text>
                <Text style={[styles.modalTitle, modalType === 'delete' && styles.modalTitleDanger]}>
                  {modalType === 'password' ? 'Change Password' : 
                   modalType === '2fa' ? 'Two-Factor Authentication' : 
                   'Delete Account'}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={handleCloseModal}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {modalType === 'password' && (
                <>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Current Password</Text>
                    <TextInput
                      style={styles.modalInput}
                      secureTextEntry
                      value={currentPass}
                      onChangeText={setCurrentPass}
                      placeholder="Enter current password"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>New Password</Text>
                    <TextInput
                      style={styles.modalInput}
                      secureTextEntry
                      value={newPass}
                      onChangeText={setNewPass}
                      placeholder="Enter new password"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Confirm New Password</Text>
                    <TextInput
                      style={styles.modalInput}
                      secureTextEntry
                      value={confirmPass}
                      onChangeText={setConfirmPass}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </>
              )}

              {modalType === '2fa' && (
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoText}>
                    {twoFAEnabled 
                      ? 'Two-factor authentication is currently enabled. Disabling it will make your account less secure.'
                      : 'Enable two-factor authentication to add an extra layer of security to your account.'}
                  </Text>
                </View>
              )}

              {modalType === 'delete' && (
                <View style={styles.modalInfo}>
                  <Text style={[styles.modalInfoText, { color: '#ef4444' }]}>
                    ⚠️ Warning: This action cannot be undone. All your data including linked children, messages, and settings will be permanently deleted.
                  </Text>
                </View>
              )}
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={handleCloseModal}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmBtn, 
                  modalType === 'delete' && styles.modalConfirmBtnDanger,
                  modalLoading && styles.modalConfirmBtnDisabled
                ]}
                onPress={handleConfirmAction}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>
                    {modalType === 'password' ? 'Change Password' :
                     modalType === '2fa' ? (twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA') :
                     'Delete Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  // Avatar styles
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  avatarInfo: {
    flex: 1,
    marginLeft: 16,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarBtn: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  avatarBtnText: {
    color: '#9333ea',
    fontSize: 13,
    fontWeight: '500',
  },
  avatarBtnOutline: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  avatarBtnOutlineText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
  // Form styles
  formSection: {
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
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#c4b5fd',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  savedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  savedBadgeText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '500',
  },
  // Children styles
  childrenList: {
    marginBottom: 16,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInitials: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  childInfo: {
    flex: 1,
    marginLeft: 12,
  },
  childName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  childEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
  },
  removeBtnText: {
    fontSize: 18,
  },
  noChildrenBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 16,
  },
  noChildrenIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  noChildrenText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  noChildrenSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  addChildSection: {
    marginTop: 8,
  },
  addChildLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  addChildRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addChildInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  addChildBtn: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  addChildBtnDisabled: {
    backgroundColor: '#c4b5fd',
  },
  addChildBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 8,
  },
  // Toggle styles
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
    marginRight: 12,
  },
  toggleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleIcon: {
    fontSize: 18,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  // Action button styles
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonDanger: {},
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIconDanger: {
    backgroundColor: '#fef2f2',
  },
  actionIcon: {
    fontSize: 18,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  actionTitleDanger: {
    color: '#ef4444',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  badge2FA: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  badge2FAText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
  },
  // Logout styles
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalCardDanger: {
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalTitleDanger: {
    color: '#ef4444',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalBody: {
    padding: 16,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  modalInfo: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalCancelBtnText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  modalConfirmBtn: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  modalConfirmBtnDanger: {
    backgroundColor: '#ef4444',
  },
  modalConfirmBtnDisabled: {
    opacity: 0.7,
  },
  modalConfirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
