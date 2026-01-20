import React, { useState, useEffect } from 'react';
import './ChapterEditor.css';
import { API_CONFIG } from '../../../config/api.config';

const API_BASE = API_CONFIG.BASE_URL;

function ChapterEditor({ chapter: initialChapter, courseId, onUpdate, onClose }) {
  const [activeTab, setActiveTab] = useState('slides');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [chapter, setChapter] = useState(initialChapter);
  
  // Slides state
  const [slideContent, setSlideContent] = useState('');
  const [slideFiles, setSlideFiles] = useState([]);
  
  // Lectures state
  const [lectures, setLectures] = useState([]);
  const [newLecture, setNewLecture] = useState({ title: '', videoUrl: '' });
  
  // Resources state (images, files, text)
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ type: 'file', title: '', url: '', content: '' });
  
  // Quiz state
  const [quizSettings, setQuizSettings] = useState({
    passingScore: 60,
    maxAttempts: 0,
    timeLimit: 0
  });
  
  const token = localStorage.getItem('token');
  
  // Fetch full chapter data on mount
  useEffect(() => {
    const fetchChapterData = async () => {
      setInitialLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/chapters/${initialChapter._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch chapter details');
        }
        
        const data = await res.json();
        setChapter(data);
        setSlideContent(data.slideContent || '');
        setSlideFiles(data.slides || []);
        setLectures(data.lectures || []);
        setResources(data.resources || []);
        setQuizSettings({
          passingScore: data.quiz?.passingScore || 60,
          maxAttempts: data.quiz?.maxAttempts || 0,
          timeLimit: data.quiz?.timeLimit || 0
        });
      } catch (err) {
        console.error('Error fetching chapter:', err);
        // Fall back to initial chapter data
        setSlideContent(initialChapter.slideContent || '');
        setSlideFiles(initialChapter.slides || []);
        setLectures(initialChapter.lectures || []);
        setResources(initialChapter.resources || []);
        setQuizSettings({
          passingScore: initialChapter.quiz?.passingScore || 60,
          maxAttempts: initialChapter.quiz?.maxAttempts || 0,
          timeLimit: initialChapter.quiz?.timeLimit || 0
        });
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchChapterData();
  }, [initialChapter._id, token]);
  
  // Save slides content
  const handleSaveSlides = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/chapters/${chapter._id}/slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slideContent,
          slides: slideFiles,
          resources
        })
      });
      
      if (!res.ok) throw new Error('Failed to save slides');
      
      setMessage('Content saved successfully!');
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage('Error saving: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Add lecture
  const handleAddLecture = async () => {
    if (!newLecture.title || !newLecture.videoUrl) {
      setMessage('Please enter lecture title and video URL');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/chapters/${chapter._id}/lectures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lectures: [newLecture]
        })
      });
      
      if (!res.ok) throw new Error('Failed to add lecture');
      
      const updated = await res.json();
      setLectures(updated.lectures || []);
      setNewLecture({ title: '', videoUrl: '' });
      setMessage('Lecture added successfully!');
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage('Error adding lecture: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate quiz
  const handleGenerateQuiz = async () => {
    if (!slideContent || slideContent.trim().length < 100) {
      setMessage('Please add slide content (at least 100 characters) before generating a quiz');
      return;
    }
    
    setLoading(true);
    setMessage('Generating quiz questions using AI... This may take a moment.');
    try {
      const res = await fetch(`${API_BASE}/api/quiz/generate/${chapter._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quizSettings)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to generate quiz');
      
      setMessage(`Quiz generated successfully! ${data.questionsCount} questions created.`);
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage('Error generating quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Regenerate quiz
  const handleRegenerateQuiz = async () => {
    if (!window.confirm('This will create new quiz questions. Students who already passed will not be affected. Continue?')) {
      return;
    }
    
    setLoading(true);
    setMessage('Regenerating quiz questions...');
    try {
      const res = await fetch(`${API_BASE}/api/quiz/regenerate/${chapter._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to regenerate quiz');
      
      setMessage(`Quiz regenerated! ${data.questionsCount} new questions.`);
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage('Error regenerating quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (initialLoading) {
    return (
      <div className="chapter-editor-overlay">
        <div className="chapter-editor-modal">
          <div className="chapter-editor-header">
            <h2>
              <i className="fas fa-book-open"></i>
              Loading Chapter...
            </h2>
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="chapter-editor-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#3498db', marginBottom: '15px', display: 'block' }}></i>
              <p>Loading chapter data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chapter-editor-overlay">
      <div className="chapter-editor-modal">
        <div className="chapter-editor-header">
          <h2>
            <i className="fas fa-book-open"></i>
            {chapter.title} - Chapter {chapter.chapterNumber}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {message && (
          <div className={`chapter-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="chapter-editor-tabs">
          <button 
            className={activeTab === 'slides' ? 'active' : ''} 
            onClick={() => setActiveTab('slides')}
          >
            <i className="fas fa-file-powerpoint"></i> Slides
          </button>
          <button 
            className={activeTab === 'lectures' ? 'active' : ''} 
            onClick={() => setActiveTab('lectures')}
          >
            <i className="fas fa-video"></i> Videos
          </button>
          <button 
            className={activeTab === 'resources' ? 'active' : ''} 
            onClick={() => setActiveTab('resources')}
          >
            <i className="fas fa-folder-open"></i> Resources
          </button>
          <button 
            className={activeTab === 'quiz' ? 'active' : ''} 
            onClick={() => setActiveTab('quiz')}
          >
            <i className="fas fa-question-circle"></i> Quiz
          </button>
        </div>
        
        <div className="chapter-editor-content">
          {/* Slides Tab */}
          {activeTab === 'slides' && (
            <div className="slides-section">
              <h3><i className="fas fa-file-powerpoint"></i> Chapter Slides & Content</h3>
              <p className="section-description">
                Add your slide content here. This text will be used by AI to generate quiz questions.
                You can paste the text from your PowerPoint or PDF slides.
              </p>
              
              <div className="slides-upload-area">
                <div className="upload-info">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>Paste your slide content below or provide file URLs</p>
                </div>
              </div>
              
              <div className="form-group">
                <label><i className="fas fa-align-left"></i> Slide Content (Text)</label>
                <textarea
                  value={slideContent}
                  onChange={(e) => setSlideContent(e.target.value)}
                  placeholder="Paste your slide content here... Include all important concepts, definitions, formulas, and key points that students should learn from this chapter.

Example:
Chapter 1: Introduction to Variables

A variable is a symbolic name for a value that can change.
Types of variables:
- Integer: whole numbers
- Float: decimal numbers
- String: text data
- Boolean: true/false values

Key concepts:
1. Variable declaration
2. Variable assignment
3. Variable scope..."
                  rows={18}
                />
                <div className="textarea-footer">
                  <span className={`char-count ${slideContent.length >= 100 ? 'good' : 'warning'}`}>
                    <i className={`fas ${slideContent.length >= 100 ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    {slideContent.length} characters 
                    {slideContent.length < 100 && ' (minimum 100 for quiz generation)'}
                    {slideContent.length >= 100 && ' ✓ Ready for quiz generation'}
                  </span>
                </div>
              </div>
              
              <div className="slide-files-section">
                <h4><i className="fas fa-file-upload"></i> Slide File URLs (Optional)</h4>
                <p className="section-hint">Add URLs to your slide files hosted on Google Drive, Dropbox, etc.</p>
                <div className="file-url-input">
                  <input
                    type="text"
                    placeholder="Paste slide file URL (PDF, PPTX, etc.)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setSlideFiles([...slideFiles, { 
                          fileUrl: e.target.value.trim(), 
                          fileName: `Slide File ${slideFiles.length + 1}`,
                          uploadedAt: new Date()
                        }]);
                        e.target.value = '';
                      }
                    }}
                  />
                  <span className="hint">Press Enter to add</span>
                </div>
                {slideFiles.length > 0 && (
                  <div className="file-list">
                    {slideFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <i className="fas fa-file-pdf"></i>
                        <span>{file.fileName}</span>
                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                          <i className="fas fa-external-link-alt"></i>
                        </a>
                        <button onClick={() => setSlideFiles(slideFiles.filter((_, i) => i !== index))}>
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                className="save-btn" 
                onClick={handleSaveSlides}
                disabled={loading}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                ) : (
                  <><i className="fas fa-save"></i> Save Slides</>
                )}
              </button>
            </div>
          )}
          
          {/* Lectures Tab */}
          {activeTab === 'lectures' && (
            <div className="lectures-section">
              <h3><i className="fas fa-video"></i> Chapter Videos</h3>
              <p className="section-description">
                Add video lectures for this chapter. You can add YouTube, Vimeo, or any direct video URL.
              </p>
              
              <div className="add-lecture-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Video Title</label>
                    <input
                      type="text"
                      value={newLecture.title}
                      onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                      placeholder="e.g., Introduction to Chapter Concepts"
                    />
                  </div>
                  <div className="form-group">
                    <label>Video URL</label>
                    <input
                      type="text"
                      value={newLecture.videoUrl}
                      onChange={(e) => setNewLecture({ ...newLecture, videoUrl: e.target.value })}
                      placeholder="YouTube, Vimeo, or direct video URL"
                    />
                  </div>
                </div>
                <button 
                  className="add-btn"
                  onClick={handleAddLecture}
                  disabled={loading}
                >
                  <i className="fas fa-plus"></i> Add Video
                </button>
              </div>
              
              <div className="lectures-list">
                <h4><i className="fas fa-list"></i> Added Videos ({lectures.length})</h4>
                {lectures.length === 0 ? (
                  <p className="empty-message">No videos added yet. Add your first video above.</p>
                ) : (
                  lectures.map((lecture, index) => (
                    <div key={index} className="lecture-item">
                      <div className="lecture-icon">
                        <i className="fas fa-play-circle"></i>
                      </div>
                      <div className="lecture-info">
                        <span className="lecture-title">{lecture.title || `Video ${index + 1}`}</span>
                        <span className="lecture-url">{lecture.videoUrl}</span>
                      </div>
                      <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" className="preview-btn">
                        <i className="fas fa-external-link-alt"></i> Preview
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="resources-section">
              <h3><i className="fas fa-folder-open"></i> Additional Resources</h3>
              <p className="section-description">
                Add supplementary materials like images, PDF files, documents, or additional text content for this chapter.
              </p>
              
              <div className="resource-type-selector">
                <label>Resource Type:</label>
                <div className="type-buttons">
                  <button 
                    className={newResource.type === 'image' ? 'active' : ''}
                    onClick={() => setNewResource({ ...newResource, type: 'image' })}
                  >
                    <i className="fas fa-image"></i> Image
                  </button>
                  <button 
                    className={newResource.type === 'file' ? 'active' : ''}
                    onClick={() => setNewResource({ ...newResource, type: 'file' })}
                  >
                    <i className="fas fa-file-pdf"></i> File/PDF
                  </button>
                  <button 
                    className={newResource.type === 'text' ? 'active' : ''}
                    onClick={() => setNewResource({ ...newResource, type: 'text' })}
                  >
                    <i className="fas fa-align-left"></i> Text
                  </button>
                  <button 
                    className={newResource.type === 'link' ? 'active' : ''}
                    onClick={() => setNewResource({ ...newResource, type: 'link' })}
                  >
                    <i className="fas fa-link"></i> Link
                  </button>
                </div>
              </div>
              
              <div className="add-resource-form">
                <div className="form-group">
                  <label>Title / Description</label>
                  <input
                    type="text"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    placeholder="e.g., Chapter Diagram, Reference PDF"
                  />
                </div>
                
                {(newResource.type === 'image' || newResource.type === 'file' || newResource.type === 'link') && (
                  <div className="form-group">
                    <label>{newResource.type === 'link' ? 'URL' : 'File URL'}</label>
                    <input
                      type="text"
                      value={newResource.url}
                      onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                      placeholder={newResource.type === 'image' ? 'Image URL (e.g., imgur, drive)' : 
                                   newResource.type === 'file' ? 'PDF/Document URL (e.g., drive, dropbox)' :
                                   'External link URL'}
                    />
                  </div>
                )}
                
                {newResource.type === 'text' && (
                  <div className="form-group">
                    <label>Content</label>
                    <textarea
                      value={newResource.content}
                      onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                      placeholder="Additional notes, explanations, or instructions..."
                      rows={5}
                    />
                  </div>
                )}
                
                <button 
                  className="add-btn"
                  onClick={() => {
                    if (!newResource.title) {
                      setMessage('Please enter a title for the resource');
                      return;
                    }
                    setResources([...resources, { ...newResource, id: Date.now() }]);
                    setNewResource({ type: newResource.type, title: '', url: '', content: '' });
                    setMessage('Resource added! (Note: Save slides to persist resources)');
                  }}
                >
                  <i className="fas fa-plus"></i> Add Resource
                </button>
              </div>
              
              <div className="resources-list">
                <h4><i className="fas fa-list"></i> Added Resources ({resources.length})</h4>
                {resources.length === 0 ? (
                  <p className="empty-message">No additional resources added yet.</p>
                ) : (
                  resources.map((resource, index) => (
                    <div key={resource.id || index} className="resource-item">
                      <div className="resource-icon">
                        <i className={`fas ${
                          resource.type === 'image' ? 'fa-image' :
                          resource.type === 'file' ? 'fa-file-pdf' :
                          resource.type === 'text' ? 'fa-align-left' :
                          'fa-link'
                        }`}></i>
                      </div>
                      <div className="resource-info">
                        <span className="resource-title">{resource.title}</span>
                        <span className="resource-type">{resource.type}</span>
                      </div>
                      {resource.url && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="preview-btn">
                          <i className="fas fa-external-link-alt"></i>
                        </a>
                      )}
                      <button 
                        className="remove-btn"
                        onClick={() => setResources(resources.filter((_, i) => i !== index))}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <button 
                className="save-btn" 
                onClick={handleSaveSlides}
                disabled={loading}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                ) : (
                  <><i className="fas fa-save"></i> Save Resources</>
                )}
              </button>
            </div>
          )}
          
          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="quiz-section">
              <h3>Chapter Quiz</h3>
              <p className="section-description">
                Generate an AI-powered quiz from your slide content. Students must score 60% or higher to unlock the next chapter.
              </p>
              
              <div className="quiz-status">
                {chapter.quiz?.isGenerated ? (
                  <div className="quiz-generated">
                    <i className="fas fa-check-circle"></i>
                    <span>Quiz Generated - {chapter.quiz.questions?.length || 20} questions</span>
                  </div>
                ) : (
                  <div className="quiz-not-generated">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>Quiz not yet generated</span>
                  </div>
                )}
              </div>
              
              <div className="quiz-settings">
                <h4>Quiz Settings</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Passing Score (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quizSettings.passingScore}
                      onChange={(e) => setQuizSettings({ ...quizSettings, passingScore: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Attempts (0 = unlimited)</label>
                    <input
                      type="number"
                      min="0"
                      value={quizSettings.maxAttempts}
                      onChange={(e) => setQuizSettings({ ...quizSettings, maxAttempts: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Limit (minutes, 0 = none)</label>
                    <input
                      type="number"
                      min="0"
                      value={quizSettings.timeLimit}
                      onChange={(e) => setQuizSettings({ ...quizSettings, timeLimit: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="quiz-actions">
                {!chapter.quiz?.isGenerated ? (
                  <button 
                    className="generate-btn"
                    onClick={handleGenerateQuiz}
                    disabled={loading || slideContent.length < 100}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic"></i> Generate Quiz with AI
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    className="regenerate-btn"
                    onClick={handleRegenerateQuiz}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Regenerating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sync"></i> Regenerate Quiz
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {slideContent.length < 100 && (
                <p className="warning-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  Please add at least 100 characters of slide content in the Slides tab before generating a quiz.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChapterEditor;
