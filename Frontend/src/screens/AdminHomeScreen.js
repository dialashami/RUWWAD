import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function AdminHomeScreen({ navigation }) {
  const stats = [
    { label: 'Total Users', value: '1,250', icon: '👥' },
    { label: 'Teachers', value: '45', icon: '👨‍🏫' },
    { label: 'Students', value: '980', icon: '👨‍🎓' },
    { label: 'Parents', value: '225', icon: '👪' },
  ];

  const menuItems = [
    { title: 'User Management', icon: '👥', screen: 'Users' },
    { title: 'Course Management', icon: '📚', screen: 'Courses' },
    { title: 'Reports', icon: '📊', screen: 'Reports' },
    { title: 'Notifications', icon: '🔔', screen: 'Notifications' },
    { title: 'System Settings', icon: '⚙️', screen: 'SystemSettings' },
    { title: 'Feedback', icon: '💬', screen: 'Feedback' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>System Overview</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityDot} />
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>New teacher registered: John Smith</Text>
            <Text style={styles.activityTime}>10 minutes ago</Text>
          </View>
        </View>
        <View style={styles.activityCard}>
          <View style={[styles.activityDot, { backgroundColor: '#28a745' }]} />
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>Course "Advanced Math" approved</Text>
            <Text style={styles.activityTime}>1 hour ago</Text>
          </View>
        </View>
        <View style={styles.activityCard}>
          <View style={[styles.activityDot, { backgroundColor: '#ffc107' }]} />
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>System backup completed</Text>
            <Text style={styles.activityTime}>3 hours ago</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#dc3545',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
