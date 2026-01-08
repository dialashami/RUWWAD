import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationAPI } from '../../services/api';

const defaultNotifications = [
  {
    id: 1,
    title: 'New Assignment Posted',
    message: 'Your teacher posted a new Math assignment due in 3 days.',
    time: '10 minutes ago',
    type: 'assignment',
    read: false,
  },
  {
    id: 2,
    title: 'Grade Updated',
    message: 'Your Physics test grade has been updated. You scored 85%!',
    time: '1 hour ago',
    type: 'grade',
    read: false,
  },
  {
    id: 3,
    title: 'Class Reminder',
    message: 'Your Chemistry class starts in 30 minutes.',
    time: '2 hours ago',
    type: 'reminder',
    read: true,
  },
  {
    id: 4,
    title: 'Achievement Unlocked',
    message: 'Congratulations! You\'ve earned the "Fast Learner" badge.',
    time: 'Yesterday',
    type: 'achievement',
    read: true,
  },
  {
    id: 5,
    title: 'New Message',
    message: 'You have a new message from Mr. Ahmed.',
    time: '2 days ago',
    type: 'message',
    read: true,
  },
];

export default function Notifications({ onNotificationsRead, decrementUnreadNotifications }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      const data = response.data.notifications || response.data || [];
      if (data.length > 0) {
        setNotifications(data.map(n => ({
          id: n._id || n.id,
          title: n.title,
          message: n.message,
          time: formatTime(n.createdAt),
          type: n.type || 'notification',
          read: n.isRead || false,
        })));
      } else {
        setNotifications(defaultNotifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications(defaultNotifications);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'assignment':
        return '📝';
      case 'grade':
        return '📊';
      case 'reminder':
        return '⏰';
      case 'achievement':
        return '🏆';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'assignment':
        return '#007bff';
      case 'grade':
        return '#28a745';
      case 'reminder':
        return '#ffc107';
      case 'achievement':
        return '#6f42c1';
      case 'message':
        return '#17a2b8';
      default:
        return '#6b7280';
    }
  };

  const markAsRead = async (id) => {
    // Check if notification was unread
    const notification = notifications.find(n => n.id === id);
    const wasUnread = notification && !notification.read;
    
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    
    // Update parent count
    if (wasUnread && decrementUnreadNotifications) {
      decrementUnreadNotifications(1);
    }
    
    try {
      // Don't call API for default notifications
      if (typeof id === 'string' && !id.toString().startsWith('fallback')) {
        await notificationAPI.markAsRead(id);
      } else if (typeof id !== 'number') {
        await notificationAPI.markAsRead(id);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    
    // Update parent count to 0
    if (onNotificationsRead) {
      onNotificationsRead();
    }
    
    try {
      await notificationAPI.markAllAsRead();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Text style={styles.bannerTitle}>Notifications</Text>
            <Text style={styles.bannerSubtitle}>{unreadCount} unread notifications</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Notifications List */}
      <ScrollView 
        style={styles.notificationsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
        }
      >
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.read && styles.unreadCard,
            ]}
            onPress={() => markAsRead(notification.id)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getTypeColor(notification.type) + '20' },
              ]}
            >
              <Text style={styles.icon}>{getTypeIcon(notification.type)}</Text>
            </View>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                {!notification.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
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
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  markAllText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
    padding: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
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
});
