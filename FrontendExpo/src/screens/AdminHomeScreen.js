import React, { useState } from 'react';
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

// Import components
import DashboardOverview from '../components/admin/DashboardOverview';
import UserManagement from '../components/admin/UserManagement';
import NotificationManagement from '../components/admin/NotificationManagement';
import ChatCenter from '../components/shared/ChatCenter';
import Settings from '../components/shared/Settings';
import FeedbackStar from '../components/shared/FeedbackStar';

export default function AdminHomeScreen({ navigation }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: '📊' },
    { id: 'users', title: 'Users', icon: '👥' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
    { id: 'communication', title: 'Messages', icon: '💬' },
    { id: 'settings', title: 'Settings', icon: '⚙️' },
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
        return <ChatCenter currentRole="admin" />;
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
          <TouchableOpacity onPress={() => setActivePage('notifications')}>
            <Text style={styles.headerIcon}>🔔</Text>
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
                  <Text style={styles.profileName}>Admin</Text>
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
              {menuItems.map((item) => (
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
  },
  menuItemTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
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
