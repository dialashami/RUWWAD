import React, { useState, useEffect } from 'react';
import ChapterEditor from './ChapterEditor';
import './CourseChaptersManager.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || window.location.origin;

function CourseChaptersManager({ course, onBack }) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [message, setMessage] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  
  const token = localStorage.getItem('token');
  
  // Fetch chapters for this course
  const fetchChapters = async () => {
    setLoading(true);
    setMessage('');
    try {
      const courseId = course.id || course._id;
      console.log('Fetching chapters for course:', courseId);
      
      const res = await fetch(`${API_BASE}/api/chapters/course/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Chapters response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch chapters (${res.status})`);
      }
      
      const data = await res.json();
      console.log('Chapters data:', data);
      setChapters(data.chapters || []);
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setMessage('Error loading chapters: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (course) {
      fetchChapters();
    }
  }, [course]);
  
  // Add new chapter
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) {
      setMessage('Please enter a chapter title');
      return;
    }
    
    setAddingChapter(true);
    setMessage('');
    try {
      const courseId = course.id || course._id;
      const res = await fetch(`${API_BASE}/api/chapters/course/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newChapterTitle,
          chapterNumber: chapters.length + 1
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create chapter');
      }
      
      const newChapter = await res.json();
      setChapters([...chapters, newChapter]);
      setNewChapterTitle('');
      setMessage('Chapter added successfully!');
      
      // Automatically open the new chapter for editing
      setSelectedChapter(newChapter);
    } catch (err) {
      setMessage('Error adding chapter: ' + err.message);
    } finally {
      setAddingChapter(false);
    }
  };
  
  const getChapterStatus = (chapter) => {
    const hasSlides = chapter.hasSlideContent || (chapter.slideContentLength && chapter.slideContentLength > 100);
    const hasLectures = chapter.lectures && chapter.lectures.length > 0;
    const hasQuiz = chapter.quiz?.isGenerated;
    
    if (hasSlides && hasLectures && hasQuiz) return 'complete';
    if (hasSlides || hasLectures) return 'in-progress';
    return 'empty';
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'complete': return { icon: 'fa-check-circle', color: '#10b981', text: 'Complete' };
      case 'in-progress': return { icon: 'fa-clock', color: '#f59e0b', text: 'In Progress' };
      default: return { icon: 'fa-circle', color: '#9ca3af', text: 'Not Started' };
    }
  };
  
  return (
    <div className="course-chapters-manager">
      {/* Header */}
      <div className="manager-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Courses
        </button>
        <div className="course-info">
          <h2><i className="fas fa-book"></i> {course.title}</h2>
          <p>
            <span><i className="fas fa-layer-group"></i> {chapters.length} Chapter{chapters.length !== 1 ? 's' : ''}</span>
            <span><i className="fas fa-book-open"></i> {course.subject}</span>
            <span><i className="fas fa-graduation-cap"></i> {course.grade}</span>
          </p>
        </div>
      </div>
      
      {/* Message */}
      {message && (
        <div className={`manager-message ${message.includes('Error') ? 'error' : 'success'}`}>
          <i className={`fas ${message.includes('Error') ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
          {message}
          <button onClick={() => setMessage('')}><i className="fas fa-times"></i></button>
        </div>
      )}
      
      {/* Instructions */}
      <div className="chapters-guide">
        <h3><i className="fas fa-info-circle"></i> How to Set Up Your Course</h3>
        <div className="guide-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <strong>Add Slides</strong>
              <p>Paste your slide content (text from PowerPoint/PDF)</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <strong>Add Lectures</strong>
              <p>Upload video URLs for each chapter</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <strong>Generate Quiz</strong>
              <p>AI creates 20 questions from your slides</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Chapter Section */}
      <div className="add-chapter-section">
        <h3><i className="fas fa-plus-circle"></i> Add New Chapter</h3>
        <div className="add-chapter-form">
          <input
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="Enter chapter title (e.g., Introduction to Variables)"
            onKeyPress={(e) => e.key === 'Enter' && handleAddChapter()}
          />
          <button 
            onClick={handleAddChapter}
            disabled={addingChapter || !newChapterTitle.trim()}
            className="add-chapter-btn"
          >
            {addingChapter ? (
              <><i className="fas fa-spinner fa-spin"></i> Adding...</>
            ) : (
              <><i className="fas fa-plus"></i> Add Chapter</>
            )}
          </button>
        </div>
      </div>
      
      {/* Chapters List */}
      <div className="chapters-section">
        <h3><i className="fas fa-list"></i> Course Chapters</h3>
        
        {loading ? (
          <div className="loading-container">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Loading chapters...</span>
          </div>
        ) : chapters.length === 0 ? (
          <div className="no-chapters">
            <i className="fas fa-book-open"></i>
            <h4>No Chapters Yet</h4>
            <p>Start by adding your first chapter above.</p>
          </div>
        ) : (
          <div className="chapters-list">
            {chapters.map((chapter, index) => {
              const status = getChapterStatus(chapter);
              const statusInfo = getStatusLabel(status);
              
              return (
                <div 
                  key={chapter._id || index} 
                  className={`chapter-item ${status}`}
                  onClick={() => setSelectedChapter(chapter)}
                >
                  <div className="chapter-number-badge">
                    {chapter.chapterNumber || index + 1}
                  </div>
                  
                  <div className="chapter-info">
                    <h4>{chapter.title || `Chapter ${chapter.chapterNumber || index + 1}`}</h4>
                    <div className="chapter-meta">
                      <span className="status-badge" style={{ color: statusInfo.color }}>
                        <i className={`fas ${statusInfo.icon}`}></i> {statusInfo.text}
                      </span>
                      <span className="detail">
                        <i className="fas fa-file-alt"></i>
                        {chapter.hasSlideContent || chapter.slideContentLength > 100 ? 'Slides ✓' : 'No Slides'}
                      </span>
                      <span className="detail">
                        <i className="fas fa-video"></i>
                        {chapter.lectures?.length || 0} Video{chapter.lectures?.length !== 1 ? 's' : ''}
                      </span>
                      <span className="detail">
                        <i className="fas fa-question-circle"></i>
                        {chapter.quiz?.isGenerated ? 'Quiz ✓' : 'No Quiz'}
                      </span>
                    </div>
                  </div>
                  
                  <button className="edit-btn">
                    <i className="fas fa-edit"></i> Edit
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Chapter Editor Modal */}
      {selectedChapter && (
        <ChapterEditor
          chapter={selectedChapter}
          courseId={course.id || course._id}
          onUpdate={() => {
            fetchChapters();
          }}
          onClose={() => setSelectedChapter(null)}
        />
      )}
    </div>
  );
}

export default CourseChaptersManager;
