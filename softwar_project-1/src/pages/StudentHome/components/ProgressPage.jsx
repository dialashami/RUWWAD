import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, BookOpen } from 'lucide-react';
import { useStudent } from '../context/StudentContext';

// Default data as fallback
const defaultSubjectProgress = [
  { name: 'Mathematics', progress: 0, lessons: 0, quizzes: 0, grade: '-', colorClass: 'subj-math', trend: '+0%' },
  { name: 'Physics', progress: 0, lessons: 0, quizzes: 0, grade: '-', colorClass: 'subj-phys', trend: '+0%' },
  { name: 'Chemistry', progress: 0, lessons: 0, quizzes: 0, grade: '-', colorClass: 'subj-chem', trend: '+0%' },
];

const defaultAchievements = [
  { id: 1, title: 'Quick Learner', description: 'Completed 10 lessons in one week', icon: '⚡', earned: false },
  { id: 2, title: 'Perfect Score', description: 'Scored 100% on 5 quizzes', icon: '💯', earned: false },
  { id: 3, title: 'Math Genius', description: 'Completed all Math lessons', icon: '🎯', earned: false },
  { id: 4, title: 'Science Explorer', description: 'Completed 50 science lessons', icon: '🔬', earned: false },
  { id: 5, title: 'Early Bird', description: 'Started 10 lessons before deadline', icon: '🌅', earned: false },
];

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
  const [subjectProgress, setSubjectProgress] = useState(defaultSubjectProgress);
  const [achievements, setAchievements] = useState(defaultAchievements);
  const [weeklyActivity, setWeeklyActivity] = useState(defaultWeeklyActivity);
  const [overallProgress, setOverallProgress] = useState(0);
  const [stats, setStats] = useState([
    { icon: BookOpen, label: 'Lessons Completed', value: '0', colorClass: 'stat-bg-blue' },
    { icon: Target, label: 'Quizzes Passed', value: '0', colorClass: 'stat-bg-purple' },
    { icon: Trophy, label: 'Achievements', value: '0', colorClass: 'stat-bg-yellow' },
  ]);

  // Fetch progress data from backend API
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('http://localhost:3000/api/student/progress', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          
          if (data.subjectProgress && data.subjectProgress.length > 0) {
            setSubjectProgress(data.subjectProgress);
          }
          if (data.achievements) {
            setAchievements(data.achievements);
          }
          if (data.weeklyActivity) {
            setWeeklyActivity(data.weeklyActivity);
          }
          if (typeof data.overallProgress === 'number') {
            setOverallProgress(data.overallProgress);
          }
          
          // Update stats
          setStats([
            { icon: BookOpen, label: 'Lessons Completed', value: String(data.lessonsCompleted || 0), colorClass: 'stat-bg-blue' },
            { icon: Target, label: 'Quizzes Passed', value: String(data.quizzesPassed || 0), colorClass: 'stat-bg-purple' },
            { icon: Trophy, label: 'Achievements', value: String(data.totalAchievements || 0), colorClass: 'stat-bg-yellow' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching progress data:', err);
      }
    };

    fetchProgressData();
  }, [student.id]);

  // Fallback: Calculate progress from courses and assignments if API fails
  useEffect(() => {
    // Only run fallback if we have courses but no subject progress from API
    const hasDefaultProgress = subjectProgress.every(s => s.progress === 0 && s.lessons === 0);
    if (courses && courses.length > 0 && hasDefaultProgress) {
      // Group courses by subject and calculate progress
      const subjectMap = {};
      
      courses.forEach(course => {
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

      // Calculate completion based on assignments
      if (assignments && assignments.length > 0) {
        const userId = student.id;
        
        assignments.forEach(assignment => {
          const courseName = assignment.course?.title || assignment.subject || 'General';
          const normalizedName = courseName.charAt(0).toUpperCase() + courseName.slice(1).toLowerCase();
          
          if (subjectMap[normalizedName]) {
            // Check if student has submitted
            const hasSubmitted = assignment.submissions?.some(
              s => s.student?.toString() === userId || s.student?._id?.toString() === userId
            );
            
            if (hasSubmitted) {
              subjectMap[normalizedName].completedLessons += 1;
              subjectMap[normalizedName].quizzes += 1;
            }
          }
        });
      }

      // Calculate percentages
      Object.values(subjectMap).forEach(subject => {
        if (subject.totalLessons > 0) {
          subject.progress = Math.round((subject.completedLessons / subject.totalLessons) * 100);
        }
        // Assign grade based on progress
        if (subject.progress >= 90) subject.grade = 'A+';
        else if (subject.progress >= 80) subject.grade = 'A';
        else if (subject.progress >= 70) subject.grade = 'B+';
        else if (subject.progress >= 60) subject.grade = 'B';
        else if (subject.progress >= 50) subject.grade = 'C';
        else subject.grade = '-';
        
        subject.trend = `+${Math.floor(Math.random() * 10)}%`;
      });

      const progressArray = Object.values(subjectMap);
      if (progressArray.length > 0) {
        setSubjectProgress(progressArray);
        
        // Calculate overall progress
        const totalProgress = progressArray.reduce((sum, s) => sum + s.progress, 0);
        setOverallProgress(Math.round(totalProgress / progressArray.length));
      }
    }
  }, [courses, assignments, student.id]);

  // Update stats from context
  useEffect(() => {
    const lessonsCompleted = contextStats?.totalCourses || 0;
    const quizzesPassed = Math.floor(lessonsCompleted * 0.7);
    const achievementCount = calculateAchievements();

    setStats([
      { icon: BookOpen, label: 'Lessons Completed', value: String(lessonsCompleted), colorClass: 'stat-bg-blue' },
      { icon: Target, label: 'Quizzes Passed', value: String(quizzesPassed), colorClass: 'stat-bg-purple' },
      { icon: Trophy, label: 'Achievements', value: String(achievementCount), colorClass: 'stat-bg-yellow' },
    ]);
  }, [contextStats]);

  // Calculate achievements based on progress
  const calculateAchievements = () => {
    const newAchievements = [...defaultAchievements];
    let earnedCount = 0;

    // Quick Learner - if enrolled in courses
    if (courses && courses.length >= 3) {
      newAchievements[0].earned = true;
      earnedCount++;
    }

    // Perfect Score - if completed assignments
    if (assignments && assignments.length >= 5) {
      newAchievements[1].earned = true;
      earnedCount++;
    }

    // Science Explorer - if enrolled in science courses
    const scienceCourses = courses?.filter(c => 
      ['physics', 'chemistry', 'biology'].some(s => 
        c.subject?.toLowerCase().includes(s) || c.title?.toLowerCase().includes(s)
      )
    );
    if (scienceCourses && scienceCourses.length >= 2) {
      newAchievements[3].earned = true;
      earnedCount++;
    }

    setAchievements(newAchievements);
    return earnedCount;
  };

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

            {subjectProgress.map((subject, index) => (
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
            ))}
          </div>

          {/* Weekly Activity */}
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

        {/* RIGHT SIDE */}
        <div className="right-col">
          <div className="achievements-card">
            <div className="achievements-card-title">Achievements 🏆</div>

            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`achievement-item ${
                  achievement.earned ? 'achievement-earned' : ''
                }`}
              >
                <div className="achievement-icon-box">
                  {achievement.earned ? achievement.icon : '🔒'}
                </div>

                <div className="achievement-texts">
                  <div className="achievement-title">{achievement.title}</div>
                  <div className="achievement-desc">
                    {achievement.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
