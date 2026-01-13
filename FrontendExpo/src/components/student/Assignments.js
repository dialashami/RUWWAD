import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudent } from '../../context/StudentContext';
import { useTheme } from '../../context/ThemeContext';
import { assignmentAPI } from '../../services/api';

const defaultAssignments = [
  {
    id: 1,
    title: 'Algebra Homework - Chapter 5',
    subject: 'Mathematics',
    dueDate: '2025-12-28',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Physics Lab Report',
    subject: 'Physics',
    dueDate: '2025-12-30',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Essay: Climate Change',
    subject: 'English',
    dueDate: '2025-12-25',
    status: 'submitted',
    priority: 'high',
  },
  {
    id: 4,
    title: 'Chemistry Quiz Preparation',
    subject: 'Chemistry',
    dueDate: '2025-12-27',
    status: 'pending',
    priority: 'low',
  },
  {
    id: 5,
    title: 'History Research Paper',
    subject: 'History',
    dueDate: '2026-01-05',
    status: 'pending',
    priority: 'medium',
  },
];

export default function Assignments() {
  // Get data from student context
  const { student, assignments: contextAssignments, refreshData, loading: contextLoading } = useStudent();
  const { isDarkMode, theme } = useTheme();

  const [activeFilter, setActiveFilter] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [student.id, contextAssignments]);

  // Helper to find the student's submission in an assignment
  const getStudentSubmission = (assignment) => {
    if (!assignment.submissions || !student.id) return null;
    return assignment.submissions.find(s => 
      s.student?._id === student.id || s.student === student.id
    );
  };

  const fetchAssignments = async () => {
    try {
      // First try context assignments
      if (contextAssignments && contextAssignments.length > 0) {
        setAssignments(contextAssignments.map(a => {
          const submission = getStudentSubmission(a);
          let status = 'pending';
          if (submission) {
            status = submission.isGraded ? 'graded' : 'submitted';
          }
          return {
            id: a._id || a.id,
            title: a.title || 'Untitled Assignment',
            subject: a.subject || a.course?.name || 'Course',
            dueDate: a.dueDate,
            status: status,
            priority: a.priority || 'medium',
            grade: submission?.grade,
            feedback: submission?.feedback,
            isGraded: submission?.isGraded || false,
          };
        }));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fallback to API call
      const response = await assignmentAPI.getMyAssignments();
      const data = response.data || [];
      if (data.length > 0) {
        setAssignments(data.map(a => {
          const submission = getStudentSubmission(a);
          let status = 'pending';
          if (submission) {
            status = submission.isGraded ? 'graded' : 'submitted';
          }
          return {
            id: a._id,
            title: a.title,
            subject: a.subject || a.course?.name || 'Course',
            dueDate: a.dueDate,
            status: status,
            priority: a.priority || 'medium',
            grade: submission?.grade,
            feedback: submission?.feedback,
            isGraded: submission?.isGraded || false,
          };
        }));
      } else {
        setAssignments(defaultAssignments);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setAssignments(defaultAssignments);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    fetchAssignments();
  };

  // File picker handler
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          name: file.name,
          uri: file.uri,
          size: file.size,
          mimeType: file.mimeType,
        });
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  // Open submit modal
  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedFile(null);
    setShowSubmitModal(true);
  };

  // Submit assignment handler
  const handleSubmitAssignment = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a file to submit.');
      return;
    }

    setSubmitting(true);
    try {
      // Get student ID
      let studentId = student.id || student._id;
      if (!studentId) {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          studentId = userData._id || userData.id;
        }
      }

      // Read file as base64
      let fileData = null;
      try {
        const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Get mime type from file extension
        const extension = selectedFile.name?.split('.').pop()?.toLowerCase() || 'bin';
        const mimeTypes = {
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          txt: 'text/plain',
          zip: 'application/zip',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
        };
        const mimeType = mimeTypes[extension] || 'application/octet-stream';
        fileData = `data:${mimeType};base64,${fileContent}`;
      } catch (readError) {
        console.error('Error reading file:', readError);
        Alert.alert('Error', 'Could not read the selected file. Please try again.');
        setSubmitting(false);
        return;
      }

      // Submit the assignment with actual file content
      await assignmentAPI.submitAssignment(selectedAssignment.id, {
        studentId,
        file: fileData,
        fileName: selectedFile.name,
      });

      // Update local state
      setAssignments(prev => prev.map(a => 
        a.id === selectedAssignment.id 
          ? { ...a, status: 'submitted' }
          : a
      ));

      Alert.alert('Success', 'Assignment submitted successfully!');
      setShowSubmitModal(false);
      setSelectedFile(null);
      setSelectedAssignment(null);
      
      // Refresh data
      refreshData();
    } catch (err) {
      console.error('Error submitting assignment:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'graded', label: 'Graded' },
  ];

  const filteredAssignments = assignments.filter((assignment) => {
    if (activeFilter === 'pending') return assignment.status === 'pending';
    if (activeFilter === 'submitted') return assignment.status === 'submitted';
    if (activeFilter === 'graded') return assignment.status === 'graded' || assignment.isGraded;
    return true;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const isOverdue = (dateString) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: theme.background }]}>
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
            <Text style={styles.bannerTitle}>Assignments</Text>
            <Text style={styles.bannerSubtitle}>
              {assignments.filter((a) => a.status === 'pending').length} pending
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={[styles.filters, isDarkMode && { backgroundColor: theme.surface }]}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterBtn,
              activeFilter === filter.id && styles.filterBtnActive,
              isDarkMode && activeFilter !== filter.id && { backgroundColor: theme.card },
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.filterTextActive,
                isDarkMode && activeFilter !== filter.id && { color: theme.textSecondary },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Assignments List */}
      <ScrollView 
        style={styles.assignmentsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAssignments.map((assignment) => (
          <TouchableOpacity key={assignment.id} style={[styles.assignmentCard, isDarkMode && { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectText}>{assignment.subject}</Text>
              </View>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(assignment.priority) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: getPriorityColor(assignment.priority) },
                  ]}
                >
                  {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
                </Text>
              </View>
            </View>

            <Text style={[styles.assignmentTitle, isDarkMode && { color: theme.text }]}>{assignment.title}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateIcon}>📅</Text>
                <Text
                  style={[
                    styles.dateText,
                    isDarkMode && { color: theme.textSecondary },
                    assignment.status === 'pending' &&
                      isOverdue(assignment.dueDate) &&
                      styles.overdueText,
                  ]}
                >
                  Due: {formatDate(assignment.dueDate)}
                </Text>
              </View>

              {assignment.status === 'graded' || assignment.isGraded ? (
                <View style={styles.gradedBadge}>
                  <Text style={styles.gradedText}>✓ Grade: {assignment.grade}%</Text>
                </View>
              ) : assignment.status === 'submitted' ? (
                <View style={styles.submittedBadge}>
                  <Text style={styles.submittedText}>✓ Submitted</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.submitBtn}
                  onPress={() => handleOpenSubmit(assignment)}
                >
                  <Text style={styles.submitBtnText}>Submit</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Show feedback if graded */}
            {assignment.isGraded && assignment.feedback && (
              <View style={[styles.feedbackContainer, isDarkMode && { backgroundColor: theme.inputBackground }]}>
                <Text style={[styles.feedbackLabel, isDarkMode && { color: theme.textSecondary }]}>💬 Teacher Feedback:</Text>
                <Text style={[styles.feedbackText, isDarkMode && { color: theme.text }]}>{assignment.feedback}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Submit Assignment Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Submit Assignment</Text>
              <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                <Text style={[styles.modalClose, isDarkMode && { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedAssignment && (
              <View style={styles.modalBody}>
                <Text style={[styles.assignmentInfo, isDarkMode && { color: theme.text }]}>
                  📚 {selectedAssignment.title}
                </Text>
                <Text style={[styles.assignmentDue, isDarkMode && { color: theme.textSecondary }]}>
                  Due: {formatDate(selectedAssignment.dueDate)}
                </Text>

                {/* File Upload Area */}
                <TouchableOpacity 
                  style={[styles.uploadArea, isDarkMode && { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
                  onPress={handlePickFile}
                >
                  {selectedFile ? (
                    <View style={styles.fileSelected}>
                      <Text style={styles.fileIcon}>📄</Text>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {selectedFile.name}
                        </Text>
                        <Text style={styles.fileSize}>
                          {formatFileSize(selectedFile.size)}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeFileBtn}
                        onPress={() => setSelectedFile(null)}
                      >
                        <Text style={styles.removeFileBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Text style={styles.uploadIcon}>📎</Text>
                      <Text style={styles.uploadText}>Tap to select a file</Text>
                      <Text style={styles.uploadHint}>
                        PDF, DOC, DOCX, Images, etc.
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitAssignmentBtn,
                    (!selectedFile || submitting) && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmitAssignment}
                  disabled={!selectedFile || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitAssignmentBtnText}>
                      📤 Submit Assignment
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#f5f7fa',
  },
  headerBanner: {
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
  assignmentsList: {
    flex: 1,
    padding: 15,
  },
  assignmentCard: {
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
  cardHeader: {
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
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
  },
  overdueText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  submittedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  submittedText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
  },
  gradedBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradedText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  feedbackContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  feedbackLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  feedbackText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalClose: {
    fontSize: 20,
    color: '#6b7280',
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  assignmentInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  assignmentDue: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: '#9ca3af',
  },
  fileSelected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeFileBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFileBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  submitAssignmentBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitAssignmentBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
