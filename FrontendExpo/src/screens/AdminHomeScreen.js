import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { messageAPI, notificationAPI } from '../services/api';

// Import components
import DashboardOverview from '../components/admin/DashboardOverview';
import UserManagement from '../components/admin/UserManagement';
import NotificationManagement from '../components/admin/NotificationManagement';
import SystemSettings from '../components/admin/SystemSettings';
import ChatCenter from '../components/shared/ChatCenter';
import Settings from '../components/shared/Settings';
import FeedbackStar from '../components/shared/FeedbackStar';

export default function AdminHomeScreen({ navigation }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userName, setUserName] = useState('Admin');

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin');
      }

      const msgResponse = await messageAPI.getConversations();
      const conversations = msgResponse.data || [];
      const totalUnreadMsgs = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadMessages(totalUnreadMsgs);

      const notifResponse = await notificationAPI.getNotifications();
      const notifications = notifResponse.data?.notifications || notifResponse.data || [];
      const totalUnreadNotifs = notifications.filter(n => !n.isRead).length;
      setUnreadNotifications(totalUnreadNotifs);
    } catch (err) {
      console.log('Error fetching unread counts:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  useEffect(() => {
    if (activePage !== 'communication') {
      fetchUnreadCounts();
    }
  }, [activePage, fetchUnreadCounts]);

  const onMessagesRead = useCallback(() => setUnreadMessages(0), []);
  const onNotificationsRead = useCallback(() => setUnreadNotifications(0), []);
  const decrementUnreadMessages = useCallback((count = 1) => setUnreadMessages(prev => Math.max(0, prev - count)), []);
  const decrementUnreadNotifications = useCallback((count = 1) => setUnreadNotifications(prev => Math.max(0, prev - count)), []);

  const getMenuItems = () => [
    { id: 'dashboard', title: 'Dashboard', icon: '📊', badge: 0 },
    { id: 'users', title: 'Users', icon: '👥', badge: 0 },
    { id: 'notifications', title: 'Notifications', icon: '🔔', badge: unreadNotifications },
    { id: 'communication', title: 'Messages', icon: '💬', badge: unreadMessages },
    { id: 'system-settings', title: 'System Settings', icon: '🛠️', badge: 0 },
    { id: 'settings', title: 'Profile Settings', icon: '⚙️', badge: 0 },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UserManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'communication':
        return (
          <ChatCenter 
            currentRole="admin"
            onMessagesRead={onMessagesRead}
            decrementUnreadMessages={decrementUnreadMessages}
          />
        );
      case 'system-settings':
        return <SystemSettings />;
      case 'settings':
        return <Settings navigation={navigation} />;
      default:
        return <DashboardOverview />;
    }
  };

  const handleMenuPress = (pageId) => {
    setActivePage(pageId);
    setSidebarVisible(false);
  };

  const getActiveTitle = () => {
    const item = menuItems.find(m => m.id === activePage);
    return item ? item.title : 'Dashboard';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getActiveTitle()}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconContainer}
            onPress={() => setActivePage('notifications')}
          >
            <Text style={styles.headerIcon}>🔔</Text>
            {unreadNotifications > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconContainer}
            onPress={() => setActivePage('communication')}
          >
            <Text style={styles.headerIcon}>💬</Text>
            {unreadMessages > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadMessages > 9 ? '9+' : unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderPage()}
      </View>

      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sidebar}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.profileSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>👨‍💼</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{userName}</Text>
                  <Text style={styles.profileRole}>RUWWAD Administrator</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSidebarVisible(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuContainer}>
              {getMenuItems().map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    activePage === item.id && styles.menuItemActive
                  ]}
                  onPress={() => handleMenuPress(item.id)}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.menuItemText,
                    activePage === item.id && styles.menuItemTextActive
                  ]}>
                    {item.title}
                  </Text>
                  {item.badge > 0 && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                setSidebarVisible(false);
                navigation.replace('Login');
              }}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Overlay to close sidebar */}
          <TouchableOpacity
            style={styles.overlayClose}
            onPress={() => setSidebarVisible(false)}
          />
        </View>
      </Modal>

      {/* Feedback Star */}
      <FeedbackStar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    fontSize: 22,
  },
  mainContent: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '75%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  overlayClose: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarHeader: {
    backgroundColor: '#4f46e5',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 28,
  },
  profileInfo: {},
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileRole: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: '#fff',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: '#eef2ff',
  },
  menuItemIcon: {
    fontSize: 22,
    marginRight: 16,
    width: 30,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  menuItemTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  menuBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  headerIconContainer: {
    position: 'relative',
    marginLeft: 12,
  },
  headerBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 10,
  },
  logoutIcon: {
    fontSize: 22,
    marginRight: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
  },
});
