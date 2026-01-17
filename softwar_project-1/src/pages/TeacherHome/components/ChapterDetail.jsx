// src/pages/TeacherHome/components/ChapterDetail.jsx
import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function ChapterDetail({ chapter, courseId, onClose, isTeacher = true }) {
  const [chapterData, setChapterData] = useState(chapter);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('slides');
  
  // Slides state
  const [slides, setSlides] = useState([]);
  const [newSlideFile, setNewSlideFile] = useState(null);
  const [uploadingSlide, setUploadingSlide] = useState(false);
  
  // Videos state
  const [videos, setVideos] = useState([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  // Additional details state
  const [additionalText, setAdditionalText] = useState('');
  const [additionalVideos, setAdditionalVideos] = useState([]);
  const [savingDetails, setSavingDetails] = useState(false);
  
  // Students state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (chapter) {
      setSlides(chapter.slides || []);
      setVideos(chapter.lectures || []);
      setAdditionalText(chapter.additionalNotes || '');
      setAdditionalVideos(chapter.additionalVideos || []);
      fetchChapterDetails();
      fetchStudentProgress();
    }
  }, [chapter]);

  const fetchChapterDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/chapters/${chapter._id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setChapterData(data);
        setSlides(data.slides || []);
        setVideos(data.lectures || []);
        setAdditionalText(data.additionalNotes || '');
        setAdditionalVideos(data.additionalVideos || []);
        // Load quiz data
        if (data.slideContent) {
          setSlideContent(data.slideContent);
        }
        if (data.quiz) {
          setQuizState({
            isGenerated: data.quiz.isGenerated || false,
            questionsCount: data.quiz.questions?.length || 0,
            passingScore: data.quiz.passingScore || 60,
            generatedAt: data.quiz.generatedAt || null
          });
          if (data.quiz.passingScore) {
            setQuizSettings(prev => ({ ...prev, passingScore: data.quiz.passingScore }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching chapter details:', err);
    }
  };

  const fetchStudentProgress = async () => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('token');
      const chapterId = chapter?._id || chapter?.id;
      const [courseRes, chapterRes] = await Promise.all([
        fetch(`${API_BASE}/api/courses/${courseId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        chapterId
          ? fetch(`${API_BASE}/api/chapters/${chapterId}`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            })
          : Promise.resolve(null),
      ]);

      if (courseRes.ok) {
        const course = await courseRes.json();
        const chapterDataResponse = chapterRes && chapterRes.ok ? await chapterRes.json() : null;

        const quizProgressByStudent = new Map();
        if (chapterDataResponse?.studentProgress?.length) {
          chapterDataResponse.studentProgress.forEach(progress => {
            const studentId = progress.student?.toString?.() || progress.student;
            const bestScore = progress.quizAttempts?.length
              ? Math.max(...progress.quizAttempts.map(attempt => attempt.score))
              : null;
            if (studentId) {
              quizProgressByStudent.set(studentId.toString(), {
                bestScore,
              });
            }
          });
        }

        // Get enrolled students with their progress
        const enrolledStudents = course.students || [];
        const studentProgress = course.studentCourseProgress || [];

        const studentsWithProgress = enrolledStudents.map(student => {
          const studentId = (student._id || student).toString();
          const progress = studentProgress.find(p =>
            p.student?.toString() === studentId
          );
          const quizProgress = quizProgressByStudent.get(studentId);
          return {
            _id: student._id || student,
            firstName: student.firstName || 'Student',
            lastName: student.lastName || '',
            email: student.email || '',
            status: progress?.chaptersCompleted?.includes(chapter.chapterNumber)
              ? 'completed'
              : progress?.currentChapter >= chapter.chapterNumber
                ? 'in-progress'
                : 'not-started',
            quizScore: quizProgress?.bestScore ?? null,
            overallProgress: progress?.overallProgress || 0,
          };
        });
        setStudents(studentsWithProgress);
      }
    } catch (err) {
      console.error('Error fetching student progress:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle slide upload
  const handleSlideUpload = async () => {
    if (!newSlideFile) {
      alert('Please select a file to upload');
      return;
    }
    
    const chapterId = chapter._id || chapter.id;
    if (!chapterId) {
      alert('Chapter ID is missing. Please try reopening the chapter.');
      return;
    }
    
    setUploadingSlide(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to upload slides');
        setUploadingSlide(false);
        return;
      }
      
      // For now, we'll store the slide content as text/URL
      // In production, you'd upload to cloud storage
      const reader = new FileReader();
      reader.onerror = () => {
        setUploadingSlide(false);
        alert('Failed to read the file. Please try again.');
      };
      reader.onload = async (e) => {
        try {
          const slideData = {
            title: newSlideFile.name,
            content: e.target.result,
            fileUrl: e.target.result, // Store the base64 data URL for viewing
            fileName: newSlideFile.name,
            fileType: newSlideFile.type,
          };
          
          const url = `${API_BASE}/api/chapters/${chapterId}/slides`;
          console.log('Uploading slide to:', url);
          
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ slides: [...slides, slideData] }),
          });
          
          if (res.ok) {
            const data = await res.json();
            setSlides(data.slides || []);
            setNewSlideFile(null);
            // Clear the file input
            const fileInput = document.getElementById('slide-file-input');
            if (fileInput) fileInput.value = '';
            alert('Slide uploaded successfully!');
          } else {
            const error = await res.json().catch(() => ({}));
            alert(error.message || 'Failed to upload slide');
          }
        } catch (err) {
          console.error('Error uploading slide:', err);
          alert(`Failed to upload slide: ${err.message || 'Network error - check if backend is running on port 5000'}`);
        } finally {
          setUploadingSlide(false);
        }
      };
      reader.readAsDataURL(newSlideFile);
    } catch (err) {
      console.error('Error uploading slide:', err);
      alert(`Failed to upload slide: ${err.message || 'Unknown error'}`);
      setUploadingSlide(false);
    }
  };

  // Handle slide delete
  const handleDeleteSlide = async (slideIndex) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const chapterId = chapter._id || chapter.id;
      const updatedSlides = slides.filter((_, idx) => idx !== slideIndex);
      
      const res = await fetch(`${API_BASE}/api/chapters/${chapterId}/slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slides: updatedSlides }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSlides(data.slides || []);
        alert('Slide deleted successfully!');
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.message || 'Failed to delete slide');
      }
    } catch (err) {
      console.error('Error deleting slide:', err);
      alert('Failed to delete slide');
    }
  };

  // Handle video add
  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) {
      alert('Please enter a video URL');
      return;
    }
    
    setUploadingVideo(true);
    try {
      const token = localStorage.getItem('token');
      const lectureData = {
        title: `Lecture ${videos.length + 1}`,
        videoUrl: newVideoUrl.trim(),
        duration: 0,
      };
      
      const res = await fetch(`${API_BASE}/api/chapters/${chapter._id}/lectures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lectures: [lectureData] }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setVideos(data.lectures || []);
        setNewVideoUrl('');
        alert('Video added successfully!');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to add video');
      }
    } catch (err) {
      console.error('Error adding video:', err);
      alert('Failed to add video');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Handle save additional details
  const handleSaveDetails = async () => {
    setSavingDetails(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/chapters/${chapter._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          additionalNotes: additionalText,
          additionalVideos: additionalVideos,
        }),
      });
      
      if (res.ok) {
        alert('Details saved successfully!');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to save details');
      }
    } catch (err) {
      console.error('Error saving details:', err);
      alert('Failed to save details');
    } finally {
      setSavingDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#dcfce7', color: '#16a34a', text: 'Completed' };
      case 'in-progress':
        return { bg: '#fef3c7', color: '#d97706', text: 'In Progress' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280', text: 'Not Started' };
    }
  };

  // Quiz state
  const [quizState, setQuizState] = useState({
    isGenerated: chapter?.quiz?.isGenerated || false,
    questionsCount: chapter?.quiz?.questions?.length || 0,
    passingScore: chapter?.quiz?.passingScore || 60,
    generatedAt: chapter?.quiz?.generatedAt || null
  });
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [slideContent, setSlideContent] = useState(chapter?.slideContent || '');
  const [savingSlideContent, setSavingSlideContent] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [quizSettings, setQuizSettings] = useState({
    passingScore: 60,
    maxAttempts: 0,
    timeLimit: 0
  });
  const [isQuizPreviewOpen, setIsQuizPreviewOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [savingQuizPreview, setSavingQuizPreview] = useState(false);

  // Generate quiz from slides
  const handleGenerateQuiz = async () => {
    if (!slideContent || slideContent.trim().length < 100) {
      alert('Please add slide content (at least 100 characters) before generating a quiz. Enter the key concepts and content from your slides in the text area.');
      return;
    }
    
    if (!window.confirm('This will generate 20 multiple-choice questions from the slide content using AI. Continue?')) {
      return;
    }
    
    setGeneratingQuiz(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/quiz/generate/${chapter._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passingScore: quizSettings.passingScore,
          maxAttempts: quizSettings.maxAttempts,
          timeLimit: quizSettings.timeLimit
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setQuizState({
          isGenerated: true,
          questionsCount: data.questionsCount,
          passingScore: quizSettings.passingScore,
          generatedAt: new Date()
        });
        alert(`Quiz generated successfully with ${data.questionsCount} questions!`);
      } else {
        alert(data.message || 'Failed to generate quiz');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      alert('Failed to generate quiz: ' + err.message);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleOpenQuizPreview = () => {
    const existingQuestions = chapterData?.quiz?.questions || [];
    const normalizedQuestions = existingQuestions.map(q => ({
      question: q.question || '',
      options: Array.isArray(q.options) ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium'
    }));
    setQuizQuestions(normalizedQuestions);
    setIsQuizPreviewOpen(true);
  };

  const handleQuizQuestionChange = (index, value) => {
    setQuizQuestions(prev => prev.map((q, i) => i === index ? { ...q, question: value } : q));
  };

  const handleQuizOptionChange = (questionIndex, optionIndex, value) => {
    setQuizQuestions(prev => prev.map((q, i) => {
      if (i !== questionIndex) return q;
      const options = [...q.options];
      options[optionIndex] = value;
      return { ...q, options };
    }));
  };

  const handleQuizCorrectAnswerChange = (questionIndex, value) => {
    const parsedValue = Number(value);
    setQuizQuestions(prev => prev.map((q, i) => i === questionIndex ? { ...q, correctAnswer: parsedValue } : q));
  };

  const handleSaveQuizPreview = async () => {
    setSavingQuizPreview(true);
    try {
      const token = localStorage.getItem('token');
      const chapterId = chapter?._id || chapter?.id;
      const res = await fetch(`${API_BASE}/api/chapters/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quiz: {
            questions: quizQuestions.map(q => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: q.difficulty
            }))
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to save quiz questions');
        return;
      }

      setChapterData(data);
      setQuizState(prev => ({
        ...prev,
        isGenerated: data.quiz?.isGenerated || prev.isGenerated,
        questionsCount: data.quiz?.questions?.length || prev.questionsCount,
      }));
      alert('Quiz questions updated successfully!');
      setIsQuizPreviewOpen(false);
    } catch (err) {
      console.error('Error saving quiz questions:', err);
      alert('Failed to save quiz questions');
    } finally {
      setSavingQuizPreview(false);
    }
  };

  // Save slide content for quiz generation
  const handleSaveSlideContent = async () => {
    if (!slideContent.trim()) {
      alert('Please enter some content from your slides');
      return;
    }
    
    setSavingSlideContent(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/chapters/${chapter._id}/slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slideContent }),
      });
      
      if (res.ok) {
        alert('Slide content saved successfully! You can now generate a quiz.');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save slide content');
      }
    } catch (err) {
      console.error('Error saving slide content:', err);
      alert('Failed to save slide content');
    } finally {
      setSavingSlideContent(false);
    }
  };

  // Extract text from PDF file
  const handleExtractPdfText = async () => {
    if (!pdfFile) {
      alert('Please select a PDF file first');
      return;
    }

    if (!pdfFile.type.includes('pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    setExtractingPdf(true);
    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE}/api/chapters/${chapter._id}/extract-pdf-text`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ pdfDataUrl: dataUrl }),
          });
          
          const data = await res.json();
          
          if (res.ok) {
            setSlideContent(data.extractedText);
            setPdfFile(null);
            // Clear the file input
            const fileInput = document.getElementById('pdf-upload-input');
            if (fileInput) fileInput.value = '';
            alert(`Successfully extracted ${data.charCount.toLocaleString()} characters from ${data.pageCount} pages! You can now review and edit the content, then generate the quiz.`);
          } else {
            alert(data.message || 'Failed to extract text from PDF');
          }
        } catch (err) {
          console.error('Error extracting PDF text:', err);
          alert('Failed to extract text from PDF: ' + err.message);
        } finally {
          setExtractingPdf(false);
        }
      };

      reader.onerror = () => {
        alert('Failed to read the PDF file');
        setExtractingPdf(false);
      };

      reader.readAsDataURL(pdfFile);
    } catch (err) {
      console.error('Error reading PDF:', err);
      alert('Failed to read PDF file');
      setExtractingPdf(false);
    }
  };

  // Regenerate quiz
  const handleRegenerateQuiz = async () => {
    if (!window.confirm('This will replace the existing quiz with new questions. Students who already took the quiz will keep their scores. Continue?')) {
      return;
    }
    
    setGeneratingQuiz(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/quiz/regenerate/${chapter._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passingScore: quizSettings.passingScore,
          maxAttempts: quizSettings.maxAttempts,
          timeLimit: quizSettings.timeLimit
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setQuizState({
          isGenerated: true,
          questionsCount: data.questionsCount,
          passingScore: quizSettings.passingScore,
          generatedAt: new Date()
        });
        alert(`Quiz regenerated with ${data.questionsCount} new questions!`);
      } else {
        alert(data.message || 'Failed to regenerate quiz');
      }
    } catch (err) {
      console.error('Error regenerating quiz:', err);
      alert('Failed to regenerate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const tabs = [
    { id: 'slides', label: 'Slides', icon: 'fa-file-powerpoint' },
    { id: 'videos', label: 'Videos', icon: 'fa-video' },
    { id: 'quiz', label: 'Quiz', icon: 'fa-clipboard-list' },
    { id: 'details', label: 'Additional Details', icon: 'fa-info-circle' },
    { id: 'students', label: 'Students', icon: 'fa-users' },
  ];

  return (
    <>
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
          color: '#fff',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              <i className="fas fa-book-open" style={{ marginRight: '10px' }}></i>
              Chapter {chapter.chapterNumber}: {chapter.title}
            </h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              {chapter.description || 'No description'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 18px',
              cursor: 'pointer',
              color: '#3498db',
              fontSize: '0.95rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateX(-3px)';
              e.currentTarget.style.background = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
            }}
            title="Back to Course"
          >
            <i className="fas fa-arrow-left"></i>
            Back
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: 'none',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid #3498db' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#3498db' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
        }}>
          {/* Slides Tab */}
          {activeTab === 'slides' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 16px', color: '#1f2937' }}>
                  <i className="fas fa-file-powerpoint" style={{ marginRight: '8px', color: '#ea580c' }}></i>
                  Chapter Slides
                </h3>
                
                {isTeacher && (
                  <div style={{
                    padding: '20px',
                    background: '#fff7ed',
                    borderRadius: '12px',
                    border: '1px solid #fed7aa',
                    marginBottom: '20px',
                  }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500, color: '#9a3412' }}>
                      Upload Slide (PDF, PPT, PPTX, Images)
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg"
                        onChange={(e) => setNewSlideFile(e.target.files[0])}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px solid #fed7aa',
                          borderRadius: '8px',
                          backgroundColor: '#fff',
                        }}
                      />
                      <button
                        onClick={handleSlideUpload}
                        disabled={uploadingSlide || !newSlideFile}
                        style={{
                          padding: '10px 20px',
                          background: uploadingSlide ? '#9ca3af' : '#ea580c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: uploadingSlide ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {uploadingSlide ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Slides List */}
                {slides.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-file-powerpoint" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                    <p>No slides uploaded yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {slides.map((slide, index) => {
                      const slideUrl = slide.fileUrl || slide.content;
                      const hasViewableContent = !!slideUrl;
                      
                      return (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px 16px',
                          background: '#fff',
                          borderRadius: '10px',
                          border: '1px solid #e5e7eb',
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: hasViewableContent ? '#fff7ed' : '#fee2e2',
                            color: hasViewableContent ? '#ea580c' : '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <i className={`fas ${hasViewableContent ? 'fa-file-powerpoint' : 'fa-exclamation-triangle'}`}></i>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937' }}>
                              {slide.title || slide.fileName || `Slide ${index + 1}`}
                            </h4>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: hasViewableContent ? '#9ca3af' : '#dc2626' }}>
                              {hasViewableContent ? slide.fileName || 'Uploaded slide' : 'File needs re-upload - students cannot view'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {hasViewableContent && (
                              <button
                                onClick={() => {
                                  // Convert data URL to blob for browser compatibility
                                  if (slideUrl.startsWith('data:')) {
                                    try {
                                      const [header, base64Data] = slideUrl.split(',');
                                      const mimeMatch = header.match(/data:([^;]+)/);
                                      const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
                                      const byteCharacters = atob(base64Data);
                                      const byteNumbers = new Array(byteCharacters.length);
                                      for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                      }
                                      const byteArray = new Uint8Array(byteNumbers);
                                      const blob = new Blob([byteArray], { type: mimeType });
                                      const blobUrl = URL.createObjectURL(blob);
                                      window.open(blobUrl, '_blank');
                                      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                                    } catch (err) {
                                      console.error('Error opening slide:', err);
                                      alert('Failed to open slide');
                                    }
                                  } else {
                                    window.open(slideUrl, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                style={{
                                  padding: '8px 16px',
                                  background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                }}
                              >
                                <i className="fas fa-eye" style={{ marginRight: '6px' }}></i>
                                View
                              </button>
                            )}
                            {!hasViewableContent && (
                              <span style={{ 
                                padding: '6px 12px', 
                                background: '#fee2e2', 
                                color: '#dc2626', 
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}>
                                Re-upload needed
                              </span>
                            )}
                            {isTeacher && (
                              <button
                                onClick={() => handleDeleteSlide(index)}
                                style={{
                                  padding: '8px 12px',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                }}
                                title="Delete slide"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 16px', color: '#1f2937' }}>
                  <i className="fas fa-video" style={{ marginRight: '8px', color: '#3498db' }}></i>
                  Chapter Videos
                </h3>
                
                {isTeacher && (
                  <div style={{
                    padding: '20px',
                    background: '#faf5ff',
                    borderRadius: '12px',
                    border: '1px solid #e9d5ff',
                    marginBottom: '20px',
                  }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500, color: '#3498db' }}>
                      Add Video URL (YouTube, Vimeo, etc.)
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: '1px solid #e9d5ff',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                        }}
                      />
                      <button
                        onClick={handleAddVideo}
                        disabled={uploadingVideo || !newVideoUrl.trim()}
                        style={{
                          padding: '10px 20px',
                          background: uploadingVideo ? '#9ca3af' : '#3498db',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: uploadingVideo ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {uploadingVideo ? 'Adding...' : 'Add Video'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Videos List */}
                {videos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-video" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                    <p>No videos added yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {videos.map((video, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: '#fff',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#faf5ff',
                            color: '#3498db',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <i className="fas fa-play-circle"></i>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937' }}>
                              {video.title || `Video ${index + 1}`}
                            </h4>
                            <a 
                              href={video.videoUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ fontSize: '0.8rem', color: '#3498db' }}
                            >
                              {video.videoUrl}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div>
              <h3 style={{ margin: '0 0 20px', color: '#1f2937' }}>
                <i className="fas fa-clipboard-list" style={{ marginRight: '8px', color: '#3498db' }}></i>
                Chapter Quiz
              </h3>

              {/* Quiz Status */}
              <div style={{
                padding: '20px',
                background: quizState.isGenerated ? '#ecfdf5' : '#fef3c7',
                borderRadius: '12px',
                border: quizState.isGenerated ? '1px solid #a7f3d0' : '1px solid #fde68a',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: quizState.isGenerated ? '#10b981' : '#f59e0b',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    <i className={`fas ${quizState.isGenerated ? 'fa-check' : 'fa-exclamation'}`}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: quizState.isGenerated ? '#047857' : '#b45309' }}>
                      {quizState.isGenerated ? 'Quiz Generated' : 'Quiz Not Generated'}
                    </h4>
                    {quizState.isGenerated ? (
                      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                        {quizState.questionsCount} questions • Passing score: {quizState.passingScore}%
                        {quizState.generatedAt && (
                          <span> • Generated: {new Date(quizState.generatedAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    ) : (
                      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                        Add slide content below, then generate the quiz
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Slide Content for AI */}
              <div style={{
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                marginBottom: '24px',
              }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#374151' }}>
                  <i className="fas fa-file-alt" style={{ marginRight: '8px', color: '#3498db' }}></i>
                  Slide Content (Required for Quiz Generation)
                </label>
                
                {/* PDF Upload Section */}
                <div style={{
                  padding: '16px',
                  background: '#e0f2fe',
                  borderRadius: '8px',
                  border: '1px dashed #0284c7',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <i className="fas fa-file-pdf" style={{ marginRight: '8px', color: '#dc2626', fontSize: '1.2rem' }}></i>
                    <span style={{ fontWeight: 600, color: '#0369a1' }}>Upload PDF to Extract Content</span>
                  </div>
                  <p style={{ margin: '0 0 12px', color: '#0369a1', fontSize: '0.85rem' }}>
                    Upload your slide PDF file and we'll automatically extract the text content for quiz generation.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      id="pdf-upload-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      style={{
                        flex: '1',
                        minWidth: '200px',
                        padding: '8px',
                        border: '1px solid #bae6fd',
                        borderRadius: '6px',
                        background: 'white',
                      }}
                    />
                    <button
                      onClick={handleExtractPdfText}
                      disabled={!pdfFile || extractingPdf}
                      style={{
                        padding: '10px 20px',
                        background: pdfFile ? '#0284c7' : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: pdfFile ? 'pointer' : 'not-allowed',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {extractingPdf ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Extracting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic"></i>
                          Extract Text
                        </>
                      )}
                    </button>
                  </div>
                  {pdfFile && (
                    <p style={{ margin: '8px 0 0', color: '#0369a1', fontSize: '0.85rem' }}>
                      <i className="fas fa-check-circle" style={{ marginRight: '6px', color: '#10b981' }}></i>
                      Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  margin: '16px 0',
                  color: '#9ca3af',
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                  <span style={{ padding: '0 16px', fontSize: '0.85rem' }}>OR type/paste content manually</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>

                <textarea
                  value={slideContent}
                  onChange={(e) => setSlideContent(e.target.value)}
                  placeholder="Enter the educational content from your slides...&#10;&#10;Example:&#10;- Photosynthesis is the process by which plants convert sunlight into energy&#10;- The equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2&#10;- Chlorophyll is the green pigment that captures light energy&#10;..."
                  rows={10}
                  disabled={!isTeacher}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: slideContent.length >= 100 ? '#10b981' : '#ef4444' }}>
                    {slideContent.length} characters {slideContent.length < 100 ? '(minimum 100 required)' : '✓'}
                  </span>
                  <button
                    onClick={handleSaveSlideContent}
                    disabled={savingSlideContent || !slideContent.trim()}
                    style={{
                      padding: '10px 20px',
                      background: slideContent.trim() ? '#3498db' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: slideContent.trim() ? 'pointer' : 'not-allowed',
                      fontWeight: 500,
                    }}
                  >
                    {savingSlideContent ? 'Saving...' : 'Save Content'}
                  </button>
                </div>
              </div>

              {/* Quiz Settings */}
              <div style={{
                padding: '20px',
                background: '#faf5ff',
                borderRadius: '12px',
                border: '1px solid #e9d5ff',
                marginBottom: '24px',
              }}>
                <h4 style={{ margin: '0 0 16px', color: '#3498db' }}>
                  <i className="fas fa-cog" style={{ marginRight: '8px' }}></i>
                  Quiz Settings
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={quizSettings.passingScore}
                      onChange={(e) => setQuizSettings({ ...quizSettings, passingScore: parseInt(e.target.value) || 60 })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9d5ff',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                      Max Attempts (0 = unlimited)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quizSettings.maxAttempts}
                      onChange={(e) => setQuizSettings({ ...quizSettings, maxAttempts: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9d5ff',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                      Time Limit (minutes, 0 = no limit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quizSettings.timeLimit}
                      onChange={(e) => setQuizSettings({ ...quizSettings, timeLimit: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e9d5ff',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {!quizState.isGenerated ? (
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz || slideContent.length < 100}
                    style={{
                      padding: '14px 32px',
                      background: slideContent.length >= 100 
                        ? 'linear-gradient(135deg, #3498db 0%, #2c3e50 100%)'
                        : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: slideContent.length >= 100 ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: slideContent.length >= 100 ? '0 4px 15px #3498db' : 'none',
                    }}
                  >
                    {generatingQuiz ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Generating Quiz (this may take a moment)...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic"></i>
                        Generate Quiz with AI
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleRegenerateQuiz}
                      disabled={generatingQuiz || slideContent.length < 100}
                      style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {generatingQuiz ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sync-alt"></i>
                          Regenerate Quiz
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleOpenQuizPreview}
                      style={{
                        padding: '14px 28px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i className="fas fa-eye"></i>
                      Preview Quiz
                    </button>
                  </>
                )}
              </div>

              {/* Instructions */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#eff6ff',
                borderRadius: '10px',
                border: '1px solid #bfdbfe',
              }}>
                <h5 style={{ margin: '0 0 10px', color: '#1d4ed8', fontSize: '0.9rem' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                  How Quiz Generation Works
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.7' }}>
                  <li>AI generates 20 multiple-choice questions from your slide content</li>
                  <li>Questions vary in difficulty: 30% easy, 50% medium, 20% hard</li>
                  <li>Students must complete all lectures before taking the quiz</li>
                  <li>Each question has 4 options with one correct answer</li>
                  <li>Quiz results show correct answers and explanations</li>
                </ul>
              </div>
            </div>
          )}

          {/* Additional Details Tab */}
          {activeTab === 'details' && (
            <div>
              <h3 style={{ margin: '0 0 16px', color: '#1f2937' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#10b981' }}></i>
                Additional Details
              </h3>

              {/* Additional Text/Notes */}
              <div style={{
                padding: '20px',
                background: '#ecfdf5',
                borderRadius: '12px',
                border: '1px solid #a7f3d0',
                marginBottom: '20px',
              }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500, color: '#047857' }}>
                  Additional Notes & Explanations
                </label>
                <textarea
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  placeholder="Add extra explanations, study tips, or resources..."
                  rows={6}
                  disabled={!isTeacher}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    backgroundColor: isTeacher ? '#fff' : '#f3f4f6',
                  }}
                />
              </div>

              {/* Additional Video Links */}
              <div style={{
                padding: '20px',
                background: '#eff6ff',
                borderRadius: '12px',
                border: '1px solid #bfdbfe',
                marginBottom: '20px',
              }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500, color: '#1d4ed8' }}>
                  Additional Video Resources
                </label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Add another video URL..."
                    disabled={!isTeacher}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setAdditionalVideos([...additionalVideos, { url: e.target.value.trim(), title: `Resource ${additionalVideos.length + 1}` }]);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                {additionalVideos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {additionalVideos.map((video, index) => (
                      <div key={index} style={{
                        padding: '8px 12px',
                        background: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <i className="fas fa-link" style={{ color: '#1d4ed8' }}></i>
                        <span>{video.title || video.url}</span>
                        {isTeacher && (
                          <button
                            onClick={() => setAdditionalVideos(additionalVideos.filter((_, i) => i !== index))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isTeacher && (
                <button
                  onClick={handleSaveDetails}
                  disabled={savingDetails}
                  style={{
                    padding: '12px 24px',
                    background: savingDetails ? '#9ca3af' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: savingDetails ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                  }}
                >
                  {savingDetails ? 'Saving...' : 'Save Details'}
                </button>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <h3 style={{ margin: '0 0 16px', color: '#1f2937' }}>
                <i className="fas fa-users" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                Enrolled Students ({students.length})
              </h3>

              {loadingStudents ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '16px', display: 'block' }}></i>
                  <p>Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                  <p>No students enrolled in this course yet.</p>
                </div>
              ) : (
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 120px 110px',
                    padding: '14px 16px',
                    background: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#374151',
                  }}>
                    <div>Student Name</div>
                    <div>Email</div>
                    <div>Status</div>
                    <div>Quiz Grade</div>
                  </div>
                  
                  {/* Table Body */}
                  {students.map((student, index) => {
                    const status = getStatusBadge(student.status);
                    return (
                      <div
                        key={student._id || index}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 120px 110px',
                          padding: '14px 16px',
                          borderBottom: index < students.length - 1 ? '1px solid #f3f4f6' : 'none',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                          }}>
                            {student.firstName?.charAt(0) || 'S'}
                          </div>
                          <span style={{ fontWeight: 500, color: '#1f2937' }}>
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                          {student.email || 'N/A'}
                        </div>
                        <div>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: status.bg,
                            color: status.color,
                          }}>
                            {status.text}
                          </span>
                        </div>
                        <div style={{ fontWeight: 500, color: '#374151' }}>
                          {typeof student.quizScore === 'number' ? `${student.quizScore}%` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    {isQuizPreviewOpen && (
      <div
        onClick={() => setIsQuizPreviewOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#111827' }}>
              <i className="fas fa-eye" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
              Preview & Edit Quiz Questions
            </h3>
            <button
              onClick={() => setIsQuizPreviewOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {quizQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
              <p style={{ margin: 0 }}>No quiz questions available. Generate a quiz first.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {quizQuestions.map((q, qIndex) => (
                <div
                  key={`quiz-question-${qIndex}`}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    background: '#f9fafb',
                  }}
                >
                  <div style={{ marginBottom: '12px', fontWeight: 600, color: '#1f2937' }}>
                    Question {qIndex + 1}
                  </div>
                  <textarea
                    value={q.question}
                    onChange={(e) => handleQuizQuestionChange(qIndex, e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      padding: '10px 12px',
                      fontSize: '0.95rem',
                      marginBottom: '12px',
                    }}
                  />
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {q.options.map((opt, optIndex) => (
                      <div key={`quiz-option-${qIndex}-${optIndex}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '24px', fontWeight: 600, color: '#374151' }}>
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleQuizOptionChange(qIndex, optIndex, e.target.value)}
                          style={{
                            flex: 1,
                            borderRadius: '10px',
                            border: '1px solid #d1d5db',
                            padding: '8px 10px',
                            fontSize: '0.95rem',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>
                      Correct Answer
                    </label>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => handleQuizCorrectAnswerChange(qIndex, e.target.value)}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        padding: '6px 10px',
                      }}
                    >
                      <option value={0}>A</option>
                      <option value={1}>B</option>
                      <option value={2}>C</option>
                      <option value={3}>D</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => setIsQuizPreviewOpen(false)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuizPreview}
              disabled={savingQuizPreview || quizQuestions.length === 0}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: savingQuizPreview ? '#93c5fd' : '#3b82f6',
                color: '#fff',
                cursor: savingQuizPreview ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {savingQuizPreview ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ChapterDetail;
