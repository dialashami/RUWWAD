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
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Context Provider
import { TeacherProvider, useTeacher } from '../context/TeacherContext';

// Import components
import Dashboard from '../components/teacher/Dashboard';
import LessonManagement from '../components/teacher/LessonManagement';
import AssignmentManagement from '../components/teacher/AssignmentManagement';
import ChatCenter from '../components/shared/ChatCenter';
import TeacherNotifications from '../components/teacher/Notifications';
import AITutorPage from '../components/shared/AITutorPage';
import Settings from '../components/shared/Settings';
import FeedbackStar from '../components/shared/FeedbackStar';

// Inner component that uses context
function TeacherHomeContent({ navigation }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Get data from context
  const {
    teacher,
    stats,
    getInitials,
    getFullName,
    getSpecializationDisplay,
    updateUnreadMessages,
    updateUnreadNotifications,
    decrementUnreadMessages,
    decrementUnreadNotifications,
    refreshData,
  } = useTeacher();

  // Menu items with dynamic badges from context
  const getMenuItems = () => [
    { id: 'dashboard', title: 'Dashboard', icon: '📊', badge: 0 },
    { id: 'lessons', title: 'My Lessons', icon: '📚', badge: 0 },
    { id: 'assignments', title: 'Assignments', icon: '📝', badge: stats.pendingSubmissions || 0 },
    { id: 'chat', title: 'Messages', icon: '💬', badge: stats.unreadMessages || 0 },
    { id: 'notifications', title: 'Notifications', icon: '🔔', badge: stats.unreadNotifications || 0 },
    { id: 'ai-tutor', title: 'AI Tutor', icon: '🤖', badge: 0 },
    { id: 'settings', title: 'Settings', icon: '⚙️', badge: 0 },
  ];

  // Refresh data when switching pages
  useEffect(() => {
    if (activePage === 'dashboard') {
      refreshData();
    }
  }, [activePage]);

  // Callbacks for components
  const onMessagesRead = useCallback(() => {
    updateUnreadMessages(0);
  }, [updateUnreadMessages]);

  const onNotificationsRead = useCallback(() => {
    updateUnreadNotifications(0);
  }, [updateUnreadNotifications]);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'lessons':
        return <LessonManagement />;
      case 'assignments':
        return <AssignmentManagement />;
      case 'chat':
        return (
          <ChatCenter 
            currentRole="teacher"
            onMessagesRead={onMessagesRead}
            decrementUnreadMessages={decrementUnreadMessages}
          />
        );
      case 'notifications':
        return (
          <TeacherNotifications
            onNotificationsRead={onNotificationsRead}
            decrementUnreadNotifications={decrementUnreadNotifications}
          />
        );
      case 'ai-tutor':
        return <AITutorPage />;
      case 'settings':
        return <Settings navigation={navigation} />;
      default:
        return <Dashboard />;
    }
  };

  const handleMenuPress = (pageId) => {
    setActivePage(pageId);
    setSidebarVisible(false);
  };

  const handleLogout = async () => {
    // Clear storage and navigate to Welcome
    await AsyncStorage.multiRemove(['token', 'user', 'userId']);
    navigation.replace('Welcome');
  };

  const getActiveTitle = () => {
    const menuItems = getMenuItems();
    const item = menuItems.find(m => m.id === activePage);
    return item ? item.title : 'Dashboard';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#28a745" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActivePage('dashboard')}>
          <Text style={styles.headerTitle}>RUWWAD</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconContainer}
            onPress={() => { setActivePage('notifications'); setSidebarVisible(false); }}
          >
            <Text style={styles.headerIcon}>🔔</Text>
            {stats.unreadNotifications > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{stats.unreadNotifications > 9 ? '9+' : stats.unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconContainer}
            onPress={() => { setActivePage('chat'); setSidebarVisible(false); }}
          >
            <Text style={styles.headerIcon}>💬</Text>
            {stats.unreadMessages > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{stats.unreadMessages > 9 ? '9+' : stats.unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={() => setActivePage('settings')}
          >
            {teacher.profilePicture ? (
              <Image source={{ uri: teacher.profilePicture }} style={styles.profileImage} />
            ) : (
              <Text style={styles.profileInitials}>{getInitials()}</Text>
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
            {/* Sidebar Header with Logo */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => { setActivePage('dashboard'); setSidebarVisible(false); }}>
                <Text style={styles.sidebarLogo}>RUWWAD</Text>
              </TouchableOpacity>
              <Text style={styles.sidebarSubtitle}>Teacher Portal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSidebarVisible(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* User Profile Section - Dynamic from Context */}
            <View style={styles.userInfo}>
              {teacher.profilePicture ? (
                <Image source={{ uri: teacher.profilePicture }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}
              <Text style={styles.userName}>{getFullName()}</Text>
              <Text style={styles.userRole}>{getSpecializationDisplay()}</Text>
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
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    </SafeAreaView>
  );
}

// Export wrapped with TeacherProvider (like web version pattern)
export default function TeacherHomeScreen({ navigation }) {
  return (
    <TeacherProvider>
      <TeacherHomeContent navigation={navigation} />
    </TeacherProvider>
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
    backgroundColor: '#28a745',
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
    backgroundColor: '#1a1f36',
    height: '100%',
  },
  overlayClose: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarHeader: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1a1f36',
  },
  sidebarLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
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
    backgroundColor: '#1a1f36',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  profileIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  profileInitials: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#1a1f36',
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
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
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
    color: '#28a745',
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
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1a1f36',
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
