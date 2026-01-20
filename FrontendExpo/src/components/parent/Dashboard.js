import React, { useState } from 'react';
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
import { useParent } from '../../context/ParentContext';

export default function Dashboard() {
  // Get data from context
  const {
    parent,
    getFullName,
    children: contextChildren,
    childrenData: contextChildrenData,
    selectedChild,
    selectChild,
    loading: contextLoading,
    refreshData,
  } = useParent();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getGradeDisplay = (child) => {
    if (child.studentType === 'university') {
      return child.universityMajor || 'University';
    }
    if (child.schoolGrade) {
      const gradeNum = child.schoolGrade.replace('grade', '');
      return `Grade ${gradeNum}`;
    }
    return 'Student';
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    return 'D';
  };

  const getCourseProgress = (course) => {
    if (!course?.chapters || course.chapters.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    const completed = course.chapters.filter(ch => ch?.progress?.chapterCompleted).length;
    const total = course.chapters.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const getQuizSummary = (course) => {
    if (!course?.chapters || course.chapters.length === 0) {
      return { passed: 0, total: 0, avgScore: 0 };
    }
    const quizChapters = course.chapters.filter(ch => ch?.quiz?.isGenerated);
    const passed = quizChapters.filter(ch => ch?.quiz?.quizPassed).length;
    const totalScores = quizChapters.reduce((sum, ch) => sum + (ch?.quiz?.bestScore || 0), 0);
    return {
      passed,
      total: quizChapters.length,
      avgScore: quizChapters.length > 0 ? Math.round(totalScores / quizChapters.length) : 0,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return { bg: '#dcfce7', text: '#166534' };
      case 'failed':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'pending':
        return { bg: '#fef9c3', text: '#854d0e' };
      case 'not-started':
        return { bg: '#f3f4f6', text: '#6b7280' };
      default:
        return { bg: '#e0f2fe', text: '#0369a1' };
    }
  };

  if (contextLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Ensure contextChildren is an array
  const children = Array.isArray(contextChildren) ? contextChildren : [];

  // No children linked
  if (children.length === 0) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9333ea']} />
        }
      >
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
                Welcome{getFullName() !== 'Parent' ? `, ${getFullName()}` : ''} 👋
              </Text>
              <Text style={styles.welcomeSubtext}>No children linked yet</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>Link Your Children</Text>
          <Text style={styles.emptyText}>
            Go to Settings → My Children to add your children by their email address.
          </Text>
          <Text style={styles.emptyText}>
            Once linked, you'll be able to view their courses, assignments, and grades here.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const childNames = children.map(c => `${c.firstName} ${c.lastName}`).join(', ');
  const currentChildData = selectedChild ? contextChildrenData[selectedChild] : null;
  const currentChild = children.find(c => c._id === selectedChild);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9333ea']} />
      }
    >
      {/* Banner */}
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
              Welcome{getFullName() !== 'Parent' ? `, ${getFullName()}` : ''} 👋
            </Text>
            <Text style={styles.welcomeSubtext}>Your children: {childNames}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Child Selector */}
      {children.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.childSelector}
        >
          {children.map((child) => (
            <TouchableOpacity
              key={child._id}
              style={[
                styles.childTab,
                selectedChild === child._id && styles.childTabActive
              ]}
              onPress={() => selectChild(child._id)}
            >
              <Text style={[
                styles.childTabText,
                selectedChild === child._id && styles.childTabTextActive
              ]}>
                {child.firstName} {child.lastName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Child Card */}
      {currentChild && (
        <View style={styles.mainCard}>
          {/* Child Header */}
          <View style={styles.childHeader}>
            <View style={styles.childInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentChild.firstName?.charAt(0)}{currentChild.lastName?.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.childName}>
                  {currentChild.firstName} {currentChild.lastName}
                </Text>
                <Text style={styles.childGrade}>
                  {getGradeDisplay(currentChild)}
                </Text>
              </View>
            </View>
            <View style={styles.overallPill}>
              <Text style={styles.overallText}>
                Overall: {currentChildData?.stats?.averageGrade || 0}%
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Courses</Text>
              <Text style={styles.statValue}>{currentChildData?.stats?.totalCourses || 0}</Text>
              <Text style={styles.statSub}>Enrolled</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Quiz Avg</Text>
              <Text style={[styles.statValue, { color: (currentChildData?.stats?.averageQuizScore || 0) >= 60 ? '#16a34a' : '#991b1b' }]}>
                {currentChildData?.stats?.averageQuizScore || 0}%
              </Text>
              <Text style={styles.statSub}>
                {currentChildData?.stats?.passedQuizzes || 0}/{currentChildData?.stats?.totalQuizzes || 0} Passed
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Assignments</Text>
              <Text style={styles.statValue}>
                {currentChildData?.stats?.completedAssignments || 0}/{currentChildData?.stats?.totalAssignments || 0}
              </Text>
              <Text style={styles.statSub}>{currentChildData?.stats?.pendingAssignments || 0} Pending</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Grade Avg</Text>
              <Text style={[styles.statValue, { color: (currentChildData?.stats?.averageGrade || 0) >= 60 ? '#16a34a' : '#991b1b' }]}>
                {currentChildData?.stats?.averageGrade || 0}%
              </Text>
              <Text style={styles.statSub}>{getLetterGrade(currentChildData?.stats?.averageGrade || 0)}</Text>
            </View>
          </View>

          {/* Courses Section with Chapters & Quizzes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎓 Enrolled Courses & Progress</Text>
            {currentChildData?.courses?.length > 0 ? (
              <View style={styles.courseList}>
                {currentChildData.courses.map((course) => {
                  const courseProgress = getCourseProgress(course);
                  const quizSummary = getQuizSummary(course);

                  return (
                    <View key={course._id} style={styles.courseCard}>
                      <View style={styles.courseHeaderRow}>
                        <View style={styles.courseHeaderLeft}>
                          <Text style={styles.courseName}>{course.title}</Text>
                          <Text style={styles.courseDetails}>
                            {course.subject || 'General'} • {course.grade || course.universityMajor || 'All Grades'}
                          </Text>
                        </View>
                        <View style={[
                          styles.courseStatusBadge,
                          courseProgress.percentage === 100 ? styles.courseStatusCompleted : styles.courseStatusInProgress,
                        ]}>
                          <Text style={[
                            styles.courseStatusText,
                            courseProgress.percentage === 100 ? styles.courseStatusTextCompleted : styles.courseStatusTextInProgress,
                          ]}>
                            {courseProgress.percentage === 100 ? '✅ Completed' : `${courseProgress.percentage}% Complete`}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.courseProgressRow}>
                        <Text style={styles.courseProgressLabel}>
                          Chapters: {courseProgress.completed}/{courseProgress.total}
                        </Text>
                        <Text style={styles.courseProgressLabel}>
                          Quizzes Passed: {quizSummary.passed}/{quizSummary.total}
                        </Text>
                      </View>

                      <View style={styles.courseProgressBar}>
                        <View
                          style={[
                            styles.courseProgressFill,
                            {
                              width: `${courseProgress.percentage}%`,
                              backgroundColor: courseProgress.percentage === 100 ? '#16a34a' : '#3b82f6',
                            },
                          ]}
                        />
                      </View>

                      {quizSummary.total > 0 && (
                        <Text style={styles.courseQuizAverage}>
                          Average Quiz Score:{' '}
                          <Text style={{ color: quizSummary.avgScore >= 60 ? '#16a34a' : '#991b1b', fontWeight: '700' }}>
                            {quizSummary.avgScore}%
                          </Text>
                        </Text>
                      )}

                      {course.chapters && course.chapters.length > 0 && (
                        <View style={styles.chapterSection}>
                          <Text style={styles.chapterHeader}>📚 Chapters & Quiz Grades</Text>
                          {course.chapters.map((chapter) => {
                            const progress = chapter.progress || {};
                            const quiz = chapter.quiz || {};
                            const quizStatus = !quiz.isGenerated
                              ? 'not-started'
                              : quiz.quizPassed
                              ? 'passed'
                              : (quiz.attempts?.length > 0 ? 'failed' : 'pending');
                            const statusColors = getStatusColor(quizStatus);

                            return (
                              <View key={chapter._id} style={styles.chapterCard}>
                                <View style={styles.chapterRow}>
                                  <View style={styles.chapterInfo}>
                                    <Text style={styles.chapterTitle}>
                                      Chapter {chapter.chapterNumber}: {chapter.title}
                                    </Text>
                                    <Text style={styles.chapterMeta}>
                                      {chapter.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                                      {progress.slidesViewed ? ' • 📄 Slides Viewed' : ''}
                                      {progress.allLecturesCompleted ? ' • 🎥 Lectures Done' : ''}
                                    </Text>
                                  </View>
                                  <View style={[
                                    styles.chapterStatus,
                                    progress.chapterCompleted ? styles.chapterStatusCompleted : styles.chapterStatusInProgress,
                                  ]}>
                                    <Text style={[
                                      styles.chapterStatusText,
                                      progress.chapterCompleted ? styles.chapterStatusTextCompleted : styles.chapterStatusTextInProgress,
                                    ]}>
                                      {progress.chapterCompleted ? 'Completed' : 'In Progress'}
                                    </Text>
                                  </View>
                                </View>

                                {quiz.isGenerated && (
                                  <View style={styles.quizCard}>
                                    <View style={styles.quizHeaderRow}>
                                      <Text style={styles.quizTitle}>📝 Quiz - {course.title}</Text>
                                      <View style={[styles.quizStatusBadge, { backgroundColor: statusColors.bg }]}>
                                        <Text style={[styles.quizStatusText, { color: statusColors.text }]}
                                        >
                                          {quizStatus === 'passed' && '✅ Passed'}
                                          {quizStatus === 'failed' && '❌ Not Passed'}
                                          {quizStatus === 'pending' && '⏳ Not Attempted'}
                                          {quizStatus === 'not-started' && '📋 No Quiz'}
                                        </Text>
                                      </View>
                                    </View>

                                    <View style={styles.quizStatsRow}>
                                      <Text style={styles.quizStat}>Attempts: <Text style={styles.quizStatBold}>{quiz.attempts?.length || 0}</Text></Text>
                                      <Text style={styles.quizStat}>Best Score: <Text style={[styles.quizStatBold, { color: (quiz.bestScore || 0) >= (quiz.passingScore || 60) ? '#16a34a' : '#991b1b' }]}>{quiz.bestScore || 0}%</Text></Text>
                                      <Text style={styles.quizStat}>Passing: <Text style={styles.quizStatBold}>{quiz.passingScore}%</Text></Text>
                                      <Text style={styles.quizStat}>Grade: <Text style={styles.quizStatBold}>{getLetterGrade(quiz.bestScore || 0)}</Text></Text>
                                    </View>

                                    {quiz.attempts && quiz.attempts.length > 0 && (
                                      <View style={styles.quizAttemptsList}>
                                        {quiz.attempts.map((attempt, index) => (
                                          <View key={`${chapter._id}-attempt-${index}`} style={styles.quizAttemptRow}>
                                            <Text style={styles.quizAttemptCell}>Attempt {attempt.attemptNumber}</Text>
                                            <Text style={styles.quizAttemptCell}>{attempt.score}%</Text>
                                            <Text style={styles.quizAttemptCell}>{getLetterGrade(attempt.score)}</Text>
                                            <Text style={styles.quizAttemptCell}>{attempt.correctAnswers}/{attempt.totalQuestions}</Text>
                                            <Text style={styles.quizAttemptCell}>{attempt.passed ? '✅' : '❌'}</Text>
                                            <Text style={styles.quizAttemptCell}>
                                              {attempt.attemptedAt ? new Date(attempt.attemptedAt).toLocaleDateString() : '-'}
                                            </Text>
                                          </View>
                                        ))}
                                      </View>
                                    )}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptySection}>No courses enrolled yet.</Text>
            )}
          </View>

          {/* Assignments Section */}
          <View style={[styles.section, { marginBottom: 30 }]}>
            <Text style={styles.sectionTitle}>Assignments & Grades</Text>
            {currentChildData?.assignments?.length > 0 ? (
              currentChildData.assignments.map((assignment) => (
                <View key={assignment._id} style={styles.assignmentItem}>
                  <View style={styles.assignmentInfo}>
                    <Text style={styles.assignmentName}>{assignment.title}</Text>
                    <Text style={styles.assignmentDetails}>
                      {assignment.course?.title || 'Unknown'} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[
                    styles.gradeBadge,
                    assignment.isGraded
                      ? (assignment.grade >= 80 ? styles.gradeGood : assignment.grade >= 60 ? styles.gradeOk : styles.gradeBad)
                      : (assignment.submitted ? styles.gradeSubmitted : styles.gradePending)
                  ]}>
                    <Text style={[
                      styles.gradeText,
                      assignment.isGraded
                        ? (assignment.grade >= 80 ? styles.gradeTextGood : assignment.grade >= 60 ? styles.gradeTextOk : styles.gradeTextBad)
                        : (assignment.submitted ? styles.gradeTextSubmitted : styles.gradeTextPending)
                    ]}>
                      {assignment.isGraded
                        ? `${assignment.grade}% (${getLetterGrade(assignment.grade)})`
                        : (assignment.submitted ? 'Submitted' : 'Pending')}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptySection}>No assignments yet.</Text>
            )}
          </View>
        </View>
      )}
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
  childSelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  childTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  childTabActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#9333ea',
  },
  childTabText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  childTabTextActive: {
    color: '#9333ea',
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  childGrade: {
    fontSize: 13,
    color: '#6b7280',
  },
  overallPill: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  overallText: {
    color: '#3498db',
    fontWeight: '600',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    width: '48%',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 4,
  },
  statSub: {
    fontSize: 11,
    color: '#9ca3af',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  courseList: {
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  courseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  courseDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  courseStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  courseStatusCompleted: {
    backgroundColor: '#dcfce7',
  },
  courseStatusInProgress: {
    backgroundColor: '#e0f2fe',
  },
  courseStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },
  courseStatusTextCompleted: {
    color: '#166534',
  },
  courseStatusTextInProgress: {
    color: '#0369a1',
  },
  courseProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  courseProgressLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  courseProgressBar: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    height: 8,
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
  },
  courseQuizAverage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  chapterSection: {
    marginTop: 12,
  },
  chapterHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  chapterCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 12,
    marginBottom: 10,
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterInfo: {
    flex: 1,
    marginRight: 10,
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  chapterMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  chapterStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chapterStatusCompleted: {
    backgroundColor: '#dcfce7',
  },
  chapterStatusInProgress: {
    backgroundColor: '#fef9c3',
  },
  chapterStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  chapterStatusTextCompleted: {
    color: '#166534',
  },
  chapterStatusTextInProgress: {
    color: '#854d0e',
  },
  quizCard: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quizTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  quizStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  quizStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quizStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quizStat: {
    fontSize: 11,
    color: '#4b5563',
  },
  quizStatBold: {
    fontWeight: '700',
  },
  quizAttemptsList: {
    marginTop: 8,
    gap: 6,
  },
  quizAttemptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  quizAttemptCell: {
    fontSize: 10,
    color: '#374151',
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  assignmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  assignmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  assignmentDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeGood: {
    backgroundColor: '#dcfce7',
  },
  gradeOk: {
    backgroundColor: '#fef9c3',
  },
  gradeBad: {
    backgroundColor: '#fee2e2',
  },
  gradeSubmitted: {
    backgroundColor: '#e0f2fe',
  },
  gradePending: {
    backgroundColor: '#f3f4f6',
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gradeTextGood: {
    color: '#166534',
  },
  gradeTextOk: {
    color: '#854d0e',
  },
  gradeTextBad: {
    color: '#991b1b',
  },
  gradeTextSubmitted: {
    color: '#0369a1',
  },
  gradeTextPending: {
    color: '#6b7280',
  },
  emptySection: {
    color: '#6b7280',
    paddingVertical: 16,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});
