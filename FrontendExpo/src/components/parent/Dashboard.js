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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parentDashboardAPI } from '../../services/api';

export default function Dashboard() {
  const [children, setChildren] = useState([]);
  const [childrenData, setChildrenData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [parentName, setParentName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setParentName(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim());
      }

      // Fetch linked children
      try {
        const childrenRes = await parentDashboardAPI.getChildren();
        const childrenList = childrenRes.data || [];
        setChildren(childrenList);

        // Fetch dashboard data for each child
        const dashboardData = {};
        for (const child of childrenList) {
          try {
            const dashRes = await parentDashboardAPI.getChildProgress(child._id);
            dashboardData[child._id] = dashRes.data;
          } catch (err) {
            console.error(`Error fetching dashboard for child ${child._id}:`, err);
          }
        }
        setChildrenData(dashboardData);

        // Select first child by default
        if (childrenList.length > 0) {
          setSelectedChild(childrenList[0]._id);
        }
      } catch (err) {
        console.error('Error fetching children:', err);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  // No children linked
  if (children.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            Welcome{parentName ? `, ${parentName}` : ''}
          </Text>
          <Text style={styles.bannerSubtitle}>No children linked yet</Text>
        </View>

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
  const currentChildData = selectedChild ? childrenData[selectedChild] : null;
  const currentChild = children.find(c => c._id === selectedChild);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>
          Welcome{parentName ? `, ${parentName}` : ''}
        </Text>
        <Text style={styles.bannerSubtitle}>Your children: {childNames}</Text>
      </View>

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
              onPress={() => setSelectedChild(child._id)}
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
              <Text style={styles.statIcon}>📚</Text>
              <Text style={styles.statLabel}>Courses</Text>
              <Text style={styles.statValue}>{currentChildData?.stats?.totalCourses || 0}</Text>
              <Text style={styles.statSub}>Enrolled</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{currentChildData?.stats?.averageGrade || 0}%</Text>
              <Text style={styles.statSub}>Score</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{currentChildData?.stats?.pendingAssignments || 0}</Text>
              <Text style={styles.statSub}>Assignments</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>{currentChildData?.stats?.completedAssignments || 0}</Text>
              <Text style={styles.statSub}>Assignments</Text>
            </View>
          </View>

          {/* Courses Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enrolled Courses</Text>
            {currentChildData?.courses?.length > 0 ? (
              currentChildData.courses.map((course) => (
                <View key={course._id} style={styles.courseItem}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.title}</Text>
                    <Text style={styles.courseDetails}>
                      {course.subject || 'General'} • {course.grade || 'All Grades'}
                    </Text>
                  </View>
                  <View style={styles.lessonBadge}>
                    <Text style={styles.lessonText}>
                      {course.lessons?.length || 0} lessons
                    </Text>
                  </View>
                </View>
              ))
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
  banner: {
    backgroundColor: '#9333ea',
    padding: 20,
    paddingTop: 10,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
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
    color: '#7c3aed',
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
  statIcon: {
    fontSize: 20,
    marginBottom: 6,
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
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  courseDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  lessonBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lessonText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '500',
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
