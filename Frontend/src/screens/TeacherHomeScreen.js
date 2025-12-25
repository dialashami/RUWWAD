import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function TeacherHomeScreen({ navigation }) {
  const menuItems = [
    { title: 'My Classes', icon: '🎓', screen: 'Classes' },
    { title: 'Students', icon: '👨‍🎓', screen: 'Students' },
    { title: 'Assignments', icon: '📝', screen: 'Assignments' },
    { title: 'Schedule', icon: '📅', screen: 'Schedule' },
    { title: 'Messages', icon: '💬', screen: 'Messages' },
    { title: 'Settings', icon: '⚙️', screen: 'Settings' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Teacher! 👋</Text>
        <Text style={styles.subtitle}>Manage your classes</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>120</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
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

        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleTime}>
            <Text style={styles.timeText}>09:00</Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.className}>Mathematics - Grade 10</Text>
            <Text style={styles.classRoom}>Room 201</Text>
          </View>
        </View>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleTime}>
            <Text style={styles.timeText}>11:00</Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.className}>Physics - Grade 11</Text>
            <Text style={styles.classRoom}>Lab 102</Text>
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
    backgroundColor: '#28a745',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
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
  },
  scheduleCard: {
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
  scheduleTime: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
  },
  timeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scheduleInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  classRoom: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
