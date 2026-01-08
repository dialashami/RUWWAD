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
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTeacher } from '../../context/TeacherContext';
import { courseAPI } from '../../services/api';

// Options matching web version
const subjectOptions = [
  'Mathematics',
  'Sciences',
  'English',
  'Arabic',
  'Technology',
  'Religion',
  'Computer Engineering',
  'Architectural Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Industrial Engineering',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Chemical Engineering',
];

const gradeOptions = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'University',
];

const universityMajors = [
  'Computer Engineering',
  'Architectural Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Industrial Engineering',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Chemical Engineering',
];

const statusOptions = ['Draft', 'Published'];

export default function LessonManagement() {
  const { teacher, courses: contextCourses, refreshData } = useTeacher();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Picker modal states
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    universityMajor: '',
    duration: '',
    status: 'Draft',
    description: '',
    objectives: '',
    materials: '',
  });

  useEffect(() => {
    fetchCourses();
  }, [teacher.id, contextCourses]);

  const fetchCourses = async () => {
    try {
      if (contextCourses && contextCourses.length > 0) {
        const mapped = contextCourses.map((course) => ({
          id: course._id || course.id,
          title: course.title || 'Untitled Course',
          subject: course.subject || 'Course',
          grade: course.grade || 'All Grades',
          status: course.isActive === false ? 'draft' : 'published',
          duration: course.duration || '45 min',
          lastEdited: formatTimeAgo(course.updatedAt),
          description: course.description || 'No description provided.',
          students: course.students || 0,
        }));
        setLessons(mapped);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let teacherId = teacher.id;
      if (!teacherId) {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          teacherId = parsed?._id || parsed?.id || null;
        }
      }

      const response = teacherId 
        ? await courseAPI.getCourses({ teacher: teacherId })
        : await courseAPI.getCourses();

      if (Array.isArray(response.data)) {
        const mapped = response.data.map((course) => ({
          id: course._id || course.id,
          title: course.title || 'Untitled Course',
          subject: course.subject || 'Course',
          grade: course.grade || 'All Grades',
          status: course.isActive === false ? 'draft' : 'published',
          duration: course.duration || '45 min',
          lastEdited: formatTimeAgo(course.updatedAt),
          description: course.description || 'No description provided.',
          students: course.students?.length || 0,
        }));
        setLessons(mapped);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    fetchCourses();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      grade: '',
      universityMajor: '',
      duration: '',
      status: 'Draft',
      description: '',
      objectives: '',
      materials: '',
    });
  };

  const handleCreateLesson = async () => {
    if (!formData.title || !formData.subject || !formData.grade || !formData.duration) {
      Alert.alert('Error', 'Please fill in all required fields (*)');
      return;
    }

    if (formData.grade === 'University' && !formData.universityMajor) {
      Alert.alert('Error', 'Please select a specialization for university level');
      return;
    }

    setIsCreating(true);

    try {
      let teacherId = teacher.id;
      const token = await AsyncStorage.getItem('token');
      
      if (!teacherId) {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          teacherId = parsed?._id || parsed?.id || null;
        }
      }

      const courseData = {
        title: formData.title,
        subject: formData.subject,
        grade: formData.grade,
        universityMajor: formData.grade === 'University' ? formData.universityMajor : undefined,
        duration: formData.duration,
        description: formData.description || 'No description provided.',
        isActive: formData.status.toLowerCase() === 'published',
        teacher: teacherId,
      };

      const response = await courseAPI.createCourse(courseData);

      if (response.data) {
        const newLesson = {
          id: response.data._id || response.data.id || Date.now(),
          title: response.data.title || formData.title,
          subject: response.data.subject || formData.subject,
          grade: response.data.grade || formData.grade,
          status: response.data.isActive === false ? 'draft' : 'published',
          duration: response.data.duration || formData.duration,
          lastEdited: 'just now',
          description: response.data.description || formData.description,
        };
        setLessons([newLesson, ...lessons]);
        Alert.alert('Success', 'Lesson created successfully!');
      }

      setShowModal(false);
      resetForm();
      refreshData();
    } catch (err) {
      console.error('Error creating lesson:', err);
      Alert.alert('Error', 'Failed to create lesson. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: lessons.length,
    published: lessons.filter(l => l.status === 'published').length,
    drafts: lessons.filter(l => l.status === 'draft').length,
  };

  // Render picker as absolute positioned overlay (not nested Modal)
  const renderPickerModal = (visible, setVisible, options, currentValue, onSelect, title) => {
    if (!visible) return null;
    return (
      <View style={styles.pickerAbsoluteOverlay}>
        <TouchableOpacity 
          style={styles.pickerBackdrop} 
          activeOpacity={1} 
          onPress={() => setVisible(false)}
        />
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.pickerClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={true}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerOption,
                  currentValue === option && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  onSelect(option);
                  setVisible(false);
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  currentValue === option && styles.pickerOptionTextSelected,
                ]}>
                  {option}
                </Text>
                {currentValue === option && (
                  <Text style={styles.pickerCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading lessons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Text style={styles.bannerTitle}>Lesson Management</Text>
            <Text style={styles.bannerSubtitle}>Create, edit, and organize your lessons</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Lessons</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.published}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.drafts}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by lesson title..."
          placeholderTextColor="#9ca3af"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Create Button */}
      <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
        <Text style={styles.createButtonIcon}>+</Text>
        <Text style={styles.createButtonText}>Create New Lesson</Text>
      </TouchableOpacity>

      {/* Lessons List */}
      <ScrollView 
        style={styles.lessonsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
        }
      >
        {filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => (
            <TouchableOpacity key={lesson.id} style={styles.lessonCard}>
              <View style={styles.lessonHeader}>
                <View style={styles.lessonTitleSection}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonSubject}>📚 {lesson.subject}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  lesson.status === 'published' ? styles.publishedBadge : styles.draftBadge
                ]}>
                  <Text style={styles.statusIcon}>
                    {lesson.status === 'published' ? '✓' : '✎'}
                  </Text>
                  <Text style={[
                    styles.statusText,
                    lesson.status === 'published' ? styles.publishedText : styles.draftText
                  ]}>
                    {lesson.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.lessonDescription} numberOfLines={2}>
                {lesson.description}
              </Text>
              <View style={styles.lessonMeta}>
                <Text style={styles.metaItem}>📍 {lesson.grade}</Text>
                <Text style={styles.metaItem}>⏱️ {lesson.duration}</Text>
                <Text style={styles.metaItem}>✏️ {lesson.lastEdited}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No Lessons Yet</Text>
            <Text style={styles.emptySubtitle}>Click "Create New Lesson" to add your first lesson.</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Lesson</Text>
                <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalForm} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Title */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Lesson Title <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter lesson title"
                    placeholderTextColor="#9ca3af"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                  />
                </View>

                {/* Subject Picker */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Subject <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowSubjectPicker(true)}
                  >
                    <Text style={formData.subject ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
                      {formData.subject || 'Select subject'}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Grade Picker */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Grade <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowGradePicker(true)}
                  >
                    <Text style={formData.grade ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
                      {formData.grade || 'Select grade'}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* University Major Picker (conditional) */}
                {formData.grade === 'University' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Specialization <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity 
                      style={styles.pickerButton}
                      onPress={() => setShowMajorPicker(true)}
                    >
                      <Text style={formData.universityMajor ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
                        {formData.universityMajor || 'Select specialization'}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Duration */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Duration <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., 45 min"
                    placeholderTextColor="#9ca3af"
                    value={formData.duration}
                    onChangeText={(text) => setFormData({ ...formData, duration: text })}
                  />
                </View>

                {/* Status Picker */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Status</Text>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowStatusPicker(true)}
                  >
                    <View style={styles.statusPreview}>
                      <View style={[
                        styles.statusDot,
                        formData.status === 'Published' ? styles.publishedDot : styles.draftDot
                      ]} />
                      <Text style={styles.pickerButtonText}>{formData.status}</Text>
                    </View>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="Enter lesson description..."
                    placeholderTextColor="#9ca3af"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Learning Objectives */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Learning Objectives (one per line)</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="List the learning objectives..."
                    placeholderTextColor="#9ca3af"
                    value={formData.objectives}
                    onChangeText={(text) => setFormData({ ...formData, objectives: text })}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Materials */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Materials (one per line)</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="List required materials..."
                    placeholderTextColor="#9ca3af"
                    value={formData.materials}
                    onChangeText={(text) => setFormData({ ...formData, materials: text })}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => { setShowModal(false); resetForm(); }}
                    disabled={isCreating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton, isCreating && styles.disabledButton]}
                    onPress={handleCreateLesson}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Create Lesson</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>

          {/* Picker Modals - Inside main modal overlay */}
          {showSubjectPicker && renderPickerModal(showSubjectPicker, setShowSubjectPicker, subjectOptions, formData.subject, 
            (val) => setFormData({ ...formData, subject: val }), 'Select Subject')}
          {showGradePicker && renderPickerModal(showGradePicker, setShowGradePicker, gradeOptions, formData.grade, 
            (val) => setFormData({ ...formData, grade: val, universityMajor: val === 'University' ? formData.universityMajor : '' }), 'Select Grade')}
          {showMajorPicker && renderPickerModal(showMajorPicker, setShowMajorPicker, universityMajors, formData.universityMajor, 
            (val) => setFormData({ ...formData, universityMajor: val }), 'Select Specialization')}
          {showStatusPicker && renderPickerModal(showStatusPicker, setShowStatusPicker, statusOptions, formData.status, 
            (val) => setFormData({ ...formData, status: val }), 'Select Status')}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
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
  headerBanner: {
    marginBottom: 16,
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
  statsRow: {
    flexDirection: 'row',
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  createButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  createButtonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lessonsContainer: {
    flex: 1,
  },
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lessonTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  lessonSubject: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  publishedBadge: {
    backgroundColor: '#d1fae5',
  },
  draftBadge: {
    backgroundColor: '#fef3c7',
  },
  statusIcon: {
    fontSize: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  publishedText: {
    color: '#059669',
  },
  draftText: {
    color: '#d97706',
  },
  lessonDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  lessonMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalClose: {
    fontSize: 24,
    color: '#6b7280',
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#1f2937',
  },
  pickerButtonPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  publishedDot: {
    backgroundColor: '#10b981',
  },
  draftDot: {
    backgroundColor: '#f59e0b',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  // Picker absolute overlay styles
  pickerAbsoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerClose: {
    fontSize: 20,
    color: '#6b7280',
    padding: 4,
  },
  pickerList: {
    padding: 8,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#1f2937',
  },
  pickerOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '500',
  },
  pickerCheck: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
