import React, { useState, useEffect } from 'react';
import './CourseChaptersView.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || window.location.origin;

function CourseChaptersView({ course, studentId, onBack }) {
  const [chapters, setChapters] = useState([]);
  const [courseProgress, setCourseProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'slides', 'lectures', 'quiz'
  const [quizState, setQuizState] = useState(null);
  const [message, setMessage] = useState('');
  
  const token = localStorage.getItem('token');
  
  // Fetch chapters
  const fetchChapters = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/chapters/course/${course.id || course._id}?studentId=${studentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (!res.ok) throw new Error('Failed to fetch chapters');
      
      const data = await res.json();
      setChapters(data.chapters || []);
      setCourseProgress(data.courseProgress);
    } catch (err) {
      setMessage('Error loading chapters: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchChapters();
  }, [course]);
  
  // Mark slides as viewed
  const handleViewSlides = async (chapter) => {
    setSelectedChapter(chapter);
    setViewMode('slides');
    
    try {
      await fetch(`${API_BASE}/api/chapters/${chapter._id}/slides/viewed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId })
      });
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
      await fetch(`${API_BASE}/api/chapters/${selectedChapter._id}/lectures/watched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          studentId,
          lectureUrl: lecture.videoUrl || lecture.uploadedVideo?.fileUrl 
        })
      });
      fetchChapters(); // Refresh progress
    } catch (err) {
      console.error('Error marking lecture watched:', err);
    }
  };
  
  // Start quiz
  const handleStartQuiz = async (chapter) => {
    setSelectedChapter(chapter);
    setMessage('');
    
    try {
      const res = await fetch(`${API_BASE}/api/quiz/start/${chapter._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessage(data.message || 'Failed to start quiz');
        return;
      }
      
      setQuizState({
        attemptId: data.attemptId,
        questions: data.questions,
        currentQuestion: 0,
        answers: new Array(data.questions.length).fill(-1),
        totalQuestions: data.totalQuestions,
        passingScore: data.passingScore,
        startedAt: new Date(data.startedAt),
        isResuming: data.isResuming
      });
      setViewMode('quiz');
    } catch (err) {
      setMessage('Error starting quiz: ' + err.message);
    }
  };
  
  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (quizState.answers.includes(-1)) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }
    
    setMessage('Submitting quiz...');
    
    try {
      const res = await fetch(`${API_BASE}/api/quiz/submit/${quizState.attemptId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          studentId,
          answers: quizState.answers 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessage(data.message || 'Failed to submit quiz');
        return;
      }
      
      setQuizState({
        ...quizState,
        submitted: true,
        result: data.result,
        detailedResults: data.detailedResults,
        message: data.message
      });
      
      // Refresh chapters to update progress
      fetchChapters();
    } catch (err) {
      setMessage('Error submitting quiz: ' + err.message);
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
    <div className="chapters-list-view">
      <div className="course-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Courses
        </button>
        <h2>{course.title}</h2>
        <div className="course-progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${courseProgress?.overallProgress || 0}%` }}
          />
          <span>{courseProgress?.overallProgress || 0}% Complete</span>
        </div>
      </div>
      
      <div className="chapters-grid">
        {chapters.map((chapter, index) => (
          <div 
            key={chapter._id} 
            className={`chapter-card ${chapter.isUnlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="chapter-header">
              <div className="chapter-number">
                {chapter.isUnlocked ? (
                  chapter.studentProgress?.chapterCompleted ? (
                    <i className="fas fa-check-circle completed"></i>
                  ) : (
                    <span>{chapter.chapterNumber}</span>
                  )
                ) : (
                  <i className="fas fa-lock"></i>
                )}
              </div>
              <h3>{chapter.title}</h3>
            </div>
            
            {chapter.isUnlocked ? (
              <div className="chapter-content">
                <div className="chapter-progress">
                  <div className="progress-item">
                    <i className={`fas fa-file-powerpoint ${chapter.studentProgress?.slidesViewed ? 'done' : ''}`}></i>
                    <span>Slides</span>
                    {chapter.studentProgress?.slidesViewed && <i className="fas fa-check"></i>}
                  </div>
                  <div className="progress-item">
                    <i className={`fas fa-video ${chapter.studentProgress?.allLecturesCompleted ? 'done' : ''}`}></i>
                    <span>Lectures ({chapter.studentProgress?.lecturesWatched || 0}/{chapter.studentProgress?.totalLectures || 0})</span>
                    {chapter.studentProgress?.allLecturesCompleted && <i className="fas fa-check"></i>}
                  </div>
                  <div className="progress-item">
                    <i className={`fas fa-question-circle ${chapter.studentProgress?.quizPassed ? 'done' : chapter.studentProgress?.quizAttempts > 0 ? 'attempted' : ''}`}></i>
                    <span>
                      Quiz 
                      {chapter.studentProgress?.bestScore > 0 && (
                        <span className={chapter.studentProgress?.quizPassed ? 'score-passed' : 'score-failed'}>
                          ({chapter.studentProgress?.bestScore}%)
                        </span>
                      )}
                    </span>
                    {chapter.studentProgress?.quizPassed && <i className="fas fa-check"></i>}
                  </div>
                </div>
                
                <div className="chapter-actions">
                  {chapter.slides?.length > 0 || chapter.slideContent ? (
                    <button onClick={() => handleViewSlides(chapter)}>
                      <i className="fas fa-file-powerpoint"></i> View Slides
                    </button>
                  ) : null}
                  
                  {chapter.lectures?.length > 0 && (
                    <button onClick={() => handleViewLectures(chapter)}>
                      <i className="fas fa-play-circle"></i> Watch Lectures 
                      {chapter.studentProgress?.lecturesWatched?.length > 0 && 
                        ` (${chapter.studentProgress.lecturesWatched.length}/${chapter.lectures.length})`
                      }
                    </button>
                  )}
                  
                  {chapter.quiz?.isGenerated && (() => {
                    // Check if all lectures are completed
                    const totalLectures = chapter.lectures?.length || 0;
                    const watchedLectures = chapter.studentProgress?.lecturesWatched?.length || 0;
                    const allLecturesComplete = totalLectures === 0 || watchedLectures >= totalLectures || chapter.studentProgress?.allLecturesCompleted;
                    
                    // Check if slides viewed
                    const hasSlides = (chapter.slides?.length > 0) || chapter.slideContent;
                    const slidesViewed = !hasSlides || chapter.studentProgress?.slidesViewed;
                    
                    const quizAvailable = allLecturesComplete && slidesViewed;
                    
                    if (!quizAvailable) {
                      return (
                        <button 
                          className="quiz-locked"
                          disabled
                          title={!allLecturesComplete ? 'Complete all lectures first' : 'View slides first'}
                        >
                          <i className="fas fa-lock"></i>
                          Quiz Locked
                          <span className="quiz-requirement">
                            {!allLecturesComplete 
                              ? `(Watch ${totalLectures - watchedLectures} more lecture${totalLectures - watchedLectures > 1 ? 's' : ''})` 
                              : '(View slides first)'}
                          </span>
                        </button>
                      );
                    }
                    
                    return (
                      <button 
                        onClick={() => handleStartQuiz(chapter)}
                        className={chapter.studentProgress?.quizPassed ? 'retake' : chapter.studentProgress?.quizAttempts > 0 ? 'retry' : 'primary'}
                      >
                        <i className="fas fa-clipboard-list"></i>
                        {chapter.studentProgress?.quizPassed 
                          ? 'Retake Quiz' 
                          : chapter.studentProgress?.quizAttempts > 0 
                            ? 'Retry Quiz' 
                            : 'Take Quiz'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="locked-message">
                <i className="fas fa-lock"></i>
                <p>Complete Chapter {chapter.chapterNumber - 1} quiz to unlock</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render slides view
  const renderSlidesView = () => {
    const getSlideUrl = (slide) => slide.fileUrl || slide.content || slide.url;
    
    // Convert data URL to blob URL for better browser compatibility
    const openSlideInNewTab = (slide) => {
      const url = getSlideUrl(slide);
      if (!url) {
        alert('Slide file not available');
        return;
      }
      
      // If it's a data URL, convert to blob for better browser support
      if (url.startsWith('data:')) {
        try {
          // Extract the base64 data and mime type
          const [header, base64Data] = url.split(',');
          const mimeMatch = header.match(/data:([^;]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
          
          // Convert base64 to blob
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          
          // Create blob URL and open
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          
          // Clean up blob URL after a delay
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (err) {
          console.error('Error opening slide:', err);
          alert('Failed to open slide. Try downloading instead.');
        }
      } else {
        // Regular URL - open directly
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };
    
    // Download slide file
    const downloadSlide = (slide) => {
      const url = getSlideUrl(slide);
      if (!url) {
        alert('Slide file not available');
        return;
      }
      
      const link = document.createElement('a');
      link.href = url;
      link.download = slide.fileName || 'slide.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    const renderSlidePreview = (slide, index) => {
      const url = getSlideUrl(slide);
      const isPdf = slide.fileType?.includes('pdf') || slide.fileName?.toLowerCase().endsWith('.pdf');
      
      if (!url) {
        return (
          <div key={index} className="slide-item slide-unavailable">
            <i className="fas fa-file-alt"></i>
            <span>{slide.fileName || `Slide ${index + 1}`}</span>
            <span className="unavailable-text">File not available</span>
          </div>
        );
      }
      
      // For PDFs, show embedded viewer with action buttons
      if (isPdf) {
        // For data URLs, we need to use blob URL for iframe too
        let iframeSrc = url;
        
        return (
          <div key={index} className="slide-item slide-pdf-embed">
            <div className="slide-header">
              <i className="fas fa-file-pdf"></i>
              <span>{slide.fileName || `Slide ${index + 1}`}</span>
              <div className="slide-actions">
                <button onClick={() => openSlideInNewTab(slide)} className="open-external-btn">
                  <i className="fas fa-external-link-alt"></i> Open
                </button>
                <button onClick={() => downloadSlide(slide)} className="download-btn">
                  <i className="fas fa-download"></i> Download
                </button>
              </div>
            </div>
            <iframe 
              src={iframeSrc} 
              title={slide.fileName || `Slide ${index + 1}`}
              className="pdf-viewer"
            />
          </div>
        );
      }
      
      // For non-PDF files, show clickable buttons
      return (
        <div key={index} className="slide-item slide-link">
          <div className="slide-link-content">
            <i className="fas fa-file-powerpoint"></i>
            <span>{slide.fileName || `Slide ${index + 1}`}</span>
          </div>
          <div className="slide-actions">
            <button onClick={() => openSlideInNewTab(slide)} className="slide-open-btn">
              <i className="fas fa-external-link-alt"></i> Open
            </button>
            <button onClick={() => downloadSlide(slide)} className="download-btn">
              <i className="fas fa-download"></i> Download
            </button>
          </div>
        </div>
      );
    };
    
    return (
      <div className="slides-view">
        <div className="view-header">
          <button className="back-btn" onClick={() => setViewMode('list')}>
            <i className="fas fa-arrow-left"></i> Back to Chapters
          </button>
          <h2>{selectedChapter.title} - Slides</h2>
        </div>
        
        <div className="slides-content">
          {selectedChapter.slideContent && (
            <div className="slide-text">
              <h4>Slide Notes</h4>
              {selectedChapter.slideContent.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}
          
          {selectedChapter.slides?.length > 0 ? (
            <div className="slide-files">
              <h4>Slide Files ({selectedChapter.slides.length})</h4>
              {selectedChapter.slides.map((slide, i) => renderSlidePreview(slide, i))}
            </div>
          ) : !selectedChapter.slideContent && (
            <p className="no-content">No slides available for this chapter.</p>
          )}
        </div>
        
        <div className="view-footer">
          <button className="next-btn" onClick={() => setViewMode('list')}>
            Done Reading <i className="fas fa-check"></i>
          </button>
        </div>
      </div>
    );
  };
  
  // Render lectures view
  const renderLecturesView = () => (
    <div className="lectures-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => setViewMode('list')}>
          <i className="fas fa-arrow-left"></i> Back to Chapters
        </button>
        <h2>{selectedChapter.title} - Lectures</h2>
      </div>
      
      <div className="lectures-list">
        {selectedChapter.lectures?.map((lecture, i) => (
          <div key={i} className="lecture-card">
            <div className="lecture-info">
              <i className="fas fa-play-circle"></i>
              <div>
                <h4>{lecture.title || `Lecture ${i + 1}`}</h4>
                {lecture.duration && <span>{lecture.duration}</span>}
              </div>
            </div>
            <div className="lecture-actions">
              <a 
                href={lecture.videoUrl || lecture.uploadedVideo?.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => handleLectureWatched(lecture)}
              >
                <i className="fas fa-external-link-alt"></i> Watch
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render quiz view
  const renderQuizView = () => {
    if (!quizState) return null;
    
    if (quizState.submitted) {
      return (
        <div className="quiz-results">
          <div className="view-header">
            <h2>Quiz Results</h2>
          </div>
          
          <div className={`result-card ${quizState.result.passed ? 'passed' : 'failed'}`}>
            <div className="score-circle">
              <span className="score">{quizState.result.score}%</span>
              <span className="label">{quizState.result.passed ? 'Passed!' : 'Not Passed'}</span>
            </div>
            <div className="result-details">
              <p><strong>{quizState.result.correctAnswers}</strong> out of <strong>{quizState.result.totalQuestions}</strong> correct</p>
              <p>Passing score: {quizState.result.passingScore}%</p>
              <p className="result-message">{quizState.message}</p>
            </div>
          </div>
          
          <div className="answers-review">
            <h3>Review Answers</h3>
            {quizState.detailedResults?.map((q, i) => (
              <div key={i} className={`question-review ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                <p className="question-text">
                  <span className="q-number">Q{i + 1}.</span> {q.question}
                </p>
                <div className="options-review">
                  {q.options.map((opt, j) => (
                    <div 
                      key={j} 
                      className={`option ${j === q.correctAnswer ? 'correct-answer' : ''} ${j === q.selectedAnswer && j !== q.correctAnswer ? 'wrong-answer' : ''}`}
                    >
                      {opt}
                      {j === q.correctAnswer && <i className="fas fa-check"></i>}
                      {j === q.selectedAnswer && j !== q.correctAnswer && <i className="fas fa-times"></i>}
                    </div>
                  ))}
                </div>
                {q.explanation && <p className="explanation">{q.explanation}</p>}
              </div>
            ))}
          </div>
          
          <div className="view-footer">
            {quizState.result.passed ? (
              <>
                <button className="success-btn" onClick={() => { setQuizState(null); setViewMode('list'); fetchChapters(); }}>
                  <i className="fas fa-check-circle"></i> Chapter Complete - Continue
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setQuizState(null); handleStartQuiz(selectedChapter); }}>
                  <i className="fas fa-redo"></i> Retry Quiz
                </button>
                <button onClick={() => { setQuizState(null); setViewMode('list'); }}>
                  Back to Chapters
                </button>
              </>
            )}
          </div>
        </div>
      );
    }
    
    const currentQ = quizState.questions[quizState.currentQuestion];
    const answeredCount = quizState.answers.filter(a => a !== -1).length;
    const progressPercent = Math.round((answeredCount / quizState.totalQuestions) * 100);
    
    return (
      <div className="quiz-view">
        <div className="quiz-header">
          <h2>{selectedChapter.title} - Quiz</h2>
          <div className="quiz-info">
            <div className="quiz-progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span>{answeredCount}/{quizState.totalQuestions} answered</span>
          </div>
          <div className="quiz-question-counter">
            Question {quizState.currentQuestion + 1} of {quizState.totalQuestions}
          </div>
        </div>
        
        <div className="question-card">
          <div className="question-number">Question {quizState.currentQuestion + 1}</div>
          <p className="question-text">{currentQ.questionText}</p>
          <div className="options">
            {currentQ.options.map((option, i) => (
              <button
                key={i}
                className={`option ${quizState.answers[quizState.currentQuestion] === i ? 'selected' : ''}`}
                onClick={() => handleAnswerQuestion(i)}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="quiz-navigation">
          <button 
            disabled={quizState.currentQuestion === 0}
            onClick={() => setQuizState({ ...quizState, currentQuestion: quizState.currentQuestion - 1 })}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          
          <div className="question-dots">
            {quizState.questions.map((_, i) => (
              <span 
                key={i} 
                className={`dot ${i === quizState.currentQuestion ? 'current' : ''} ${quizState.answers[i] !== -1 ? 'answered' : ''}`}
                onClick={() => setQuizState({ ...quizState, currentQuestion: i })}
                title={`Question ${i + 1}${quizState.answers[i] !== -1 ? ' (answered)' : ''}`}
              />
            ))}
          </div>
          
          {quizState.currentQuestion < quizState.totalQuestions - 1 ? (
            <button 
              onClick={() => setQuizState({ ...quizState, currentQuestion: quizState.currentQuestion + 1 })}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          ) : (
            <button className="submit-btn" onClick={handleSubmitQuiz}>
              Submit Quiz <i className="fas fa-paper-plane"></i>
            </button>
          )}
        </div>
        
        {/* Quick Jump */}
        <div className="quiz-jump-grid">
          <span className="jump-label">Jump to question:</span>
          <div className="jump-buttons">
            {quizState.questions.map((_, i) => (
              <button
                key={i}
                className={`jump-btn ${i === quizState.currentQuestion ? 'current' : ''} ${quizState.answers[i] !== -1 ? 'answered' : ''}`}
                onClick={() => setQuizState({ ...quizState, currentQuestion: i })}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="course-chapters-view loading">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Loading chapters...</span>
      </div>
    );
  }
  
  return (
    <div className="course-chapters-view">
      {message && <div className="message-bar">{message}</div>}
      
      {viewMode === 'list' && renderChapterList()}
      {viewMode === 'slides' && renderSlidesView()}
      {viewMode === 'lectures' && renderLecturesView()}
      {viewMode === 'quiz' && renderQuizView()}
    </div>
  );
}

export default CourseChaptersView;
