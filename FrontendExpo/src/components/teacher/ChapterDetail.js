import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import { chapterAPI, quizAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function ChapterDetail({ chapter, courseId, onClose, isTeacher = true }) {
  const [chapterData, setChapterData] = useState(chapter);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('slides');
  
  // Slides state
  const [slides, setSlides] = useState([]);
  const [slideContent, setSlideContent] = useState('');
  const [savingSlideContent, setSavingSlideContent] = useState(false);
  
  // Videos state
  const [videos, setVideos] = useState([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  // Quiz state
  const [quizState, setQuizState] = useState({
    isGenerated: false,
    questionsCount: 0,
    passingScore: 60,
  });
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizSettings, setQuizSettings] = useState({
    passingScore: 60,
  });

  // Students state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const chapterId = chapter._id || chapter.id;

  useEffect(() => {
    if (chapter) {
      setSlides(chapter.slides || []);
      setVideos(chapter.lectures || []);
      setSlideContent(chapter.slideContent || '');
      if (chapter.quiz) {
        setQuizState({
          isGenerated: chapter.quiz.isGenerated || false,
          questionsCount: chapter.quiz.questions?.length || 0,
          passingScore: chapter.quiz.passingScore || 60,
        });
      }
      fetchChapterDetails();
    }
  }, [chapter]);

  const fetchChapterDetails = async () => {
    try {
      const response = await chapterAPI.getChapter(chapterId);
      if (response.data) {
        const data = response.data;
        setChapterData(data);
        setSlides(data.slides || []);
        setVideos(data.lectures || []);
        setSlideContent(data.slideContent || '');
        if (data.quiz) {
          setQuizState({
            isGenerated: data.quiz.isGenerated || false,
            questionsCount: data.quiz.questions?.length || 0,
            passingScore: data.quiz.passingScore || 60,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching chapter details:', err);
    }
  };

  // Save slide content
  const handleSaveSlideContent = async () => {
    if (!slideContent.trim()) {
      Alert.alert('Error', 'Please enter some content from your slides');
      return;
    }

    setSavingSlideContent(true);
    try {
      const response = await chapterAPI.addSlides(chapterId, { slideContent });
      if (response.data) {
        Alert.alert('Success', 'Slide content saved! You can now generate a quiz.');
      }
    } catch (err) {
      console.error('Error saving slide content:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save slide content');
    } finally {
      setSavingSlideContent(false);
    }
  };

  // Add video
  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) {
      Alert.alert('Error', 'Please enter a video URL');
      return;
    }

    setUploadingVideo(true);
    try {
      const lectureData = {
        title: `Lecture ${videos.length + 1}`,
        videoUrl: newVideoUrl.trim(),
        duration: 0,
      };

      const response = await chapterAPI.addLectures(chapterId, { 
        lectures: [...videos, lectureData] 
      });
      
      if (response.data) {
        setVideos(response.data.lectures || []);
        setNewVideoUrl('');
        Alert.alert('Success', 'Video added successfully!');
      }
    } catch (err) {
      console.error('Error adding video:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to add video');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Delete video
  const handleDeleteVideo = async (index) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedVideos = videos.filter((_, i) => i !== index);
              const response = await chapterAPI.addLectures(chapterId, { 
                lectures: updatedVideos 
              });
              if (response.data) {
                setVideos(response.data.lectures || []);
                Alert.alert('Success', 'Video deleted!');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete video');
            }
          },
        },
      ]
    );
  };

  // Generate quiz
  const handleGenerateQuiz = async () => {
    if (!slideContent || slideContent.trim().length < 100) {
      Alert.alert(
        'Insufficient Content',
        'Please add slide content (at least 100 characters) before generating a quiz.'
      );
      return;
    }

    Alert.alert(
      'Generate Quiz',
      'This will generate 20 multiple-choice questions from your slide content using AI. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGeneratingQuiz(true);
            try {
              const response = await quizAPI.generateQuiz(chapterId);
              if (response.data) {
                setQuizState({
                  isGenerated: true,
                  questionsCount: response.data.questionsCount || 20,
                  passingScore: quizSettings.passingScore,
                });
                Alert.alert(
                  'Success',
                  `Quiz generated with ${response.data.questionsCount} questions!`
                );
              }
            } catch (err) {
              console.error('Error generating quiz:', err);
              Alert.alert('Error', err.response?.data?.message || 'Failed to generate quiz');
            } finally {
              setGeneratingQuiz(false);
            }
          },
        },
      ]
    );
  };

  // Regenerate quiz
  const handleRegenerateQuiz = async () => {
    Alert.alert(
      'Regenerate Quiz',
      'This will replace the existing quiz with new questions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            setGeneratingQuiz(true);
            try {
              const response = await quizAPI.regenerateQuiz(chapterId);
              if (response.data) {
                setQuizState({
                  isGenerated: true,
                  questionsCount: response.data.questionsCount || 20,
                  passingScore: quizSettings.passingScore,
                });
                Alert.alert(
                  'Success',
                  `Quiz regenerated with ${response.data.questionsCount} new questions!`
                );
              }
            } catch (err) {
              console.error('Error regenerating quiz:', err);
              Alert.alert('Error', err.response?.data?.message || 'Failed to regenerate quiz');
            } finally {
              setGeneratingQuiz(false);
            }
          },
        },
      ]
    );
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(ytRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  const tabs = [
    { id: 'slides', label: 'Slides', icon: '📑' },
    { id: 'videos', label: 'Videos', icon: '🎥' },
    { id: 'quiz', label: 'Quiz', icon: '📝' },
    { id: 'students', label: 'Students', icon: '👥' },
  ];

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
          <Text style={styles.chapterLabel}>
            Chapter {chapter.chapterNumber || 1}
          </Text>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          {chapter.description && (
            <Text style={styles.chapterDescription}>{chapter.description}</Text>
          )}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Slides Tab */}
        {activeTab === 'slides' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📑 Chapter Slides</Text>
            </View>

            {isTeacher && (
              <View style={styles.slideContentSection}>
                <Text style={styles.instructionText}>
                  Enter the key concepts and content from your slides. This text will be used to generate quiz questions.
                </Text>

                <TextInput
                  style={styles.slideContentInput}
                  placeholder="Paste or type your slide content here..."
                  placeholderTextColor="#9ca3af"
                  value={slideContent}
                  onChangeText={setSlideContent}
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                />

                <View style={styles.contentStats}>
                  <Text style={styles.contentStatsText}>
                    {slideContent.length} characters | {slideContent.split(/\s+/).filter(Boolean).length} words
                  </Text>
                  {slideContent.length < 100 && (
                    <Text style={styles.contentWarning}>
                      Need at least 100 characters for quiz
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, savingSlideContent && styles.disabledButton]}
                  onPress={handleSaveSlideContent}
                  disabled={savingSlideContent}
                >
                  {savingSlideContent ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>💾 Save Slide Content</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Display uploaded slides */}
            {slides.length > 0 && (
              <View style={styles.slidesListSection}>
                <Text style={styles.subsectionTitle}>Uploaded Slides ({slides.length})</Text>
                {slides.map((slide, index) => (
                  <View key={index} style={styles.slideItem}>
                    <Text style={styles.slideIcon}>📄</Text>
                    <Text style={styles.slideTitle} numberOfLines={1}>
                      {slide.title || slide.fileName || `Slide ${index + 1}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎥 Chapter Videos</Text>
            </View>

            {isTeacher && (
              <View style={styles.addVideoSection}>
                <Text style={styles.subsectionTitle}>Add Video Link</Text>
                <TextInput
                  style={styles.videoUrlInput}
                  placeholder="https://youtube.com/watch?v=..."
                  placeholderTextColor="#9ca3af"
                  value={newVideoUrl}
                  onChangeText={setNewVideoUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.addVideoButton, uploadingVideo && styles.disabledButton]}
                  onPress={handleAddVideo}
                  disabled={uploadingVideo}
                >
                  {uploadingVideo ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addVideoButtonText}>+ Add Video</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Video List */}
            {videos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyText}>No videos yet</Text>
                {isTeacher && (
                  <Text style={styles.emptySubtext}>Add a video URL above</Text>
                )}
              </View>
            ) : (
              <View style={styles.videosList}>
                {videos.map((video, index) => {
                  const embedUrl = getYouTubeEmbedUrl(video.videoUrl);
                  return (
                    <View key={index} style={styles.videoCard}>
                      <View style={styles.videoHeader}>
                        <Text style={styles.videoTitle}>
                          {video.title || `Lecture ${index + 1}`}
                        </Text>
                        {isTeacher && (
                          <TouchableOpacity
                            style={styles.deleteVideoBtn}
                            onPress={() => handleDeleteVideo(index)}
                          >
                            <Text style={styles.deleteVideoBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {embedUrl ? (
                        <View style={styles.videoPreview}>
                          <WebView
                            style={styles.webview}
                            source={{ uri: embedUrl }}
                            allowsFullscreenVideo
                          />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.videoLink}
                          onPress={() => Linking.openURL(video.videoUrl)}
                        >
                          <Text style={styles.videoLinkText}>🔗 {video.videoUrl}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📝 Chapter Quiz</Text>
            </View>

            {quizState.isGenerated ? (
              <View style={styles.quizStatusCard}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.quizStatusGradient}
                >
                  <Text style={styles.quizStatusIcon}>✓</Text>
                  <Text style={styles.quizStatusTitle}>Quiz Generated</Text>
                  <Text style={styles.quizStatusInfo}>
                    {quizState.questionsCount} questions | Passing score: {quizState.passingScore}%
                  </Text>
                </LinearGradient>

                {isTeacher && (
                  <View style={styles.quizActions}>
                    <TouchableOpacity
                      style={[styles.regenerateButton, generatingQuiz && styles.disabledButton]}
                      onPress={handleRegenerateQuiz}
                      disabled={generatingQuiz}
                    >
                      {generatingQuiz ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.regenerateButtonText}>🔄 Regenerate Quiz</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.quizSetupSection}>
                {isTeacher && (
                  <>
                    <View style={styles.quizInstructions}>
                      <Text style={styles.quizInstructionsTitle}>📋 How to Generate a Quiz</Text>
                      <Text style={styles.quizInstructionsText}>
                        1. Go to the Slides tab and add your content{'\n'}
                        2. Save the slide content{'\n'}
                        3. Come back here and click "Generate Quiz"{'\n'}
                        4. AI will create 20 questions from your content
                      </Text>
                    </View>

                    <View style={styles.quizSettingsCard}>
                      <Text style={styles.quizSettingsTitle}>Quiz Settings</Text>
                      <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Passing Score (%)</Text>
                        <TextInput
                          style={styles.settingInput}
                          value={String(quizSettings.passingScore)}
                          onChangeText={(val) => setQuizSettings(prev => ({
                            ...prev,
                            passingScore: parseInt(val) || 60
                          }))}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.generateQuizButton,
                        (slideContent.length < 100 || generatingQuiz) && styles.disabledButton
                      ]}
                      onPress={handleGenerateQuiz}
                      disabled={slideContent.length < 100 || generatingQuiz}
                    >
                      {generatingQuiz ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.generateQuizIcon}>🤖</Text>
                          <Text style={styles.generateQuizText}>Generate Quiz with AI</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {slideContent.length < 100 && (
                      <Text style={styles.quizWarning}>
                        ⚠️ Add at least 100 characters of slide content first
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 Student Progress</Text>
            </View>

            {loadingStudents ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Loading students...</Text>
              </View>
            ) : students.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No students enrolled yet</Text>
                <Text style={styles.emptySubtext}>
                  Students who enroll in this course will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.studentsList}>
                {students.map((student, index) => (
                  <View key={student._id || index} style={styles.studentCard}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>
                        {(student.firstName?.[0] || 'S').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>
                        {student.firstName} {student.lastName}
                      </Text>
                      <Text style={styles.studentEmail}>{student.email}</Text>
                    </View>
                    <View style={[
                      styles.studentStatus,
                      { backgroundColor: student.status === 'completed' ? '#dcfce7' : '#fef3c7' }
                    ]}>
                      <Text style={[
                        styles.studentStatusText,
                        { color: student.status === 'completed' ? '#16a34a' : '#d97706' }
                      ]}>
                        {student.status === 'completed' ? '✓' : '○'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
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
  chapterLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  chapterDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeTabLabel: {
    color: '#3498db',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  // Slides styles
  slideContentSection: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 13,
    color: '#9a3412',
    marginBottom: 12,
    lineHeight: 18,
  },
  slideContentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  contentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  contentStatsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  contentWarning: {
    fontSize: 12,
    color: '#dc2626',
  },
  saveButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  slidesListSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  slideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  slideIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  slideTitle: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  // Videos styles
  addVideoSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  videoUrlInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
  },
  addVideoButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addVideoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  videosList: {
    gap: 12,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  deleteVideoBtn: {
    padding: 4,
  },
  deleteVideoBtnText: {
    fontSize: 18,
  },
  videoPreview: {
    height: 200,
  },
  webview: {
    flex: 1,
  },
  videoLink: {
    padding: 16,
  },
  videoLinkText: {
    fontSize: 13,
    color: '#3b82f6',
  },
  // Quiz styles
  quizStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  quizStatusGradient: {
    padding: 20,
    alignItems: 'center',
  },
  quizStatusIcon: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 8,
  },
  quizStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  quizStatusInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quizActions: {
    padding: 16,
  },
  regenerateButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quizSetupSection: {
    gap: 16,
  },
  quizInstructions: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  quizInstructionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  quizInstructionsText: {
    fontSize: 13,
    color: '#3b82f6',
    lineHeight: 20,
  },
  quizSettingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  quizSettingsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingInput: {
    width: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'center',
  },
  generateQuizButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateQuizIcon: {
    fontSize: 20,
  },
  generateQuizText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quizWarning: {
    textAlign: 'center',
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Students styles
  loadingSection: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  studentsList: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  studentStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentStatusText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
