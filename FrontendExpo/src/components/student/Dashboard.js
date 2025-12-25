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
import { studentDashboardAPI } from '../../services/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      const response = await studentDashboardAPI.getDashboard();
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard');
      // Use default data if API fails
      setDashboardData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // Default data if API fails
  const stats = dashboardData?.stats || [
    { label: 'Courses', value: '5', icon: '📚', color: '#007bff' },
    { label: 'Pending', value: '3', icon: '📝', color: '#ffc107' },
    { label: 'Progress', value: '85%', icon: '📈', color: '#28a745' },
  ];

  const upcomingClasses = dashboardData?.schedule || [
    { subject: 'Mathematics', time: '09:00 AM', room: 'Room 201' },
    { subject: 'Physics', time: '11:00 AM', room: 'Lab 102' },
    { subject: 'English', time: '02:00 PM', room: 'Room 305' },
  ];

  const recentActivity = dashboardData?.recentActivity || [
    { text: '📖 Completed Lesson 5 in Math', time: '2 hours ago' },
    { text: '✅ Submitted English Assignment', time: 'Yesterday' },
    { text: '🏆 Earned Achievement Badge', time: '2 days ago' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Student! 👋</Text>
        <Text style={styles.subtitle}>Welcome back to your dashboard</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {upcomingClasses.map((cls, index) => (
          <View key={index} style={styles.scheduleCard}>
            <View style={styles.scheduleTime}>
              <Text style={styles.timeText}>{cls.time}</Text>
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.subjectText}>{cls.subject}</Text>
              <Text style={styles.roomText}>{cls.room}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((activity, index) => (
          <View key={index} style={styles.activityCard}>
            <Text style={styles.activityText}>{activity.text}</Text>
            <Text style={styles.activityTime}>{activity.time}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#007bff' }]}>
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionText}>Continue Learning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#28a745' }]}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>View Assignments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  scheduleCard: {
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
  scheduleTime: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 15,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
  },
  scheduleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  roomText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  activityCard: {
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
  activityText: {
    fontSize: 15,
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
