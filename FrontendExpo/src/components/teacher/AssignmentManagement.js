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
import { useTeacher } from '../../context/TeacherContext';
import { assignmentAPI } from '../../services/api';

const defaultAssignments = [
  {
    id: 1,
    title: 'Algebra Homework',
    subject: 'Mathematics',
    grade: 'Grade 7',
    dueDate: '2025-02-01',
    maxScore: 100,
    submissions: 15,
    totalStudents: 25,
    status: 'active',
  },
  {
    id: 2,
    title: 'Physics Lab Report',
    subject: 'Physics',
    grade: 'Grade 8',
    dueDate: '2025-01-28',
    maxScore: 50,
    submissions: 20,
    totalStudents: 22,
    status: 'active',
  },
  {
    id: 3,
    title: 'Essay Writing',
    subject: 'English',
    grade: 'Grade 7',
    dueDate: '2025-01-20',
    maxScore: 100,
    submissions: 25,
    totalStudents: 25,
    status: 'completed',
  },
];

export default function AssignmentManagement() {
  // Get data from context
  const { teacher, assignments: contextAssignments, refreshData } = useTeacher();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    dueDate: '',
    maxScore: '100',
    description: '',
  });

  useEffect(() => {
    fetchAssignments();
  }, [teacher.id, contextAssignments]);

  const fetchAssignments = async () => {
    try {
      // First check context assignments
      if (contextAssignments && contextAssignments.length > 0) {
        setAssignments(contextAssignments.map(a => ({
          id: a._id || a.id,
          title: a.title || 'Untitled Assignment',
          subject: a.subject || 'General',
          grade: a.grade || 'All Grades',
          dueDate: a.dueDate,
          maxScore: a.maxScore || 100,
          submissions: a.submissions || 0,
          totalStudents: a.totalStudents || 0,
          status: a.dueDate && new Date(a.dueDate) > new Date() ? 'active' : 'completed',
        })));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fallback to API call
      const response = await assignmentAPI.getAssignments();
      if (Array.isArray(response.data) && response.data.length > 0) {
        setAssignments(response.data.map(a => ({
          id: a._id || a.id,
          title: a.title,
          subject: a.subject || 'General',
          grade: a.grade || 'All Grades',
          dueDate: a.dueDate,
          maxScore: a.maxScore || 100,
          submissions: a.submissions?.length || 0,
          totalStudents: a.totalStudents || 0,
          status: new Date(a.dueDate) > new Date() ? 'active' : 'completed',
        })));
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

  const handleCreateAssignment = async () => {
    if (!formData.title || !formData.subject || !formData.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await assignmentAPI.createAssignment(formData);
      await fetchAssignments();

      setShowModal(false);
      setFormData({
        title: '',
        subject: '',
        grade: '',
        dueDate: '',
        maxScore: '100',
        description: '',
      });
    } catch (err) {
      // Fallback to local
      const newAssignment = {
        id: Date.now(),
        ...formData,
        submissions: 0,
        totalStudents: 0,
        status: 'active',
      };
      setAssignments([newAssignment, ...assignments]);
      setShowModal(false);
      setFormData({
        title: '',
        subject: '',
        grade: '',
        dueDate: '',
        maxScore: '100',
        description: '',
      });
    }
  };

  const getFilteredAssignments = () => {
    let filtered = assignments;
    
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.status === filter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysLeft = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return '1 day left';
    return `${diff} days left`;
  };

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === 'active').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    pendingReview: assignments.reduce((acc, a) => acc + a.submissions, 0),
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
        <Text style={styles.headerTitle}>Assignment Management</Text>
        <Text style={styles.headerSubtitle}>Create and manage student assignments</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#6b7280' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pendingReview}</Text>
          <Text style={styles.statLabel}>To Review</Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search assignments..."
          placeholderTextColor="#9ca3af"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'active', 'completed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create Button */}
      <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
        <Text style={styles.createButtonText}>+ Create Assignment</Text>
      </TouchableOpacity>

      {/* Assignments List */}
      <ScrollView 
        style={styles.assignmentsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {getFilteredAssignments().length > 0 ? (
          getFilteredAssignments().map((assignment) => (
            <TouchableOpacity key={assignment.id} style={styles.assignmentCard}>
              <View style={styles.assignmentHeader}>
                <View style={styles.assignmentTitleSection}>
                  <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                  <Text style={styles.assignmentSubject}>📚 {assignment.subject} • {assignment.grade}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  assignment.status === 'active' ? styles.activeBadge : styles.completedBadge
                ]}>
                  <Text style={[
                    styles.statusText,
                    assignment.status === 'active' ? styles.activeText : styles.completedText
                  ]}>
                    {assignment.status}
                  </Text>
                </View>
              </View>

              <View style={styles.assignmentInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>📅</Text>
                  <Text style={styles.infoText}>{formatDate(assignment.dueDate)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>⏰</Text>
                  <Text style={[
                    styles.infoText,
                    getDaysLeft(assignment.dueDate) === 'Overdue' && styles.overdueText
                  ]}>
                    {getDaysLeft(assignment.dueDate)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Submissions</Text>
                  <Text style={styles.progressValue}>
                    {assignment.submissions}/{assignment.totalStudents}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: assignment.totalStudents > 0
                          ? `${(assignment.submissions / assignment.totalStudents) * 100}%`
                          : '0%'
                      }
                    ]}
                  />
                </View>
              </View>

              <View style={styles.assignmentFooter}>
                <Text style={styles.maxScore}>Max Score: {assignment.maxScore}</Text>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Details →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No assignments found</Text>
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
              <Text style={styles.modalTitle}>Create Assignment</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Assignment title"
                  placeholderTextColor="#9ca3af"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Subject *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Mathematics"
                  placeholderTextColor="#9ca3af"
                  value={formData.subject}
                  onChangeText={(text) => setFormData({ ...formData, subject: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Grade</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Grade 7"
                  placeholderTextColor="#9ca3af"
                  value={formData.grade}
                  onChangeText={(text) => setFormData({ ...formData, grade: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={formData.dueDate}
                  onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Max Score</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="100"
                  placeholderTextColor="#9ca3af"
                  value={formData.maxScore}
                  onChangeText={(text) => setFormData({ ...formData, maxScore: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Assignment instructions..."
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
                  onPress={handleCreateAssignment}
                >
                  <Text style={styles.submitButtonText}>Create</Text>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
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
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  filterTabActive: {
    backgroundColor: '#007bff',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
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
  assignmentsContainer: {
    flex: 1,
  },
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assignmentTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  assignmentSubject: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  completedBadge: {
    backgroundColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  activeText: {
    color: '#059669',
  },
  completedText: {
    color: '#6b7280',
  },
  assignmentInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  overdueText: {
    color: '#dc2626',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maxScore: {
    fontSize: 12,
    color: '#9ca3af',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewButtonText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 13,
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
    fontSize: 16,
    color: '#6b7280',
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
