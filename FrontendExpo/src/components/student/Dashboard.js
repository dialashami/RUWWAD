import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudent } from '../../context/StudentContext';
import { useTheme } from '../../context/ThemeContext';

export default function Dashboard({ onNavigate }) {
  // Get data from context
  const {
    student,
    courses: contextCourses,
    todaySchedule: contextTodaySchedule,
    recentActivities: contextRecentActivities,
    progress: contextProgress,
    loading: contextLoading,
    refreshData,
  } = useStudent();
  
  const { isDarkMode, theme } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState({});

  // Update progress data when context progress changes
  useEffect(() => {
    if (contextProgress?.subjectProgress) {
      const progressObj = {};
      contextProgress.subjectProgress.forEach(subject => {
        const key = subject.name.toLowerCase();
        progressObj[key] = {
          percent: subject.progress || 0,
          completedLessons: subject.watchedVideos || 0,
          totalLessons: subject.totalVideos || 0,
          completedQuizzes: 0,
          totalQuizzes: 0,
          avgScore: subject.grade
            ? (subject.grade === 'A+' ? 95 : subject.grade === 'A' ? 90 : subject.grade === 'B+' ? 85 : subject.grade === 'B' ? 80 : subject.grade === 'C' ? 70 : 0)
            : 0,
          grade: subject.grade || '-',
        };
      });
      setProgressData(progressObj);
    }
  }, [contextProgress]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getStudentId = () => {
    if (student?.id) return student.id;
    return null;
  };

  const getStudentVideoProgress = (course, userId) => {
    if (!course?.videoProgress || !userId) return null;
    return course.videoProgress.find(vp => vp.student?.toString() === userId?.toString());
  };

  const getStudentCourseProgress = (course, userId) => {
    if (!course?.studentCourseProgress || !userId) return null;
    return course.studentCourseProgress.find(p => p.student?.toString() === userId?.toString());
  };

  const getLectureStats = (course, progressFromApi, userId) => {
    const totalLectures = (course?.videoUrls?.length || 0) + (course?.uploadedVideos?.length || 0);
    const studentVideoProgress = getStudentVideoProgress(course, userId);
    const completedLectures = studentVideoProgress
      ? (studentVideoProgress.watchedVideoUrls?.length || 0) + (studentVideoProgress.watchedUploadedVideos?.length || 0)
      : 0;

    if (totalLectures > 0) {
      return { totalLectures, completedLectures };
    }

    return {
      totalLectures: progressFromApi?.totalLessons ?? course?.totalLessons ?? course?.lessons?.length ?? 0,
      completedLectures: progressFromApi?.completedLessons ?? course?.completedLessons ?? 0,
    };
  };

  const getQuizStats = (course, progressFromApi, userId) => {
    const studentCourseProgress = getStudentCourseProgress(course, userId);
    if (course?.isChapterBased && course?.numberOfChapters) {
      return {
        totalQuizzes: course.numberOfChapters,
        completedQuizzes: studentCourseProgress?.chaptersCompleted?.length || 0,
      };
    }

    return {
      totalQuizzes: progressFromApi?.totalQuizzes ?? course?.totalQuizzes ?? course?.quizzes?.length ?? 0,
      completedQuizzes: progressFromApi?.completedQuizzes ?? course?.completedQuizzes ?? 0,
    };
  };

  const getAverageQuizScore = (course, progressFromApi) => {
    if (typeof progressFromApi?.avgScore === 'number') return progressFromApi.avgScore;
    if (typeof course?.averageScore === 'number') return course.averageScore;
    return 0;
  };

  const isCourseStarted = (course) => {
    if (!course) return false;
    if (course.startedAt || course.enrolledAt) return true;
    if (typeof course.progress === 'number' && course.progress > 0) return true;
    if ((course.completedLessons || 0) > 0) return true;
    if ((course.completedQuizzes || 0) > 0) return true;
    if (course.status && ['in-progress', 'active', 'started'].includes(course.status.toLowerCase())) return true;
    return false;
  };

  const buildProgressCards = () => {
    const progressMapByName = {};
    const userId = getStudentId();

    Object.entries(progressData || {}).forEach(([key, value]) => {
      progressMapByName[key.toLowerCase()] = value;
    });

    const startedCourses = (contextCourses || []).filter(isCourseStarted);
    const coursesToDisplay = startedCourses.length > 0 ? startedCourses : (contextCourses || []);

    return coursesToDisplay.map(course => {
      const courseName = course.title || course.subject || 'Course';
      const normalizedKey = courseName.toLowerCase();
      const progressFromApi = progressMapByName[normalizedKey];

      const lectureStats = getLectureStats(course, progressFromApi, userId);
      const quizStats = getQuizStats(course, progressFromApi, userId);
      const avgScore = getAverageQuizScore(course, progressFromApi);

      const percent = progressFromApi?.percent ?? course.progress ?? 0;

      return {
        key: course._id || courseName,
        courseName,
        percent,
        completedLessons: lectureStats.completedLectures,
        totalLessons: lectureStats.totalLectures,
        completedQuizzes: quizStats.completedQuizzes,
        totalQuizzes: quizStats.totalQuizzes,
        avgScore,
        subjectKey: (course.subject || courseName || 'course').toLowerCase(),
      };
    });
  };

  // Build schedule from context
  const upcomingClasses = contextTodaySchedule.length > 0
    ? contextTodaySchedule.map((item, index) => ({
        id: item._id || index,
        time: item.dueDate 
          ? new Date(item.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : '09:00 AM',
        subject: item.title || item.subject || 'Course',
        room: item.description || 'Online',
        zoomLink: item.zoomLink,
      }))
    : contextCourses.slice(0, 3).map((course, index) => ({
        id: course._id || index,
        time: '09:00 AM',
        subject: course.title || course.subject || 'Course',
        room: course.description || 'Online Session',
        zoomLink: course.zoomLink,
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
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, isDarkMode && { color: theme.text }]}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, isDarkMode && { backgroundColor: theme.background }]} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3498db']} />
      }
    >
      {/* Welcome Banner */}
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
            <Text style={styles.welcomeText}>
              Welcome back, {student.firstName || 'Student'}!
            </Text>
            <Text style={styles.welcomeSubtext}>
              Continue your learning journey and achieve your goals today!
            </Text>
          </View>
          <Text style={styles.bannerIcon}>📘</Text>
        </View>
      </LinearGradient>

      {/* Progress Tracker */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, isDarkMode && { color: theme.text }]}>Progress Tracker</Text>
          <TouchableOpacity onPress={() => onNavigate && onNavigate('progress')}>
            <Text style={styles.sectionLink}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressTracker}>
          {buildProgressCards().length === 0 ? (
            <View style={[styles.progressCard, styles.progressCardEmpty, isDarkMode && { backgroundColor: theme.card }]}>
              <Text style={styles.emptyText}>No courses enrolled yet. Enroll in courses to track your progress!</Text>
            </View>
          ) : (
            buildProgressCards().map((data) => (
              <View key={data.key} style={[styles.progressCard, isDarkMode && { backgroundColor: theme.card }]}>
                <View style={styles.progressHeaderRow}>
                  <Text style={[styles.progressTitle, isDarkMode && { color: theme.text }]}>
                    📊 {data.courseName}
                  </Text>
                  <Text style={[styles.progressPercent, isDarkMode && { color: theme.primary }]}>{data.percent}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${data.percent}%` }]} />
                </View>
                <View style={styles.progressStatsRow}>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>{data.completedLessons}/{data.totalLessons}</Text>
                    <Text style={styles.progressStatLabel}>Lectures</Text>
                  </View>
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>{data.avgScore}%</Text>
                    <Text style={styles.progressStatLabel}>Avg. Grade</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, isDarkMode && { color: theme.text }]}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => onNavigate && onNavigate('assignments')}>
            <Text style={styles.sectionLink}>View Full Schedule</Text>
          </TouchableOpacity>
        </View>
        {upcomingClasses.map((cls, index) => (
          <View key={index} style={[styles.scheduleCard, isDarkMode && { backgroundColor: theme.card }]}>
            <View style={styles.scheduleTime}>
              <Text style={[styles.timeText, isDarkMode && { color: theme.primary }]}>{cls.time}</Text>
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={[styles.subjectText, isDarkMode && { color: theme.text }]}>{cls.subject}</Text>
              <Text style={[styles.roomText, isDarkMode && { color: theme.textSecondary }]}>{cls.room}</Text>
              {cls.zoomLink && (
                <TouchableOpacity onPress={() => Linking.openURL(cls.zoomLink)}>
                  <Text style={styles.zoomLink}>Join Zoom Meeting</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, isDarkMode && { color: theme.text }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => onNavigate && onNavigate('notifications')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentActivity.map((activity, index) => (
          <View key={index} style={[styles.activityCard, isDarkMode && { backgroundColor: theme.card }]}>
            <Text style={[styles.activityText, isDarkMode && { color: theme.text }]}>{activity.text}</Text>
            <Text style={[styles.activityTime, isDarkMode && { color: theme.textSecondary }]}>{activity.time}</Text>
          </View>
        ))}
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
  bannerIcon: {
    fontSize: 36,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLink: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '600',
  },
  progressTracker: {
    gap: 12,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  progressCardEmpty: {
    alignItems: 'center',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3498db',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
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
  zoomLink: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#2D8CFF',
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
