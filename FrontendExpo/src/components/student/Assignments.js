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

  const [activeFilter, setActiveFilter] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [student.id, contextAssignments]);

  const fetchAssignments = async () => {
    try {
      // First try context assignments
      if (contextAssignments && contextAssignments.length > 0) {
        setAssignments(contextAssignments.map(a => ({
          id: a._id || a.id,
          title: a.title || 'Untitled Assignment',
          subject: a.subject || a.course?.name || 'Course',
          dueDate: a.dueDate,
          status: a.status || 'pending',
          priority: a.priority || 'medium',
        })));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fallback to API call
      const response = await assignmentAPI.getMyAssignments();
      const data = response.data || [];
      if (data.length > 0) {
        setAssignments(data.map(a => ({
          id: a._id,
          title: a.title,
          subject: a.subject || a.course?.name || 'Course',
          dueDate: a.dueDate,
          status: a.status || 'pending',
          priority: a.priority || 'medium',
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

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'submitted', label: 'Submitted' },
  ];

  const filteredAssignments = assignments.filter((assignment) => {
    if (activeFilter === 'pending') return assignment.status === 'pending';
    if (activeFilter === 'submitted') return assignment.status === 'submitted';
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Assignments</Text>
        <Text style={styles.subtitle}>
          {assignments.filter((a) => a.status === 'pending').length} pending
        </Text>
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

      {/* Assignments List */}
      <ScrollView 
        style={styles.assignmentsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAssignments.map((assignment) => (
          <TouchableOpacity key={assignment.id} style={styles.assignmentCard}>
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

            <Text style={styles.assignmentTitle}>{assignment.title}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateIcon}>📅</Text>
                <Text
                  style={[
                    styles.dateText,
                    assignment.status === 'pending' &&
                      isOverdue(assignment.dueDate) &&
                      styles.overdueText,
                  ]}
                >
                  Due: {formatDate(assignment.dueDate)}
                </Text>
              </View>

              {assignment.status === 'submitted' ? (
                <View style={styles.submittedBadge}>
                  <Text style={styles.submittedText}>✓ Submitted</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.submitBtn}>
                  <Text style={styles.submitBtnText}>Submit</Text>
                </TouchableOpacity>
              )}
            </View>
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
});
