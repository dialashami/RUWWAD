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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI, parentDashboardAPI } from '../../services/api';

export default function ParentSettings({ navigation }) {
  // User data
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Settings
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Children management
  const [children, setChildren] = useState([]);
  const [newChildEmail, setNewChildEmail] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [childError, setChildError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user data
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
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
    await fetchChildren();
    setRefreshing(false);
  };

  const handleAddChild = async () => {
    if (!newChildEmail.trim()) {
      setChildError('Please enter an email address');
      return;
    }

    // Basic email validation
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
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('user');
            navigation.replace('Welcome');
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, hasSwitch, value, onToggle, onPress }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View style={styles.settingIcon}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {hasSwitch ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#e5e7eb', true: '#9333ea' }}
          thumbColor="#fff"
        />
      ) : (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Parent' : 'Parent';
  const userEmail = user?.email || 'parent@example.com';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9333ea']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your preferences</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My Children Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 My Children</Text>
        <View style={styles.settingsCard}>
          <Text style={styles.childrenDescription}>
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

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingsCard}>
          <SettingItem
            icon="🔔"
            title="Push Notifications"
            subtitle="Receive push notifications"
            hasSwitch
            value={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="📧"
            title="Email Alerts"
            subtitle="Receive email notifications"
            hasSwitch
            value={emailAlerts}
            onToggle={setEmailAlerts}
          />
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingsCard}>
          <SettingItem
            icon="🌙"
            title="Dark Mode"
            subtitle="Enable dark theme"
            hasSwitch
            value={darkMode}
            onToggle={setDarkMode}
          />
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <SettingItem
            icon="🔒"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => Alert.alert('Password', 'Password change coming soon!')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="🔐"
            title="Privacy"
            subtitle="Manage your privacy settings"
            onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon!')}
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
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  profileEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
  },
  editBtnText: {
    color: '#9333ea',
    fontWeight: '600',
  },
  childrenDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
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
});
