import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, BookOpen } from 'lucide-react';
import { useStudent } from '../context/StudentContext';

const defaultWeeklyActivity = [
  { day: 'Mon', hours: 0 },
  { day: 'Tue', hours: 0 },
  { day: 'Wed', hours: 0 },
  { day: 'Thu', hours: 0 },
  { day: 'Fri', hours: 0 },
  { day: 'Sat', hours: 0 },
  { day: 'Sun', hours: 0 },
];

export default function ProgressPage() {
  const { 
    student, 
    stats: contextStats, 
    progress: contextProgress,
    courses,
    assignments,
    loading 
  } = useStudent();

  // Local state for progress data
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState(defaultWeeklyActivity);
  const [overallProgress, setOverallProgress] = useState(0);
  const [stats, setStats] = useState([
    { icon: BookOpen, label: 'Lessons Completed', value: '0', colorClass: 'stat-bg-blue' },
    { icon: Target, label: 'Quizzes Passed', value: '0', colorClass: 'stat-bg-purple' },
    { icon: Trophy, label: 'Achievements', value: '0', colorClass: 'stat-bg-yellow' },
  ]);

  const getStudentId = () => {
    if (student?.id) return student.id;
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser);
      return parsed?._id || parsed?.id || null;
    } catch {
      return null;
    }
  };

  const normalizeWeeklyActivity = (activity = []) => {
    const byDay = activity.reduce((acc, item) => {
      if (item?.day) acc[item.day] = item.hours || 0;
      return acc;
    }, {});

    return defaultWeeklyActivity.map(day => ({
      day: day.day,
      hours: byDay[day.day] ?? day.hours,
    }));
  };

  const calculateSubmittedAssignments = (userId) => {
    if (!assignments || assignments.length === 0 || !userId) return 0;
    return assignments.filter(assignment =>
      assignment.submissions?.some(
        s => s.student?.toString() === userId || s.student?._id?.toString() === userId || s.student === userId
      )
    ).length;
  };

  const buildSubjectProgress = (userId) => {
    const subjectMap = {};

    (courses || []).forEach(course => {
      const subjectName = course.subject || course.title || 'General';
      const normalizedName = subjectName.charAt(0).toUpperCase() + subjectName.slice(1).toLowerCase();

      if (!subjectMap[normalizedName]) {
        subjectMap[normalizedName] = {
          name: normalizedName,
          progress: 0,
          lessons: 0,
          quizzes: 0,
          grade: '-',
          colorClass: getColorClass(normalizedName),
          trend: '+0%',
          totalLessons: 0,
          completedLessons: 0,
        };
      }

      subjectMap[normalizedName].totalLessons += course.lessons?.length || 1;
      subjectMap[normalizedName].lessons = subjectMap[normalizedName].totalLessons;
    });

    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        const courseName = assignment.course?.title || assignment.subject || 'General';
        const normalizedName = courseName.charAt(0).toUpperCase() + courseName.slice(1).toLowerCase();

        if (subjectMap[normalizedName]) {
          const hasSubmitted = assignment.submissions?.some(
            s => s.student?.toString() === userId || s.student?._id?.toString() === userId || s.student === userId
          );

          if (hasSubmitted) {
            subjectMap[normalizedName].completedLessons += 1;
            subjectMap[normalizedName].quizzes += 1;
          }
        }
      });
    }

    Object.values(subjectMap).forEach(subject => {
      if (subject.totalLessons > 0) {
        subject.progress = Math.round((subject.completedLessons / subject.totalLessons) * 100);
      }
      if (subject.progress >= 90) subject.grade = 'A+';
      else if (subject.progress >= 80) subject.grade = 'A';
      else if (subject.progress >= 70) subject.grade = 'B+';
      else if (subject.progress >= 60) subject.grade = 'B';
      else if (subject.progress >= 50) subject.grade = 'C';
      else subject.grade = '-';
    });

    return Object.values(subjectMap);
  };

  const buildWeeklyActivityFromSubmissions = (userId) => {
    if (!assignments || assignments.length === 0 || !userId) return defaultWeeklyActivity;
    const now = new Date();
    const last7Days = new Date();
    last7Days.setDate(now.getDate() - 6);

    const dayMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    assignments.forEach(assignment => {
      assignment.submissions?.forEach(submission => {
        const submissionStudent = submission.student?._id || submission.student;
        if (submissionStudent?.toString() !== userId?.toString()) return;

        const submittedAt = submission.submittedAt ? new Date(submission.submittedAt) : null;
        if (!submittedAt || submittedAt < last7Days) return;

        const dayLabel = submittedAt.toLocaleDateString('en-US', { weekday: 'short' });
        if (dayMap[dayLabel] !== undefined) {
          dayMap[dayLabel] += 1;
        }
      });
    });

    return defaultWeeklyActivity.map(day => ({
      day: day.day,
      hours: dayMap[day.day] || 0,
    }));
  };

  const calculateAchievements = (lessonsCompleted, quizzesPassed) => {
    let earnedCount = 0;

    if (lessonsCompleted >= 10) {
      earnedCount++;
    }

    if (quizzesPassed >= 5) {
      earnedCount++;
    }

    const mathCourses = courses?.filter(c =>
      c.subject?.toLowerCase().includes('math') || c.title?.toLowerCase().includes('math')
    );
    if (mathCourses && mathCourses.length >= 1) {
      earnedCount++;
    }

    const scienceCourses = courses?.filter(c =>
      ['physics', 'chemistry', 'biology'].some(s =>
        c.subject?.toLowerCase().includes(s) || c.title?.toLowerCase().includes(s)
      )
    );
    if (scienceCourses && scienceCourses.length >= 2) {
      earnedCount++;
    }

    const submittedAssignments = calculateSubmittedAssignments(getStudentId());
    if (submittedAssignments >= 10) {
      earnedCount++;
    }

    return earnedCount;
  };

  useEffect(() => {
    const userId = getStudentId();
    const progressData = contextProgress || {};

    const normalizedSubjects = (progressData.subjectProgress && progressData.subjectProgress.length > 0)
      ? progressData.subjectProgress.map(subject => ({
          ...subject,
          colorClass: subject.colorClass || getColorClass(subject.name || ''),
          lessons: subject.lessons ?? subject.totalLessons ?? 0,
          quizzes: subject.quizzes ?? 0,
          grade: subject.grade ?? '-',
          trend: subject.trend ?? '+0%',
        }))
      : buildSubjectProgress(userId);

    const totalAssignments = assignments?.length || 0;
    const submittedAssignments = calculateSubmittedAssignments(userId);
    const overall = typeof progressData.overallProgress === 'number'
      ? progressData.overallProgress
      : (totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0);

    const lessonsCompleted = progressData.lessonsCompleted ?? contextStats?.totalCourses ?? submittedAssignments;
    const quizzesPassed = progressData.quizzesPassed ?? Math.floor(lessonsCompleted * 0.7);
    const achievementCount = progressData.totalAchievements ?? calculateAchievements(lessonsCompleted, quizzesPassed);

    setSubjectProgress(normalizedSubjects);
    setOverallProgress(overall);
    setWeeklyActivity(
      progressData.weeklyActivity && progressData.weeklyActivity.length > 0
        ? normalizeWeeklyActivity(progressData.weeklyActivity)
        : buildWeeklyActivityFromSubmissions(userId)
    );

    setStats([
      { icon: BookOpen, label: 'Lessons Completed', value: String(lessonsCompleted || 0), colorClass: 'stat-bg-blue' },
      { icon: Target, label: 'Quizzes Passed', value: String(quizzesPassed || 0), colorClass: 'stat-bg-purple' },
      { icon: Trophy, label: 'Achievements', value: String(achievementCount || 0), colorClass: 'stat-bg-yellow' },
    ]);
  }, [contextProgress, contextStats, courses, assignments, student.id]);

  // Helper function to get color class
  const getColorClass = (subject) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('math')) return 'subj-math';
    if (subjectLower.includes('phys')) return 'subj-phys';
    if (subjectLower.includes('chem')) return 'subj-chem';
    if (subjectLower.includes('bio')) return 'subj-bio';
    if (subjectLower.includes('eng')) return 'subj-eng';
    if (subjectLower.includes('arab')) return 'subj-arab';
    return 'subj-default';
  };

  const maxHours = Math.max(...weeklyActivity.map(d => d.hours), 1);

  return (
    <div className="progress-page-wrapper">
      {/* Header */}
      <div>
        <h1 className="progress-header-title">My Progress </h1>
        <p className="progress-header-subtitle">
          Track your learning journey and achievements
        </p>
        {loading && (
          <p className="progress-header-subtitle">Loading progress data...</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="stat-card">
                <div className="stat-card-row">
                  <div className={`stat-card-icon ${stat.colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="stat-card-label">{stat.label}</p>
                    <p className="stat-card-value">{stat.value}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="main-grid">
        {/* LEFT SIDE */}
        <div className="left-col">
          {/* Overall Progress */}
          <div className="overall-progress-card">
            <div className="overall-progress-top">
              <div>
                <div className="overall-progress-left-title">Overall Progress</div>
                <div className="overall-progress-left-sub">
                  You're doing great! Keep it up 🎉
                </div>
              </div>
              <div className="overall-progress-percent">{overallProgress}%</div>
            </div>
            <div className="overall-progress-bar-wrapper">
              <div
                className="overall-progress-bar-fill"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Progress by Subject */}
          <div className="subject-card">
            <div className="subject-card-title">Progress by Subject</div>

            {subjectProgress.length === 0 ? (
              <div className="subject-row">
                <div className="subject-text-sub">No subject progress available yet.</div>
              </div>
            ) : (
              subjectProgress.map((subject, index) => (
                <motion.div
                  key={subject.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="subject-row"
                >
                  <div className="subject-row-header">
                    <div className="subject-left">
                      <div className={`subject-icon-bubble ${subject.colorClass}`}>
                        {subject.name[0]}
                      </div>
                      <div>
                        <div className="subject-text-title">{subject.name}</div>
                        <div className="subject-text-sub">
                          {subject.lessons} lessons • {subject.quizzes} quizzes
                        </div>
                      </div>
                    </div>

                    <div className="subject-right">
                      <div className="grade-badge">Grade: {subject.grade}</div>
                      <div className="subject-numbers">
                        <div className="subject-percent">{subject.progress}%</div>
                        <div className="subject-trend">{subject.trend}</div>
                      </div>
                    </div>
                  </div>

                  <div className="subject-progress-track">
                    <div
                      className="subject-progress-fill"
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="right-col">
          <div className="weekly-card">
            <div className="weekly-card-title">Weekly Activity</div>

            <div className="weekly-bars-wrapper">
              {weeklyActivity.map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="weekly-bar-col"
                >
                  <div className="weekly-bar-outer">
                    <div
                      className="weekly-bar-inner"
                      style={{ height: `${(day.hours / maxHours) * 160}px` }}
                    ></div>
                  </div>
                  <div className="weekly-day">{day.day}</div>
                  <div className="weekly-hours">{day.hours}h</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
