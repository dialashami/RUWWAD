import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudent } from '../../context/StudentContext';
import { studentDashboardAPI } from '../../services/api';

export default function Dashboard({ onNavigate }) {
  // Get data from context
  const {
    student,
    getFullName,
    stats: contextStats,
    courses: contextCourses,
    todaySchedule: contextTodaySchedule,
    recentActivities: contextRecentActivities,
    loading: contextLoading,
    refreshData,
  } = useStudent();

  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState({});

  // Helper function for activity icons
  const getActivityIcon = (type) => {
    switch(type) {
      case 'lesson':
      case 'course':
        return '📖';
      case 'assignment':
        return '✅';
      case 'achievement':
        return '🏆';
      case 'message':
        return '💬';
      case 'notification':
        return '🔔';
      default:
        return '📌';
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Fetch progress data
  useEffect(() => {
    const isMountedRef = { current: true };
    
    const fetchProgressData = async () => {
      // Check if token exists to prevent 401 errors after logout
      const token = await AsyncStorage.getItem('token');
      if (!token || !isMountedRef.current) {
        return;
      }

      try {
        const response = await studentDashboardAPI.getProgress();
        if (!isMountedRef.current) return;
        
        if (response.data?.subjectProgress) {
          const progressObj = {};
          response.data.subjectProgress.forEach(subject => {
            const key = subject.name.toLowerCase();
            progressObj[key] = {
              percent: subject.progress || 0,
              completedLessons: subject.completedLessons || 0,
              totalLessons: subject.totalLessons || 0,
              grade: subject.grade || '-',
            };
          });
          setProgressData(progressObj);
        }
      } catch (err) {
        // Only log if not a 401 (user logged out)
        if (err.response?.status !== 401) {
          console.log('Progress data error:', err);
        }
      }
    };
    fetchProgressData();

    return () => {
      isMountedRef.current = false;
    };
  }, [student.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Build stats from context
  const stats = [
    { label: 'Courses', value: contextStats.totalCourses || contextCourses.length || 0, icon: '📚', color: '#007bff' },
    { label: 'Pending', value: contextStats.pendingAssignments || 0, icon: '📝', color: '#ffc107' },
    { label: 'Messages', value: contextStats.unreadMessages || 0, icon: '💬', color: '#17a2b8' },
  ];

  // Build schedule from context
  const upcomingClasses = contextTodaySchedule.length > 0
    ? contextTodaySchedule.map((item, index) => ({
        id: item._id || index,
        time: item.dueDate 
          ? new Date(item.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : '09:00 AM',
        subject: item.title || item.subject || 'Course',
        room: item.description || 'Online',
      }))
    : contextCourses.slice(0, 3).map((course, index) => ({
        id: course._id || index,
        time: '09:00 AM',
        subject: course.title || course.subject || 'Course',
        room: course.description || 'Online Session',
      }));

  // Build activities from context
  const recentActivity = contextRecentActivities.length > 0
    ? contextRecentActivities.map((activity, index) => ({
        id: activity.id || index,
        text: `${getActivityIcon(activity.type)} ${activity.title}`,
        time: formatTimeAgo(activity.createdAt),
      }))
    : [
        { text: '📖 Completed Lesson 5 in Math', time: '2 hours ago' },
        { text: '✅ Submitted English Assignment', time: 'Yesterday' },
        { text: '🏆 Earned Achievement Badge', time: '2 days ago' },
      ];

  if (contextLoading) {
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3498db']} />
      }
    >
      {/* Welcome Banner - styled like web version */}
      <LinearGradient
        colors={['#3498db', '#2c3e50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeBanner}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorSquare} />
        
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.welcomeText}>Hello, {getFullName()} 👋</Text>
            <Text style={styles.welcomeSubtext}>Ready to continue your learning journey?</Text>
          </View>
        </View>
      </LinearGradient>

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
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#007bff' }]}
            onPress={() => onNavigate && onNavigate('lessons')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionText}>Continue Learning</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#28a745' }]}
            onPress={() => onNavigate && onNavigate('assignments')}
          >
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
  welcomeBanner: {
    margin: 15,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#3498db',
    overflow: 'hidden',
    position: 'relative',
    // Gradient effect approximation
    shadowColor: '#2c3e50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  decorCircle1: {
    position: 'absolute',
    top: -20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorSquare: {
    position: 'absolute',
    top: '40%',
    right: '25%',
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  bannerIconContainer: {
    marginLeft: 16,
  },
  bannerIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 36,
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
