import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { chapterAPI, quizAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function CourseChaptersView({ course, studentId, onBack }) {
  const { isDarkMode, theme } = useTheme();

  const [chapters, setChapters] = useState([]);
  const [courseProgress, setCourseProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'slides', 'lectures', 'quiz'
  const [quizState, setQuizState] = useState(null);
  const [message, setMessage] = useState('');
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const courseId = course._id || course.id;

  useEffect(() => {
    fetchChapters();
  }, [courseId]);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const response = await chapterAPI.getChaptersByCourse(courseId, studentId);
      const data = response.data;
      
      setChapters(data.chapters || data || []);
      setCourseProgress(data.courseProgress || null);
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setMessage('Error loading chapters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mark slides as viewed
  const handleViewSlides = async (chapter) => {
    setSelectedChapter(chapter);
    setViewMode('slides');

    try {
      await chapterAPI.markSlidesViewed(chapter._id, studentId);
      // Refresh to update progress
      fetchChapters();
    } catch (err) {
      console.error('Error marking slides viewed:', err);
    }
  };

  // View lectures
  const handleViewLectures = (chapter) => {
    setSelectedChapter(chapter);
    setViewMode('lectures');
  };

  // Mark lecture as watched
  const handleLectureWatched = async (lecture) => {
    try {
      const lectureUrl = lecture.videoUrl || lecture.uploadedVideo?.fileUrl;
      await chapterAPI.markLectureWatched(selectedChapter._id, studentId, lectureUrl);
      fetchChapters(); // Refresh progress
      Alert.alert('Progress Updated', 'Lecture marked as watched!');
    } catch (err) {
      console.error('Error marking lecture watched:', err);
    }
  };

  // Start quiz
  const handleStartQuiz = async (chapter) => {
    setSelectedChapter(chapter);
    setMessage('');

    try {
      const response = await quizAPI.startQuiz(chapter._id, studentId);
      const data = response.data;

      setQuizState({
        attemptId: data.attemptId,
        questions: data.questions,
        currentQuestion: 0,
        answers: new Array(data.questions.length).fill(-1),
        totalQuestions: data.totalQuestions,
        passingScore: data.passingScore,
        startedAt: new Date(data.startedAt),
        isResuming: data.isResuming,
      });
      setViewMode('quiz');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to start quiz';
      Alert.alert('Error', errorMessage);
    }
  };

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (quizState.answers.includes(-1)) {
      Alert.alert(
        'Unanswered Questions',
        'You have unanswered questions. Are you sure you want to submit?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Anyway', onPress: () => submitQuizAnswers() },
        ]
      );
      return;
    }
    submitQuizAnswers();
  };

  const submitQuizAnswers = async () => {
    setSubmittingQuiz(true);
    setMessage('Submitting quiz...');

    try {
      const response = await quizAPI.submitQuiz(
        quizState.attemptId,
        studentId,
        quizState.answers
      );
      const data = response.data;

      setQuizState({
        ...quizState,
        submitted: true,
        result: data.result,
        detailedResults: data.detailedResults,
        message: data.message,
      });

      // Refresh chapters to update progress
      fetchChapters();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error submitting quiz';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmittingQuiz(false);
      setMessage('');
    }
  };

  // Answer question
  const handleAnswerQuestion = (answerIndex) => {
    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentQuestion] = answerIndex;
    setQuizState({ ...quizState, answers: newAnswers });
  };

  // Render chapter list
  const renderChapterList = () => (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Courses</Text>
        </TouchableOpacity>
        <Text style={[styles.courseTitle, isDarkMode && { color: theme.text }]}>
          {course.title}
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#4F46E5', '#9333EA']}
              style={[
                styles.progressFill,
                { width: `${courseProgress?.overallProgress || 0}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressText, isDarkMode && { color: theme.textSecondary }]}>
            {courseProgress?.overallProgress || 0}% Complete
          </Text>
        </View>
      </View>

      {/* Chapters Grid */}
      <View style={styles.chaptersGrid}>
        {chapters.map((chapter, index) => {
          const isUnlocked = chapter.isUnlocked !== false;
          const studentProgress = chapter.studentProgress || {};

          return (
            <View
              key={chapter._id}
              style={[
                styles.chapterCard,
                !isUnlocked && styles.chapterCardLocked,
                isDarkMode && { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {/* Chapter Header */}
              <View style={styles.chapterHeader}>
                <View
                  style={[
                    styles.chapterNumber,
                    isUnlocked && studentProgress.chapterCompleted && styles.chapterCompleted,
                    !isUnlocked && styles.chapterLocked,
                  ]}
                >
                  {!isUnlocked ? (
                    <Text style={styles.lockIcon}>🔒</Text>
                  ) : studentProgress.chapterCompleted ? (
                    <Text style={styles.checkIcon}>✅</Text>
                  ) : (
                    <Text style={[styles.chapterNum, isDarkMode && { color: theme.text }]}>
                      {chapter.chapterNumber || index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[styles.chapterTitle, isDarkMode && { color: theme.text }]}
                  numberOfLines={2}
                >
                  {chapter.title}
                </Text>
              </View>

              {isUnlocked ? (
                <View style={styles.chapterContent}>
                  {/* Progress Items */}
                  <View style={styles.progressItems}>
                    <View style={styles.progressItem}>
                      <Text style={studentProgress.slidesViewed ? styles.itemIconDone : styles.itemIcon}>
                        📑
                      </Text>
                      <Text style={[styles.itemText, isDarkMode && { color: theme.textSecondary }]}>
                        Slides {studentProgress.slidesViewed && '✓'}
                      </Text>
                    </View>
                    
                    <View style={styles.progressItem}>
                      <Text style={studentProgress.allLecturesCompleted ? styles.itemIconDone : styles.itemIcon}>
                        🎥
                      </Text>
                      <Text style={[styles.itemText, isDarkMode && { color: theme.textSecondary }]}>
                        Lectures ({studentProgress.lecturesWatched || 0}/{studentProgress.totalLectures || 0})
                        {studentProgress.allLecturesCompleted && ' ✓'}
                      </Text>
                    </View>
                    
                    <View style={styles.progressItem}>
                      <Text style={studentProgress.quizPassed ? styles.itemIconDone : styles.itemIcon}>
                        📝
                      </Text>
                      <Text style={[styles.itemText, isDarkMode && { color: theme.textSecondary }]}>
                        Quiz {studentProgress.bestScore > 0 && `(${studentProgress.bestScore}%)`}
                        {studentProgress.quizPassed && ' ✓'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.chapterActions}>
                    {(chapter.slides?.length > 0 || chapter.slideContent) && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleViewSlides(chapter)}
                      >
                        <Text style={styles.actionBtnText}>📑 View Slides</Text>
                      </TouchableOpacity>
                    )}

                    {chapter.lectures?.length > 0 && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleViewLectures(chapter)}
                      >
                        <Text style={styles.actionBtnText}>🎥 Watch Lectures</Text>
                      </TouchableOpacity>
                    )}

                    {chapter.quiz?.isGenerated && (() => {
                      const totalLectures = chapter.lectures?.length || 0;
                      const watchedLectures = studentProgress.lecturesWatched?.length || 0;
                      const allLecturesComplete = totalLectures === 0 || watchedLectures >= totalLectures;
                      const hasSlides = (chapter.slides?.length > 0) || chapter.slideContent;
                      const slidesViewed = !hasSlides || studentProgress.slidesViewed;
                      const quizAvailable = allLecturesComplete && slidesViewed;

                      if (!quizAvailable) {
                        return (
                          <View style={[styles.actionBtn, styles.actionBtnDisabled]}>
                            <Text style={styles.actionBtnTextDisabled}>
                              🔒 Quiz Locked
                            </Text>
                          </View>
                        );
                      }

                      return (
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            studentProgress.quizPassed && styles.actionBtnRetake,
                          ]}
                          onPress={() => handleStartQuiz(chapter)}
                        >
                          <Text style={styles.actionBtnText}>
                            {studentProgress.quizPassed
                              ? '🔄 Retake Quiz'
                              : studentProgress.quizAttempts > 0
                              ? '🔄 Retry Quiz'
                              : '📝 Take Quiz'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                </View>
              ) : (
                <View style={styles.lockedMessage}>
                  <Text style={styles.lockedIcon}>🔒</Text>
                  <Text style={[styles.lockedText, isDarkMode && { color: theme.textSecondary }]}>
                    Complete Chapter {(chapter.chapterNumber || index + 1) - 1} quiz to unlock
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  // Render slides view
  const renderSlidesView = () => {
    const slides = selectedChapter?.slides || [];
    const slideContent = selectedChapter?.slideContent;

    return (
      <View style={styles.fullScreen}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Text style={styles.closeBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>
            {selectedChapter?.title} - Slides
          </Text>
        </View>

        <ScrollView style={styles.slidesContainer}>
          {slideContent ? (
            <View style={styles.slideContent}>
              <Text style={[styles.slideContentText, isDarkMode && { color: theme.text }]}>
                {slideContent}
              </Text>
            </View>
          ) : slides.length > 0 ? (
            slides.map((slide, index) => (
              <View key={index} style={styles.slideItem}>
                <Text style={[styles.slideName, isDarkMode && { color: theme.text }]}>
                  {slide.fileName || `Slide ${index + 1}`}
                </Text>
                <TouchableOpacity
                  style={styles.viewSlideBtn}
                  onPress={() => {
                    const url = slide.fileUrl || slide.content || slide.url;
                    if (url) {
                      Linking.openURL(url);
                    } else {
                      Alert.alert('Error', 'Slide file not available');
                    }
                  }}
                >
                  <Text style={styles.viewSlideBtnText}>View File</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={[styles.noContent, isDarkMode && { color: theme.textSecondary }]}>
              No slides available for this chapter
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  // Render lectures view
  const renderLecturesView = () => {
    const lectures = selectedChapter?.lectures || [];
    const studentProgress = selectedChapter?.studentProgress || {};
    const watchedLectures = studentProgress.lecturesWatched || [];

    return (
      <View style={styles.fullScreen}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Text style={styles.closeBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>
            {selectedChapter?.title} - Lectures
          </Text>
        </View>

        <ScrollView style={styles.lecturesContainer}>
          {lectures.length > 0 ? (
            lectures.map((lecture, index) => {
              const lectureUrl = lecture.videoUrl || lecture.uploadedVideo?.fileUrl;
              const isWatched = watchedLectures.includes(lectureUrl);

              return (
                <View
                  key={index}
                  style={[
                    styles.lectureItem,
                    isDarkMode && { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.lectureInfo}>
                    <Text style={[styles.lectureName, isDarkMode && { color: theme.text }]}>
                      {lecture.title || `Lecture ${index + 1}`}
                    </Text>
                    {isWatched && (
                      <Text style={styles.watchedBadge}>✓ Watched</Text>
                    )}
                  </View>

                  <View style={styles.lectureActions}>
                    <TouchableOpacity
                      style={styles.watchBtn}
                      onPress={() => {
                        if (lectureUrl) {
                          Linking.openURL(lectureUrl);
                        } else {
                          Alert.alert('Error', 'Video not available');
                        }
                      }}
                    >
                      <Text style={styles.watchBtnText}>▶️ Watch</Text>
                    </TouchableOpacity>

                    {!isWatched && (
                      <TouchableOpacity
                        style={styles.markWatchedBtn}
                        onPress={() => handleLectureWatched(lecture)}
                      >
                        <Text style={styles.markWatchedBtnText}>Mark as Watched</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={[styles.noContent, isDarkMode && { color: theme.textSecondary }]}>
              No lectures available for this chapter
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  // Render quiz view
  const renderQuizView = () => {
    if (!quizState) return null;

    if (quizState.submitted) {
      return (
        <View style={styles.fullScreen}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setViewMode('list'); setQuizState(null); }}>
              <Text style={styles.closeBtn}>← Back to Chapters</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>
              Quiz Results
            </Text>
          </View>

          <ScrollView style={styles.quizResultsContainer}>
            <View style={[styles.resultCard, quizState.result?.passed ? styles.resultPassed : styles.resultFailed]}>
              <Text style={styles.resultIcon}>
                {quizState.result?.passed ? '🎉' : '😔'}
              </Text>
              <Text style={styles.resultTitle}>
                {quizState.result?.passed ? 'Congratulations!' : 'Not Quite!'}
              </Text>
              <Text style={styles.resultScore}>
                Score: {quizState.result?.score}%
              </Text>
              <Text style={styles.resultDetails}>
                {quizState.result?.correctAnswers}/{quizState.result?.totalQuestions} correct answers
              </Text>
              <Text style={styles.resultPassingScore}>
                Passing Score: {quizState.passingScore}%
              </Text>
            </View>

            {/* Detailed Results */}
            {quizState.detailedResults && (
              <View style={styles.detailedResults}>
                <Text style={[styles.detailedTitle, isDarkMode && { color: theme.text }]}>
                  Question Review
                </Text>
                {quizState.detailedResults.map((result, index) => (
                  <View
                    key={index}
                    style={[
                      styles.detailedItem,
                      result.isCorrect ? styles.detailedCorrect : styles.detailedIncorrect,
                    ]}
                  >
                    <Text style={styles.detailedQuestion}>
                      Q{index + 1}: {result.question}
                    </Text>
                    <Text style={result.isCorrect ? styles.detailedAnswerCorrect : styles.detailedAnswerWrong}>
                      Your answer: {result.userAnswer}
                    </Text>
                    {!result.isCorrect && (
                      <Text style={styles.detailedCorrectAnswer}>
                        Correct answer: {result.correctAnswer}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    const currentQ = quizState.questions[quizState.currentQuestion];

    return (
      <View style={styles.fullScreen}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Exit Quiz',
              'Are you sure? Your progress will be lost.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', onPress: () => { setViewMode('list'); setQuizState(null); } },
              ]
            );
          }}>
            <Text style={styles.closeBtn}>✕ Exit</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>
            Question {quizState.currentQuestion + 1}/{quizState.totalQuestions}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.quizProgress}>
          <View style={styles.quizProgressBar}>
            <View
              style={[
                styles.quizProgressFill,
                { width: `${((quizState.currentQuestion + 1) / quizState.totalQuestions) * 100}%` },
              ]}
            />
          </View>
        </View>

        <ScrollView style={styles.quizContainer}>
          {/* Question */}
          <View style={styles.questionCard}>
            <Text style={[styles.questionText, isDarkMode && { color: theme.text }]}>
              {currentQ?.question || currentQ?.text}
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQ?.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionBtn,
                  quizState.answers[quizState.currentQuestion] === index && styles.optionSelected,
                  isDarkMode && { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => handleAnswerQuestion(index)}
              >
                <Text
                  style={[
                    styles.optionText,
                    quizState.answers[quizState.currentQuestion] === index && styles.optionTextSelected,
                    isDarkMode && { color: theme.text },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Navigation */}
          <View style={styles.quizNavigation}>
            {quizState.currentQuestion > 0 && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setQuizState({ ...quizState, currentQuestion: quizState.currentQuestion - 1 })}
              >
                <Text style={styles.navBtnText}>← Previous</Text>
              </TouchableOpacity>
            )}

            {quizState.currentQuestion < quizState.totalQuestions - 1 ? (
              <TouchableOpacity
                style={[styles.navBtn, styles.navBtnNext]}
                onPress={() => setQuizState({ ...quizState, currentQuestion: quizState.currentQuestion + 1 })}
              >
                <Text style={styles.navBtnTextNext}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navBtn, styles.submitBtn]}
                onPress={handleSubmitQuiz}
                disabled={submittingQuiz}
              >
                {submittingQuiz ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Quiz</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, isDarkMode && { color: theme.text }]}>
          Loading chapters...
        </Text>
      </View>
    );
  }

  // Render based on view mode
  switch (viewMode) {
    case 'slides':
      return renderSlidesView();
    case 'lectures':
      return renderLecturesView();
    case 'quiz':
      return renderQuizView();
    default:
      return renderChapterList();
  }
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
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  chaptersGrid: {
    padding: 16,
    gap: 16,
  },
  chapterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chapterCardLocked: {
    opacity: 0.7,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  chapterLocked: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  chapterNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  lockIcon: {
    fontSize: 16,
  },
  checkIcon: {
    fontSize: 18,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  chapterContent: {},
  progressItems: {
    gap: 8,
    marginBottom: 16,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  itemIconDone: {
    fontSize: 16,
    opacity: 1,
  },
  itemText: {
    fontSize: 14,
    color: '#64748b',
  },
  chapterActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionBtnDisabled: {
    backgroundColor: '#e5e7eb',
  },
  actionBtnRetake: {
    backgroundColor: '#9333EA',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actionBtnTextDisabled: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  lockedMessage: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  lockedIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  // Full screen views
  fullScreen: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  closeBtn: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  // Slides
  slidesContainer: {
    flex: 1,
    padding: 16,
  },
  slideContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  slideContentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0F172A',
  },
  slideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  slideName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    flex: 1,
  },
  viewSlideBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewSlideBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  noContent: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    padding: 40,
  },
  // Lectures
  lecturesContainer: {
    flex: 1,
    padding: 16,
  },
  lectureItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lectureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lectureName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  watchedBadge: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  lectureActions: {
    flexDirection: 'row',
    gap: 12,
  },
  watchBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  watchBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  markWatchedBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  markWatchedBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  // Quiz
  quizProgress: {
    padding: 16,
    backgroundColor: '#fff',
  },
  quizProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  quizProgressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  quizContainer: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: '#0F172A',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  optionSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  optionText: {
    fontSize: 16,
    color: '#0F172A',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  quizNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  navBtnNext: {
    backgroundColor: '#4F46E5',
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  navBtnTextNext: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#22C55E',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Quiz Results
  quizResultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultPassed: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  resultFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  resultPassingScore: {
    fontSize: 14,
    color: '#9ca3af',
  },
  detailedResults: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  detailedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  detailedItem: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  detailedCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  detailedIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  detailedQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  detailedAnswerCorrect: {
    fontSize: 14,
    color: '#22C55E',
  },
  detailedAnswerWrong: {
    fontSize: 14,
    color: '#EF4444',
  },
  detailedCorrectAnswer: {
    fontSize: 14,
    color: '#22C55E',
    marginTop: 4,
  },
});
