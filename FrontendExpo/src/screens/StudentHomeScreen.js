import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';

// Sub-components
import Dashboard from '../components/student/Dashboard';
import MyLessons from '../components/student/MyLessons';
import Assignments from '../components/student/Assignments';
import ChatCenter from '../components/shared/ChatCenter';
import ProgressPage from '../components/student/ProgressPage';
import Notifications from '../components/shared/Notifications';
import AITutorPage from '../components/shared/AITutorPage';
import Settings from '../components/shared/Settings';
import FeedbackStar from '../components/shared/FeedbackStar';

const { width } = Dimensions.get('window');

const menuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'lessons', title: 'My Lessons', icon: '📚' },
  { id: 'assignments', title: 'Assignments', icon: '📝' },
  { id: 'chat', title: 'Messages', icon: '💬' },
  { id: 'progress', title: 'Progress', icon: '📈' },
  { id: 'notifications', title: 'Notifications', icon: '🔔' },
  { id: 'ai-tutor', title: 'AI Tutor', icon: '🤖' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
];

export default function StudentHomeScreen({ navigation }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'lessons':
        return <MyLessons />;
      case 'assignments':
        return <Assignments />;
      case 'chat':
        return <ChatCenter currentRole="student" />;
      case 'progress':
        return <ProgressPage />;
      case 'notifications':
        return <Notifications />;
      case 'ai-tutor':
        return <AITutorPage />;
      case 'settings':
        return <Settings navigation={navigation} />;
      default:
        return <Dashboard />;
    }
  };

  const handleMenuPress = (id) => {
    setActivePage(id);
    setSidebarVisible(false);
  };

  const handleLogout = () => {
    navigation.replace('Welcome');
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>RUWWAD</Text>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIcon}>
            <Text>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileIcon}>
            <Text>👤</Text>
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
          <View style={styles.sidebar}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarLogo}>RUWWAD</Text>
              <Text style={styles.sidebarSubtitle}>Student Portal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSidebarVisible(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👨‍🎓</Text>
              </View>
              <Text style={styles.userName}>Student</Text>
              <Text style={styles.userRole}>Student Account</Text>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuList}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    activePage === item.id && styles.menuItemActive,
                  ]}
                  onPress={() => handleMenuPress(item.id)}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.menuItemText,
                      activePage === item.id && styles.menuItemTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderPage()}
      </View>

      {/* Floating Feedback Button */}
      <FeedbackStar />
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
    backgroundColor: '#007bff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  navRight: {
    flexDirection: 'row',
    gap: 15,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.75,
    backgroundColor: '#1a1f36',
    height: '100%',
  },
  sidebarHeader: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sidebarLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
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
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
  },
  menuItemTextActive: {
    color: '#007bff',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
  },
});
