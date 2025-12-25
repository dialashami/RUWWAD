import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { studentDashboardAPI } from '../../services/api';

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
  const [progressData, setProgressData] = useState(defaultProgressData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchProgress();
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Progress</Text>
        <Text style={styles.subtitle}>Track your learning journey</Text>
      </View>

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
});
