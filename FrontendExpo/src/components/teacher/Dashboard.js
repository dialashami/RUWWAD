import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTeacher } from '../../context/TeacherContext';
import { teacherDashboardAPI } from '../../services/api';

export default function Dashboard() {
  // Get data from context
  const {
    teacher,
    getFullName,
    stats: contextStats,
    courses: contextCourses,
    recentActivities: contextActivities,
    upcomingLessons: contextLessons,
    weeklyStats: contextWeeklyStats,
    loading: contextLoading,
    refreshData,
  } = useTeacher();

  const [refreshing, setRefreshing] = useState(false);

  // Build stats from context
  const stats = {
    totalStudents: contextStats.totalStudents || 0,
    activeCourses: contextStats.activeCourses || contextCourses.length || 0,
    totalAssignments: contextStats.totalAssignments || 0,
    activityRate: contextStats.activityRate || 0,
    pendingSubmissions: contextStats.pendingSubmissions || 0,
    unreadMessages: contextStats.unreadMessages || 0,
  };

  // Build courses from context
  const courses = contextCourses.length > 0 ? contextCourses : [];

  // Build activities from context
  const recentActivities = contextActivities.length > 0 
    ? contextActivities.map((a, i) => ({
        id: a.id || i,
        type: a.type || 'activity',
        title: a.title || 'Activity',
        time: formatTimeAgo(a.createdAt),
      }))
    : [];

  // Build lessons from context
  const upcomingLessons = contextLessons.length > 0 
    ? contextLessons 
    : [];

  // Weekly stats from context
  const weeklyStats = contextWeeklyStats.length > 0 
    ? contextWeeklyStats 
    : [
        { day: 'Mon', value: 30 },
        { day: 'Tue', value: 45 },
        { day: 'Wed', value: 60 },
        { day: 'Thu', value: 50 },
        { day: 'Fri', value: 75 },
        { day: 'Sat', value: 40 },
        { day: 'Sun', value: 25 },
      ];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getSubjectColor = (subject) => {
    switch (subject) {
      case 'Mathematics': return '#667eea';
      case 'Physics': return '#11998e';
      case 'Chemistry': return '#eb3349';
      default: return '#4facfe';
    }
  };

  if (contextLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#28a745']} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, {getFullName()}!</Text>
        <Text style={styles.subText}>Here's an overview of your classes and students</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#667eea' }]}>
            <Text style={styles.iconText}>👥</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Total Students</Text>
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statChange}>+12% from last month</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#11998e' }]}>
            <Text style={styles.iconText}>📚</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Active Courses</Text>
            <Text style={styles.statNumber}>{stats.activeCourses}</Text>
            <Text style={styles.statChange}>+3 new this week</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#eb3349' }]}>
            <Text style={styles.iconText}>📋</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Assignments</Text>
            <Text style={styles.statNumber}>{stats.totalAssignments}</Text>
            <Text style={styles.statChange}>{stats.pendingSubmissions} pending</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#4facfe' }]}>
            <Text style={styles.iconText}>📈</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Activity Rate</Text>
            <Text style={styles.statNumber}>{stats.activityRate}%</Text>
            <Text style={styles.statChange}>+5% this week</Text>
          </View>
        </View>
      </View>

      {/* Upcoming Lessons */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📅 Upcoming Lessons</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllBtn}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.lessonsList}>
          {upcomingLessons.length > 0 ? (
            upcomingLessons.map((lesson) => (
              <View key={lesson.id} style={styles.lessonItem}>
                <View style={styles.lessonTimeBadge}>
                  <Text style={styles.lessonTimeIcon}>🕒</Text>
                  <Text style={styles.lessonTime}>{lesson.time}</Text>
                </View>
                <View style={styles.lessonDetails}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonInfo}>{lesson.grade} • {lesson.room}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming lessons</Text>
          )}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🔔 Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllBtn}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, activity.type === 'submission' ? styles.activitySubmission : styles.activityDefault]}>
                  <Text>{activity.type === 'submission' ? '✓' : '🔔'}</Text>
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </View>
      </View>

      {/* My Courses */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📚 My Courses</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllBtn}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.coursesGrid}>
          {courses.length > 0 ? (
            courses.slice(0, 4).map((course) => (
              <View key={course._id} style={styles.courseCard}>
                <View style={[styles.courseColorBar, { backgroundColor: getSubjectColor(course.subject) }]} />
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseGrade}>{course.grade}</Text>
                <View style={styles.courseStudents}>
                  <Text style={styles.courseStudentsText}>👥 {course.students} students</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No courses yet</Text>
          )}
        </View>
      </View>

      {/* Weekly Overview */}
      <View style={[styles.card, { marginBottom: 30 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📊 Weekly Overview</Text>
        </View>
        <View style={styles.weeklyStats}>
          {weeklyStats.map((stat, index) => (
            <View key={index} style={styles.weeklyStat}>
              <View style={styles.weeklyBarContainer}>
                <View style={[styles.weeklyBar, { height: `${stat.value}%` }]} />
              </View>
              <Text style={styles.weeklyDay}>{stat.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statChange: {
    fontSize: 11,
    color: '#10b981',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewAllBtn: {
    color: '#007bff',
    fontSize: 14,
  },
  lessonsList: {
    gap: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lessonTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  lessonTimeIcon: {
    fontSize: 12,
  },
  lessonTime: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  lessonDetails: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  lessonInfo: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activitySubmission: {
    backgroundColor: '#d1fae5',
  },
  activityDefault: {
    backgroundColor: '#e0f2fe',
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  courseCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  courseColorBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  courseGrade: {
    fontSize: 12,
    color: '#6b7280',
  },
  courseStudents: {
    marginTop: 8,
  },
  courseStudentsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyBarContainer: {
    height: 80,
    width: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyBar: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    width: '100%',
  },
  weeklyDay: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 20,
  },
});
