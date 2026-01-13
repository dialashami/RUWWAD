import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';

// Context Provider
import { StudentProvider, useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';

// Sub-components
import Dashboard from '../components/student/Dashboard';
import MyLessons from '../components/student/MyLessons';
import Assignments from '../components/student/Assignments';
import ChatCenter from '../components/shared/ChatCenter';
import ProgressPage from '../components/student/ProgressPage';
import Notifications from '../components/shared/Notifications';
import AITutorPage from '../components/shared/AITutorPage';
import Settings from '../components/student/Settings';
import FeedbackStar from '../components/shared/FeedbackStar';
import QuizzesExams from '../components/student/QuizzesExams';

const { width } = Dimensions.get('window');

// Inner component that uses context
function StudentHomeContent({ navigation }) {
  const dispatch = useDispatch();
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { isDarkMode, theme, profileImage } = useTheme();

  // Get data from context
  const {
    student,
    stats,
    getInitials,
    getFullName,
    getGradeDisplay,
    updateUnreadMessages,
    updateUnreadNotifications,
    decrementUnreadMessages,
    decrementUnreadNotifications,
    refreshData,
  } = useStudent();

  // Menu items with dynamic badges from context
  const getMenuItems = () => [
    { id: 'dashboard', title: 'Dashboard', icon: '📊', badge: 0 },
    { id: 'lessons', title: 'My Lessons', icon: '📚', badge: 0 },
    { id: 'assignments', title: 'Assignments', icon: '📝', badge: stats.pendingAssignments || 0 },
    { id: 'quizzes', title: 'Quizzes & Exams', icon: '✏️', badge: 0 },
    { id: 'chat', title: 'Messages', icon: '💬', badge: stats.unreadMessages || 0 },
    { id: 'progress', title: 'Progress', icon: '📈', badge: 0 },
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
        return <Dashboard onNavigate={setActivePage} />;
      case 'lessons':
        return <MyLessons />;
      case 'assignments':
        return <Assignments />;
      case 'quizzes':
        return <QuizzesExams />;
      case 'chat':
        return (
          <ChatCenter 
            currentRole="student" 
            onMessagesRead={onMessagesRead}
            decrementUnreadMessages={decrementUnreadMessages}
          />
        );
      case 'progress':
        return <ProgressPage />;
      case 'notifications':
        return (
          <Notifications 
            onNotificationsRead={onNotificationsRead}
            decrementUnreadNotifications={decrementUnreadNotifications}
          />
        );
      case 'ai-tutor':
        return <AITutorPage />;
      case 'settings':
        return <Settings navigation={navigation} />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  const handleMenuPress = (id) => {
    setActivePage(id);
    setSidebarVisible(false);
  };

  const handleLogout = async () => {
    // Dispatch Redux logout action to clear storage and reset state
    await dispatch(logoutUser());
    navigation.replace('Login');
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
            onPress={() => { setActivePage('notifications'); setSidebarVisible(false); }}
          >
            <Text>🔔</Text>
            {stats.unreadNotifications > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{stats.unreadNotifications > 9 ? '9+' : stats.unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navIcon}
            onPress={() => { setActivePage('chat'); setSidebarVisible(false); }}
          >
            <Text>💬</Text>
            {stats.unreadMessages > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{stats.unreadMessages > 9 ? '9+' : stats.unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={() => setActivePage('settings')}
          >
            {(profileImage || student.profilePicture) ? (
              <Image source={{ uri: profileImage || student.profilePicture }} style={styles.profileImage} />
            ) : (
              <Text style={styles.profileInitials}>{getInitials()}</Text>
            )}
          </TouchableOpacity>
        </View>
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
              <Text style={styles.sidebarSubtitle}>Student Portal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSidebarVisible(false)}
              >
                <Text style={[styles.closeIcon, isDarkMode && { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* User Profile Section - Dynamic from Context */}
            <View style={styles.userInfo}>
              {(profileImage || student.profilePicture) ? (
                <Image source={{ uri: profileImage || student.profilePicture }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}
              <Text style={[styles.userName, isDarkMode && { color: theme.text }]}>{getFullName()}</Text>
              <Text style={[styles.userRole, isDarkMode && { color: theme.textSecondary }]}>{getGradeDisplay()}</Text>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuList}>
              {getMenuItems().map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    activePage === item.id && styles.menuItemActive,
                    isDarkMode && activePage !== item.id && { backgroundColor: 'transparent' },
                  ]}
                  onPress={() => handleMenuPress(item.id)}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.menuItemText,
                      activePage === item.id && styles.menuItemTextActive,
                      isDarkMode && activePage !== item.id && { color: theme.textSecondary },
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Logout Button */}
            <TouchableOpacity style={[styles.logoutButton, isDarkMode && { borderTopColor: theme.border }]} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={[styles.logoutText, isDarkMode && { color: theme.textSecondary }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={[styles.mainContent, isDarkMode && { backgroundColor: theme.background }]}>
        {renderPage()}
      </View>

      {/* Floating Feedback Button - Only on Dashboard */}
      {activePage === 'dashboard' && <FeedbackStar />}
    </View>
  );
}

// Export wrapped with StudentProvider (like web version)
export default function StudentHomeScreen({ navigation }) {
  return (
    <StudentProvider>
      <StudentHomeContent navigation={navigation} />
    </StudentProvider>
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
  navLogoImage: {
    width: 28,
    height: 28,
    marginRight: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.75,
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'linear-gradient(135deg, #007bff, #8b5cf6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  avatarText: {
    fontSize: 35,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  menuList: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  menuItemActive: {
    backgroundColor: 'rgba(0, 123, 255, 0.2)',
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 15,
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
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
  mainContent: {
    flex: 1,
  },
});
