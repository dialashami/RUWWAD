import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { notificationAPI } from '../../services/api';

const quickTemplates = [
  {
    id: 1,
    title: 'Assignment Reminder',
    content: 'This is a reminder that your assignment is due soon. Please submit it on time.',
    type: 'reminder',
    icon: '📝',
  },
  {
    id: 2,
    title: 'Class Cancellation',
    content: 'Your class has been cancelled. You will be notified of the rescheduled time.',
    type: 'cancellation',
    icon: '❌',
  },
  {
    id: 3,
    title: 'Grade Posted',
    content: 'Your grades have been posted. Please check your gradebook.',
    type: 'grade',
    icon: '📊',
  },
  {
    id: 4,
    title: 'Study Tips',
    content: 'Here are some helpful study tips for your upcoming exam.',
    type: 'tip',
    icon: '💡',
  },
];

export default function TeacherNotifications({ onNotificationsRead, decrementUnreadNotifications }) {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSentNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getSentNotifications();
      const data = response.data || [];
      
      const formattedNotifications = data.map(n => ({
        id: n._id || n.id,
        title: n.title,
        content: n.body || n.message || n.content,
        type: n.type || 'notification',
        date: formatDate(n.createdAt),
        status: n.status || 'sent',
        recipientCount: n.recipientCount || 0,
      }));
      
      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching sent notifications:', err);
      // Show some sample data
      setNotifications([
        {
          id: 1,
          title: 'Welcome Message',
          content: 'Welcome to the new semester!',
          type: 'announcement',
          date: 'Jan 15, 2025',
          status: 'sent',
          recipientCount: 25,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchSentNotifications();
  }, [fetchSentNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSentNotifications();
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setMessage(template.content);
  };

  const handleSendNotification = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message or select a template');
      return;
    }

    setSending(true);
    try {
      // Check if Assignment Reminder template is selected
      if (selectedTemplate && selectedTemplate.type === 'reminder') {
        const response = await notificationAPI.sendAssignmentReminder(message);
        const data = response.data;

        const newNotification = {
          id: Date.now(),
          title: 'Assignment Reminder',
          content: message,
          type: 'reminder',
          date: formatDate(new Date()),
          status: 'sent',
          studentsNotified: data?.studentsNotified || 0,
          recipientCount: data?.studentsNotified || 0,
        };

        setNotifications([newNotification, ...notifications]);
        setMessage('');
        setSelectedTemplate(null);

        if (data?.notificationsSent === 0) {
          Alert.alert('Notice', 'No assignments due tomorrow. No students were notified.');
        } else {
          Alert.alert(
            'Success',
            `Assignment reminder sent!\n\nStudents notified: ${data?.studentsNotified || 0}`
          );
        }
      } else {
        // Send custom or other template notification
        const title = selectedTemplate?.title || 'Teacher Notification';
        const type = selectedTemplate?.type || 'custom';

        await notificationAPI.sendNotification({
          title,
          body: message,
          type,
          recipientType: 'students', // Send to all students
        });

        const newNotification = {
          id: Date.now(),
          title,
          content: message,
          type,
          date: formatDate(new Date()),
          status: 'sent',
        };

        setNotifications([newNotification, ...notifications]);
        setMessage('');
        setSelectedTemplate(null);

        Alert.alert('Success', 'Notification sent successfully!');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      Alert.alert('Error', 'Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return '#28a745';
      case 'pending': return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6b7280';
    }
  };

  const renderTemplatesTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
      }
    >
      {/* Quick Templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Templates</Text>
        <View style={styles.templateGrid}>
          {quickTemplates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplate?.id === template.id && styles.templateCardSelected,
              ]}
              onPress={() => handleTemplateSelect(template)}
            >
              <Text style={styles.templateIcon}>{template.icon}</Text>
              <Text style={styles.templateTitle}>{template.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Message Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedTemplate ? `Edit ${selectedTemplate.title}` : 'Custom Message'}
        </Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your message here..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.sendButton, sending && styles.sendButtonDisabled]}
        onPress={handleSendNotification}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.sendButtonIcon}>📤</Text>
            <Text style={styles.sendButtonText}>Send Notification</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
      }
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No notifications sent yet</Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationItem}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(notification.status) }]}>
                <Text style={styles.statusText}>{notification.status}</Text>
              </View>
            </View>
            <Text style={styles.notificationContent}>{notification.content}</Text>
            <View style={styles.notificationFooter}>
              <Text style={styles.notificationDate}>{notification.date}</Text>
              {notification.recipientCount > 0 && (
                <Text style={styles.recipientCount}>
                  {notification.recipientCount} recipients
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Send notifications to your students</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
            📝 Send New
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            📜 History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'templates' ? renderTemplatesTab() : renderHistoryTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#007bff',
  },
  tabContent: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  templateCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  templateCardSelected: {
    borderColor: '#007bff',
    backgroundColor: '#e0f2fe',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  messageInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 120,
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  notificationContent: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recipientCount: {
    fontSize: 12,
    color: '#007bff',
  },
});
