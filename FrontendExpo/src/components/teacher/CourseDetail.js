import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { courseAPI, chapterAPI } from '../../services/api';
import ChapterDetail from './ChapterDetail';

const { width } = Dimensions.get('window');

export default function CourseDetail({ course, onClose, isTeacher = true }) {
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDescription, setNewChapterDescription] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const courseId = course._id || course.id;

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      fetchChapters();
    } else {
      setCourseData(course);
      setLoading(false);
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const response = await courseAPI.getCourse(courseId);
      if (response.data) {
        setCourseData(response.data);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setCourseData(course);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    if (!courseId) return;
    
    setLoadingChapters(true);
    try {
      const response = await chapterAPI.getChaptersByCourse(courseId);
      const data = response.data;
      setChapters(data.chapters || data || []);
    } catch (err) {
      console.error('Error fetching chapters:', err);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) {
      Alert.alert('Error', 'Please enter a chapter title');
      return;
    }

    setAddingChapter(true);
    try {
      const response = await chapterAPI.createChapter(courseId, {
        title: newChapterTitle.trim(),
        description: newChapterDescription.trim(),
        chapterNumber: chapters.length + 1,
      });

      if (response.data) {
        setChapters(prev => [...prev, response.data]);
        setNewChapterTitle('');
        setNewChapterDescription('');
        setShowAddChapter(false);
        Alert.alert('Success', 'Chapter added successfully!');
        // Automatically open the new chapter for editing
        setSelectedChapter(response.data);
      }
    } catch (err) {
      console.error('Error adding chapter:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to add chapter');
    } finally {
      setAddingChapter(false);
    }
  };

  const getChapterStatus = (chapter) => {
    const hasSlides = chapter.hasSlideContent || (chapter.slideContentLength && chapter.slideContentLength > 100);
    const hasLectures = chapter.lectures && chapter.lectures.length > 0;
    const hasQuiz = chapter.quiz?.isGenerated;
    
    if (hasSlides && hasLectures && hasQuiz) return 'complete';
    if (hasSlides || hasLectures) return 'in-progress';
    return 'empty';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'complete': return { bg: '#dcfce7', color: '#10b981', icon: '✓' };
      case 'in-progress': return { bg: '#fef3c7', color: '#f59e0b', icon: '◐' };
      default: return { bg: '#f3f4f6', color: '#9ca3af', icon: '○' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  const displayCourse = courseData || course;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3498db', '#2c3e50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonIcon}>←</Text>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.courseTitle}>{displayCourse.title}</Text>
          <View style={styles.courseMeta}>
            <Text style={styles.courseMetaItem}>📚 {displayCourse.subject || 'No subject'}</Text>
            <Text style={styles.courseMetaItem}>📍 {displayCourse.grade || 'All grades'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Info Card */}
        {displayCourse.description && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>📝 Description</Text>
            <Text style={styles.infoCardText}>{displayCourse.description}</Text>
          </View>
        )}

        {/* Chapters Section */}
        <View style={styles.chaptersSection}>
          <View style={styles.chaptersSectionHeader}>
            <Text style={styles.chaptersSectionTitle}>
              📚 Chapters ({chapters.length})
            </Text>
            {isTeacher && (
              <TouchableOpacity
                style={[styles.addChapterBtn, showAddChapter && styles.cancelBtn]}
                onPress={() => setShowAddChapter(!showAddChapter)}
              >
                <Text style={styles.addChapterBtnText}>
                  {showAddChapter ? '✕ Cancel' : '+ Add Chapter'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Add Chapter Form */}
          {showAddChapter && isTeacher && (
            <View style={styles.addChapterForm}>
              <Text style={styles.formLabel}>Chapter Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter chapter title"
                placeholderTextColor="#9ca3af"
                value={newChapterTitle}
                onChangeText={setNewChapterTitle}
              />
              
              <Text style={styles.formLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Enter chapter description"
                placeholderTextColor="#9ca3af"
                value={newChapterDescription}
                onChangeText={setNewChapterDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtn, addingChapter && styles.disabledBtn]}
                onPress={handleAddChapter}
                disabled={addingChapter}
              >
                {addingChapter ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Add Chapter</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Chapters List */}
          {loadingChapters ? (
            <View style={styles.loadingChapters}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.loadingChaptersText}>Loading chapters...</Text>
            </View>
          ) : chapters.length === 0 ? (
            <View style={styles.emptyChapters}>
              <Text style={styles.emptyChaptersIcon}>📖</Text>
              <Text style={styles.emptyChaptersText}>No chapters yet</Text>
              {isTeacher && (
                <Text style={styles.emptyChaptersSubtext}>
                  Click "Add Chapter" to create your first chapter
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.chaptersList}>
              {chapters.map((chapter, index) => {
                const status = getChapterStatus(chapter);
                const statusStyle = getStatusStyle(status);
                
                return (
                  <TouchableOpacity
                    key={chapter._id || index}
                    style={styles.chapterCard}
                    onPress={() => setSelectedChapter(chapter)}
                  >
                    <LinearGradient
                      colors={['#3498db', '#2c3e50']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.chapterCardGradient}
                    >
                      <View style={styles.chapterNumber}>
                        <Text style={styles.chapterNumberText}>
                          {chapter.chapterNumber || index + 1}
                        </Text>
                      </View>
                      <View style={styles.chapterInfo}>
                        <Text style={styles.chapterTitle}>
                          {chapter.title || `Chapter ${chapter.chapterNumber || index + 1}`}
                        </Text>
                        {chapter.description && (
                          <Text style={styles.chapterDescription} numberOfLines={1}>
                            {chapter.description}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusIcon, { color: statusStyle.color }]}>
                          {statusStyle.icon}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Course Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>📊 Course Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{chapters.length}</Text>
              <Text style={styles.statLabel}>Chapters</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {displayCourse.students?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>
                {chapters.filter(c => getChapterStatus(c) === 'complete').length}
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>
        </View>

        {/* Setup Guide */}
        {isTeacher && (
          <View style={styles.guideSection}>
            <Text style={styles.guideSectionTitle}>📋 How to Set Up Your Course</Text>
            <View style={styles.guideSteps}>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Add Chapters</Text>
                  <Text style={styles.stepDescription}>Create chapters to organize your content</Text>
                </View>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Add Slides Content</Text>
                  <Text style={styles.stepDescription}>Upload slides or enter content for each chapter</Text>
                </View>
              </View>
              <View style={styles.guideStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Generate Quiz</Text>
                  <Text style={styles.stepDescription}>AI will create quizzes from your content</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Chapter Detail Modal */}
      <Modal
        visible={selectedChapter !== null}
        animationType="slide"
        onRequestClose={() => setSelectedChapter(null)}
      >
        {selectedChapter && (
          <ChapterDetail
            chapter={selectedChapter}
            courseId={courseId}
            onClose={() => {
              setSelectedChapter(null);
              fetchChapters(); // Refresh chapters after editing
            }}
            isTeacher={isTeacher}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonIcon: {
    color: '#fff',
    fontSize: 18,
    marginRight: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContent: {
    marginTop: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  courseMetaItem: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  chaptersSection: {
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  chaptersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chaptersSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
  },
  addChapterBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: '#dc2626',
  },
  addChapterBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  addChapterForm: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingChapters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingChaptersText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyChapters: {
    alignItems: 'center',
    padding: 30,
  },
  emptyChaptersIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyChaptersText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyChaptersSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  chaptersList: {
    gap: 12,
  },
  chapterCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chapterCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  chapterDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  guideSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  guideSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 16,
  },
  guideSteps: {
    gap: 12,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  stepDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
