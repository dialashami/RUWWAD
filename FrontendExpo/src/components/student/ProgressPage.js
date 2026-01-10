import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudent } from '../../context/StudentContext';
import { useTheme } from '../../context/ThemeContext';
import { studentDashboardAPI } from '../../services/api';

// Empty state - no fake data
const emptyProgressData = {
  overallProgress: 0,
  subjects: [],
  achievements: [],
  weeklyStats: {
    lessonsCompleted: 0,
    assignmentsSubmitted: 0,
    hoursSpent: 0,
  },
  coursesCount: 0,
  assignmentsCount: 0,
};

export default function ProgressPage() {
  // Get data from student context
  const { student, refreshData, loading: contextLoading } = useStudent();
  const { isDarkMode, theme } = useTheme();

  const [progressData, setProgressData] = useState(emptyProgressData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, [student.id]);

  const fetchProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch from API
      const response = await studentDashboardAPI.getProgress();
      const data = response.data;
      
      if (data) {
        setProgressData({
          overallProgress: data.overallProgress || 0,
          subjects: data.subjectProgress?.map(s => ({
            name: s.name,
            progress: s.progress || 0,
            grade: s.grade || '-',
            totalVideos: s.totalVideos || 0,
            watchedVideos: s.watchedVideos || 0,
          })) || [],
          achievements: data.achievements || [],
          weeklyStats: data.weeklyStats || emptyProgressData.weeklyStats,
          coursesCount: data.coursesCount || 0,
          assignmentsCount: data.assignmentsCount || 0,
          totalVideos: data.totalVideos || 0,
          totalWatchedVideos: data.totalWatchedVideos || 0,
          averageScore: data.averageScore || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      setProgressData(emptyProgressData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    fetchProgress();
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#28a745';
    if (progress >= 60) return '#ffc107';
    return '#dc3545';
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, isDarkMode && { backgroundColor: theme.background }]} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Banner */}
      <LinearGradient
        colors={['#3498db', '#2c3e50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorSquare} />
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>My Progress</Text>
            <Text style={styles.bannerSubtitle}>Track your learning journey</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Overall Progress */}
      <View style={[styles.overallCard, isDarkMode && { backgroundColor: theme.card }]}>
        <Text style={[styles.overallLabel, isDarkMode && { color: theme.textSecondary }]}>Overall Progress</Text>
        <View style={styles.progressCircle}>
          <Text style={[styles.progressValue, isDarkMode && { color: theme.text }]}>{progressData.overallProgress}%</Text>
        </View>
        <Text style={[styles.progressNote, isDarkMode && { color: theme.textSecondary }]}>Keep up the great work! 🎉</Text>
      </View>

      {/* Weekly Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statItem, isDarkMode && { backgroundColor: theme.card }]}>
          <Text style={[styles.statValue, isDarkMode && { color: theme.text }]}>{progressData.weeklyStats.lessonsCompleted}</Text>
          <Text style={[styles.statLabel, isDarkMode && { color: theme.textSecondary }]}>Videos Watched</Text>
        </View>
        <View style={[styles.statItem, isDarkMode && { backgroundColor: theme.card }]}>
          <Text style={[styles.statValue, isDarkMode && { color: theme.text }]}>{progressData.weeklyStats.assignmentsSubmitted}</Text>
          <Text style={[styles.statLabel, isDarkMode && { color: theme.textSecondary }]}>Assignments</Text>
        </View>
        <View style={[styles.statItem, isDarkMode && { backgroundColor: theme.card }]}>
          <Text style={[styles.statValue, isDarkMode && { color: theme.text }]}>{progressData.weeklyStats.hoursSpent}h</Text>
          <Text style={[styles.statLabel, isDarkMode && { color: theme.textSecondary }]}>Study Time</Text>
        </View>
      </View>

      {/* Subject Progress */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && { color: theme.text }]}>Subject Progress</Text>
        {progressData.subjects.length > 0 ? (
          progressData.subjects.map((subject, index) => (
            <View key={index} style={[styles.subjectCard, isDarkMode && { backgroundColor: theme.card }]}>
              <View style={styles.subjectHeader}>
                <View style={styles.subjectNameContainer}>
                  <Text style={[styles.subjectName, isDarkMode && { color: theme.text }]}>{subject.name}</Text>
                  {subject.totalVideos > 0 && (
                    <Text style={[styles.videoCount, isDarkMode && { color: theme.textSecondary }]}>
                      📹 {subject.watchedVideos}/{subject.totalVideos} videos
                    </Text>
                  )}
                </View>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{subject.grade}</Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, isDarkMode && { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${subject.progress}%`,
                        backgroundColor: getProgressColor(subject.progress),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>{subject.progress}%</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No courses available yet</Text>
            <Text style={styles.emptySubtext}>
              Enroll in courses to track your progress
            </Text>
          </View>
        )}
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {progressData.achievements.length > 0 ? (
          <View style={styles.achievementsGrid}>
            {progressData.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDate}>{achievement.date}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>No achievements yet</Text>
            <Text style={styles.emptySubtext}>
              Complete lessons and assignments to earn achievements!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerBanner: {
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
  bannerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  overallCard: {
    margin: 15,
    padding: 25,
    backgroundColor: '#007bff',
    borderRadius: 20,
    alignItems: 'center',
  },
  overallLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#fff',
  },
  progressValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressNote: {
    fontSize: 14,
    color: '#fff',
    marginTop: 15,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  subjectCard: {
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
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  subjectNameContainer: {
    flex: 1,
  },
  videoCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  gradeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 45,
    textAlign: 'right',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  achievementDate: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackRating: {
    flexDirection: 'row',
  },
  feedbackStar: {
    fontSize: 16,
    color: '#d1d5db',
    marginRight: 2,
  },
  feedbackStarActive: {
    color: '#fbbf24',
  },
  feedbackDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  feedbackComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  feedbackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  feedbackFrom: {
    fontSize: 12,
    color: '#6b7280',
  },
  feedbackCourse: {
    fontSize: 11,
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyFeedback: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyFeedbackIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyFeedbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptyFeedbackSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
