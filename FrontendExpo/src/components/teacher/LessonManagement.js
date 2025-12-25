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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { courseAPI } from '../../services/api';

export default function LessonManagement() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    duration: '',
    status: 'draft',
    description: '',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      let teacherId = null;
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        teacherId = parsed?._id || parsed?.id || null;
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
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

  const handleCreateLesson = async () => {
    if (!formData.title || !formData.subject || !formData.grade || !formData.duration) {
      Alert.alert('Error', 'Please fill in all required fields (*)');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      let teacherId = null;
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        teacherId = parsed?._id || parsed?.id || null;
      }

      if (teacherId) {
        await courseAPI.createCourse({
          ...formData,
          teacher: teacherId,
        });
        await fetchCourses();
      } else {
        // Local only
        const newLesson = {
          id: Date.now(),
          title: formData.title,
          subject: formData.subject,
          status: formData.status,
          duration: formData.duration,
          lastEdited: 'just now',
          description: formData.description || 'No description provided.',
        };
        setLessons([newLesson, ...lessons]);
      }

      setShowModal(false);
      setFormData({
        title: '',
        subject: '',
        grade: '',
        duration: '',
        status: 'draft',
        description: '',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to create lesson');
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
        <View>
          <Text style={styles.headerTitle}>Lesson Management</Text>
          <Text style={styles.headerSubtitle}>Create, edit, and organize your lessons</Text>
        </View>
      </View>

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
        <Text style={styles.createButtonText}>+ Create New Lesson</Text>
      </TouchableOpacity>

      {/* Lessons List */}
      <ScrollView 
        style={styles.lessonsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                  <Text style={[
                    styles.statusText,
                    lesson.status === 'published' ? styles.publishedText : styles.draftText
                  ]}>
                    {lesson.status === 'published' ? '✓ ' : '✎ '}{lesson.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.lessonDescription} numberOfLines={2}>
                {lesson.description}
              </Text>
              <View style={styles.lessonFooter}>
                <Text style={styles.lessonMeta}>⏱ {lesson.duration}</Text>
                <Text style={styles.lessonMeta}>📝 {lesson.lastEdited}</Text>
                <Text style={styles.lessonMeta}>🎓 {lesson.grade}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No lessons found</Text>
            <Text style={styles.emptySubtext}>Create your first lesson to get started</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create New Lesson</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Lesson Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter lesson title"
                  placeholderTextColor="#9ca3af"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Subject *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Mathematics, Science"
                  placeholderTextColor="#9ca3af"
                  value={formData.subject}
                  onChangeText={(text) => setFormData({ ...formData, subject: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Grade *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Grade 6, Grade 7"
                  placeholderTextColor="#9ca3af"
                  value={formData.grade}
                  onChangeText={(text) => setFormData({ ...formData, grade: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Duration *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., 45 min"
                  placeholderTextColor="#9ca3af"
                  value={formData.duration}
                  onChangeText={(text) => setFormData({ ...formData, duration: text })}
                />
              </View>

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

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCreateLesson}
                >
                  <Text style={styles.submitButtonText}>Create Lesson</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
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
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
    alignItems: 'center',
    marginBottom: 16,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lessonTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  lessonSubject: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  publishedBadge: {
    backgroundColor: '#d1fae5',
  },
  draftBadge: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  publishedText: {
    color: '#059669',
  },
  draftText: {
    color: '#d97706',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  lessonFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lessonMeta: {
    fontSize: 12,
    color: '#9ca3af',
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
    color: '#1f2937',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
