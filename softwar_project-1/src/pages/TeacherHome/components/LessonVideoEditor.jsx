// src/pages/TeacherHome/components/LessonVideoEditor.jsx
import React, { useState, useEffect } from 'react';

function LessonVideoEditor({ courseId, courseTitle, onClose, onSave }) {
  // 🔹 لينكات أونلاين (YouTube, Vimeo, ... إلخ)
  const [videoUrls, setVideoUrls] = useState(['']);

  // 🔹 فيديوهات مرفوعة من جهاز المعلم
  const [uploadedVideos, setUploadedVideos] = useState([]); 
  // كل عنصر: { file, name, previewUrl }

  // علشان نعرف إذا المعلم كبس Save
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch existing videos for this course on mount
  useEffect(() => {
    const fetchCourseVideos = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Fetched course data:', data);
          console.log('Video URLs from DB:', data.videoUrls);
          console.log('Uploaded Videos from DB:', data.uploadedVideos);
          
          // Load existing video URLs
          if (data.videoUrls && data.videoUrls.length > 0) {
            setVideoUrls(data.videoUrls);
          }
          // Load existing uploaded videos
          if (data.uploadedVideos && data.uploadedVideos.length > 0) {
            setUploadedVideos(data.uploadedVideos.map(v => ({
              name: v.fileName,
              previewUrl: v.fileUrl,
              isExisting: true
            })));
          }
        } else {
          console.error('Failed to fetch course:', res.status);
        }
      } catch (err) {
        console.error('Error fetching course videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseVideos();
  }, [courseId]);

  const handleVideoChange = (index, value) => {
    const copy = [...videoUrls];
    copy[index] = value;
    setVideoUrls(copy);
    setSaved(false); // لو عدّل بعد الحفظ نرجع نخفي رسالة "تم الحفظ"
  };

  const handleAddVideoField = () => {
    setVideoUrls([...videoUrls, '']);
    setSaved(false);
  };

  // ✅ لما يختار فيديو من الجهاز
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newUploaded = files.map((file) => ({
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadedVideos((prev) => [...prev, ...newUploaded]);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!courseId) {
      alert('No course selected');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('No authentication token found. Please log in again.');
        setSaving(false);
        return;
      }
      
      // Filter out empty URLs
      const filteredUrls = videoUrls.filter(url => url.trim().length > 0);
      
      // Prepare uploaded videos data
      const uploadedVideosData = uploadedVideos.map(v => ({
        fileName: v.name,
        fileUrl: v.previewUrl || v.fileUrl
      }));

      console.log('Saving videos to course:', courseId);
      console.log('Course ID type:', typeof courseId);
      console.log('Video URLs:', filteredUrls);
      console.log('Uploaded Videos:', uploadedVideosData);
      console.log('API URL:', `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}`);

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoUrls: filteredUrls,
          uploadedVideos: uploadedVideosData
        }),
      });

      const responseData = await res.json();
      console.log('Save response status:', res.status);
      console.log('Save response data:', responseData);

      if (!res.ok) {
        console.error('Save failed:', res.status, responseData);
        throw new Error(responseData.message || 'Failed to save videos');
      }

      console.log('Saved videoUrls:', responseData.videoUrls);
      console.log('Saved uploadedVideos:', responseData.uploadedVideos);

      alert('Videos saved successfully!');
      setSaved(true);
      
      // Notify parent component
      if (onSave) {
        onSave({ videoUrls: filteredUrls, uploadedVideos: uploadedVideosData });
      }

      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    } catch (err) {
      console.error('Error saving videos:', err);
      alert('Could not save videos. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ helper بسيطة عشان نعرف إذا اللينك يوتيوب ونطلع embed URL
  const getYouTubeEmbedUrl = (url) => {
    try {
      if (!url) return null;
      const ytRegex =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const match = url.match(ytRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  // نفلتر اللينكات الفاضية
  const nonEmptyVideos = videoUrls
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

  const hasAnyVideos =
    nonEmptyVideos.length > 0 || uploadedVideos.length > 0;

  if (loading) {
    return (
      <div className="lesson-video-editor-modal">
        <div className="video-editor-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-video-editor-modal">
      <div className="video-editor-content">
        <div className="video-editor-header">
          <h2>Videos for: {courseTitle || `Course #${courseId}`}</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Add online links or upload videos from your device for this course/lesson.</p>

        {/* ====== فورم إدخال الفيديوهات للمعلم (لينكات) ====== */}
        <div className="videos-form">
          {videoUrls.map((url, index) => (
            <div key={index} className="form-group" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label>Video URL #{index + 1}</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleVideoChange(index, e.target.value)}
                  placeholder="Paste video URL (YouTube, Vimeo, ...)"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
              </div>
              {videoUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newUrls = videoUrls.filter((_, i) => i !== index);
                    setVideoUrls(newUrls);
                    setSaved(false);
                  }}
                  style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', marginTop: 20 }}
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={handleAddVideoField} style={{ background: '#f3f4f6', border: '1px dashed #9ca3af', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', marginTop: 8 }}>
            + Add another video URL
          </button>
        </div>

        {/* ====== رفع فيديو من الجهاز ====== */}
        <div
          className="form-group"
          style={{ marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}
        >
          <label>Upload videos from your device</label>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileChange}
            style={{ marginTop: 8 }}
          />
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            You can select one or more video files (e.g., MP4).
          </p>

          {uploadedVideos.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 13, color: '#4b5563' }}>
              {uploadedVideos.map((v, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Attached: {v.name}
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedVideos(prev => prev.filter((_, idx) => idx !== i));
                      setSaved(false);
                    }}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: 12 }}>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500 }}
          >
            {saving ? 'Saving...' : 'Save Videos'}
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 24px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
          {saved && hasAnyVideos && (
            <span style={{ marginLeft: 10, fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center' }}>
              ✓ Videos saved
            </span>
          )}
        </div>

        {/* ====== Preview: كيف اليوزر/الطالب رح يشوف الفيديوهات ====== */}
        {saved && hasAnyVideos && (
          <div
            className="lesson-student-preview"
            style={{
              marginTop: '24px',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '16px',
            }}
          >
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Student View Preview</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
              This is how students will see the lesson videos:
            </p>

            {/* 🔹 لينكات أونلاين */}
            {nonEmptyVideos.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {nonEmptyVideos.map((url, index) => {
                  const embedUrl = getYouTubeEmbedUrl(url);

                  return (
                    <div
                      key={index}
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: embedUrl ? 8 : 0,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 500 }}>
                          Video #{index + 1}
                        </span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 13,
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Open video
                        </a>
                      </div>

                      {/* لو يوتيوب نعرضه كـ iframe */}
                      {embedUrl && (
                        <div style={{ marginTop: 8 }}>
                          <iframe
                            width="100%"
                            height="200"
                            src={embedUrl}
                            title={`Video ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{ borderRadius: 12, border: 'none' }}
                          ></iframe>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 🔹 فيديوهات مرفوعة من الجهاز */}
            {uploadedVideos.length > 0 && (
              <div>
                {uploadedVideos.map((v, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      background: '#eef2ff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        Uploaded Video #{index + 1}
                      </span>
                      <span style={{ fontSize: 12, color: '#4b5563' }}>
                        {v.name}
                      </span>
                    </div>

                    <video
                      width="100%"
                      height="200"
                      controls
                      src={v.previewUrl}
                      style={{ borderRadius: 12, outline: 'none' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* لو حفظ وما في ولا لينك ولا فيديو */}
        {saved && !hasAnyVideos && (
          <p style={{ marginTop: 16, fontSize: 13, color: '#dc2626' }}>
            You saved, but there are no videos yet (URLs or uploaded files).
          </p>
        )}
      </div>
    </div>
  );
}

export default LessonVideoEditor;
