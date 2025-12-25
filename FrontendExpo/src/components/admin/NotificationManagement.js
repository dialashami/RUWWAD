import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from 'react-native';
import { notificationAPI } from '../../services/api';

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetRole: 'all',
    isImportant: false,
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      const data = response.data?.notifications || response.data || [];
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Demo data if API fails
      setNotifications([
        {
          _id: '1',
          title: 'Welcome to RUWWAD',
          body: 'Thank you for joining our platform!',
          targetRole: 'all',
          isImportant: false,
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          title: 'System Maintenance',
          body: 'Scheduled maintenance on Sunday',
          targetRole: 'all',
          isImportant: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.body) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    try {
      await notificationAPI.sendNotification(formData);
      Alert.alert('Success', 'Notification sent successfully');
      setShowModal(false);
      setFormData({
        title: '',
        body: '',
        targetRole: 'all',
        isImportant: false,
      });
      fetchNotifications();
    } catch (err) {
      // Add to local list for demo
      const newNotification = {
        _id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setNotifications([newNotification, ...notifications]);
      setShowModal(false);
      setFormData({
        title: '',
        body: '',
        targetRole: 'all',
        isImportant: false,
      });
    }
  };

  const handleDeleteNotification = async (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/notifications/${id}`);
            } catch (err) {
              // Continue even if API fails
            }
            setNotifications(notifications.filter(n => n._id !== id));
          },
        },
      ]
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'important') return n.isImportant;
    return n.targetRole === filter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notification Management</Text>
          <Text style={styles.headerSubtitle}>Send and manage platform notifications</Text>
        </View>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.sendButtonText}>+ Send New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['all', 'important', 'student', 'teacher', 'parent'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <View key={notification._id} style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationTitleRow}>
                  {notification.isImportant && (
                    <Text style={styles.importantBadge}>⚠️</Text>
                  )}
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteNotification(notification._id)}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.notificationBody}>{notification.body}</Text>
              <View style={styles.notificationFooter}>
                <View style={styles.targetBadge}>
                  <Text style={styles.targetText}>
                    {notification.targetRole === 'all' ? '👥 All Users' : `👤 ${notification.targetRole}`}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{formatDate(notification.createdAt)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications sent yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Send Notification Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Send Notification</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Notification title"
                placeholderTextColor="#9ca3af"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Notification message..."
                placeholderTextColor="#9ca3af"
                value={formData.body}
                onChangeText={(text) => setFormData({ ...formData, body: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Audience</Text>
              <View style={styles.targetOptions}>
                {['all', 'student', 'teacher', 'parent'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.targetOption,
                      formData.targetRole === role && styles.targetOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, targetRole: role })}
                  >
                    <Text style={[
                      styles.targetOptionText,
                      formData.targetRole === role && styles.targetOptionTextActive
                    ]}>
                      {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mark as Important</Text>
              <Switch
                value={formData.isImportant}
                onValueChange={(value) => setFormData({ ...formData, isImportant: value })}
                trackColor={{ false: '#e5e7eb', true: '#4f46e5' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSendNotification}
              >
                <Text style={styles.submitButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#4f46e5',
  },
  filterTabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  notificationsList: {
    flex: 1,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  importantBadge: {
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  deleteIcon: {
    fontSize: 16,
  },
  notificationBody: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  targetText: {
    fontSize: 12,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#9ca3af',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
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
  formInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 100,
  },
  targetOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  targetOptionActive: {
    backgroundColor: '#4f46e5',
  },
  targetOptionText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  targetOptionTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
