import { useState, useEffect } from "react";
import { Search } from "lucide-react";
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

          return {
            id: courseId || `temp-${index}`, // Use temp prefix if no ID to avoid confusion
            _id: courseId || `temp-${index}`,
            title: course.title || 'Untitled course',
            subject: course.subject || 'Course',
            grade: course.grade || grade || 'N/A',
            description: course.description || 'No description provided.',
            progress: isEnrolled ? progress : 0,
            status: statusFromCourse,
            teacherName: course.teacher?.firstName 
              ? `${course.teacher.firstName} ${course.teacher.lastName || ''}`
              : 'Teacher',
            zoomLink: course.zoomLink || null,
            isChapterBased: course.isChapterBased || false,
            numberOfChapters: course.numberOfChapters || 0,
            subjectType: course.subjectType || '',
            thumbnail:
              course.thumbnail ||
              "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop",
          };
        });

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
              {lesson.isChapterBased && (
                <div 
                  className="chapter-badge"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  <i className="fas fa-book-open" style={{ marginRight: '5px' }}></i>
                  {lesson.numberOfChapters} Chapters
                </div>
              )}
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
                          if (lesson.isChapterBased) {
                            setSelectedChapterCourse(lesson);
                            setShowChaptersView(true);
                          } else {
                            setSelectedCourse(lesson);
                            setShowCourseDetail(true);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          backgroundColor: lesson.isChapterBased ? '#667eea' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                        }}
                      >
                        {lesson.isChapterBased ? 'View Chapters' : 'Continue'}
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
                        setSelectedCourse(lesson);
                        setShowCourseDetail(true);
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

      {/* Chapter-Based Course View Modal */}
      {showChaptersView && selectedChapterCourse && (
        <div 
          className="chapters-view-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f5f7fa',
            zIndex: 1000,
            overflow: 'auto',
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
      )}
    </div>
  );
}
