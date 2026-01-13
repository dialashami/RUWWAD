import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudent } from '../../context/StudentContext';
import { useTheme } from '../../context/ThemeContext';
import { chapterAPI, quizAPI } from '../../services/api';

// Default quiz data for demo purposes
const defaultQuizzes = [
  {
    id: 1,
    title: 'Algebra Fundamentals Quiz',
    subject: 'Mathematics',
    type: 'quiz',
    questions: 20,
    duration: 30,
    deadline: 'Jan 20, 2026',
    status: 'available',
    score: null,
    difficulty: 'Medium',
    attempts: 0,
    maxAttempts: 3,
  },
  {
    id: 2,
    title: 'Physics Midterm Exam',
    subject: 'Physics',
    type: 'exam',
    questions: 50,
    duration: 120,
    deadline: 'Jan 25, 2026',
    status: 'upcoming',
    score: null,
    difficulty: 'Hard',
    attempts: 0,
    maxAttempts: 1,
  },
  {
    id: 3,
    title: 'Organic Chemistry Test',
    subject: 'Chemistry',
    type: 'quiz',
    questions: 15,
    duration: 25,
    deadline: 'Jan 15, 2026',
    status: 'completed',
    score: 92,
    difficulty: 'Medium',
    attempts: 1,
    maxAttempts: 2,
  },
  {
    id: 4,
    title: 'Cell Biology Assessment',
    subject: 'Biology',
    type: 'quiz',
    questions: 25,
    duration: 40,
    deadline: 'Jan 18, 2026',
    status: 'in-progress',
    score: null,
    difficulty: 'Easy',
    attempts: 1,
    maxAttempts: 3,
  },
];

const statusConfig = {
  available: {
    icon: '▶️',
    color: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.1)',
    badgeGradient: ['#4F46E5', '#9333EA'],
    label: 'Start Now',
  },
  upcoming: {
    icon: '📅',
    color: '#FACC15',
    bg: 'rgba(250, 204, 21, 0.1)',
    badgeGradient: ['#FACC15', '#FCD34D'],
    label: 'Upcoming',
  },
  'in-progress': {
    icon: '⏱️',
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.1)',
    badgeGradient: ['#F97316', '#FB923C'],
    label: 'Resume',
  },
  completed: {
    icon: '✅',
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.1)',
    badgeGradient: ['#22C55E', '#4ADE80'],
    label: 'Completed',
  },
};

export default function QuizzesExams() {
  const { student, courses, refreshData } = useStudent();
  const { isDarkMode, theme } = useTheme();

  const [activeTab, setActiveTab] = useState('all');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, [student.id, courses]);

  const fetchQuizzes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setQuizzes(defaultQuizzes);
        setLoading(false);
        return;
      }

      // Collect quizzes from enrolled courses' chapters
      const allQuizzes = [];
      
      for (const course of courses) {
        const courseId = course._id || course.id;
        if (!courseId) continue;

        try {
          const response = await chapterAPI.getChaptersByCourse(courseId, student.id);
          const chapters = response.data?.chapters || response.data || [];
          
          chapters.forEach((chapter, index) => {
            if (chapter.quiz?.isGenerated) {
              const studentProgress = chapter.studentProgress || {};
              let status = 'available';
              
              // Check if quiz is locked (prerequisites not met)
              const totalLectures = chapter.lectures?.length || 0;
              const watchedLectures = studentProgress.lecturesWatched?.length || 0;
              const allLecturesComplete = totalLectures === 0 || watchedLectures >= totalLectures;
              const hasSlides = (chapter.slides?.length > 0) || chapter.slideContent;
              const slidesViewed = !hasSlides || studentProgress.slidesViewed;
              
              if (!allLecturesComplete || !slidesViewed) {
                status = 'upcoming'; // Quiz locked
              } else if (studentProgress.quizPassed) {
                status = 'completed';
              } else if (studentProgress.quizAttempts > 0) {
                status = 'in-progress';
              }

              allQuizzes.push({
                id: chapter._id,
                chapterId: chapter._id,
                courseId: courseId,
                title: `${chapter.title} Quiz`,
                subject: course.subject || course.title,
                type: 'quiz',
                questions: chapter.quiz.numberOfQuestions || 10,
                duration: chapter.quiz.timeLimit || 30,
                deadline: course.endDate || 'No deadline',
                status,
                score: studentProgress.bestScore || null,
                difficulty: chapter.quiz.difficulty || 'Medium',
                attempts: studentProgress.quizAttempts || 0,
                maxAttempts: chapter.quiz.maxAttempts || 3,
                passingScore: chapter.quiz.passingScore || 70,
                chapterNumber: chapter.chapterNumber || index + 1,
              });
            }
          });
        } catch (err) {
          console.log(`Error fetching chapters for course ${courseId}:`, err.message);
        }
      }

      if (allQuizzes.length > 0) {
        setQuizzes(allQuizzes);
      } else {
        // No real quizzes, show demo data
        setQuizzes(defaultQuizzes);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setQuizzes(defaultQuizzes);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    fetchQuizzes();
  };

  const handleStartQuiz = async (quiz) => {
    if (quiz.status === 'upcoming') {
      Alert.alert(
        'Quiz Locked',
        'You need to complete all lectures and view slides before taking this quiz.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      quiz.status === 'in-progress' ? 'Resume Quiz' : 'Start Quiz',
      `${quiz.title}\n\n` +
      `📝 ${quiz.questions} questions\n` +
      `⏱️ ${quiz.duration} minutes\n` +
      `🎯 Passing score: ${quiz.passingScore || 70}%\n` +
      `📊 Attempts: ${quiz.attempts}/${quiz.maxAttempts}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: quiz.status === 'in-progress' ? 'Resume' : 'Start',
          onPress: () => {
            // TODO: Navigate to quiz taking screen
            Alert.alert('Coming Soon', 'Quiz taking feature will be available soon!');
          },
        },
      ]
    );
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'quizzes') return quiz.type === 'quiz';
    if (activeTab === 'exams') return quiz.type === 'exam';
    if (activeTab === 'completed') return quiz.status === 'completed';
    return true;
  });

  const stats = {
    total: quizzes.length,
    completed: quizzes.filter(q => q.status === 'completed').length,
    average: quizzes.filter(q => q.score !== null).length > 0
      ? Math.round(
          quizzes.filter(q => q.score !== null).reduce((acc, q) => acc + (q.score || 0), 0) /
          quizzes.filter(q => q.score !== null).length
        )
      : 0,
  };

  const tabs = ['all', 'quizzes', 'exams', 'completed'];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, isDarkMode && { color: theme.text }]}>
          Loading quizzes...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, isDarkMode && { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isDarkMode && { color: theme.text }]}>
          📝 Quizzes & Exams
        </Text>
        <Text style={[styles.subtitle, isDarkMode && { color: theme.textSecondary }]}>
          Test your knowledge and track your progress
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['rgba(79, 70, 229, 0.1)', 'rgba(147, 51, 234, 0.1)']}
          style={styles.statCard}
        >
          <Text style={[styles.statLabel, isDarkMode && { color: theme.textSecondary }]}>
            Completed
          </Text>
          <Text style={[styles.statValue, { color: '#4F46E5' }]}>
            {stats.completed}/{stats.total}
          </Text>
        </LinearGradient>
        
        <View style={[styles.statCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
          <Text style={[styles.statLabel, isDarkMode && { color: theme.textSecondary }]}>
            Average Score
          </Text>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>
            {stats.average}%
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive,
              isDarkMode && styles.tabDark,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            {activeTab === tab ? (
              <LinearGradient
                colors={['#4F46E5', '#9333EA']}
                style={styles.tabGradient}
              >
                <Text style={styles.tabTextActive}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.tabText, isDarkMode && { color: theme.text }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quiz List */}
      <View style={styles.quizList}>
        {filteredQuizzes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, isDarkMode && { color: theme.text }]}>
              No quizzes found
            </Text>
            <Text style={[styles.emptySubtext, isDarkMode && { color: theme.textSecondary }]}>
              Quizzes will appear here when available
            </Text>
          </View>
        ) : (
          filteredQuizzes.map((quiz, index) => {
            const config = statusConfig[quiz.status] || statusConfig.available;

            return (
              <View
                key={quiz.id || index}
                style={[
                  styles.quizCard,
                  isDarkMode && { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.quizCardContent}>
                  {/* Icon */}
                  <View style={[styles.quizIcon, { backgroundColor: config.bg }]}>
                    <Text style={styles.quizIconText}>{config.icon}</Text>
                  </View>

                  {/* Content */}
                  <View style={styles.quizInfo}>
                    <View style={styles.quizHeader}>
                      <Text
                        style={[styles.quizTitle, isDarkMode && { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {quiz.title}
                      </Text>
                      <LinearGradient
                        colors={config.badgeGradient}
                        style={styles.statusBadge}
                      >
                        <Text style={styles.statusBadgeText}>{config.label}</Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.quizMeta}>
                      <Text style={[styles.quizMetaText, isDarkMode && { color: theme.textSecondary }]}>
                        {quiz.subject}
                      </Text>
                      <Text style={[styles.quizMetaDot, isDarkMode && { color: theme.textSecondary }]}>
                        •
                      </Text>
                      <Text style={[styles.quizMetaText, isDarkMode && { color: theme.textSecondary }]}>
                        {quiz.type.charAt(0).toUpperCase() + quiz.type.slice(1)}
                      </Text>
                      <Text style={[styles.quizMetaDot, isDarkMode && { color: theme.textSecondary }]}>
                        •
                      </Text>
                      <Text style={[styles.quizMetaText, isDarkMode && { color: theme.textSecondary }]}>
                        {quiz.difficulty}
                      </Text>
                    </View>

                    {/* Score display for completed */}
                    {quiz.score !== null && (
                      <View style={styles.scoreContainer}>
                        <Text style={styles.scoreIcon}>🏆</Text>
                        <Text style={styles.scoreText}>{quiz.score}%</Text>
                      </View>
                    )}

                    {/* Details */}
                    <View style={styles.quizDetails}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>📝</Text>
                        <Text style={[styles.detailText, isDarkMode && { color: theme.textSecondary }]}>
                          {quiz.questions} questions
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>⏱️</Text>
                        <Text style={[styles.detailText, isDarkMode && { color: theme.textSecondary }]}>
                          {quiz.duration} min
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>📊</Text>
                        <Text style={[styles.detailText, isDarkMode && { color: theme.textSecondary }]}>
                          {quiz.attempts}/{quiz.maxAttempts} attempts
                        </Text>
                      </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        quiz.status === 'upcoming' && styles.actionButtonDisabled,
                      ]}
                      onPress={() => handleStartQuiz(quiz)}
                      disabled={quiz.status === 'upcoming'}
                    >
                      {quiz.status === 'available' && (
                        <LinearGradient
                          colors={['#4F46E5', '#9333EA']}
                          style={styles.actionButtonGradient}
                        >
                          <Text style={styles.actionButtonText}>▶️ Start Quiz</Text>
                        </LinearGradient>
                      )}
                      {quiz.status === 'in-progress' && (
                        <LinearGradient
                          colors={['#F97316', '#FB923C']}
                          style={styles.actionButtonGradient}
                        >
                          <Text style={styles.actionButtonText}>⏱️ Resume</Text>
                        </LinearGradient>
                      )}
                      {quiz.status === 'completed' && (
                        <View style={styles.actionButtonOutline}>
                          <Text style={[styles.actionButtonTextOutline, isDarkMode && { color: theme.text }]}>
                            View Results
                          </Text>
                        </View>
                      )}
                      {quiz.status === 'upcoming' && (
                        <View style={styles.actionButtonOutline}>
                          <Text style={styles.actionButtonTextDisabled}>
                            🔒 Not Available Yet
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 8,
  },
  tabDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {},
  tabGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabText: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  quizList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  quizCardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  quizIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizIconText: {
    fontSize: 24,
  },
  quizInfo: {
    flex: 1,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  quizTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizMetaText: {
    fontSize: 13,
    color: '#64748b',
  },
  quizMetaDot: {
    marginHorizontal: 6,
    color: '#d1d5db',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  quizDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonOutline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  actionButtonTextOutline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionButtonTextDisabled: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
