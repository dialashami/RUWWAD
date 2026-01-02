import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminDashboardAPI, notificationAPI } from '../../services/api';

export default function CommunicationCenter() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [users, setUsers] = useState([]);
  const [recipientGroup, setRecipientGroup] = useState('all');
  const [recipientTarget, setRecipientTarget] = useState('all');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showTargetPicker, setShowTargetPicker] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminDashboardAPI.getUsers();
      const data = response.data?.users || response.data || [];
      
      const mappedUsers = data.map(u => ({
        id: u._id || u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: u.role || 'user',
      }));
      
      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const getRecipientGroupLabel = () => {
    switch (recipientGroup) {
      case 'students': return 'Students';
      case 'teachers': return 'Teachers';
      case 'parents': return 'Parents';
      default: return 'All Users';
    }
  };

  const getRecipientUsersForGroup = () => {
    switch (recipientGroup) {
      case 'students': return users.filter(u => u.role === 'student');
      case 'teachers': return users.filter(u => u.role === 'teacher');
      case 'parents': return users.filter(u => u.role === 'parent');
      default: return [];
    }
  };

  const getRecipientIdsForSelection = () => {
    if (recipientTarget && recipientTarget !== 'all') {
      return [recipientTarget];
    }

    if (!recipientGroup || recipientGroup === 'all') {
      return users.map(u => u.id);
    }

    return getRecipientUsersForGroup().map(u => u.id);
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message before sending.');
      return;
    }

    const recipientIds = getRecipientIdsForSelection();
    if (!recipientIds || recipientIds.length === 0) {
      Alert.alert('Error', 'No recipients found for selected criteria.');
      return;
    }

    Alert.alert(
      'Send Email',
      `Send notification to ${recipientIds.length} recipient(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setSendingEmail(true);
              let successCount = 0;

              for (const userId of recipientIds) {
                try {
                  await notificationAPI.sendNotification({
                    user: userId,
                    title: emailSubject.trim(),
                    message: emailBody.trim(),
                    type: 'message',
                  });
                  successCount++;
                } catch (singleErr) {
                  console.error('Error creating notification for user', userId, singleErr);
                }
              }

              if (successCount === 0) {
                Alert.alert('Error', 'Failed to send email notifications.');
                return;
              }

              Alert.alert('Success', `Email notifications sent to ${successCount} recipient(s).`);
              setEmailBody('');
              setEmailSubject('');
            } catch (err) {
              console.error('Error sending bulk email notification:', err);
              Alert.alert('Error', 'Error sending email notifications: ' + err.message);
            } finally {
              setSendingEmail(false);
            }
          },
        },
      ]
    );
  };

  const recipientUsersInGroup = getRecipientUsersForGroup();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
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
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Communication Center</Text>
          <Text style={styles.headerSubtitle}>Connect with teachers, parents, and students</Text>
        </View>

      {/* Email Badge */}
      <View style={styles.tabContainer}>
        <View style={styles.emailTab}>
          <Text style={styles.emailTabIcon}>✉️</Text>
          <Text style={styles.emailTabText}>Email</Text>
        </View>
      </View>

      {/* Send Bulk Email Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Send Bulk Email</Text>

        {/* Recipients Group */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Recipients</Text>
          <View style={styles.pickerContainer}>
            {['all', 'students', 'teachers', 'parents'].map(group => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.pickerOption,
                  recipientGroup === group && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  setRecipientGroup(group);
                  setRecipientTarget('all');
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  recipientGroup === group && styles.pickerOptionTextActive,
                ]}>
                  {group === 'all' ? 'All Users' : group.charAt(0).toUpperCase() + group.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target in Category (if not all) */}
        {recipientGroup !== 'all' && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Target in {getRecipientGroupLabel()}</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowTargetPicker(!showTargetPicker)}
            >
              <Text style={styles.dropdownText}>
                {recipientTarget === 'all' 
                  ? `All ${getRecipientGroupLabel()}`
                  : recipientUsersInGroup.find(u => u.id === recipientTarget)?.name || 'Select user'
                }
              </Text>
              <Text style={styles.dropdownArrow}>{showTargetPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {showTargetPicker && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={[styles.dropdownItem, recipientTarget === 'all' && styles.dropdownItemActive]}
                  onPress={() => {
                    setRecipientTarget('all');
                    setShowTargetPicker(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>All {getRecipientGroupLabel()}</Text>
                </TouchableOpacity>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {recipientUsersInGroup.map(user => (
                    <TouchableOpacity
                      key={user.id}
                      style={[styles.dropdownItem, recipientTarget === user.id && styles.dropdownItemActive]}
                      onPress={() => {
                        setRecipientTarget(user.id);
                        setShowTargetPicker(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText} numberOfLines={1}>
                        {user.name} ({user.email})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Subject */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email subject"
            placeholderTextColor="#9ca3af"
            value={emailSubject}
            onChangeText={setEmailSubject}
          />
        </View>

        {/* Message */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your message here..."
            placeholderTextColor="#9ca3af"
            value={emailBody}
            onChangeText={setEmailBody}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.draftButton}>
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, sendingEmail && styles.sendButtonDisabled]}
            onPress={handleSendEmail}
            disabled={sendingEmail}
          >
            <Text style={styles.sendButtonText}>
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  emailTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  emailTabIcon: {
    fontSize: 16,
  },
  emailTabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pickerOptionText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  pickerOptionTextActive: {
    color: '#fff',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  draftButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  draftButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  sendButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
