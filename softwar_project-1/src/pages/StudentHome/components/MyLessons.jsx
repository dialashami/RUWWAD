import { useState, useEffect } from "react";
import { Search, X, BookOpen, User, Calendar, Clock, Link as LinkIcon, FileText } from "lucide-react";
import { Input } from "./ui/input";
import { useStudent } from '../context/StudentContext';
import CourseDetail from '../../TeacherHome/components/CourseDetail';
import CourseChaptersView from './CourseChaptersView';

export function MyLessons() {
  // Get student data from context
  const { student, courses: contextCourses, todaySchedule, refreshData } = useStudent();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showChaptersView, setShowChaptersView] = useState(false);
  const [selectedChapterCourse, setSelectedChapterCourse] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailsLesson, setSelectedDetailsLesson] = useState(null);

  useEffect(() => {
    const fetchStudentCourses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Use student data from context
        const grade = student.grade || null;
        const major = student.studentType === 'university' ? student.grade : null;
        const studentId = student.id || null;

        console.log('Fetching courses for student grade:', grade, 'studentId:', studentId);

        // Fetch all active courses that match student's grade
        let url = `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses?isActive=true`;
        if (grade) url += `&grade=${encodeURIComponent(grade)}`;
        if (major) url += `&specialization=${encodeURIComponent(major)}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch courses:', res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log('Courses received for student:', data);
        
        if (!Array.isArray(data)) {
          setLoading(false);
          return;
        }

        const mapped = data.map((course, index) => {
          const progress = typeof course.progress === 'number' ? course.progress : 0;
          
          // Count actual chapters from populated array (chapters with real content)
          const actualChapters = course.chapters?.length || 0;
          console.log(`Course "${course.title}": chapters array:`, course.chapters, 'actualChapters:', actualChapters);
          
          // Check if student is enrolled - use isEnrolled from backend (preferred) or fallback to students array check
          const isEnrolled = course.isEnrolled === true || course.students?.some(s => 
            (typeof s === 'string' ? s : s?._id) === studentId
          );
          const statusFromCourse = isEnrolled 
            ? (progress >= 100 ? 'completed' : 'in-progress')
            : 'recommended';

          const courseId = course._id || course.id;
          console.log('Mapped course:', course.title, 'id:', courseId, 'isEnrolled:', isEnrolled, 'isChapterBased:', course.isChapterBased);
          
          if (!courseId) {
            console.warn('Course missing ID:', course);
          }

          // Generate unique placeholder image based on subject if no thumbnail
          const subjectImages = {
            'Mathematics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop',
            'Science': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop',
            'English': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop',
            'Physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop',
            'Chemistry': 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop',
            'Biology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&auto=format&fit=crop',
            'History': 'https://images.unsplash.com/photo-1461360370896-922624d12a74?w=600&auto=format&fit=crop',
            'Arabic': 'https://images.unsplash.com/photo-1579187707643-35646d22b596?w=600&auto=format&fit=crop',
            'Computer Engineering': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop',
          };
          
          const defaultThumbnail = course.subject && subjectImages[course.subject] 
            ? subjectImages[course.subject]
            : `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&sig=${courseId || index}`;

          return {
            id: courseId || `temp-${index}`, // Use temp prefix if no ID to avoid confusion
            _id: courseId || `temp-${index}`,
            title: course.title || 'Untitled course',
            subject: course.subject || 'Course',
            grade: course.grade || grade || 'N/A',
            description: course.description || '',
            progress: isEnrolled ? progress : 0,
            status: statusFromCourse,
            teacherName: course.teacher?.firstName 
              ? `${course.teacher.firstName} ${course.teacher.lastName || ''}`
              : 'Unknown Instructor',
            zoomLink: course.zoomLink || null,
            isChapterBased: course.isChapterBased || false,
            numberOfChapters: course.numberOfChapters || 0,
            chaptersWithContent: actualChapters, // Use actual populated chapters array length
            subjectType: course.subjectType || '',
            thumbnail: course.thumbnail || defaultThumbnail,
          };
        });
        
        // Debug: log chapters info
        console.log('Courses with chapter info:', mapped.map(m => ({ title: m.title, chaptersWithContent: m.chaptersWithContent, numberOfChapters: m.numberOfChapters })));

        setLessons(mapped);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCourses();
  }, [student.id, student.grade]);

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "in-progress" && lesson.status === "in-progress") ||
      (activeTab === "completed" && lesson.status === "completed") ||
      (activeTab === "recommended" && lesson.status === "recommended");
    return matchesSearch && matchesTab;
  });

  const inProgressCount = lessons.filter(
    (l) => l.status === "in-progress"
  ).length;
  const completedCount = lessons.filter(
    (l) => l.status === "completed"
  ).length;
  
  // Calculate today's lessons count from schedule
  const todayLessonsCount = Array.isArray(todaySchedule) ? todaySchedule.length : 0;

  // Handle course enrollment
  const handleEnroll = async (courseId) => {
    // Validate courseId
    if (!courseId || courseId.toString().startsWith('temp-')) {
      alert('Invalid course ID. Cannot enroll.');
      console.error('Invalid courseId:', courseId);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      let studentId = null;
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          studentId = parsed?._id || parsed?.id || null;
          console.log('Enrolling - studentId:', studentId, 'courseId:', courseId);
        }
      } catch {
        // ignore
      }

      if (!token || !studentId) {
        alert('Please log in to enroll in courses.');
        return;
      }

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}/enroll`;
      console.log('Enrollment API URL:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId }),
      });

      console.log('Enrollment response status:', res.status);
      const responseData = await res.json().catch(() => ({}));
      console.log('Enrollment response data:', responseData);

      if (!res.ok) {
        alert(responseData.message || 'Failed to enroll in course.');
        return;
      }

      // Update local state to reflect enrollment
      setLessons(prev => prev.map(lesson => 
        lesson.id === courseId 
          ? { ...lesson, status: 'in-progress', progress: 0, isEnrolled: true }
          : lesson
      ));

      alert('Successfully enrolled in the course!');
      
      // Refresh data to ensure consistency
      if (refreshData) {
        refreshData();
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      alert('Error enrolling in course. Please try again.');
    }
  };

  // Handle course unenrollment
  const handleUnenroll = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      let studentId = null;
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          studentId = parsed?._id || parsed?.id || null;
        }
      } catch {
        // ignore
      }

      if (!token || !studentId) {
        alert('Please log in to manage courses.');
        return;
      }

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/courses/${courseId}/unenroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to unenroll from course.');
        return;
      }

      // Update local state to reflect unenrollment
      setLessons(prev => prev.map(lesson => 
        lesson.id === courseId 
          ? { ...lesson, status: 'recommended', progress: 0 }
          : lesson
      ));

      alert('Successfully unenrolled from the course.');
    } catch (err) {
      console.error('Error unenrolling from course:', err);
      alert('Error unenrolling from course. Please try again.');
    }
  };

  return (
    <div className="my-lessons-container">
      

      {/* Header */}
      <div className="my-lessons-header">
        <h1>My Lessons</h1>
        <p>Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="stats-container">
        <div className="stat-box stat-inprogress">
          In Progress <span>{inProgressCount}</span>
        </div>
        <div className="stat-box stat-completed">
          Completed <span>{completedCount}</span>
        </div>
      </div>
{/* Search bar */}
      <div className="search-bar">
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
            size={20}
          />
          <Input
            type="text"
            placeholder="Search for lessons, assignments, quizzes, or ask a question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button>{todayLessonsCount} {todayLessonsCount === 1 ? 'lesson' : 'lessons'} today</button>
      </div>
      {/* Tabs */}
      <div className="tabs">
        {["all", "in-progress", "completed", "recommended"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "active" : ""}
          >
            {tab === "all"
              ? "All"
              : tab === "in-progress"
              ? "In Progress"
              : tab === "completed"
              ? "Completed"
              : "Recommended"}
          </button>
        ))}
      </div>

      {/* Lessons Grid */}
      <div className="lessons-grid">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Loading your courses...</p>
          </div>
        ) : filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => (
            <div className="lesson-card" key={lesson.id}>
              <img src={lesson.thumbnail} alt={lesson.title} />
              <div
                className={`lesson-status ${
                  lesson.status === "completed" ? "completed" : 
                  lesson.status === "recommended" ? "recommended" : ""
                }`}
              >
                {lesson.status === "completed" ? "Completed" : 
                 lesson.status === "recommended" ? "Recommended" : "In Progress"}
              </div>
              <div className="lesson-card-content">
                <h3>{lesson.title}</h3>
                <p>{lesson.description}</p>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                  <strong>Subject:</strong> {lesson.subject} | <strong>Grade:</strong> {lesson.grade}
                  {lesson.subjectType && <> | <strong>Type:</strong> {lesson.subjectType}</>}
                </p>
                {lesson.teacherName && (
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                    Teacher: {lesson.teacherName}
                  </p>
                )}
                <div className="lesson-progress">
                  <div
                    className="lesson-progress-bar"
                    style={{ width: `${lesson.progress}%` }}
                  ></div>
                </div>
                
                {/* Enroll/Unenroll buttons */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  {lesson.status === 'recommended' ? (
                    <button
                      onClick={() => handleEnroll(lesson.id)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                      }}
                    >
                      Enroll Now
                    </button>
                  ) : lesson.status === 'in-progress' ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDetailsLesson(lesson);
                          setShowDetailsModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                        }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleUnenroll(lesson.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Leave
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedDetailsLesson(lesson);
                        setShowDetailsModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                      }}
                    >
                      Review Course
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '60px 20px',
            background: '#f8f9fa',
            borderRadius: '12px'
          }}>
            <h3 style={{ color: '#666', marginBottom: '8px' }}>No Courses Available</h3>
            <p style={{ color: '#999' }}>No courses are available for your grade yet. Check back later!</p>
          </div>
        )}
      </div>

      {/* Floating button */}
      <button className="floating-btn">
        <i className="fas fa-robot"></i>
      </button>

      {/* Course Detail Modal */}
      {showCourseDetail && selectedCourse && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowCourseDetail(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: 800, 
              width: '90%',
              maxHeight: '90vh', 
              overflow: 'auto', 
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <CourseDetail
              courseId={selectedCourse.id}
              courseTitle={selectedCourse.title}
              isTeacher={false}
              onClose={() => setShowCourseDetail(false)}
            />
          </div>
        </div>
      )}

      {/* Chapter-Based Course View Modal - Internal Page Style */}
      {showChaptersView && selectedChapterCourse && (
        <div 
          className="modal-overlay"
          onClick={() => {
            setShowChaptersView(false);
            setSelectedChapterCourse(null);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 900,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <CourseChaptersView
              course={selectedChapterCourse}
              studentId={student.id}
              onBack={() => {
                setShowChaptersView(false);
                setSelectedChapterCourse(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {showDetailsModal && selectedDetailsLesson && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setShowDetailsModal(false);
            setSelectedDetailsLesson(null);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: 600, 
              width: '100%',
              maxHeight: '85vh', 
              overflow: 'auto', 
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              position: 'relative',
              padding: '0',
            }}>
              <img 
                src={selectedDetailsLesson.thumbnail} 
                alt={selectedDetailsLesson.title}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '16px 16px 0 0',
                }}
              />
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDetailsLesson(null);
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {/* Title and Subject */}
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '8px',
              }}>
                {selectedDetailsLesson.title}
              </h2>
              
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '500',
                marginBottom: '20px',
              }}>
                {selectedDetailsLesson.subject}
              </div>

              {/* Course Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                }}>
                  <User size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Instructor</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                      {selectedDetailsLesson.teacherName}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                }}>
                  <BookOpen size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Grade</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                      {selectedDetailsLesson.grade}
                    </div>
                  </div>
                </div>

                {selectedDetailsLesson.chaptersWithContent > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '10px',
                  }}>
                    <FileText size={18} color="#6b7280" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Chapters</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                        {selectedDetailsLesson.chaptersWithContent} {selectedDetailsLesson.chaptersWithContent === 1 ? 'Chapter' : 'Chapters'}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                }}>
                  <Clock size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Progress</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                      {selectedDetailsLesson.progress}% Complete
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Course Description
                </h3>
                {selectedDetailsLesson.description ? (
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    lineHeight: '1.6',
                  }}>
                    {selectedDetailsLesson.description}
                  </p>
                ) : (
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    lineHeight: '1.6',
                  }}>
                    No description has been added by the instructor yet.
                  </p>
                )}
              </div>

              {/* Zoom Link if available */}
              {selectedDetailsLesson.zoomLink && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '10px',
                  marginBottom: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <LinkIcon size={18} color="#2563eb" />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e40af' }}>Live Session Link</span>
                  </div>
                  <a 
                    href={selectedDetailsLesson.zoomLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.85rem',
                      color: '#2563eb',
                      textDecoration: 'underline',
                      wordBreak: 'break-all',
                    }}
                  >
                    {selectedDetailsLesson.zoomLink}
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {selectedDetailsLesson.chaptersWithContent > 0 && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedDetailsLesson(null);
                      setSelectedChapterCourse(selectedDetailsLesson);
                      setShowChaptersView(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                    }}
                  >
                    View Chapters
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDetailsLesson(null);
                  }}
                  style={{
                    flex: selectedDetailsLesson.chaptersWithContent > 0 ? 0 : 1,
                    padding: '12px 20px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
