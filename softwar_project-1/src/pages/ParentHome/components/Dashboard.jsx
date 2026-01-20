import React, { useState, useEffect, useCallback } from "react";
import { Users, BookOpen, Trophy, Target, Clock, CheckCircle, XCircle, AlertCircle, GraduationCap, RefreshCw, FileText } from "lucide-react";
import { API_CONFIG } from '../../../config/api.config';

export default function Dashboard() {
  const [children, setChildren] = useState([]);
  const [childrenData, setChildrenData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [parentName, setParentName] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch data function - extracted for reuse
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const token = localStorage.getItem('token');
      
      // Get parent name from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setParentName(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim());
      }

      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Helper for fetch with timeout
      const fetchWithTimeout = async (url, options, timeoutMs = 10000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(timeoutId);
          return response;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      };

      // Fetch linked children
      const childrenRes = await fetchWithTimeout(
        `${API_CONFIG.BASE_URL}/api/users/children`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (childrenRes.ok) {
        const childrenList = await childrenRes.json();
        setChildren(childrenList || []);
        
        // Fetch dashboard data for all children in PARALLEL for faster loading
        const dashboardPromises = childrenList.map(async (child) => {
          try {
            const dashRes = await fetchWithTimeout(
              `${API_CONFIG.BASE_URL}/api/users/children/${child._id}/dashboard`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (dashRes.ok) {
              return { childId: child._id, data: await dashRes.json() };
            }
            return { childId: child._id, data: null };
          } catch (err) {
            console.error(`Error fetching dashboard for child ${child._id}:`, err);
            return { childId: child._id, data: null };
          }
        });
        
        const results = await Promise.all(dashboardPromises);
        const dashboardData = {};
        results.forEach(({ childId, data }) => {
          if (data) dashboardData[childId] = data;
        });
        
        setChildrenData(dashboardData);
        setLastUpdated(new Date());
        
        // Select first child by default if not already selected
        setSelectedChild(prev => {
          if (!prev && childrenList.length > 0) {
            return childrenList[0]._id;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error fetching children data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Remove selectedChild dependency to prevent infinite loops

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchData(true);
  };

  // Get grade display text
  const getGradeDisplay = (child) => {
    if (child.studentType === 'university') {
      return child.universityMajor || 'University';
    }
    if (child.schoolGrade) {
      const gradeNum = child.schoolGrade.replace('grade', '');
      return `Grade ${gradeNum}`;
    }
    return 'Student';
  };

  // Get letter grade from percentage
  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    return 'D';
  };

  // Get course progress summary
  const getCourseProgress = (course) => {
    if (!course.chapters || course.chapters.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    const completed = course.chapters.filter(ch => ch.progress?.chapterCompleted).length;
    const total = course.chapters.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  // Get quiz summary for a course
  const getQuizSummary = (course) => {
    if (!course.chapters || course.chapters.length === 0) {
      return { passed: 0, total: 0, avgScore: 0 };
    }
    const quizChapters = course.chapters.filter(ch => ch.quiz?.isGenerated);
    const passed = quizChapters.filter(ch => ch.quiz?.quizPassed).length;
    const totalScores = quizChapters.reduce((sum, ch) => sum + (ch.quiz?.bestScore || 0), 0);
    return {
      passed,
      total: quizChapters.length,
      avgScore: quizChapters.length > 0 ? Math.round(totalScores / quizChapters.length) : 0
    };
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return { bg: '#dcfce7', text: '#166534' };
      case 'failed': return { bg: '#fee2e2', text: '#991b1b' };
      case 'pending': return { bg: '#fef9c3', text: '#854d0e' };
      case 'not-started': return { bg: '#f3f4f6', text: '#6b7280' };
      default: return { bg: '#e0f2fe', text: '#0369a1' };
    }
  };

  if (loading) {
    return (
      <div className="parent-dashboard">
        <div className="parent-banner">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  // No children linked
  if (children.length === 0) {
    return (
      <div className="parent-dashboard">
        <div className="parent-banner">
          <h1>Welcome{parentName ? `, ${parentName}` : ''}</h1>
          <p>No children linked to your account yet</p>
        </div>
        <div className="parent-main-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Users size={64} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Link Your Children</h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Go to Settings → My Children to add your children by their email address.
          </p>
          <p style={{ color: '#6b7280' }}>
            Once linked, you'll be able to view their courses, assignments, and grades here.
          </p>
        </div>
      </div>
    );
  }

  const childNames = children.map(c => `${c.firstName} ${c.lastName}`).join(', ');
  const currentChildData = selectedChild ? childrenData[selectedChild] : null;
  const currentChild = children.find(c => c._id === selectedChild);

  return (
    <div className="parent-dashboard">
      {/* Top Banner */}
      <div className="parent-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Welcome{parentName ? `, ${parentName}` : ''}</h1>
          <p>Your children: {childNames}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#fff',
              fontSize: 12,
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Child Selector (if multiple children) */}
      {children.length > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          {children.map((child) => (
            <button
              key={child._id}
              onClick={() => setSelectedChild(child._id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: selectedChild === child._id ? '2px solid #2c3e50' : '1px solid #e5e7eb',
                backgroundColor: selectedChild === child._id ? '#eef2ff' : 'white',
                cursor: 'pointer',
                fontWeight: selectedChild === child._id ? 600 : 400,
              }}
            >
              {child.firstName} {child.lastName}
            </button>
          ))}
        </div>
      )}

      {/* Child Card */}
      {currentChild && (
        <div className="parent-main-card">
          {/* Header */}
          <div className="parent-main-card-header">
            <div className="parent-main-card-user">
              <div className="parent-avatar">
                {currentChild.profileImage ? (
                  <img src={currentChild.profileImage} alt={currentChild.firstName} />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '50%',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                  }}>
                    {currentChild.firstName?.charAt(0)}{currentChild.lastName?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h2>{currentChild.firstName} {currentChild.lastName}</h2>
                <span>{getGradeDisplay(currentChild)}</span>
              </div>
            </div>

            <div className="parent-overall-pill">
              Overall: {currentChildData?.stats?.averageGrade || 0}%
            </div>
          </div>

          {/* Stats Row */}
          <div className="parent-stats-row">
            <div className="parent-stat-card">
              <span className="parent-stat-title">
                <BookOpen size={16} style={{ marginRight: '4px' }} />
                Courses
              </span>
              <span className="parent-stat-main">{currentChildData?.stats?.totalCourses || 0}</span>
              <span className="parent-stat-sub">Enrolled</span>
            </div>

            <div className="parent-stat-card">
              <span className="parent-stat-title">
                <Trophy size={16} style={{ marginRight: '4px' }} />
                Quiz Avg
              </span>
              <span className="parent-stat-main" style={{ color: (currentChildData?.stats?.averageQuizScore || 0) >= 60 ? '#16a34a' : '#991b1b' }}>
                {currentChildData?.stats?.averageQuizScore || 0}%
              </span>
              <span className="parent-stat-sub">{currentChildData?.stats?.passedQuizzes || 0}/{currentChildData?.stats?.totalQuizzes || 0} Passed</span>
            </div>

            <div className="parent-stat-card">
              <span className="parent-stat-title">
                <FileText size={16} style={{ marginRight: '4px' }} />
                Assignments
              </span>
              <span className="parent-stat-main">{currentChildData?.stats?.completedAssignments || 0}/{currentChildData?.stats?.totalAssignments || 0}</span>
              <span className="parent-stat-sub">{currentChildData?.stats?.pendingAssignments || 0} Pending</span>
            </div>

            <div className="parent-stat-card">
              <span className="parent-stat-title">
                <Target size={16} style={{ marginRight: '4px' }} />
                Grade Avg
              </span>
              <span className="parent-stat-main" style={{ color: (currentChildData?.stats?.averageGrade || 0) >= 60 ? '#16a34a' : '#991b1b' }}>
                {currentChildData?.stats?.averageGrade || 0}%
              </span>
              <span className="parent-stat-sub">{getLetterGrade(currentChildData?.stats?.averageGrade || 0)}</span>
            </div>
          </div>


          {/* Courses Section with Chapters & Quizzes */}
          <div className="parent-subjects">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={20} />
              Enrolled Courses & Progress
            </h3>
            {currentChildData?.courses?.length > 0 ? (
              <div className="parent-subject-list">
                {currentChildData.courses.map((course) => {
                  const courseProgress = getCourseProgress(course);
                  const quizSummary = getQuizSummary(course);
                  return (
                  <div key={course._id} className="parent-subject-item" style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
                    {/* Course Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div className="parent-subject-name" style={{ fontWeight: 700, fontSize: 16 }}>{course.title}</div>
                        <div className="parent-subject-progress" style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
                          {course.subject || 'General'} • {course.grade || course.universityMajor || 'All Grades'}
                        </div>
                      </div>
                      <div style={{ 
                        padding: '4px 12px', 
                        borderRadius: 20, 
                        fontSize: 12, 
                        fontWeight: 600,
                        background: courseProgress.percentage === 100 ? '#dcfce7' : '#e0f2fe',
                        color: courseProgress.percentage === 100 ? '#166534' : '#0369a1'
                      }}>
                        {courseProgress.percentage === 100 ? '✅ Completed' : `${courseProgress.percentage}% Complete`}
                      </div>
                    </div>

                    {/* Course Progress Bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: '#6b7280' }}>Chapters: {courseProgress.completed}/{courseProgress.total}</span>
                        <span style={{ color: '#6b7280' }}>Quizzes Passed: {quizSummary.passed}/{quizSummary.total}</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${courseProgress.percentage}%`, 
                          height: '100%', 
                          background: courseProgress.percentage === 100 ? '#16a34a' : '#3b82f6',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      {quizSummary.total > 0 && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          Average Quiz Score: <b style={{ color: quizSummary.avgScore >= 60 ? '#16a34a' : '#991b1b' }}>{quizSummary.avgScore}%</b>
                        </div>
                      )}
                    </div>

                    {/* Chapters */}
                    {course.chapters && course.chapters.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#374151' }}>📚 Chapters & Quiz Grades</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {course.chapters.map((chapter) => {
                            const progress = chapter.progress || {};
                            const quiz = chapter.quiz || {};
                            const quizStatus = !quiz.isGenerated ? 'not-started' : 
                                               quiz.quizPassed ? 'passed' : 
                                               (quiz.attempts?.length > 0 ? 'failed' : 'pending');
                            const statusColors = getStatusColor(quizStatus);
                            
                            return (
                              <li key={chapter._id} style={{ marginBottom: 10, background: '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #f3f4f6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontWeight: 600, color: '#1f2937' }}>
                                        Chapter {chapter.chapterNumber}: {chapter.title}
                                      </span>
                                      {progress.chapterCompleted && <CheckCircle size={16} color="#16a34a" />}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                      {chapter.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                                      {progress.slidesViewed && ' • 📄 Slides Viewed'}
                                      {progress.allLecturesCompleted && ' • 🎥 Lectures Done'}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: 12, 
                                    fontSize: 11, 
                                    fontWeight: 600,
                                    background: progress.chapterCompleted ? '#dcfce7' : '#fef9c3',
                                    color: progress.chapterCompleted ? '#166534' : '#854d0e'
                                  }}>
                                    {progress.chapterCompleted ? 'Completed' : 'In Progress'}
                                  </div>
                                </div>
                                
                                {/* Quiz Details */}
                                {quiz.isGenerated && (
                                  <div style={{ marginTop: 8, padding: 10, background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0369a1' }}>📝 Quiz - {course.title}</span>
                                      <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: 10, 
                                        fontSize: 11, 
                                        fontWeight: 600,
                                        background: statusColors.bg,
                                        color: statusColors.text
                                      }}>
                                        {quizStatus === 'passed' && '✅ Passed'}
                                        {quizStatus === 'failed' && '❌ Not Passed'}
                                        {quizStatus === 'pending' && '⏳ Not Attempted'}
                                        {quizStatus === 'not-started' && '📋 No Quiz'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#4b5563' }}>
                                      <span>Attempts: <b>{quiz.attempts?.length || 0}</b></span>
                                      <span>Best Score: <b style={{ color: quiz.bestScore >= quiz.passingScore ? '#16a34a' : '#991b1b' }}>{quiz.bestScore || 0}%</b></span>
                                      <span>Passing: <b>{quiz.passingScore}%</b></span>
                                      <span>Grade: <b>{getLetterGrade(quiz.bestScore || 0)}</b></span>
                                    </div>
                                    
                                    {/* Quiz Attempts Table */}
                                    {quiz.attempts && quiz.attempts.length > 0 && (
                                      <div style={{ marginTop: 8, overflowX: 'auto' }}>
                                        <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                                          <thead>
                                            <tr style={{ background: '#f3f4f6' }}>
                                              <th style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>Attempt</th>
                                              <th style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>Score</th>
                                              <th style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>Grade</th>
                                              <th style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>Correct</th>
                                              <th style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>Result</th>
                                              <th style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>Date</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {quiz.attempts.map((a, idx) => (
                                              <tr key={idx} style={{ background: a.passed ? '#f0fdf4' : '#fef2f2' }}>
                                                <td style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>{a.attemptNumber}</td>
                                                <td style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 600 }}>{a.score}%</td>
                                                <td style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 600 }}>{getLetterGrade(a.score)}</td>
                                                <td style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>{a.correctAnswers}/{a.totalQuestions}</td>
                                                <td style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                                  {a.passed ? <CheckCircle size={14} color="#16a34a" /> : <XCircle size={14} color="#991b1b" />}
                                                </td>
                                                <td style={{ padding: 4, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                                  {a.attemptedAt ? new Date(a.attemptedAt).toLocaleDateString() : '-'}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#6b7280', padding: '1rem 0' }}>No courses enrolled yet.</p>
            )}
          </div>

          {/* Assignments Section */}
          <div className="parent-subjects" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={20} />
              Assignments & Grades
            </h3>

            {currentChildData?.assignments?.length > 0 ? (
              <div className="parent-subject-list">
                {currentChildData.assignments.map((assignment) => {
                  // Determine status styling
                  let statusInfo;
                  switch (assignment.status) {
                    case 'graded':
                      const passed = (assignment.grade || 0) >= 60;
                      statusInfo = { 
                        icon: passed ? <CheckCircle size={16} /> : <XCircle size={16} />, 
                        label: `${assignment.grade}% (${getLetterGrade(assignment.grade)})`, 
                        bg: passed ? '#dcfce7' : '#fee2e2', 
                        text: passed ? '#166534' : '#991b1b' 
                      };
                      break;
                    case 'submitted':
                      statusInfo = { 
                        icon: <Clock size={16} />, 
                        label: 'Submitted - Awaiting Grade', 
                        bg: '#e0f2fe', 
                        text: '#0369a1' 
                      };
                      break;
                    case 'overdue':
                      statusInfo = { 
                        icon: <XCircle size={16} />, 
                        label: 'Overdue - Not Submitted', 
                        bg: '#fee2e2', 
                        text: '#991b1b' 
                      };
                      break;
                    default: // pending
                      statusInfo = { 
                        icon: <AlertCircle size={16} />, 
                        label: 'Pending', 
                        bg: '#fef9c3', 
                        text: '#854d0e' 
                      };
                  }
                  
                  const dueDate = new Date(assignment.dueDate);
                  const isOverdue = assignment.status === 'overdue';
                  
                  return (
                    <div key={assignment._id} className="parent-subject-item" style={{ 
                      padding: 14, 
                      marginBottom: 10, 
                      background: '#fff', 
                      borderRadius: 10, 
                      border: isOverdue ? '2px solid #fecaca' : '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: '#1f2937' }}>{assignment.title}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <span>📚 {assignment.course?.title || 'Unknown Course'}</span>
                            {assignment.course?.grade && <span>• {assignment.course.grade}</span>}
                            <span style={{ color: isOverdue ? '#991b1b' : '#6b7280' }}>
                              📅 Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {assignment.points && <span>• {assignment.points} pts</span>}
                          </div>
                          {assignment.submittedAt && (
                            <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
                              ✓ Submitted: {new Date(assignment.submittedAt).toLocaleString()}
                              {assignment.fileName && <span> ({assignment.fileName})</span>}
                            </div>
                          )}
                        </div>
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            borderRadius: 16,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.text,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>
                      </div>
                      
                      {/* Grade details if graded */}
                      {assignment.isGraded && (
                        <div style={{ 
                          marginTop: 10, 
                          padding: 10, 
                          background: (assignment.grade || 0) >= 60 ? '#f0fdf4' : '#fef2f2', 
                          borderRadius: 6,
                          border: `1px solid ${(assignment.grade || 0) >= 60 ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 13 }}>
                              <span style={{ fontWeight: 600, color: '#374151' }}>Grade: </span>
                              <span style={{ 
                                fontWeight: 700, 
                                fontSize: 16, 
                                color: (assignment.grade || 0) >= 60 ? '#16a34a' : '#dc2626' 
                              }}>
                                {assignment.grade}% ({getLetterGrade(assignment.grade)})
                              </span>
                              {assignment.points && (
                                <span style={{ color: '#6b7280', marginLeft: 8 }}>
                                  ({Math.round((assignment.grade / 100) * assignment.points)}/{assignment.points} pts)
                                </span>
                              )}
                            </div>
                            <div style={{ 
                              padding: '2px 8px', 
                              borderRadius: 10, 
                              fontSize: 11, 
                              fontWeight: 600,
                              background: (assignment.grade || 0) >= 60 ? '#dcfce7' : '#fee2e2',
                              color: (assignment.grade || 0) >= 60 ? '#166534' : '#991b1b'
                            }}>
                              {(assignment.grade || 0) >= 60 ? '✅ Passed' : '❌ Failed'}
                            </div>
                          </div>
                          {assignment.feedback && (
                            <div style={{ marginTop: 8, fontSize: 12, color: '#4b5563' }}>
                              <span style={{ fontWeight: 600 }}>💬 Teacher Feedback:</span>
                              <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>{assignment.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: 8 }}>
                <AlertCircle size={32} color="#9ca3af" style={{ marginBottom: 8 }} />
                <p style={{ color: '#6b7280', margin: 0 }}>No assignments yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}