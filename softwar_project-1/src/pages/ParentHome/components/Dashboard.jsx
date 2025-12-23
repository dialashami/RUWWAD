import React, { useState, useEffect } from "react";
import { Users, BookOpen, Trophy, Target, Clock } from "lucide-react";

export default function Dashboard() {
  const [children, setChildren] = useState([]);
  const [childrenData, setChildrenData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [parentName, setParentName] = useState("");


  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Get parent name from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setParentName(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim());
        }

        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch linked children
        const childrenRes = await fetch('http://localhost:3000/api/users/children', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (childrenRes.ok) {
          const childrenList = await childrenRes.json();
          setChildren(childrenList || []);
          
          // Fetch dashboard data for each child
          const dashboardData = {};
          for (const child of childrenList) {
            try {
              const dashRes = await fetch(`http://localhost:3000/api/users/children/${child._id}/dashboard`, {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              if (dashRes.ok) {
                dashboardData[child._id] = await dashRes.json();
              }
            } catch (err) {
              console.error(`Error fetching dashboard for child ${child._id}:`, err);
            }
          }
          setChildrenData(dashboardData);
          
          // Select first child by default
          if (childrenList.length > 0) {
            setSelectedChild(childrenList[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching children data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="parent-banner">
        <h1>Welcome{parentName ? `, ${parentName}` : ''}</h1>
        <p>Your children: {childNames}</p>
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
                border: selectedChild === child._id ? '2px solid #6366f1' : '1px solid #e5e7eb',
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
                Average
              </span>
              <span className="parent-stat-main">{currentChildData?.stats?.averageGrade || 0}%</span>
              <span className="parent-stat-sub">Score</span>
            </div>

            <div className="parent-stat-card">
              <span className="parent-stat-title">
                <Target size={16} style={{ marginRight: '4px' }} />
                Assignments
              </span>
              <span className="parent-stat-main">{currentChildData?.stats?.pendingAssignments || 0}</span>
              <span className="parent-stat-sub">Pending</span>
            </div>

            <div className="parent-stat-card">
              <span className="parent-stat-title">
                <Clock size={16} style={{ marginRight: '4px' }} />
                Completed
              </span>
              <span className="parent-stat-main">{currentChildData?.stats?.completedAssignments || 0}</span>
              <span className="parent-stat-sub">Assignments</span>
            </div>
          </div>

          {/* Courses Section */}
          <div className="parent-subjects">
            <h3>Enrolled Courses</h3>

            {currentChildData?.courses?.length > 0 ? (
              <div className="parent-subject-list">
                {currentChildData.courses.map((course) => (
                  <div key={course._id} className="parent-subject-item">
                    <div>
                      <div className="parent-subject-name">{course.title}</div>
                      <div className="parent-subject-progress">
                        {course.subject || 'General'} • {course.grade || 'All Grades'}
                      </div>
                    </div>
                    <div className="parent-grade-pill" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      {course.lessons?.length || 0} lessons
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', padding: '1rem 0' }}>No courses enrolled yet.</p>
            )}
          </div>

          {/* Assignments Section */}
          <div className="parent-subjects" style={{ marginTop: '1.5rem' }}>
            <h3>Assignments & Grades</h3>

            {currentChildData?.assignments?.length > 0 ? (
              <div className="parent-subject-list">
                {currentChildData.assignments.map((assignment) => (
                  <div key={assignment._id} className="parent-subject-item">
                    <div>
                      <div className="parent-subject-name">{assignment.title}</div>
                      <div className="parent-subject-progress">
                        {assignment.course?.title || 'Unknown Course'} • 
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div 
                      className="parent-grade-pill"
                      style={{
                        backgroundColor: assignment.isGraded 
                          ? (assignment.grade >= 80 ? '#dcfce7' : assignment.grade >= 60 ? '#fef9c3' : '#fee2e2')
                          : (assignment.submitted ? '#e0f2fe' : '#f3f4f6'),
                        color: assignment.isGraded
                          ? (assignment.grade >= 80 ? '#166534' : assignment.grade >= 60 ? '#854d0e' : '#991b1b')
                          : (assignment.submitted ? '#0369a1' : '#6b7280'),
                      }}
                    >
                      {assignment.isGraded 
                        ? `${assignment.grade}% (${getLetterGrade(assignment.grade)})`
                        : (assignment.submitted ? 'Submitted' : 'Pending')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', padding: '1rem 0' }}>No assignments yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}