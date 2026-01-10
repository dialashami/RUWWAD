import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { notificationAPI } from '../services/api';

// Context
import { useTheme } from '../context/ThemeContext';

// Import components
import DashboardOverview from '../components/admin/DashboardOverview';
import UserManagement from '../components/admin/UserManagement';
import NotificationManagement from '../components/admin/NotificationManagement';
import CommunicationCenter from '../components/admin/CommunicationCenter';
import SystemSettings from '../components/admin/SystemSettings';
import FeedbackStar from '../components/shared/FeedbackStar';

export default function AdminHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isDarkMode, theme } = useTheme();
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userName, setUserName] = useState('Admin');

  // Handle logout
  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigation.replace('Login');
  };

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin');
      }

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

  const onNotificationsRead = useCallback(() => setUnreadNotifications(0), []);
  const decrementUnreadNotifications = useCallback((count = 1) => setUnreadNotifications(prev => Math.max(0, prev - count)), []);

  const getMenuItems = () => [
    { id: 'dashboard', title: 'Dashboard', icon: '📊', badge: 0 },
    { id: 'users', title: 'Users', icon: '👥', badge: 0 },
    { id: 'notifications', title: 'Notifications', icon: '🔔', badge: unreadNotifications },
    { id: 'communication', title: 'Communication Center', icon: '📧', badge: 0 },
    { id: 'system-settings', title: 'System Settings', icon: '🛠️', badge: 0 },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UserManagement />;
      case 'notifications':
        return <NotificationManagement onUnreadCountChange={fetchUnreadCounts} />;
      case 'communication':
        return <CommunicationCenter />;
      case 'system-settings':
        return <SystemSettings navigation={navigation} />;
      default:
        return <DashboardOverview />;
    }
  };

  const handleMenuPress = (pageId) => {
    setActivePage(pageId);
    setSidebarVisible(false);
  };

  const getActiveTitle = () => {
    const items = getMenuItems();
    const item = items.find(m => m.id === activePage);
    return item ? item.title : 'Dashboard';
  };

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: theme.background }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.navbar, isDarkMode && { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Text style={[styles.menuIcon, isDarkMode && { color: theme.text }]}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTitleContainer} onPress={() => setActivePage('dashboard')}>
          <Text style={[styles.navTitle, isDarkMode && { color: theme.primary }]}>RUWWAD</Text>
        </TouchableOpacity>
        <View style={styles.navRight}>
          <TouchableOpacity 
            style={styles.navIcon}
            onPress={() => setActivePage('notifications')}
          >
            <Text>🔔</Text>
            {unreadNotifications > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={[styles.mainContent, isDarkMode && { backgroundColor: theme.background }]}>
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
          <View style={[styles.sidebar, isDarkMode && { backgroundColor: theme.surface }]}>
            {/* Sidebar Header with Logo */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity style={styles.sidebarLogoContainer} onPress={() => { setActivePage('dashboard'); setSidebarVisible(false); }}>
                <Image source={require('../../assets/logoRUWWAD2.png')} style={styles.sidebarLogoImage} />
                <Text style={styles.sidebarLogo}>RUWWAD</Text>
              </TouchableOpacity>
              <Text style={styles.sidebarSubtitle}>Admin Portal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSidebarVisible(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* User Profile Section */}
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>👨‍💼</Text>
              </View>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userRole}>Administrator</Text>
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
                handleLogout();
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

      {/* Feedback Star - Only on Dashboard */}
      {activePage === 'dashboard' && <FeedbackStar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2c3e50',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    position: 'relative',
  },
  menuButton: {
    padding: 8,
    zIndex: 1,
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
  },
  navTitleContainer: {
    position: 'absolute',
    left: '30%',
    right: '30%',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 35,
    zIndex: 0,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  navIcon: {
    padding: 5,
  },
  navBadge: {
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
  navBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: '75%',
    backgroundColor: '#2c3e50',
    height: '100%',
  },
  sidebarHeader: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sidebarLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sidebarLogoImage: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  sidebarLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 15,
    padding: 5,
  },
  closeIcon: {
    fontSize: 20,
    color: '#fff',
  },
  userInfo: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 28,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
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
    backgroundColor: 'rgba(0, 123, 255, 0.2)',
  },
  menuItemIcon: {
    fontSize: 22,
    marginRight: 16,
    width: 30,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  menuItemTextActive: {
    color: '#007bff',
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 20,
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
});
