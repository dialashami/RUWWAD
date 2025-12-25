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
import { useStudent } from '../../context/StudentContext';
import { courseAPI } from '../../services/api';

const defaultLessons = [
  {
    id: 1,
    title: 'Introduction to Algebra',
    subject: 'Mathematics',
    progress: 100,
    duration: '45 min',
    completed: true,
  },
  {
    id: 2,
    title: 'Newton\'s Laws of Motion',
    subject: 'Physics',
    progress: 75,
    duration: '60 min',
    completed: false,
  },
  {
    id: 3,
    title: 'Essay Writing Techniques',
    subject: 'English',
    progress: 50,
    duration: '30 min',
    completed: false,
  },
  {
    id: 4,
    title: 'Chemical Reactions',
    subject: 'Chemistry',
    progress: 0,
    duration: '50 min',
    completed: false,
  },
  {
    id: 5,
    title: 'World War II History',
    subject: 'History',
    progress: 25,
    duration: '40 min',
    completed: false,
  },
];

export default function MyLessons() {
  // Get data from student context
  const { student, courses: contextCourses, refreshData, loading: contextLoading } = useStudent();

  const [activeFilter, setActiveFilter] = useState('all');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [student.id, student.grade, contextCourses]);

  const fetchLessons = async () => {
    try {
      // First try context courses
      if (contextCourses && contextCourses.length > 0) {
        setLessons(contextCourses.map(c => ({
          id: c._id || c.id,
          title: c.title || 'Untitled Course',
          subject: c.subject || 'Course',
          progress: c.progress || 0,
          duration: c.duration || '30 min',
          completed: c.progress === 100,
          status: c.progress >= 100 ? 'completed' : c.progress > 0 ? 'in-progress' : 'not-started',
        })));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fallback to API call
      const response = await courseAPI.getMyCourses();
      const data = response.data || [];
      if (data.length > 0) {
        setLessons(data.map(c => ({
          id: c._id,
          title: c.title,
          subject: c.subject || 'Course',
          progress: c.progress || 0,
          duration: c.duration || '30 min',
          completed: c.progress === 100,
          status: c.progress >= 100 ? 'completed' : c.progress > 0 ? 'in-progress' : 'not-started',
        })));
      } else {
        setLessons(defaultLessons);
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setLessons(defaultLessons);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    fetchLessons();
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  const filteredLessons = lessons.filter((lesson) => {
    if (activeFilter === 'completed') return lesson.completed;
    if (activeFilter === 'inProgress') return !lesson.completed && lesson.progress > 0;
    return true;
  });

  const getProgressColor = (progress) => {
    if (progress === 100) return '#28a745';
    if (progress >= 50) return '#ffc107';
    return '#007bff';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Lessons</Text>
        <Text style={styles.subtitle}>{lessons.length} courses enrolled</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterBtn,
              activeFilter === filter.id && styles.filterBtnActive,
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lessons List */}
      <ScrollView 
        style={styles.lessonsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLessons.map((lesson) => (
          <TouchableOpacity key={lesson.id} style={styles.lessonCard}>
            <View style={styles.lessonHeader}>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectText}>{lesson.subject}</Text>
              </View>
              {lesson.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ Completed</Text>
                </View>
              )}
            </View>

            <Text style={styles.lessonTitle}>{lesson.title}</Text>

            <View style={styles.lessonFooter}>
              <Text style={styles.duration}>⏱️ {lesson.duration}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${lesson.progress}%`,
                        backgroundColor: getProgressColor(lesson.progress),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{lesson.progress}%</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                lesson.completed && styles.actionBtnCompleted,
              ]}
            >
              <Text style={styles.actionBtnText}>
                {lesson.completed ? 'Review' : lesson.progress > 0 ? 'Continue' : 'Start'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  filters: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  filterBtnActive: {
    backgroundColor: '#007bff',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  lessonsList: {
    flex: 1,
    padding: 15,
  },
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  duration: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnCompleted: {
    backgroundColor: '#6b7280',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
});
