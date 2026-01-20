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
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTeacher } from '../../context/TeacherContext';
import { courseAPI } from '../../services/api';
import CourseDetail from './CourseDetail';

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
  
  // Course Details Modal States
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);
  
  // Video Editor Modal States
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [videoUrls, setVideoUrls] = useState(['']);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isSavingVideos, setIsSavingVideos] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
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

  const [coursePage, setCoursePage] = React.useState(1);
  const [hasMoreCourses, setHasMoreCourses] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  useEffect(() => {
    fetchCourses(true);
  }, [teacher.id, contextCourses]);

  const fetchCourses = async (reset = false) => {
    try {
      if (reset) {
        setCoursePage(1);
        setLessons([]);
        setHasMoreCourses(true);
      }

      if (contextCourses && contextCourses.length > 0 && reset) {
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

      const currentPage = reset ? 1 : coursePage;
      const limit = 10; // Load 10 courses at a time (20% if total is ~50)
      
      const params = {
        page: currentPage,
        limit: limit,
      };
      if (teacherId) params.teacher = teacherId;

      const response = await courseAPI.getCourses(params);

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
        
        if (reset) {
          setLessons(mapped);
        } else {
          setLessons(prev => [...prev, ...mapped]);
        }
        
        // Check if we have more data
        setHasMoreCourses(response.data.length === limit);
        setCoursePage(currentPage + 1);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadMoreCourses = async () => {
    if (!hasMoreCourses || loadingMore) return;
    setLoadingMore(true);
    await fetchCourses(false);
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

  const handleCoursePress = async (lesson) => {
    setCourseDetailsLoading(true);
    setShowCourseDetails(true);
    setShowVideoEditor(false);  // Reset video editor state
    setVideoUrls(['']);  // Reset video URLs
    setUploadedVideos([]);  // Reset uploaded videos
    
    try {
      const response = await courseAPI.getCourse(lesson.id);
      if (response.data) {
        const courseData = response.data;
        
        // Calculate attendance for each student
        const totalVideos = (courseData.videoUrls?.length || 0) + (courseData.uploadedVideos?.length || 0);
        
        const studentsWithAttendance = (courseData.students || []).map(student => {
          // Find student's video progress
          const studentProgress = courseData.videoProgress?.find(
            vp => vp.student && vp.student.toString() === (student._id || student.id)?.toString()
          );
          
          let watchedCount = 0;
          let attendancePercent = 0;
          
          if (studentProgress) {
            watchedCount = 
              (studentProgress.watchedVideoUrls?.length || 0) + 
              (studentProgress.watchedUploadedVideos?.length || 0);
            attendancePercent = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0;
          }
          
          return {
            id: student._id || student.id,
            name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
            email: student.email || 'No email',
            watchedCount,
            totalVideos,
            attendancePercent,
            hasAttended: watchedCount > 0,
          };
        });
        
        setSelectedCourse({
          ...courseData,
          studentsWithAttendance,
          totalVideos,
          enrolledCount: courseData.students?.length || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      Alert.alert('Error', 'Failed to load course details');
      setShowCourseDetails(false);
    } finally {
      setCourseDetailsLoading(false);
    }
  };

  // Video Editor Functions
  const handleOpenVideoEditor = () => {
    console.log('Opening video editor for course:', selectedCourse?.title);
    if (selectedCourse) {
      const existingUrls = selectedCourse.videoUrls || [];
      setVideoUrls(existingUrls.length > 0 ? [...existingUrls] : ['']);
    } else {
      setVideoUrls(['']);
    }
    setShowVideoEditor(true);
  };

  const handleCloseVideoEditor = () => {
    setShowVideoEditor(false);
    setVideoUrls(['']);
  };

  const handleAddVideoField = () => {
    const newUrls = [...videoUrls, ''];
    setVideoUrls(newUrls);
  };

  const handleRemoveVideoField = (index) => {
    if (videoUrls.length > 1) {
      const newUrls = videoUrls.filter((_, i) => i !== index);
      setVideoUrls(newUrls);
    }
  };

  const handleVideoUrlChange = (index, value) => {
    const newUrls = [...videoUrls];
    newUrls[index] = value;
    setVideoUrls(newUrls);
  };

  // Pick video from device
  const handlePickVideo = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library to upload videos.');
        return;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 600, // 10 minutes max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        console.log('Selected video:', video);
        
        // Add to uploaded videos list
        const newVideo = {
          uri: video.uri,
          fileName: video.fileName || `video_${Date.now()}.mp4`,
          fileSize: video.fileSize,
          duration: video.duration,
          type: video.mimeType || 'video/mp4',
        };
        
        setUploadedVideos(prev => [...prev, newVideo]);
        Alert.alert('Video Added', `"${newVideo.fileName}" has been added. Don't forget to save!`);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  // Remove uploaded video
  const handleRemoveUploadedVideo = (index) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const isValidVideoUrl = (url) => {
    if (!url || url.trim() === '') return false;
    // Accept any URL that looks like a link
    try {
      // Check for common video platforms or file extensions
      const videoPatterns = [
        /youtube\.com/i,
        /youtu\.be/i,
        /vimeo\.com/i,
        /\.(mp4|webm|ogg|mov)(\?|$)/i,
        /drive\.google\.com/i,
        /^https?:\/\//i,  // Accept any http/https URL
      ];
      return videoPatterns.some(pattern => pattern.test(url));
    } catch (e) {
      return false;
    }
  };

  const handleSaveVideos = async () => {
    // Filter out empty URLs
    const validUrls = videoUrls.filter(url => url && url.trim() !== '');
    
    // Check if there are any videos to save
    const totalVideos = validUrls.length + uploadedVideos.length;
    
    if (totalVideos === 0) {
      Alert.alert('No Videos', 'Please add at least one video URL or upload a video from your device.');
      return;
    }

    setIsSavingVideos(true);

    try {
      const courseId = selectedCourse._id || selectedCourse.id;
      
      // Prepare uploaded videos data
      const uploadedVideosData = uploadedVideos.map(video => ({
        fileName: video.fileName,
        fileUrl: video.uri,  // In production, this would be the cloud storage URL
        fileSize: video.fileSize,
        duration: video.duration,
      }));
      
      console.log('Updating course ID:', courseId);
      console.log('Video URLs:', validUrls);
      console.log('Uploaded Videos:', uploadedVideosData);
      
      const response = await courseAPI.updateCourse(courseId, { 
        videoUrls: validUrls,
        uploadedVideos: uploadedVideosData,
      });
      console.log('Update response:', response.data);
      
      // Update local state
      setSelectedCourse(prev => ({
        ...prev,
        videoUrls: validUrls,
        uploadedVideos: uploadedVideosData,
        totalVideos: totalVideos,
      }));
      
      Alert.alert('Success', `${totalVideos} video(s) saved successfully!`);
      setShowVideoEditor(false);
      setVideoUrls(['']);
      setUploadedVideos([]);
      
      // Refresh the courses list
      if (refreshData) {
        await refreshData();
      }
      fetchCourses();
    } catch (err) {
      console.error('Error saving videos:', err);
      console.error('Error details:', err.response?.data || err.message);
      Alert.alert('Error', `Failed to save videos: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setIsSavingVideos(false);
    }
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
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMoreCourses();
          }
        }}
        scrollEventThrottle={400}
      >
        {filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => (
            <TouchableOpacity 
              key={lesson.id} 
              style={styles.lessonCard}
              onPress={() => handleCoursePress(lesson)}
            >
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
              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>Tap for details →</Text>
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
        {loadingMore && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#007bff" />
            <Text style={{ color: '#666', marginTop: 8 }}>Loading more courses...</Text>
          </View>
        )}
        {!hasMoreCourses && lessons.length > 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#999', fontSize: 14 }}>✓ All courses loaded</Text>
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

      {/* Course Details Modal - Full Screen with CourseDetail Component */}
      <Modal
        visible={showCourseDetails}
        animationType="slide"
        onRequestClose={() => { setShowCourseDetails(false); setSelectedCourse(null); }}
      >
        {courseDetailsLoading ? (
          <View style={styles.detailsLoading}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.detailsLoadingText}>Loading course details...</Text>
          </View>
        ) : selectedCourse ? (
          <CourseDetail
            course={selectedCourse}
            onClose={() => { 
              setShowCourseDetails(false); 
              setSelectedCourse(null);
              // Refresh courses list after closing
              fetchCourses(true);
            }}
            isTeacher={true}
          />
        ) : null}
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
  // Tap hint styles
  tapHint: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  tapHintText: {
    fontSize: 12,
    color: '#007bff',
    fontStyle: 'italic',
  },
  // Course Details Modal Styles
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  detailsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCloseBtnText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  detailsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  detailsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  detailsContent: {
    padding: 16,
  },
  courseInfoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  courseInfoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  courseInfoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  courseMetaIcon: {
    fontSize: 14,
  },
  courseMetaText: {
    fontSize: 13,
    color: '#4b5563',
  },
  courseInfoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  detailsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  detailsStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailsStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  detailsStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  attendanceSection: {
    marginBottom: 20,
  },
  attendanceSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  studentAttendanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  attendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  attendancePercent: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'right',
  },
  watchedText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  noStudentsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noStudentsIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  noStudentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  noStudentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  // Manage Videos Button Styles
  manageVideosButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
  },
  manageVideosIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  manageVideosText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  manageVideosCount: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  // Inline Video Editor Styles
  inlineVideoEditor: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  videoEditorSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  videoEditorDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  uploadVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
  },
  uploadVideoIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  uploadVideoBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  uploadedVideosList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  uploadedVideosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  uploadedVideoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  uploadedVideoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedVideoIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  uploadedVideoDetails: {
    flex: 1,
  },
  uploadedVideoName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  uploadedVideoDuration: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeUploadedBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeUploadedBtnText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  videoSummary: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  videoSummaryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Videos Section Styles
  videosSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  videosSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  videoItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  videoItemInfo: {
    flex: 1,
  },
  videoItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  videoItemUrl: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Video Editor Modal Styles
  videoEditorFullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoEditorContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  videoEditorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  videoEditorCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoEditorCloseBtnText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  videoEditorContent: {
    padding: 16,
  },
  videoEditorInstructions: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  videoEditorInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  videoEditorInstructionsText: {
    fontSize: 14,
    color: '#3b82f6',
    lineHeight: 20,
  },
  videoUrlInputContainer: {
    marginBottom: 16,
  },
  videoUrlInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  videoUrlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  removeVideoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeVideoBtnText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  videoUrlInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  videoUrlValid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  videoUrlValidIcon: {
    fontSize: 14,
    color: '#10b981',
  },
  videoUrlValidText: {
    fontSize: 12,
    color: '#10b981',
  },
  videoUrlInvalid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  videoUrlInvalidIcon: {
    fontSize: 14,
    color: '#f59e0b',
  },
  videoUrlInvalidText: {
    fontSize: 12,
    color: '#f59e0b',
  },
  addVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addVideoBtnIcon: {
    fontSize: 20,
    color: '#6b7280',
    marginRight: 8,
  },
  addVideoBtnText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  videoSummary: {
    alignItems: 'center',
    marginBottom: 20,
  },
  videoSummaryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  videoEditorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  videoEditorBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoEditorCancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  videoEditorCancelBtnText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  videoEditorSaveBtn: {
    backgroundColor: '#007bff',
  },
  videoEditorSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
