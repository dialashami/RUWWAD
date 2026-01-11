 import { useState, useEffect } from 'react';
import { Card, Button, Badge } from './ui';
import { FaBook, FaClipboardList, FaChartBar, FaBell, FaCalendar, FaCheckCircle, FaFileUpload, FaGraduationCap, FaFlask, FaAtom, FaVideo } from "react-icons/fa";
import { useStudent } from '../context/StudentContext';

export function Dashboard() {
  // Get student data from context
  const { 
    student, 
    getFullName,
    stats: contextStats, 
    courses: contextCourses,
    todaySchedule: contextTodaySchedule,
    recentActivities: contextRecentActivities,
    loading: contextLoading,
    refreshData
  } = useStudent();

  // Local state for UI interactions - starts empty, populated from backend
  const [progressData, setProgressData] = useState({});

  const [scheduleItems, setScheduleItems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    unreadMessages: 0,
  });

  // Update local state when context data changes
  useEffect(() => {
    if (contextStats) {
      setStats(contextStats);
    }
  }, [contextStats]);

  // Update schedule from context
  useEffect(() => {
    if (contextTodaySchedule && contextTodaySchedule.length > 0) {
      const mappedSchedule = contextTodaySchedule.map((item, index) => ({
        id: item._id || index,
        time: new Date(item.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        title: item.title,
        description: item.description || 'Assignment due',
        subject: item.subject?.toLowerCase() || 'course',
        duration: '1h',
        completed: false,
        zoomLink: item.zoomLink,
      }));
      setScheduleItems(mappedSchedule);
    } else if (contextCourses && contextCourses.length > 0) {
      // Use courses as schedule if no today schedule
      const mappedSchedule = contextCourses.slice(0, 4).map((course, index) => ({
        id: course._id || index,
        time: '09:00 AM',
        title: course.title,
        description: course.description || 'Course session',
        subject: course.subject?.toLowerCase() || 'course',
        duration: course.duration || '1h',
        completed: false,
        zoomLink: course.zoomLink,
      }));
      setScheduleItems(mappedSchedule);
    }
  }, [contextTodaySchedule, contextCourses]);

  // Update activities from context
  useEffect(() => {
    if (contextRecentActivities && contextRecentActivities.length > 0) {
      const mappedActivities = contextRecentActivities.map((activity, index) => ({
        id: activity.id || index,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        score: null,
        status: activity.isRead ? 'Read' : 'New',
        read: activity.isRead || false,
      }));
      setActivities(mappedActivities);
    }
  }, [contextRecentActivities]);

  // Fetch progress data from backend API
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/student/progress`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.subjectProgress && data.subjectProgress.length > 0) {
            // Convert array to object format for progressData
            const progressObj = {};
            data.subjectProgress.forEach(subject => {
              const key = subject.name.toLowerCase();
              progressObj[key] = {
                percent: subject.progress || 0,
                completedLessons: subject.completedLessons || 0,
                totalLessons: subject.totalLessons || subject.lessons || 0,
                lessons: subject.lessons || 0,
                completedQuizzes: subject.completedQuizzes || subject.quizzes || 0,
                totalQuizzes: subject.totalQuizzes || subject.quizzes || 0,
                quizzes: subject.quizzes || 0,
                avgScore: subject.grade ? (subject.grade === 'A+' ? 95 : subject.grade === 'A' ? 90 : subject.grade === 'B+' ? 85 : subject.grade === 'B' ? 80 : subject.grade === 'C' ? 70 : 0) : 0,
                grade: subject.grade || '-',
              };
            });
            if (Object.keys(progressObj).length > 0) {
              setProgressData(progressObj);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching progress data:', err);
      }
    };

    fetchProgressData();
  }, [student.id]);

  // Fallback: Update progress data based on enrolled courses if API doesn't return data
  useEffect(() => {
    // Only use fallback if we have courses but no progress data from API
    if (contextCourses && contextCourses.length > 0 && Object.keys(progressData).length === 0) {
      const newProgressData = {};
      contextCourses.forEach(course => {
        // Use course title as the key (this shows actual enrolled courses)
        const courseKey = (course.title || course.subject || 'course').toLowerCase();
        if (!newProgressData[courseKey]) {
          // Calculate actual progress based on course data
          const totalLessons = course.lessons?.length || 0;
          const completedLessons = course.completedLessons || 0;
          const totalQuizzes = course.quizzes?.length || 0;
          const completedQuizzes = course.completedQuizzes || 0;
          const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          
          newProgressData[courseKey] = {
            percent: percent,
            completedLessons: completedLessons,
            totalLessons: totalLessons,
            lessons: totalLessons,
            completedQuizzes: completedQuizzes,
            totalQuizzes: totalQuizzes,
            quizzes: totalQuizzes,
            avgScore: course.averageScore || 0,
            grade: '-',
            courseId: course._id,
            courseName: course.title,
          };
        }
      });
      if (Object.keys(newProgressData).length > 0) {
        setProgressData(newProgressData);
      }
    }
  }, [contextCourses, progressData]);

  // State for current lesson/quiz/assignment
  const [currentContent, setCurrentContent] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    title: "Advanced Calculus Assignment",
    description: "Complete problems 1-10 from chapter 5",
    dueDate: "2023-06-15",
    file: null
  });

  // Button handlers with actual functionality
  const handleViewDetails = async (subject) => {
    // Calculate overall stats from context data
    let overallStats = {
      totalLessons: contextCourses?.reduce((sum, c) => sum + (c.lessons?.length || 1), 0) || 0,
      completedLessons: 0,
      totalQuizzes: 0,
      avgScore: 0,
    };

    // Try to fetch detailed progress from backend
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/student/progress`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          overallStats = {
            totalLessons: data.lessonsCompleted || overallStats.totalLessons,
            completedLessons: data.lessonsCompleted || 0,
            totalQuizzes: data.quizzesPassed || 0,
            avgScore: data.averageScore || 0,
            overallProgress: data.overallProgress || 0,
          };
        }
      }
    } catch (err) {
      console.error('Error fetching detailed progress:', err);
    }

    setCurrentContent({
      type: "progress",
      subject: subject,
      data: subject === 'all' ? progressData : (progressData[subject] || progressData),
      overallStats,
      studentName: student.firstName || 'Student',
      grade: student.grade || 'N/A',
    });
  };

  const handleViewFullSchedule = () => {
    // Build weekly schedule from courses and assignments
    const weeklyItems = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Add today's schedule items
    scheduleItems.forEach((item, index) => {
      weeklyItems.push({
        ...item,
        day: days[0], // Today
      });
    });

    // Add courses as scheduled items across the week
    if (contextCourses && contextCourses.length > 0) {
      contextCourses.forEach((course, index) => {
        const dayIndex = index % days.length;
        const hour = 9 + (index % 6);
        const timeStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        
        weeklyItems.push({
          id: `course-${course._id || index}`,
          time: timeStr,
          title: course.title,
          description: course.description || 'Course session',
          subject: (course.subject || 'course').toLowerCase(),
          duration: course.duration || '1h',
          completed: false,
          day: days[dayIndex],
          zoomLink: course.zoomLink,
        });
      });
    }

    setCurrentContent({
      type: "schedule",
      title: "Weekly Schedule",
      items: weeklyItems,
      studentGrade: student.grade || 'N/A',
    });
  };

  const handleViewAllActivities = () => {
    // Build activities from context data
    const allActivities = [...activities];
    
    // Add course enrollments as activities
    if (contextCourses && contextCourses.length > 0) {
      contextCourses.slice(0, 3).forEach((course, index) => {
        if (!allActivities.find(a => a.title?.includes(course.title))) {
          allActivities.push({
            id: `course-activity-${index}`,
            type: 'lesson',
            title: `Enrolled in ${course.title}`,
            description: course.description || `Started learning ${course.subject || 'new course'}`,
            score: null,
            read: true,
            date: course.createdAt || new Date().toISOString(),
          });
        }
      });
    }

    // Add assignment activities from context
    if (contextRecentActivities && contextRecentActivities.length > 0) {
      contextRecentActivities.forEach((activity, index) => {
        if (!allActivities.find(a => a.id === activity.id)) {
          allActivities.push({
            id: activity.id || `activity-${index}`,
            type: activity.type || 'notification',
            title: activity.title,
            description: activity.description,
            score: activity.score || null,
            read: activity.isRead || false,
            date: activity.createdAt || new Date().toISOString(),
          });
        }
      });
    }

    setCurrentContent({
      type: "activities",
      title: "All Activities",
      items: allActivities,
      totalCourses: stats.totalCourses,
      totalAssignments: stats.totalAssignments,
    });
  };

  const handleMarkAsCompleted = (scheduleId) => {
    setScheduleItems(prevItems => 
      prevItems.map(item => 
        item.id === scheduleId ? { ...item, completed: true } : item
      )
    );
  };

  const handleMarkActivityAsRead = (activityId) => {
    setActivities(prevActivities => 
      prevActivities.map(activity => 
        activity.id === activityId ? { ...activity, read: true } : activity
      )
    );
  };

  const handleStartSubjectLesson = (subject) => {
    setCurrentContent({
      type: "lesson",
      title: `${subject.charAt(0).toUpperCase() + subject.slice(1)} - New Chapter`,
      content: `This is the beginning of a new ${subject} lesson. You will learn important concepts and principles...`,
      duration: "50 minutes",
      progress: progressData[subject].percent
    });
  };

  const handleTakeSubjectQuiz = (subject) => {
    setCurrentQuiz({
      title: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Quiz`,
      questions: [
        {
          id: 1,
          question: `What is a fundamental concept in ${subject}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: Math.floor(Math.random() * 4)
        },
        {
          id: 2,
          question: `Which principle is most important in ${subject}?`,
          options: ["Principle 1", "Principle 2", "Principle 3", "Principle 4"],
          correctAnswer: Math.floor(Math.random() * 4)
        }
      ],
      currentQuestion: 0,
      score: 0
    });
  };

  const handleAnswerQuestion = (questionIndex, answerIndex) => {
    if (currentQuiz.questions[questionIndex].correctAnswer === answerIndex) {
      setCurrentQuiz(prev => ({
        ...prev,
        score: prev.score + 1,
        currentQuestion: prev.currentQuestion + 1
      }));
    } else {
      setCurrentQuiz(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }));
    }
  };

  const handleFinishQuiz = () => {
    const finalScore = Math.round((currentQuiz.score / currentQuiz.questions.length) * 100);
    alert(`Quiz completed! Your score: ${finalScore}%`);
    setCurrentQuiz(null);
    
    // Update progress data
    setProgressData(prev => {
      const updated = {...prev};
      Object.keys(updated).forEach(subject => {
        if (currentQuiz.title.toLowerCase().includes(subject)) {
          updated[subject] = {
            ...updated[subject],
            quizzes: updated[subject].quizzes + 1,
            avgScore: Math.round((updated[subject].avgScore * updated[subject].quizzes + finalScore) / (updated[subject].quizzes + 1))
          };
        }
      });
      return updated;
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAssignmentData(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  const handleSubmitAssignmentFile = () => {
    if (assignmentData.file) {
      alert(`Assignment "${assignmentData.title}" submitted successfully!`);
      setCurrentContent(null);
      setAssignmentData(prev => ({
        ...prev,
        file: null
      }));
    } else {
      alert("Please select a file to upload.");
    }
  };

  const handleCloseContent = () => {
    setCurrentContent(null);
    setCurrentQuiz(null);
  };

  // Function to get subject icon
  const getSubjectIcon = (subject) => {
    switch(subject) {
      case 'math': return <FaGraduationCap />;
      case 'physics': return <FaAtom />;
      case 'chemistry': return <FaFlask />;
      default: return <FaBook />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* ======= Top Banner ======= */}
      <section className="welcome-banner">
        <div className="banner-left">
          <h1>Welcome back, {student.firstName || 'Student'}!</h1>
          <p>
            Continue your learning journey and achieve your goals today!
          </p>
           
        </div>
        <div className="banner-right">
          <FaBook className="banner-icon" />
        </div>
      </section>

      {/* ======= Progress Tracker ======= */}
      <section className="section">
        <div className="section-header">
          <h2><FaChartBar /> Progress Tracker</h2>
          <button
            type="button"
            onClick={() => handleViewDetails('all')}
            className="link-button"
          >
            View Details
          </button>
        </div>
        <div className="progress-tracker">
          {Object.keys(progressData).length === 0 ? (
            <Card className="progress-card empty-state">
              <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No courses enrolled yet. Enroll in courses to track your progress!
              </p>
            </Card>
          ) : (
            Object.entries(progressData).map(([subject, data]) => (
              <Card key={subject} className="progress-card">
                <div className="progress-header">
                  <h3>{getSubjectIcon(subject)} {data.courseName || subject.charAt(0).toUpperCase() + subject.slice(1)}</h3>
                  <span className="progress-percent">{data.percent || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${data.percent || 0}%`}}
                  ></div>
                </div>
                <div className="progress-stats">
                  <div className="stat">
                    <span className="stat-value">{data.completedLessons || 0}/{data.totalLessons || data.lessons || 0}</span>
                    <span className="stat-label">Lessons</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{data.completedQuizzes || 0}/{data.totalQuizzes || data.quizzes || 0}</span>
                    <span className="stat-label">Quizzes</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{data.avgScore || 0}%</span>
                    <span className="stat-label">Avg. Score</span>
                  </div>
                </div>
                {data.grade && data.grade !== '-' && (
                  <div className="progress-grade">
                    <span className="grade-label">Grade:</span>
                    <span className="grade-value">{data.grade}</span>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </section>

      {/* ======= Today's Schedule ======= */}
      <section className="section">
        <div className="section-header">
          <h2><FaCalendar /> Today's Schedule</h2>
          <button
  type="button"
  onClick={handleViewFullSchedule}
  className="link-button"
>
  View Full Schedule
</button>
        </div>
        <div className="schedule-container">
          {scheduleItems.length === 0 ? (
            <Card className="schedule-item">
              <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No scheduled items for today. Check back later!
              </p>
            </Card>
          ) : (
            scheduleItems.map((item) => (
              <Card key={item.id} className="schedule-item">
                <div className="time-badge">
                  <span>{item.time}</span>
                </div>
                <div className="schedule-content">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <div className="schedule-meta">
                    <span className={`subject-tag ${item.subject}`}>
                      {getSubjectIcon(item.subject)} {item.subject.charAt(0).toUpperCase() + item.subject.slice(1)}
                    </span>
                    <span className="duration">{item.duration}</span>
                  </div>
                  {/* Zoom Link Button */}
                  {item.zoomLink && (
                    <a 
                      href={item.zoomLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="zoom-link-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#2D8CFF',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      <FaVideo /> Join Zoom Meeting
                    </a>
                  )}
                </div>
                {item.completed ? (
                  <FaCheckCircle className="status-icon completed" />
                ) : (
                  <Button 
                    className="small primary" 
                    onClick={() => handleMarkAsCompleted(item.id)}
                  >
                    Mark Done
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      </section>

      {/* ======= Recent Activity ======= */}
      <section className="section">
        <div className="section-header">
          <h2><FaBell /> Recent Activity</h2>
          
<button
  type="button"
  onClick={handleViewAllActivities}
  className="link-button"
>
  View All
</button>
        </div>
        <div className="activity-list">
          {activities.map((activity) => (
            <Card key={activity.id} className="activity-item">
              {activity.type === "quiz" ? (
                <FaClipboardList className={`activity-icon ${activity.read ? 'read' : 'new'}`} />
              ) : (
                <FaBell className={`activity-icon ${activity.read ? 'read' : 'new'}`} />
              )}
              <div className="activity-content">
                <h4>{activity.title}</h4>
                <p>{activity.description}</p>
              </div>
              {activity.score ? (
                <Badge 
                  className={`score-badge ${activity.read ? 'read' : 'new'}`}
                  onClick={() => handleMarkActivityAsRead(activity.id)}
                >
                  {activity.score}
                </Badge>
              ) : (
                <Badge 
                  className={`status-badge ${activity.read ? 'read' : 'new'}`}
                  onClick={() => handleMarkActivityAsRead(activity.id)}
                >
                  {activity.status}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* ======= Modal for current content ======= */}
      {currentContent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={handleCloseContent}>×</button>
            <h2>{currentContent.title}</h2>
            
            {currentContent.type === "lesson" && (
              <div className="lesson-content">
                <div className="lesson-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${currentContent.progress}%`}}
                    ></div>
                  </div>
                  <span>{currentContent.progress}% Complete</span>
                </div>
                <div className="lesson-text">
                  <p>{currentContent.content}</p>
                </div>
                <div className="lesson-actions">
                  <Button className="primary">Mark as Completed</Button>
                  <Button className="secondary">Save Progress</Button>
                </div>
              </div>
            )}
            
            {currentContent.type === "assignment" && (
              <div className="assignment-content">
                <p><strong>Description:</strong> {currentContent.description}</p>
                <p><strong>Due Date:</strong> {currentContent.dueDate}</p>
                <div className="file-upload">
                  <input 
                    type="file" 
                    id="assignment-file" 
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="assignment-file" className="file-upload-label">
                    Choose File
                  </label>
                  {assignmentData.file && (
                    <span className="file-name">{assignmentData.file.name}</span>
                  )}
                </div>
                <Button className="primary" onClick={handleSubmitAssignmentFile}>
                  Submit Assignment
                </Button>
              </div>
            )}
            
            {currentContent.type === "progress" && (
              <div className="progress-details">
                {currentContent.subject === 'all' ? (
                  <div className="all-progress">
                    <h3>Overall Progress for {currentContent.studentName}</h3>
                    <p className="student-grade">Grade: {currentContent.grade}</p>
                    {currentContent.overallStats && (
                      <div className="overall-stats-summary">
                        <div className="stat-item">
                          <span className="stat-label">Overall Progress:</span>
                          <span className="stat-value">{currentContent.overallStats.overallProgress || 0}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Total Lessons:</span>
                          <span className="stat-value">{currentContent.overallStats.completedLessons || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Quizzes Passed:</span>
                          <span className="stat-value">{currentContent.overallStats.totalQuizzes || 0}</span>
                        </div>
                      </div>
                    )}
                    {Object.entries(currentContent.data).map(([subject, data]) => (
                      <div key={subject} className="subject-progress-detail">
                        <h4>{subject.charAt(0).toUpperCase() + subject.slice(1)}</h4>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{width: `${data.percent || 0}%`}}
                          ></div>
                        </div>
                        <div className="progress-stats">
                          <div className="stat">
                            <span>Lessons: {data.completedLessons || 0}/{data.totalLessons || data.lessons || 0}</span>
                          </div>
                          <div className="stat">
                            <span>Quizzes: {data.completedQuizzes || 0}/{data.totalQuizzes || data.quizzes || 0}</span>
                          </div>
                          <div className="stat">
                            <span>Average Score: {data.avgScore || 0}%</span>
                          </div>
                          {data.grade && data.grade !== '-' && (
                            <div className="stat">
                              <span>Grade: {data.grade}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="single-subject-progress">
                    <h3>{currentContent.subject.charAt(0).toUpperCase() + currentContent.subject.slice(1)} Progress</h3>
                    <div className="progress-bar large">
                      <div 
                        className="progress-fill" 
                        style={{width: `${currentContent.data.percent || 0}%`}}
                      ></div>
                    </div>
                    <div className="detailed-stats">
                      <div className="stat-card">
                        <h4>Lessons Completed</h4>
                        <span className="stat-value">{currentContent.data.completedLessons || 0}/{currentContent.data.totalLessons || currentContent.data.lessons || 0}</span>
                      </div>
                      <div className="stat-card">
                        <h4>Quizzes Taken</h4>
                        <span className="stat-value">{currentContent.data.completedQuizzes || 0}/{currentContent.data.totalQuizzes || currentContent.data.quizzes || 0}</span>
                      </div>
                      <div className="stat-card">
                        <h4>Average Score</h4>
                        <span className="stat-value">{currentContent.data.avgScore || 0}%</span>
                      </div>
                      {currentContent.data.grade && currentContent.data.grade !== '-' && (
                        <div className="stat-card">
                          <h4>Grade</h4>
                          <span className="stat-value">{currentContent.data.grade}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentContent.type === "schedule" && (
              <div className="full-schedule">
                <h3>Weekly Schedule</h3>
                <div className="schedule-days">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <div key={day} className="schedule-day">
                      <h4>{day}</h4>
                      {currentContent.items
                        .filter(item => !item.day || item.day === day)
                        .map(item => (
                          <div key={item.id} className="schedule-item compact">
                            <div className="time-badge small">
                              <span>{item.time}</span>
                            </div>
                            <div className="schedule-content">
                              <h5>{item.title}</h5>
                              <p>{item.description}</p>
                            </div>
                            {item.completed ? (
                              <FaCheckCircle className="status-icon completed" />
                            ) : (
                              <span className="pending">Pending</span>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentContent.type === "activities" && (
              <div className="all-activities">
                <h3>All Activities</h3>
                <div className="activity-filters">
                  <Button className="small">All</Button>
                  <Button className="small secondary">Quizzes</Button>
                  <Button className="small secondary">Lessons</Button>
                  <Button className="small secondary">Assignments</Button>
                </div>
                <div className="activities-list">
                  {currentContent.items.map(activity => (
                    <div key={activity.id} className="activity-item detailed">
                      {activity.type === "quiz" ? (
                        <FaClipboardList className="activity-icon" />
                      ) : activity.type === "lesson" ? (
                        <FaBook className="activity-icon" />
                      ) : (
                        <FaFileUpload className="activity-icon" />
                      )}
                      <div className="activity-content">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        <span className="activity-date">2 days ago</span>
                      </div>
                      {activity.score && (
                        <Badge className="score-badge">{activity.score}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======= Quiz Modal ======= */}
      {currentQuiz && (
        <div className="modal-overlay">
          <div className="modal-content quiz-modal">
            <button className="close-button" onClick={handleCloseContent}>×</button>
            <h2>{currentQuiz.title}</h2>
            
            {currentQuiz.currentQuestion < currentQuiz.questions.length ? (
              <div className="quiz-question">
                <div className="quiz-progress">
                  Question {currentQuiz.currentQuestion + 1} of {currentQuiz.questions.length}
                </div>
                <h3>{currentQuiz.questions[currentQuiz.currentQuestion].question}</h3>
                <div className="quiz-options">
                  {currentQuiz.questions[currentQuiz.currentQuestion].options.map((option, index) => (
                    <Button 
                      key={index}
                      className="quiz-option"
                      onClick={() => handleAnswerQuestion(currentQuiz.currentQuestion, index)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="quiz-results">
                <h3>Quiz Completed!</h3>
                <p>Your score: {currentQuiz.score} out of {currentQuiz.questions.length}</p>
                <p>Percentage: {Math.round((currentQuiz.score / currentQuiz.questions.length) * 100)}%</p>
                <Button className="primary" onClick={handleFinishQuiz}>
                  Finish Quiz
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}