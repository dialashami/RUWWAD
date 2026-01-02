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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTeacher } from '../../context/TeacherContext';
import { assignmentAPI } from '../../services/api';

// Options matching web version
const subjectOptions = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Biology',
  'Physics',
  'Chemistry',
  'Arabic',
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

const statusOptions = [
  { value: 'upcoming', label: 'Upcoming', color: '#3b82f6' },
  { value: 'active', label: 'Active', color: '#10b981' },
  { value: 'closed', label: 'Closed', color: '#6b7280' },
];

export default function AssignmentManagement() {
  const { teacher, assignments: contextAssignments, refreshData } = useTeacher();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);

  // Picker modal states
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    universityMajor: '',
    dueDate: '',
    status: 'upcoming',
    totalPoints: '100',
    passingScore: '60',
    totalStudents: '30',
    description: '',
  });

  useEffect(() => {
    fetchAssignments();
  }, [teacher.id, contextAssignments]);

  const fetchAssignments = async () => {
    try {
      if (contextAssignments && contextAssignments.length > 0) {
        setAssignments(contextAssignments.map(a => ({
          id: a._id || a.id,
          title: a.title || 'Untitled Assignment',
          subject: a.subject || 'General',
          grade: a.grade || 'All Grades',
          dueDate: a.dueDate,
          displayDate: a.dueDate
            ? new Date(a.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'No date',
          maxScore: a.points || a.maxScore || 100,
          passingScore: a.passingScore || 60,
          submissions: a.submissions || a.submitted || 0,
          totalStudents: a.totalStudents || 0,
          graded: a.graded || 0,
          status: a.status || (a.dueDate && new Date(a.dueDate) > new Date() ? 'active' : 'closed'),
          description: a.description || '',
        })));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await assignmentAPI.getAssignments();
      if (Array.isArray(response.data) && response.data.length > 0) {
        setAssignments(response.data.map(a => ({
          id: a._id || a.id,
          title: a.title,
          subject: a.subject || 'General',
          grade: a.grade || 'All Grades',
          dueDate: a.dueDate,
          displayDate: a.dueDate
            ? new Date(a.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'No date',
          maxScore: a.points || a.maxScore || 100,
          passingScore: a.passingScore || 60,
          submissions: a.submissions?.length || 0,
          totalStudents: a.totalStudents || 0,
          graded: a.graded || 0,
          status: a.status || 'active',
          description: a.description || '',
        })));
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
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

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      grade: '',
      universityMajor: '',
      dueDate: '',
      status: 'upcoming',
      totalPoints: '100',
      passingScore: '60',
      totalStudents: '30',
      description: '',
    });
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleCreateAssignment = async () => {
    if (!formData.title || !formData.subject || !formData.grade || !formData.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields (*)');
      return;
    }

    if (formData.grade === 'University' && !formData.universityMajor) {
      Alert.alert('Error', 'Please select a specialization for university level');
      return;
    }

    // Validate due date is in future
    const selectedDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      Alert.alert('Error', 'Due date must be in the future');
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

      const assignmentData = {
        title: formData.title,
        subject: formData.subject,
        grade: formData.grade,
        universityMajor: formData.grade === 'University' ? formData.universityMajor : undefined,
        dueDate: formData.dueDate,
        status: formData.status,
        points: parseInt(formData.totalPoints) || 100,
        passingScore: parseInt(formData.passingScore) || 60,
        totalStudents: parseInt(formData.totalStudents) || 30,
        description: formData.description || 'No description provided.',
        teacher: teacherId,
      };

      const response = await assignmentAPI.createAssignment(assignmentData);

      if (response.data) {
        const newAssignment = {
          id: response.data._id || response.data.id || Date.now(),
          title: response.data.title || formData.title,
          subject: response.data.subject || formData.subject,
          grade: response.data.grade || formData.grade,
          dueDate: response.data.dueDate || formData.dueDate,
          displayDate: new Date(formData.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          maxScore: response.data.points || parseInt(formData.totalPoints),
          passingScore: response.data.passingScore || parseInt(formData.passingScore),
          submissions: 0,
          totalStudents: parseInt(formData.totalStudents),
          graded: 0,
          status: formData.status,
          description: formData.description,
        };
        setAssignments([newAssignment, ...assignments]);
        Alert.alert('Success', 'Assignment created successfully!');
      }

      setShowModal(false);
      resetForm();
      refreshData();
    } catch (err) {
      console.error('Error creating assignment:', err);
      // Fallback to local
      const newAssignment = {
        id: Date.now(),
        title: formData.title,
        subject: formData.subject,
        grade: formData.grade,
        dueDate: formData.dueDate,
        displayDate: new Date(formData.dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        maxScore: parseInt(formData.totalPoints),
        passingScore: parseInt(formData.passingScore),
        submissions: 0,
        totalStudents: parseInt(formData.totalStudents),
        graded: 0,
        status: formData.status,
        description: formData.description,
      };
      setAssignments([newAssignment, ...assignments]);
      setShowModal(false);
      resetForm();
    } finally {
      setIsCreating(false);
    }
  };

  const getFilteredAssignments = () => {
    let filtered = assignments;
    
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.status === filter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getDaysLeft = (dueDate) => {
    if (!dueDate) return 'No date';
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return '1 day left';
    return `${diff} days left`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'active': return { bg: '#d1fae5', text: '#059669' };
      case 'closed': return { bg: '#e5e7eb', text: '#6b7280' };
      default: return { bg: '#e5e7eb', text: '#6b7280' };
    }
  };

  const stats = {
    total: assignments.length,
    upcoming: assignments.filter(a => a.status === 'upcoming').length,
    active: assignments.filter(a => a.status === 'active').length,
    closed: assignments.filter(a => a.status === 'closed').length,
    pendingReview: assignments.reduce((acc, a) => acc + (a.submissions - a.graded), 0),
  };

  // Date picker options
  const generateDateOptions = () => {
    const dates = [];
    const start = new Date();
    start.setDate(start.getDate() + 1); // Start from tomorrow
    for (let i = 0; i < 60; i++) { // Next 60 days
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      });
    }
    return dates;
  };

  // Render picker as absolute positioned overlay (not nested Modal)
  const renderPickerModal = (visible, setVisible, options, currentValue, onSelect, title, isObject = false) => {
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
            {options.map((option, index) => {
              const value = isObject ? option.value : option;
              const label = isObject ? option.label : option;
              const isSelected = currentValue === value;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerOption,
                    isSelected && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(value);
                    setVisible(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    isSelected && styles.pickerOptionTextSelected,
                  ]}>
                    {label}
                  </Text>
                  {isSelected && (
                    <Text style={styles.pickerCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignment Management</Text>
        <Text style={styles.headerSubtitle}>Create, grade, and monitor student assignments</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pendingReview > 0 ? stats.pendingReview : 0}</Text>
          <Text style={styles.statLabel}>To Grade</Text>
        </View>
      </View>

      {/* Search */}
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'upcoming', 'active', 'closed'].map((tab) => (
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
      </ScrollView>

      {/* Create Button */}
      <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
        <Text style={styles.createButtonIcon}>+</Text>
        <Text style={styles.createButtonText}>Create Assignment</Text>
      </TouchableOpacity>

      {/* Assignments List */}
      <ScrollView 
        style={styles.assignmentsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
        }
      >
        {getFilteredAssignments().length > 0 ? (
          getFilteredAssignments().map((assignment) => {
            const statusColors = getStatusColor(assignment.status);
            return (
              <TouchableOpacity key={assignment.id} style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <View style={styles.assignmentTitleSection}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <Text style={styles.assignmentSubject}>📚 {assignment.subject} • {assignment.grade}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {assignment.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.assignmentInfo}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoIcon}>📅</Text>
                    <Text style={styles.infoText}>{assignment.displayDate}</Text>
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

                {/* Grading Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Graded</Text>
                    <Text style={styles.progressValue}>
                      {assignment.graded}/{assignment.submissions}
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        styles.gradedBar,
                        {
                          width: assignment.submissions > 0
                            ? `${(assignment.graded / assignment.submissions) * 100}%`
                            : '0%'
                        }
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.assignmentFooter}>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreLabel}>Points: {assignment.maxScore}</Text>
                    <Text style={styles.scoreLabel}>Pass: {assignment.passingScore}</Text>
                  </View>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View Details →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Assignments Yet</Text>
            <Text style={styles.emptySubtitle}>Click "Create Assignment" to add your first assignment.</Text>
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
                <Text style={styles.modalTitle}>Create Assignment</Text>
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
                  <Text style={styles.formLabel}>Assignment Title <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter assignment title"
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

                {/* Due Date Picker */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Due Date <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={formData.dueDate ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
                      {formData.dueDate 
                        ? new Date(formData.dueDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Select due date'}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
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
                        { backgroundColor: statusOptions.find(s => s.value === formData.status)?.color || '#6b7280' }
                      ]} />
                      <Text style={styles.pickerButtonText}>
                        {statusOptions.find(s => s.value === formData.status)?.label || 'Upcoming'}
                      </Text>
                    </View>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Points Row */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Total Points</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="100"
                      placeholderTextColor="#9ca3af"
                      value={formData.totalPoints}
                      onChangeText={(text) => setFormData({ ...formData, totalPoints: text })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Passing Score</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="60"
                      placeholderTextColor="#9ca3af"
                      value={formData.passingScore}
                      onChangeText={(text) => setFormData({ ...formData, passingScore: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Total Students */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Total Students</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="30"
                    placeholderTextColor="#9ca3af"
                    value={formData.totalStudents}
                    onChangeText={(text) => setFormData({ ...formData, totalStudents: text })}
                    keyboardType="numeric"
                  />
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Instructions/Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="Enter assignment instructions..."
                    placeholderTextColor="#9ca3af"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    multiline
                    numberOfLines={4}
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
                    onPress={handleCreateAssignment}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Create Assignment</Text>
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
            (val) => setFormData({ ...formData, status: val }), 'Select Status', true)}
          {showDatePicker && renderPickerModal(showDatePicker, setShowDatePicker, generateDateOptions(), formData.dueDate, 
            (val) => setFormData({ ...formData, dueDate: val }), 'Select Due Date', true)}
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
  filterContainer: {
    maxHeight: 44,
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
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
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 10,
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
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  gradedBar: {
    backgroundColor: '#10b981',
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreLabel: {
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
