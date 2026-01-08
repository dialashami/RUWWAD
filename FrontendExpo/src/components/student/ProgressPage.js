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
import { useStudent } from '../../context/StudentContext';
import { studentDashboardAPI, feedbackAPI } from '../../services/api';

const defaultProgressData = {
  overallProgress: 75,
  subjects: [
    { name: 'Mathematics', progress: 85, grade: 'A' },
    { name: 'Physics', progress: 70, grade: 'B+' },
    { name: 'English', progress: 90, grade: 'A' },
    { name: 'Chemistry', progress: 60, grade: 'B' },
    { name: 'History', progress: 55, grade: 'B-' },
  ],
  achievements: [
    { title: 'Fast Learner', icon: '🚀', date: 'Dec 20, 2025' },
    { title: 'Perfect Score', icon: '⭐', date: 'Dec 15, 2025' },
    { title: 'Consistent Learner', icon: '📚', date: 'Dec 10, 2025' },
  ],
  weeklyStats: {
    lessonsCompleted: 12,
    assignmentsSubmitted: 5,
    hoursSpent: 18,
  },
};

export default function ProgressPage() {
  // Get data from student context
  const { student, progress: contextProgress, refreshData, loading: contextLoading } = useStudent();

  const [progressData, setProgressData] = useState(defaultProgressData);
  const [feedback, setFeedback] = useState({ received: [], given: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProgress();
    fetchFeedback();
  }, [student.id, contextProgress]);

  const fetchFeedback = async () => {
    try {
      const response = await feedbackAPI.getMyFeedback();
      if (response.data) {
        setFeedback({
          received: response.data.received || [],
          given: response.data.given || [],
        });
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    }
  };

  const fetchProgress = async () => {
    try {
      // First check context progress data
      if (contextProgress && contextProgress.overallProgress !== undefined) {
        setProgressData({
          overallProgress: contextProgress.overallProgress || 0,
          subjects: contextProgress.subjectProgress?.map(s => ({
            name: s.name,
            progress: s.progress || 0,
            grade: s.grade || '-',
          })) || defaultProgressData.subjects,
          achievements: contextProgress.achievements || defaultProgressData.achievements,
          weeklyStats: contextProgress.weeklyStats || defaultProgressData.weeklyStats,
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fallback to API call
      const response = await studentDashboardAPI.getProgress();
      const data = response.data;
      if (data) {
        setProgressData({
          overallProgress: data.overallProgress || defaultProgressData.overallProgress,
          subjects: data.subjects || defaultProgressData.subjects,
          achievements: data.achievements || defaultProgressData.achievements,
          weeklyStats: data.weeklyStats || defaultProgressData.weeklyStats,
        });
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      setProgressData(defaultProgressData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    fetchProgress();
    fetchFeedback();
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#28a745';
    if (progress >= 60) return '#ffc107';
    return '#dc3545';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
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
      <View style={styles.overallCard}>
        <Text style={styles.overallLabel}>Overall Progress</Text>
        <View style={styles.progressCircle}>
          <Text style={styles.progressValue}>{progressData.overallProgress}%</Text>
        </View>
        <Text style={styles.progressNote}>Keep up the great work! 🎉</Text>
      </View>

      {/* Weekly Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progressData.weeklyStats.lessonsCompleted}</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progressData.weeklyStats.assignmentsSubmitted}</Text>
          <Text style={styles.statLabel}>Assignments</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progressData.weeklyStats.hoursSpent}h</Text>
          <Text style={styles.statLabel}>Study Time</Text>
        </View>
      </View>

      {/* Subject Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject Progress</Text>
        {progressData.subjects.map((subject, index) => (
          <View key={index} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>{subject.grade}</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
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
        ))}
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <View style={styles.achievementsGrid}>
          {progressData.achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDate}>{achievement.date}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Feedback Section - Only show 4+ star feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teacher Feedback</Text>
        {feedback.received.filter(item => item.rating >= 4).length > 0 ? (
          feedback.received.filter(item => item.rating >= 4).map((item, index) => (
            <View key={index} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <View style={styles.feedbackRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text 
                      key={star} 
                      style={[
                        styles.feedbackStar,
                        star <= (item.rating || 0) && styles.feedbackStarActive
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={styles.feedbackDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {item.comment && (
                <Text style={styles.feedbackComment}>{item.comment}</Text>
              )}
              <View style={styles.feedbackMeta}>
                <Text style={styles.feedbackFrom}>
                  From: {item.author?.firstName} {item.author?.lastName}
                </Text>
                {item.course && (
                  <Text style={styles.feedbackCourse}>
                    {item.course.subject || item.course.title}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyFeedback}>
            <Text style={styles.emptyFeedbackIcon}>💬</Text>
            <Text style={styles.emptyFeedbackText}>No feedback received yet</Text>
            <Text style={styles.emptyFeedbackSubtext}>
              Keep working hard and you'll receive feedback soon!
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
