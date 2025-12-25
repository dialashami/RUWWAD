import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function ParentHomeScreen({ navigation }) {
  const children = [
    { name: 'Ahmed', grade: 'Grade 10', avatar: '👦' },
    { name: 'Sara', grade: 'Grade 8', avatar: '👧' },
  ];

  const menuItems = [
    { title: 'Progress Reports', icon: '📊', screen: 'Progress' },
    { title: 'Attendance', icon: '✅', screen: 'Attendance' },
    { title: 'Teachers', icon: '👨‍🏫', screen: 'Teachers' },
    { title: 'Messages', icon: '💬', screen: 'Messages' },
    { title: 'Payments', icon: '💳', screen: 'Payments' },
    { title: 'Settings', icon: '⚙️', screen: 'Settings' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Parent! 👋</Text>
        <Text style={styles.subtitle}>Monitor your children's progress</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Your Children</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childrenContainer}>
          {children.map((child, index) => (
            <TouchableOpacity key={index} style={styles.childCard}>
              <Text style={styles.childAvatar}>{child.avatar}</Text>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childGrade}>{child.grade}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

        <Text style={styles.sectionTitle}>Recent Updates</Text>
        <View style={styles.updateCard}>
          <Text style={styles.updateBadge}>📢</Text>
          <View style={styles.updateContent}>
            <Text style={styles.updateTitle}>Ahmed's Math Test Results</Text>
            <Text style={styles.updateText}>Score: 92/100 - Excellent!</Text>
            <Text style={styles.updateTime}>Today, 2:30 PM</Text>
          </View>
        </View>
        <View style={styles.updateCard}>
          <Text style={styles.updateBadge}>📅</Text>
          <View style={styles.updateContent}>
            <Text style={styles.updateTitle}>Parent-Teacher Meeting</Text>
            <Text style={styles.updateText}>Scheduled for next Monday</Text>
            <Text style={styles.updateTime}>Yesterday</Text>
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
    backgroundColor: '#6f42c1',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  childrenContainer: {
    marginBottom: 16,
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  childAvatar: {
    fontSize: 48,
    marginBottom: 8,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  childGrade: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  updateBadge: {
    fontSize: 24,
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  updateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  updateTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
