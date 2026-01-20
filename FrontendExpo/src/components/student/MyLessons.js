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
  TextInput,
  Image,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudent } from '../../context/StudentContext';
import { useTheme } from '../../context/ThemeContext';
import { courseAPI } from '../../services/api';
import CourseDetail from './CourseDetail';
import CourseChaptersView from './CourseChaptersView';

export default function MyLessons() {
  // Get data from student context
  const { student, courses: contextCourses, todaySchedule, refreshData } = useStudent();
  const { isDarkMode, theme } = useTheme();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailVisible, setCourseDetailVisible] = useState(false);
  const [showChaptersView, setShowChaptersView] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailsLesson, setSelectedDetailsLesson] = useState(null);
  const isMountedRef = useRef(true);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    isMountedRef.current = true;
    fetchLessons(1, true);
    return () => {
      isMountedRef.current = false;
    };
  }, [student.id, student.grade, student.universityMajor]);

  const subjectImages = {
    Mathematics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop',
    Science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop',
    English: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop',
    Physics: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop',
    Chemistry: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop',
    Biology: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&auto=format&fit=crop',
    History: 'https://images.unsplash.com/photo-1461360370896-922624d12a74?w=600&auto=format&fit=crop',
    Arabic: 'https://images.unsplash.com/photo-1579187707643-35646d22b596?w=600&auto=format&fit=crop',
    'Computer Engineering': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop',
  };

  const mapCourseData = (data) => {
    const progressMap = new Map(
      (contextCourses || []).map((c) => [String(c._id || c.id), c])
    );

    // Helper to sanitize course IDs
    const sanitizeId = (id) => {
      if (!id) return id;
      const idStr = String(id);
      // Fix known corruption: a66ec -> a6ec (double 6 to single 6)
      return idStr.includes('a66ec') ? idStr.replace('a66ec', 'a6ec') : idStr;
    };

    return data.map((course, index) => {
      const rawCourseId = course._id || course.id || `temp-${index}`;
      const courseId = sanitizeId(rawCourseId);
      
      // Log if we fixed an ID
      if (rawCourseId !== courseId) {
        console.warn('⚠️  Fixed corrupted course ID in MyLessons:', rawCourseId, '→', courseId);
      }
      
      const matchedProgress = progressMap.get(String(courseId));
      const progress = matchedProgress?.progress ?? course.progress ?? 0;
      const isEnrolled = course.isEnrolled === true || course.students?.some(
        (s) => String(s?._id || s) === String(student.id)
      );

      const statusFromCourse = isEnrolled
        ? (progress >= 100 ? 'completed' : 'in-progress')
        : 'recommended';

      const defaultThumbnail = course.subject && subjectImages[course.subject]
        ? subjectImages[course.subject]
        : `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&sig=${courseId}`;

      return {
        id: courseId,
        _id: courseId,
        title: course.title || 'Untitled course',
        subject: course.subject || 'Course',
        grade: course.grade || student.grade || 'N/A',
        description: course.description || '',
        progress: isEnrolled ? progress : 0,
        status: statusFromCourse,
        teacherName: course.teacher?.firstName
          ? `${course.teacher.firstName} ${course.teacher.lastName || ''}`
          : 'Unknown Instructor',
        zoomLink: course.zoomLink || null,
        isChapterBased: course.isChapterBased || false,
        numberOfChapters: course.numberOfChapters || 0,
        chaptersWithContent: course.chaptersCount || course.chapters?.length || 0,
        subjectType: course.subjectType || '',
        thumbnail: course.thumbnail || defaultThumbnail,
        isEnrolled,
      };
    });
  };

  const fetchLessons = async (page = 1, reset = false) => {
    const token = await AsyncStorage.getItem('token');
    if (!token || !isMountedRef.current) {
      setLoading(false);
      return;
    }

    if (reset) {
      setLoading(true);
      setLessons([]);
      setCurrentPage(1);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const grade = student.grade || null;
      const specialization = student.studentType === 'university' ? student.universityMajor : null;

      const params = {
        isActive: true,
        page,
        limit: ITEMS_PER_PAGE,
      };

      if (grade) {
        params.grade = grade;
      }
      if (specialization) {
        params.specialization = specialization;
      }

      const response = await courseAPI.getCourses(params);
      if (!isMountedRef.current) return;

      const data = Array.isArray(response.data) ? response.data : [];
      const mapped = mapCourseData(data);

      if (reset || page === 1) {
        setLessons(mapped);
      } else {
        setLessons((prev) => [...prev, ...mapped]);
      }

      setHasMore(data.length === ITEMS_PER_PAGE);
      setCurrentPage(page);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Error fetching lessons:', err);
      }
      if (isMountedRef.current) {
        setLessons([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    fetchLessons(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchLessons(currentPage + 1);
    }
  };

  // Open course detail modal - show details modal first (like web)
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
    
    // Show details modal first like web version
    setSelectedDetailsLesson(lesson);
    setShowDetailsModal(true);
  };

  // Open chapters view from details modal
  const handleViewChapters = () => {
    if (selectedDetailsLesson) {
      setSelectedCourse(selectedDetailsLesson);
      setShowDetailsModal(false);
      setSelectedDetailsLesson(null);
      setShowChaptersView(true);
    }
  };

  // Open video-based course detail
  const handleViewVideoCourse = () => {
    if (selectedDetailsLesson) {
      setSelectedCourse(selectedDetailsLesson);
      setShowDetailsModal(false);
      setSelectedDetailsLesson(null);
      setCourseDetailVisible(true);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!courseId) return;

    try {
      const userStr = await AsyncStorage.getItem('user');
      const parsed = userStr ? JSON.parse(userStr) : null;
      const studentId = parsed?._id || parsed?.id || student.id;

      if (!studentId) {
        Alert.alert('Login Required', 'Please log in to enroll in courses.');
        return;
      }

      await courseAPI.enrollCourse(courseId, studentId);
      setLessons((prev) => prev.map((lesson) =>
        String(lesson.id) === String(courseId)
          ? { ...lesson, status: 'in-progress', progress: 0, isEnrolled: true }
          : lesson
      ));

      Alert.alert('Enrolled', 'Successfully enrolled in the course!');
      refreshData();
    } catch (err) {
      console.error('Error enrolling in course:', err);
      Alert.alert('Error', 'Failed to enroll in course. Please try again.');
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!courseId) return;

    try {
      const userStr = await AsyncStorage.getItem('user');
      const parsed = userStr ? JSON.parse(userStr) : null;
      const studentId = parsed?._id || parsed?.id || student.id;

      if (!studentId) {
        Alert.alert('Login Required', 'Please log in to manage courses.');
        return;
      }

      await courseAPI.unenrollCourse(courseId, studentId);
      setLessons((prev) => prev.map((lesson) =>
        String(lesson.id) === String(courseId)
          ? { ...lesson, status: 'recommended', progress: 0, isEnrolled: false }
          : lesson
      ));

      Alert.alert('Unenrolled', 'Successfully left the course.');
      refreshData();
    } catch (err) {
      console.error('Error unenrolling from course:', err);
      Alert.alert('Error', 'Failed to unenroll from course. Please try again.');
    }
  };

  // Close course detail modal
  const handleCloseCourse = () => {
    setCourseDetailVisible(false);
    setShowChaptersView(false);
    setSelectedCourse(null);
    // Refresh to get updated progress
    fetchLessons();
  };

  // Handle course completion
  const handleCourseComplete = () => {
    fetchLessons();
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'recommended', label: 'Recommended' },
  ];

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'in-progress' && lesson.status === 'in-progress') ||
      (activeTab === 'completed' && lesson.status === 'completed') ||
      (activeTab === 'recommended' && lesson.status === 'recommended');

    return matchesSearch && matchesTab;
  });

  const inProgressCount = lessons.filter((l) => l.status === 'in-progress').length;
  const completedCount = lessons.filter((l) => l.status === 'completed').length;
  const todayLessonsCount = Array.isArray(todaySchedule) ? todaySchedule.length : 0;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDarkMode && { color: theme.text }]}>My Lessons</Text>
        <Text style={[styles.headerSubtitle, isDarkMode && { color: theme.textSecondary }]}>
          Continue your learning journey
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, styles.statInProgress, isDarkMode && { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, isDarkMode && { color: theme.textSecondary }]}>In Progress</Text>
          <Text style={[styles.statValue, { color: '#3498db' }]}>{inProgressCount}</Text>
        </View>
        <View style={[styles.statBox, styles.statCompleted, isDarkMode && { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, isDarkMode && { color: theme.textSecondary }]}>Completed</Text>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>{completedCount}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, isDarkMode && { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          style={[styles.searchInput, isDarkMode && { color: theme.text }]}
          placeholder="Search for lessons, assignments, quizzes, or ask a question..."
          placeholderTextColor={isDarkMode ? theme.textSecondary : '#9ca3af'}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>
            {todayLessonsCount} {todayLessonsCount === 1 ? 'lesson' : 'lessons'} today
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive,
              isDarkMode && activeTab !== tab.id && { backgroundColor: theme.card },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.id && styles.tabButtonTextActive,
                isDarkMode && activeTab !== tab.id && { color: theme.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lessons Grid */}
      <ScrollView
        style={styles.lessonsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading your courses...</Text>
          </View>
        ) : filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => (
            <View key={lesson.id} style={[styles.lessonCard, isDarkMode && { backgroundColor: theme.card }]}>
              <Image source={{ uri: lesson.thumbnail }} style={styles.lessonImage} />
              <View
                style={[
                  styles.lessonStatus,
                  lesson.status === 'completed' && styles.lessonStatusCompleted,
                  lesson.status === 'recommended' && styles.lessonStatusRecommended,
                ]}
              >
                <Text style={styles.lessonStatusText}>
                  {lesson.status === 'completed'
                    ? 'Completed'
                    : lesson.status === 'recommended'
                    ? 'Recommended'
                    : 'In Progress'}
                </Text>
              </View>

              <View style={styles.lessonCardContent}>
                <Text style={[styles.lessonTitle, isDarkMode && { color: theme.text }]}>{lesson.title}</Text>
                <Text style={[styles.lessonDescription, isDarkMode && { color: theme.textSecondary }]}>
                  {lesson.description || 'No description available.'}
                </Text>
                <Text style={[styles.lessonMeta, isDarkMode && { color: theme.textSecondary }]}>
                  <Text style={styles.lessonMetaLabel}>Subject:</Text> {lesson.subject} |{' '}
                  <Text style={styles.lessonMetaLabel}>Grade:</Text> {lesson.grade}
                  {lesson.subjectType ? ` | Type: ${lesson.subjectType}` : ''}
                </Text>
                {!!lesson.teacherName && (
                  <Text style={[styles.lessonTeacher, isDarkMode && { color: theme.textSecondary }]}>
                    Teacher: {lesson.teacherName}
                  </Text>
                )}

                <View style={styles.lessonProgressWrapper}>
                  <View style={styles.lessonProgressTrack}>
                    <View
                      style={[
                        styles.lessonProgressFill,
                        { width: `${lesson.progress}%` },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  {lesson.status === 'recommended' ? (
                    <TouchableOpacity
                      style={styles.enrollButton}
                      onPress={() => handleEnroll(lesson.id)}
                    >
                      <Text style={styles.enrollButtonText}>Enroll Now</Text>
                    </TouchableOpacity>
                  ) : lesson.status === 'in-progress' ? (
                    <>
                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => handleOpenCourse(lesson)}
                      >
                        <Text style={styles.detailsButtonText}>View Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.leaveButton}
                        onPress={() => handleUnenroll(lesson.id)}
                      >
                        <Text style={styles.leaveButtonText}>Leave</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={() => handleOpenCourse(lesson)}
                    >
                      <Text style={styles.reviewButtonText}>Review Course</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Courses Available</Text>
            <Text style={styles.emptySubtitle}>
              No courses are available for your grade yet. Check back later!
            </Text>
          </View>
        )}

        {hasMore && !loading && lessons.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <TouchableOpacity
              style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
              onPress={loadMore}
              disabled={loadingMore}
            >
              <Text style={styles.loadMoreButtonText}>
                {loadingMore ? 'Loading...' : 'Load More Courses'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!hasMore && lessons.length > 0 && (
          <View style={styles.allLoadedContainer}>
            <Text style={styles.allLoadedText}>✓ All courses loaded</Text>
          </View>
        )}
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

      {/* Course Chapters View Modal (for chapter-based courses) */}
      <Modal
        visible={showChaptersView}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseCourse}
      >
        {selectedCourse && (
          <CourseChaptersView
            course={selectedCourse}
            studentId={student.id}
            onBack={handleCloseCourse}
          />
        )}
      </Modal>

      {/* Course Details Modal - Web-style details view */}
      <Modal
        visible={showDetailsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowDetailsModal(false);
          setSelectedDetailsLesson(null);
        }}
      >
        <View style={styles.detailsModalOverlay}>
          <View style={[styles.detailsModalContainer, isDarkMode && { backgroundColor: theme.card }]}>
            {selectedDetailsLesson && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header with Thumbnail */}
                <View style={styles.detailsModalHeader}>
                  <Image
                    source={{ uri: selectedDetailsLesson.thumbnail }}
                    style={styles.detailsModalThumbnail}
                  />
                  <TouchableOpacity
                    style={styles.detailsModalCloseBtn}
                    onPress={() => {
                      setShowDetailsModal(false);
                      setSelectedDetailsLesson(null);
                    }}
                  >
                    <Text style={styles.detailsModalCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Modal Content */}
                <View style={styles.detailsModalContent}>
                  {/* Title */}
                  <Text style={[styles.detailsModalTitle, isDarkMode && { color: theme.text }]}>
                    {selectedDetailsLesson.title}
                  </Text>

                  {/* Subject Badge */}
                  <View style={styles.detailsSubjectBadge}>
                    <Text style={styles.detailsSubjectBadgeText}>
                      {selectedDetailsLesson.subject}
                    </Text>
                  </View>

                  {/* Course Info Grid */}
                  <View style={styles.detailsInfoGrid}>
                    {/* Instructor */}
                    <View style={[styles.detailsInfoItem, isDarkMode && { backgroundColor: theme.background }]}>
                      <Text style={styles.detailsInfoIcon}>👤</Text>
                      <View style={styles.detailsInfoTextContainer}>
                        <Text style={[styles.detailsInfoLabel, isDarkMode && { color: theme.textSecondary }]}>
                          Instructor
                        </Text>
                        <Text style={[styles.detailsInfoValue, isDarkMode && { color: theme.text }]}>
                          {selectedDetailsLesson.teacherName}
                        </Text>
                      </View>
                    </View>

                    {/* Grade */}
                    <View style={[styles.detailsInfoItem, isDarkMode && { backgroundColor: theme.background }]}>
                      <Text style={styles.detailsInfoIcon}>📖</Text>
                      <View style={styles.detailsInfoTextContainer}>
                        <Text style={[styles.detailsInfoLabel, isDarkMode && { color: theme.textSecondary }]}>
                          Grade
                        </Text>
                        <Text style={[styles.detailsInfoValue, isDarkMode && { color: theme.text }]}>
                          {selectedDetailsLesson.grade}
                        </Text>
                      </View>
                    </View>

                    {/* Chapters (if applicable) */}
                    {selectedDetailsLesson.chaptersWithContent > 0 && (
                      <View style={[styles.detailsInfoItem, isDarkMode && { backgroundColor: theme.background }]}>
                        <Text style={styles.detailsInfoIcon}>📑</Text>
                        <View style={styles.detailsInfoTextContainer}>
                          <Text style={[styles.detailsInfoLabel, isDarkMode && { color: theme.textSecondary }]}>
                            Chapters
                          </Text>
                          <Text style={[styles.detailsInfoValue, isDarkMode && { color: theme.text }]}>
                            {selectedDetailsLesson.chaptersWithContent} {selectedDetailsLesson.chaptersWithContent === 1 ? 'Chapter' : 'Chapters'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Progress */}
                    <View style={[styles.detailsInfoItem, isDarkMode && { backgroundColor: theme.background }]}>
                      <Text style={styles.detailsInfoIcon}>⏱️</Text>
                      <View style={styles.detailsInfoTextContainer}>
                        <Text style={[styles.detailsInfoLabel, isDarkMode && { color: theme.textSecondary }]}>
                          Progress
                        </Text>
                        <Text style={[styles.detailsInfoValue, isDarkMode && { color: theme.text }]}>
                          {selectedDetailsLesson.progress}% Complete
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.detailsDescriptionSection}>
                    <Text style={[styles.detailsDescriptionTitle, isDarkMode && { color: theme.text }]}>
                      Course Description
                    </Text>
                    {selectedDetailsLesson.description ? (
                      <Text style={[styles.detailsDescriptionText, isDarkMode && { color: theme.textSecondary }]}>
                        {selectedDetailsLesson.description}
                      </Text>
                    ) : (
                      <Text style={[styles.detailsDescriptionEmpty, isDarkMode && { color: theme.textSecondary }]}>
                        No description has been added by the instructor yet.
                      </Text>
                    )}
                  </View>

                  {/* Zoom Link */}
                  {selectedDetailsLesson.zoomLink && (
                    <TouchableOpacity
                      style={styles.detailsZoomSection}
                      onPress={() => Linking.openURL(selectedDetailsLesson.zoomLink)}
                    >
                      <Text style={styles.detailsZoomIcon}>🔗</Text>
                      <View style={styles.detailsZoomTextContainer}>
                        <Text style={styles.detailsZoomTitle}>Live Session Link</Text>
                        <Text style={styles.detailsZoomLink} numberOfLines={1}>
                          {selectedDetailsLesson.zoomLink}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.detailsActionButtons}>
                    {selectedDetailsLesson.isChapterBased && selectedDetailsLesson.chaptersWithContent > 0 ? (
                      <TouchableOpacity
                        style={styles.detailsViewChaptersBtn}
                        onPress={handleViewChapters}
                      >
                        <Text style={styles.detailsViewChaptersBtnText}>View Chapters</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.detailsViewChaptersBtn}
                        onPress={handleViewVideoCourse}
                      >
                        <Text style={styles.detailsViewChaptersBtnText}>View Course Content</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.detailsCloseBtn,
                        (selectedDetailsLesson.isChapterBased && selectedDetailsLesson.chaptersWithContent > 0) && { flex: 0, paddingHorizontal: 20 }
                      ]}
                      onPress={() => {
                        setShowDetailsModal(false);
                        setSelectedDetailsLesson(null);
                      }}
                    >
                      <Text style={styles.detailsCloseBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchBar: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  searchInput: {
    fontSize: 14,
    color: '#0F172A',
  },
  todayBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#3498db',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  todayBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  tabButtonActive: {
    backgroundColor: '#3498db',
  },
  tabButtonText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  lessonsList: {
    flex: 1,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lessonImage: {
    width: '100%',
    height: 160,
  },
  lessonStatus: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#3498db',
  },
  lessonStatusCompleted: {
    backgroundColor: '#22C55E',
  },
  lessonStatusRecommended: {
    backgroundColor: '#FACC15',
  },
  lessonStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  lessonCardContent: {
    padding: 16,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  lessonMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  lessonMetaLabel: {
    fontWeight: '700',
    color: '#0F172A',
  },
  lessonTeacher: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  lessonProgressWrapper: {
    marginTop: 12,
  },
  lessonProgressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  lessonProgressFill: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  enrollButton: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
  },
  leaveButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  reviewButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loadMoreButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  allLoadedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  allLoadedText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  // Course Details Modal Styles (Web-style)
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailsModalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 25,
  },
  detailsModalHeader: {
    position: 'relative',
  },
  detailsModalThumbnail: {
    width: '100%',
    height: 180,
  },
  detailsModalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModalCloseBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  detailsModalContent: {
    padding: 24,
  },
  detailsModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  detailsSubjectBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    marginBottom: 20,
  },
  detailsSubjectBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4338ca',
  },
  detailsInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailsInfoItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
  },
  detailsInfoIcon: {
    fontSize: 18,
  },
  detailsInfoTextContainer: {
    flex: 1,
  },
  detailsInfoLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  detailsInfoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  detailsDescriptionSection: {
    marginBottom: 24,
  },
  detailsDescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailsDescriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  detailsDescriptionEmpty: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  detailsZoomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    marginBottom: 24,
  },
  detailsZoomIcon: {
    fontSize: 18,
  },
  detailsZoomTextContainer: {
    flex: 1,
  },
  detailsZoomTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 2,
  },
  detailsZoomLink: {
    fontSize: 12,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  detailsActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsViewChaptersBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#3498db',
    borderRadius: 10,
    alignItems: 'center',
  },
  detailsViewChaptersBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailsCloseBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    alignItems: 'center',
  },
  detailsCloseBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
});
