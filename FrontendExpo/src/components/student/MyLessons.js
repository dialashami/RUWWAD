import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudent } from '../../context/StudentContext';
import { courseAPI } from '../../services/api';
import CourseDetail from './CourseDetail';

const defaultLessons = [
  {
    id: 'demo-1',
    title: 'Introduction to Algebra',
    subject: 'Mathematics',
    progress: 100,
    duration: '45 min',
    completed: true,
    isDemo: true, // Flag to identify demo lessons
  },
  {
    id: 'demo-2',
    title: 'Newton\'s Laws of Motion',
    subject: 'Physics',
    progress: 75,
    duration: '60 min',
    completed: false,
    isDemo: true,
  },
  {
    id: 'demo-3',
    title: 'Essay Writing Techniques',
    subject: 'English',
    progress: 50,
    duration: '30 min',
    completed: false,
    isDemo: true,
  },
  {
    id: 'demo-4',
    title: 'Chemical Reactions',
    subject: 'Chemistry',
    progress: 0,
    duration: '50 min',
    completed: false,
    isDemo: true,
  },
  {
    id: 'demo-5',
    title: 'World War II History',
    subject: 'History',
    progress: 25,
    duration: '40 min',
    completed: false,
    isDemo: true,
  },
];

export default function MyLessons() {
  // Get data from student context
  const { student, courses: contextCourses, refreshData, loading: contextLoading } = useStudent();

  const [activeFilter, setActiveFilter] = useState('all');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailVisible, setCourseDetailVisible] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLessons();
    return () => {
      isMountedRef.current = false;
    };
  }, [student.id, student.grade, contextCourses]);

  const fetchLessons = async () => {
    // Check token to prevent 401 errors after logout
    const token = await AsyncStorage.getItem('token');
    if (!token || !isMountedRef.current) {
      setLoading(false);
      return;
    }

    try {
      // First try context courses
      if (contextCourses && contextCourses.length > 0) {
        if (!isMountedRef.current) return;
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
      if (!isMountedRef.current) return;
      
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
      // Only log if not a 401 (user logged out)
      if (err.response?.status !== 401) {
        console.error('Error fetching lessons:', err);
      }
      if (isMountedRef.current) {
        setLessons(defaultLessons);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    fetchLessons();
  };

  // Open course detail modal
  const handleOpenCourse = (lesson) => {
    // Don't open detail modal for demo lessons
    if (lesson.isDemo) {
      Alert.alert(
        'Demo Course',
        'This is a demo course for preview. Enroll in real courses to access video content.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedCourse(lesson);
    setCourseDetailVisible(true);
  };

  // Close course detail modal
  const handleCloseCourse = () => {
    setCourseDetailVisible(false);
    setSelectedCourse(null);
    // Refresh to get updated progress
    fetchLessons();
  };

  // Handle course completion
  const handleCourseComplete = () => {
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
          <TouchableOpacity 
            key={lesson.id} 
            style={styles.lessonCard}
            onPress={() => handleOpenCourse(lesson)}
          >
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
              onPress={() => handleOpenCourse(lesson)}
            >
              <Text style={styles.actionBtnText}>
                {lesson.completed ? 'Review' : lesson.progress > 0 ? 'Continue' : 'Start'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Course Detail Modal */}
      <Modal
        visible={courseDetailVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseCourse}
      >
        {selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            onClose={handleCloseCourse}
            onCourseComplete={handleCourseComplete}
          />
        )}
      </Modal>
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
