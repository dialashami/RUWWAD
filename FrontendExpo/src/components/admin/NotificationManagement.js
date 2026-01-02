import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { notificationAPI } from '../../services/api';

export default function NotificationManagement({ onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationAPI.getAdminNotifications();
      const data = response.data || [];
      
      const mapped = Array.isArray(data)
        ? data.map(n => ({
            id: n._id,
            title: n.title || 'No Title',
            message: n.message || n.body || '',
            type: n.type || 'other',
            isRead: n.isRead || false,
            createdAt: n.createdAt,
          }))
        : [];
      
      setNotifications(mapped);
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await notificationAPI.markAsRead(id);
      if (onUnreadCountChange) {
        onUnreadCountChange();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      Alert.alert('Error', 'Failed to mark notification as read.');
    }
  };

  const handleViewDetails = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    setSelectedNotification(notification);
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
              await notificationAPI.deleteNotification(id);
              setNotifications(prev => prev.filter(n => n.id !== id));
              setSelectedIds(prev => prev.filter(i => i !== id));
              if (onUnreadCountChange) {
                onUnreadCountChange();
              }
            } catch (err) {
              console.error('Error deleting notification:', err);
              Alert.alert('Error', 'Failed to delete notification.');
            }
          },
        },
      ]
    );
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      Alert.alert(
        'Delete Selected',
        `Delete ${selectedIds.length} selected notifications?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                for (const id of selectedIds) {
                  await notificationAPI.deleteNotification(id);
                }
                setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
                setSelectedIds([]);
                if (onUnreadCountChange) {
                  onUnreadCountChange();
                }
              } catch (err) {
                console.error('Error deleting notifications:', err);
                Alert.alert('Error', 'Failed to delete some notifications.');
              }
            },
          },
        ]
      );
    } else if (action === 'markRead') {
      Alert.alert(
        'Mark as Read',
        `Mark ${selectedIds.length} selected notifications as read?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Read',
            onPress: async () => {
              try {
                for (const id of selectedIds) {
                  await notificationAPI.markAsRead(id);
                }
                setNotifications(prev =>
                  prev.map(n => (selectedIds.includes(n.id) ? { ...n, isRead: true } : n))
                );
                setSelectedIds([]);
                if (onUnreadCountChange) {
                  onUnreadCountChange();
                }
              } catch (err) {
                console.error('Error marking notifications as read:', err);
                Alert.alert('Error', 'Failed to mark some notifications as read.');
              }
            },
          },
        ]
      );
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (notification.title || '').toLowerCase().includes(q) ||
      (notification.message || '').toLowerCase().includes(q);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unread' && !notification.isRead) ||
      (filterStatus === 'read' && notification.isRead);

    const matchesType =
      filterType === 'all' || notification.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      message: { bg: '#dbeafe', text: '#1d4ed8' },
      assignment: { bg: '#fef3c7', text: '#d97706' },
      course: { bg: '#d1fae5', text: '#059669' },
      enrollment: { bg: '#e0e7ff', text: '#4f46e5' },
      system: { bg: '#fee2e2', text: '#dc2626' },
      grade: { bg: '#fce7f3', text: '#db2777' },
      other: { bg: '#f3f4f6', text: '#6b7280' },
    };
    return colors[type] || colors.other;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
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
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Management</Text>
        <Text style={styles.headerSubtitle}>
          View and manage admin notifications and system alerts
        </Text>
      </View>

      {/* Filters Card */}
      <View style={styles.filtersCard}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Row */}
        <View style={styles.filterRow}>
          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[
              { value: 'all', label: 'All Status' },
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  filterStatus === option.value && styles.filterChipActive,
                ]}
                onPress={() => setFilterStatus(option.value)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterStatus === option.value && styles.filterChipTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Type Filter */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[
              { value: 'all', label: 'All Types' },
              { value: 'message', label: 'Messages' },
              { value: 'assignment', label: 'Assignments' },
              { value: 'course', label: 'Courses' },
              { value: 'system', label: 'System' },
              { value: 'grade', label: 'Grades' },
              { value: 'other', label: 'Other' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  filterType === option.value && styles.filterChipActive,
                ]}
                onPress={() => setFilterType(option.value)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterType === option.value && styles.filterChipTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <View style={styles.bulkActions}>
            <Text style={styles.bulkActionsText}>{selectedIds.length} selected</Text>
            <TouchableOpacity
              style={styles.bulkButton}
              onPress={() => handleBulkAction('markRead')}
            >
              <Text style={styles.bulkButtonText}>✓ Mark Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkDeleteButton]}
              onPress={() => handleBulkAction('delete')}
            >
              <Text style={[styles.bulkButtonText, styles.bulkDeleteText]}>🗑 Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSelectedIds([])}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <TouchableOpacity style={styles.checkboxCell} onPress={toggleSelectAll}>
          <View style={[
            styles.checkbox,
            filteredNotifications.length > 0 && selectedIds.length === filteredNotifications.length && styles.checkboxChecked,
          ]}>
            {filteredNotifications.length > 0 && selectedIds.length === filteredNotifications.length && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </TouchableOpacity>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Title</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Type</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Actions</Text>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>
              {loading ? 'Loading notifications...' : 'No notifications match your filters.'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map(notification => {
            const typeColor = getTypeColor(notification.type);
            return (
              <View
                key={notification.id}
                style={[
                  styles.notificationRow,
                  !notification.isRead && styles.notificationRowUnread,
                ]}
              >
                <TouchableOpacity
                  style={styles.checkboxCell}
                  onPress={() => toggleSelect(notification.id)}
                >
                  <View style={[
                    styles.checkbox,
                    selectedIds.includes(notification.id) && styles.checkboxChecked,
                  ]}>
                    {selectedIds.includes(notification.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.titleCell}
                  onPress={() => handleViewDetails(notification)}
                >
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage} numberOfLines={1}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationDate}>{formatDate(notification.createdAt)}</Text>
                </TouchableOpacity>

                <View style={styles.typeCell}>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>
                      {notification.type}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusCell}>
                  <View style={[
                    styles.statusBadge,
                    notification.isRead ? styles.statusRead : styles.statusUnread,
                  ]}>
                    <Text style={styles.statusIcon}>
                      {notification.isRead ? '✓' : '●'}
                    </Text>
                    <Text style={[
                      styles.statusText,
                      notification.isRead ? styles.statusTextRead : styles.statusTextUnread,
                    ]}>
                      {notification.isRead ? 'Read' : 'Unread'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsCell}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewDetails(notification)}
                  >
                    <Text style={styles.actionIcon}>ℹ️</Text>
                  </TouchableOpacity>
                  {!notification.isRead && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsRead(notification.id)}
                    >
                      <Text style={styles.actionIcon}>✓</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteNotification(notification.id)}
                  >
                    <Text style={styles.actionIconRed}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={selectedNotification !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedNotification(null)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Notification Details</Text>

            {selectedNotification && (
              <>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Title</Text>
                  <Text style={styles.modalValue}>{selectedNotification.title}</Text>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Message</Text>
                  <Text style={styles.modalValue}>
                    {selectedNotification.message || 'No message provided.'}
                  </Text>
                </View>

                <View style={styles.modalFieldRow}>
                  <View style={styles.modalFieldHalf}>
                    <Text style={styles.modalLabel}>Type</Text>
                    <Text style={styles.modalValue}>{selectedNotification.type}</Text>
                  </View>
                  <View style={styles.modalFieldHalf}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <Text style={styles.modalValue}>
                      {selectedNotification.isRead ? 'Read' : 'Unread'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Created At</Text>
                  <Text style={styles.modalValue}>
                    {formatDate(selectedNotification.createdAt)}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedNotification(null)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  filtersCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  filterRow: {
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkActionsText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '600',
  },
  bulkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  bulkDeleteButton: {
    backgroundColor: '#dc2626',
  },
  bulkButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  bulkDeleteText: {
    color: '#fff',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  countRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  countText: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  notificationsList: {
    flex: 1,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  notificationRowUnread: {
    backgroundColor: '#eff6ff',
  },
  checkboxCell: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleCell: {
    flex: 2,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  notificationDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  typeCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusRead: {
    backgroundColor: '#f3f4f6',
  },
  statusUnread: {
    backgroundColor: '#dbeafe',
  },
  statusIcon: {
    fontSize: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusTextRead: {
    color: '#6b7280',
  },
  statusTextUnread: {
    color: '#2563eb',
  },
  actionsCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  actionIcon: {
    fontSize: 12,
  },
  actionIconRed: {
    fontSize: 12,
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
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#9ca3af',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  modalField: {
    marginBottom: 16,
  },
  modalFieldRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  modalFieldHalf: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  modalCloseButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
});
