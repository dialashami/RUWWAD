// src/pages/TeacherHome/components/CourseDetail.jsx
import React, { useState, useEffect } from 'react';

function CourseDetail({ courseId, courseTitle, onClose, isTeacher = true }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Course detail loaded:', data);
          console.log('Course videoUrls:', data.videoUrls);
          console.log('Course uploadedVideos:', data.uploadedVideos);
          setCourse(data);
        } else {
          console.error('Failed to fetch course:', res.status);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

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
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Description */}
        {course.description && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#374151' }}>Description</h3>
            <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6 }}>{course.description}</p>
          </div>
        )}

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

        {/* Videos Section */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#1f2937' }}>
            <i className="fas fa-play-circle" style={{ marginRight: '8px', color: '#8b5cf6' }}></i>
            Course Videos
          </h3>

          {!hasVideos ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: '#f9fafb', 
              borderRadius: '12px',
              color: '#9ca3af'
            }}>
              <i className="fas fa-film" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
              <p style={{ margin: 0 }}>No videos available for this course yet.</p>
              {isTeacher && (
                <p style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>
                  Click "Add Videos" on the course card to add videos.
                </p>
              )}
            </div>
          ) : (
            <div>
              {/* Online Video URLs */}
              {course.videoUrls && course.videoUrls.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  {course.videoUrls.map((url, index) => {
                    const embedUrl = getYouTubeEmbedUrl(url);
                    return (
                      <div
                        key={index}
                        style={{
                          marginBottom: '16px',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          background: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: embedUrl ? '12px' : 0 }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>
                            Video {index + 1}
                          </span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}
                          >
                            <i className="fas fa-external-link-alt" style={{ marginRight: '4px' }}></i>
                            Open in new tab
                          </a>
                        </div>
                        {embedUrl && (
                          <iframe
                            width="100%"
                            height="315"
                            src={embedUrl}
                            title={`Video ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ borderRadius: '8px', border: 'none' }}
                          ></iframe>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Uploaded Videos */}
              {course.uploadedVideos && course.uploadedVideos.length > 0 && (
                <div>
                  {course.uploadedVideos.map((video, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        background: '#faf5ff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>
                          <i className="fas fa-file-video" style={{ marginRight: '8px', color: '#8b5cf6' }}></i>
                          {video.fileName || `Uploaded Video ${index + 1}`}
                        </span>
                      </div>
                      {video.fileUrl && (
                        <video
                          width="100%"
                          height="315"
                          controls
                          src={video.fileUrl}
                          style={{ borderRadius: '8px' }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
    </div>
  );
}

export default CourseDetail;
