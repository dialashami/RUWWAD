import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTeacher } from '../../context/TeacherContext';
import { teacherDashboardAPI } from '../../services/api';

// Helper function - format time ago (defined outside component to avoid hoisting issues)
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
  const [viewAllModal, setViewAllModal] = useState(null); // 'lessons', 'activities', 'courses'

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

  const getSubjectColor = (subject) => {
    switch (subject) {
      case 'Mathematics': return '#3498db';
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
      {/* Welcome Banner - styled like student version */}
      <LinearGradient
        colors={['#3498db', '#2c3e50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeBanner}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorSquare} />
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.welcomeText}>Welcome back, {getFullName()} 👋</Text>
            <Text style={styles.welcomeSubtext}>Here's an overview of your classes and students</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3498db' }]}>
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
          <TouchableOpacity onPress={() => setViewAllModal('lessons')}>
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
          <TouchableOpacity onPress={() => setViewAllModal('activities')}>
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
          <TouchableOpacity onPress={() => setViewAllModal('courses')}>
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

      {/* View All Lessons Modal */}
      <Modal
        visible={viewAllModal === 'lessons'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewAllModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 All Upcoming Lessons</Text>
              <TouchableOpacity onPress={() => setViewAllModal(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {upcomingLessons.length > 0 ? (
                upcomingLessons.map((lesson, index) => (
                  <View key={lesson.id || index} style={styles.modalItem}>
                    <View style={styles.modalItemHeader}>
                      <View style={styles.lessonTimeBadge}>
                        <Text style={styles.lessonTimeIcon}>🕒</Text>
                        <Text style={styles.lessonTime}>{lesson.time}</Text>
                      </View>
                      {lesson.date && (
                        <Text style={styles.modalItemDate}>{lesson.date}</Text>
                      )}
                    </View>
                    <Text style={styles.modalItemTitle}>{lesson.title}</Text>
                    <Text style={styles.modalItemSubtitle}>{lesson.grade} • {lesson.room}</Text>
                    {lesson.description && (
                      <Text style={styles.modalItemDescription}>{lesson.description}</Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyIcon}>📅</Text>
                  <Text style={styles.modalEmptyText}>No upcoming lessons scheduled</Text>
                  <Text style={styles.modalEmptySubtext}>Your upcoming lessons will appear here</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View All Activities Modal */}
      <Modal
        visible={viewAllModal === 'activities'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewAllModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔔 All Recent Activity</Text>
              <TouchableOpacity onPress={() => setViewAllModal(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <View key={activity.id || index} style={styles.modalItem}>
                    <View style={styles.activityModalRow}>
                      <View style={[styles.activityIcon, activity.type === 'submission' ? styles.activitySubmission : styles.activityDefault]}>
                        <Text>{activity.type === 'submission' ? '✓' : '🔔'}</Text>
                      </View>
                      <View style={styles.activityModalContent}>
                        <Text style={styles.modalItemTitle}>{activity.title}</Text>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                        {activity.description && (
                          <Text style={styles.modalItemDescription}>{activity.description}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyIcon}>🔔</Text>
                  <Text style={styles.modalEmptyText}>No recent activity</Text>
                  <Text style={styles.modalEmptySubtext}>Your activity history will appear here</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View All Courses Modal */}
      <Modal
        visible={viewAllModal === 'courses'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewAllModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📚 All My Courses</Text>
              <TouchableOpacity onPress={() => setViewAllModal(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {courses.length > 0 ? (
                courses.map((course, index) => (
                  <View key={course._id || index} style={styles.modalCourseCard}>
                    <View style={[styles.modalCourseColorBar, { backgroundColor: getSubjectColor(course.subject) }]} />
                    <View style={styles.modalCourseContent}>
                      <Text style={styles.modalCourseTitle}>{course.title}</Text>
                      <Text style={styles.modalCourseSubject}>{course.subject}</Text>
                      <View style={styles.modalCourseDetails}>
                        <Text style={styles.modalCourseDetail}>📚 {course.grade}</Text>
                        <Text style={styles.modalCourseDetail}>👥 {course.students} students</Text>
                      </View>
                      {course.description && (
                        <Text style={styles.modalItemDescription}>{course.description}</Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyIcon}>📚</Text>
                  <Text style={styles.modalEmptyText}>No courses yet</Text>
                  <Text style={styles.modalEmptySubtext}>Your courses will appear here once created</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBanner: {
    margin: 15,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#3498db',
    overflow: 'hidden',
    position: 'relative',
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
    backgroundColor: '#3498db',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  modalItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalItemDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  modalItemDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 18,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  activityModalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityModalContent: {
    flex: 1,
  },
  modalCourseCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  modalCourseColorBar: {
    height: 6,
  },
  modalCourseContent: {
    padding: 16,
  },
  modalCourseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalCourseSubject: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalCourseDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  modalCourseDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
});
