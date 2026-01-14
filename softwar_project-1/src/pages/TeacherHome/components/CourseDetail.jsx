// src/pages/TeacherHome/components/CourseDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import ChapterDetail from './ChapterDetail';

function CourseDetail({ courseId, courseTitle, onClose, isTeacher = true }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchedVideos, setWatchedVideos] = useState({ urls: [], uploaded: [] });
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userId, setUserId] = useState(null);
  const videoRefs = useRef({});
  
  // Chapter states
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDescription, setNewChapterDescription] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);

  useEffect(() => {
    // Get user ID from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUserId(userData._id || userData.id);
      }
    } catch (e) {
      console.error('Error getting user ID:', e);
    }
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        // For students, fetch course with progress
        if (!isTeacher && userId) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}/progress?studentId=${userId}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            setCourse(data);
            setProgress(data.progress || 0);
            setIsCompleted(data.isCompleted || false);
            if (data.studentVideoProgress) {
              setWatchedVideos({
                urls: data.studentVideoProgress.watchedVideoUrls || [],
                uploaded: data.studentVideoProgress.watchedUploadedVideos || [],
              });
            }
          } else {
            // Fallback to regular fetch
            const fallbackRes = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            if (fallbackRes.ok) {
              const data = await fallbackRes.json();
              setCourse(data);
            }
          }
        } else {
          // Teacher view - just fetch course
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            setCourse(data);
          } else {
            console.error('Failed to fetch course:', res.status);
          }
        }
      } catch (err) {
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, isTeacher, userId]);

  // Fetch chapters for the course
  useEffect(() => {
    const fetchChapters = async () => {
      if (!courseId) return;
      
      setLoadingChapters(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/chapters/course/${courseId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          // Backend returns { chapters: [], courseProgress: {} }
          setChapters(data.chapters || data || []);
        }
      } catch (err) {
        console.error('Error fetching chapters:', err);
      } finally {
        setLoadingChapters(false);
      }
    };

    fetchChapters();
  }, [courseId]);

  // Add new chapter
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) {
      alert('Please enter a chapter title');
      return;
    }

    setAddingChapter(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/chapters/course/${courseId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newChapterTitle.trim(),
            description: newChapterDescription.trim(),
            chapterNumber: chapters.length + 1,
          }),
        }
      );

      if (res.ok) {
        const newChapter = await res.json();
        setChapters(prev => [...prev, newChapter]);
        setNewChapterTitle('');
        setNewChapterDescription('');
        setShowAddChapter(false);
        alert('Chapter added successfully!');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to add chapter');
      }
    } catch (err) {
      console.error('Error adding chapter:', err);
      alert('Failed to add chapter');
    } finally {
      setAddingChapter(false);
    }
  };

  // Helper to get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    try {
      if (!url) return null;
      const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const match = url.match(ytRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Check if video is watched
  const isVideoWatched = (videoUrl, type) => {
    if (type === 'url') {
      return watchedVideos.urls.includes(videoUrl);
    }
    return watchedVideos.uploaded.includes(videoUrl);
  };

  // Mark video as watched
  const markVideoWatched = async (videoUrl, videoType) => {
    if (!userId || isTeacher) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}/watch-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: userId,
          videoUrl,
          videoType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWatchedVideos({
          urls: data.watchedVideoUrls || [],
          uploaded: data.watchedUploadedVideos || [],
        });
        setProgress(data.progress || 0);
        
        if (data.isCompleted && !isCompleted) {
          setIsCompleted(true);
          alert(`🎉 Congratulations! You have completed "${course?.title}"!`);
        }
      }
    } catch (err) {
      console.error('Error marking video as watched:', err);
    }
  };

  // Handle video ended event
  const handleVideoEnded = (videoUrl, videoType) => {
    if (!isVideoWatched(videoUrl, videoType)) {
      markVideoWatched(videoUrl, videoType);
    }
  };

  if (loading) {
    return (
      <div className="course-detail-modal">
        <div className="course-detail-content">
          <p style={{ textAlign: 'center', padding: '40px' }}>Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-modal">
        <div className="course-detail-content">
          <p style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>Course not found</p>
          {onClose && (
            <button onClick={onClose} style={{ display: 'block', margin: '0 auto' }}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasVideos = (course.videoUrls && course.videoUrls.length > 0) || 
                    (course.uploadedVideos && course.uploadedVideos.length > 0);

  return (
    <div className="course-detail-modal">
      <div className="course-detail-content" style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>
              {course.title || courseTitle}
            </h2>
            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
              {course.subject} • {course.grade}
            </p>
            {course.teacher && (
              <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>
                Teacher: {course.teacher.firstName} {course.teacher.lastName}
              </p>
            )}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              title="Go Back"
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
          )}
        </div>

        {/* Progress Bar - Only for students */}
        {!isTeacher && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>Course Progress</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#007bff' }}>{progress}%</span>
            </div>
            <div style={{ 
              height: '10px', 
              background: '#e5e7eb', 
              borderRadius: '5px', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: isCompleted ? '#16a34a' : '#007bff',
                borderRadius: '5px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            {isCompleted && (
              <div style={{ 
                marginTop: '10px', 
                padding: '8px 12px', 
                background: '#dcfce7', 
                borderRadius: '8px',
                display: 'inline-block'
              }}>
                <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
                  ✓ Course Completed
                </span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {course.description && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#374151' }}>Description</h3>
            <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6 }}>{course.description}</p>
          </div>
        )}

        {/* Chapters Section - Always visible for managing chapters */}
        <div style={{ marginBottom: '20px', padding: '20px', background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#3498db' }}>
              <i className="fas fa-layer-group" style={{ marginRight: '8px' }}></i>
              Chapters ({chapters.length})
            </h3>
            {isTeacher && (
              <button
                onClick={() => setShowAddChapter(!showAddChapter)}
                style={{
                  padding: '8px 16px',
                  background: showAddChapter ? '#dc2626' : 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className={`fas ${showAddChapter ? 'fa-times' : 'fa-plus'}`}></i>
                {showAddChapter ? 'Cancel' : 'Add Chapter'}
              </button>
            )}
          </div>

          {/* Add Chapter Form */}
          {showAddChapter && isTeacher && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '16px', 
                background: '#fff', 
                borderRadius: '10px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
                    Chapter Title *
                  </label>
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="Enter chapter title"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={newChapterDescription}
                    onChange={(e) => setNewChapterDescription(e.target.value)}
                    placeholder="Enter chapter description"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <button
                  onClick={handleAddChapter}
                  disabled={addingChapter}
                  style={{
                    padding: '10px 20px',
                    background: addingChapter ? '#9ca3af' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: addingChapter ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {addingChapter ? 'Adding...' : 'Add Chapter'}
                </button>
              </div>
            )}

            {/* Chapters List as Buttons */}
            {loadingChapters ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                Loading chapters...
              </div>
            ) : chapters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                <i className="fas fa-book-open" style={{ fontSize: '28px', marginBottom: '10px', display: 'block' }}></i>
                <p style={{ margin: 0 }}>No chapters yet.</p>
                {isTeacher && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>
                    Click "Add Chapter" to create your first chapter.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter._id || index}
                    onClick={() => {
                      setSelectedChapter(chapter);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 18px',
                      background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }}
                  >
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}>
                      {chapter.chapterNumber || index + 1}
                    </span>
                    <span>{chapter.title || `Chapter ${chapter.chapterNumber || index + 1}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        {/* Zoom Link */}
        {course.zoomLink && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#1e40af' }}>
              <i className="fas fa-video" style={{ marginRight: '8px' }}></i>
              Live Session
            </h3>
            <a 
              href={course.zoomLink} 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
            >
              Join Zoom Meeting
            </a>
          </div>
        )}

        {/* Close button at bottom */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '12px 32px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Chapter Detail Modal */}
      {selectedChapter && (
        <ChapterDetail
          chapter={selectedChapter}
          courseId={courseId}
          onClose={() => setSelectedChapter(null)}
          isTeacher={isTeacher}
        />
      )}
    </div>
  );
}

export default CourseDetail;
