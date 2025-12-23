const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/user_model');

// Student dashboard: aggregate key stats and recent activity for logged-in student
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || userPayload.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }

    // Get the student's full profile for grade/major info
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Build grade filter based on student type
    const gradeFilter = {};
    if (student.studentType === 'school' && student.schoolGrade) {
      // Match courses with this school grade
      const normalizedGrade = student.schoolGrade.toLowerCase().replace(/\s+/g, '');
      gradeFilter.$or = [
        { grade: student.schoolGrade },
        { grade: new RegExp(normalizedGrade, 'i') },
        { grade: new RegExp(student.schoolGrade.replace('grade', 'Grade '), 'i') },
      ];
    } else if (student.studentType === 'university' && student.universityMajor) {
      // Match courses with this university major
      gradeFilter.grade = new RegExp(student.universityMajor, 'i');
    }

    // Fetch courses, assignments, messages, notifications in parallel
    const [courses, assignments, messages, notifications] = await Promise.all([
      Course.find({ ...gradeFilter, isActive: true })
        .populate('teacher', 'firstName lastName')
        .sort({ createdAt: -1 }),
      Assignment.find(gradeFilter)
        .populate('course', 'title')
        .populate('teacher', 'firstName lastName')
        .sort({ dueDate: 1 }),
      Message.find({ $or: [{ sender: userId }, { receiver: userId }] })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('sender receiver', 'firstName lastName'),
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    // Calculate stats
    const totalCourses = courses.length;
    const totalAssignments = assignments.length;
    
    // Pending assignments (not yet submitted by this student)
    const pendingAssignments = assignments.filter(a => {
      const hasSubmitted = a.submissions && a.submissions.some(
        s => s.student && s.student.toString() === userId
      );
      return !hasSubmitted && new Date(a.dueDate) >= new Date();
    }).length;

    // Overdue assignments
    const overdueAssignments = assignments.filter(a => {
      const hasSubmitted = a.submissions && a.submissions.some(
        s => s.student && s.student.toString() === userId
      );
      return !hasSubmitted && new Date(a.dueDate) < new Date();
    }).length;

    // Unread messages
    const unreadMessages = messages.filter(
      m => m.receiver && m.receiver._id && m.receiver._id.toString() === userId && !m.isRead
    ).length;

    // Unread notifications
    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    // Today's schedule (assignments due today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySchedule = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });

    // Recent activity (mix of assignments and notifications)
    const recentActivities = [
      ...assignments.slice(0, 5).map(a => ({
        type: 'assignment',
        id: a._id,
        title: a.title,
        description: `Due: ${new Date(a.dueDate).toLocaleDateString()}`,
        createdAt: a.createdAt,
      })),
      ...notifications.slice(0, 5).map(n => ({
        type: 'notification',
        id: n._id,
        title: n.title,
        description: n.body,
        createdAt: n.createdAt,
        isRead: n.isRead,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    return res.json({
      studentId: userId,
      studentName: `${student.firstName} ${student.lastName}`,
      stats: {
        totalCourses,
        totalAssignments,
        pendingAssignments,
        overdueAssignments,
        unreadMessages,
        unreadNotifications,
      },
      courses: courses.slice(0, 6), // limit for dashboard display
      assignments: assignments.slice(0, 6),
      todaySchedule,
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
};

// Get detailed progress data for student
exports.getProgress = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || userPayload.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }

    // Get the student's full profile
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Build grade filter
    const gradeFilter = {};
    if (student.studentType === 'school' && student.schoolGrade) {
      const normalizedGrade = student.schoolGrade.toLowerCase().replace(/\s+/g, '');
      gradeFilter.$or = [
        { grade: student.schoolGrade },
        { grade: new RegExp(normalizedGrade, 'i') },
        { grade: new RegExp(student.schoolGrade.replace('grade', 'Grade '), 'i') },
      ];
    } else if (student.studentType === 'university' && student.universityMajor) {
      gradeFilter.grade = new RegExp(student.universityMajor, 'i');
    }

    // Fetch courses and assignments
    const [courses, assignments] = await Promise.all([
      Course.find({ ...gradeFilter, isActive: true })
        .populate('teacher', 'firstName lastName')
        .sort({ createdAt: -1 }),
      Assignment.find(gradeFilter)
        .populate('course', 'title subject')
        .sort({ dueDate: 1 }),
    ]);

    // Calculate subject progress
    const subjectMap = {};
    
    courses.forEach(course => {
      const subject = course.subject || course.title || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          name: subject,
          progress: 0,
          lessons: 0,
          quizzes: 0,
          grade: '-',
          colorClass: getSubjectColorClass(subject),
          trend: '+0%',
          totalLessons: 0,
          completedLessons: 0,
        };
      }
      subjectMap[subject].totalLessons += course.lessons?.length || 1;
      subjectMap[subject].lessons = subjectMap[subject].totalLessons;
    });

    // Calculate completion based on assignments
    let totalSubmitted = 0;
    let totalGraded = 0;
    let totalScore = 0;

    assignments.forEach(assignment => {
      const courseName = assignment.course?.subject || assignment.course?.title || 'General';
      
      // Check if student has submitted
      const studentSubmission = assignment.submissions?.find(
        s => s.student?.toString() === userId
      );
      
      if (studentSubmission) {
        totalSubmitted++;
        
        if (subjectMap[courseName]) {
          subjectMap[courseName].completedLessons += 1;
          subjectMap[courseName].quizzes += 1;
        }
        
        if (studentSubmission.isGraded && studentSubmission.grade) {
          totalGraded++;
          totalScore += studentSubmission.grade;
        }
      }
    });

    // Calculate percentages and grades
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
    });

    const subjectProgress = Object.values(subjectMap);
    
    // Calculate overall progress
    const overallProgress = subjectProgress.length > 0
      ? Math.round(subjectProgress.reduce((sum, s) => sum + s.progress, 0) / subjectProgress.length)
      : 0;

    // Calculate achievements
    const achievements = calculateAchievements(courses, assignments, totalSubmitted, userId);

    // Weekly activity (placeholder - would need activity tracking)
    const weeklyActivity = [
      { day: 'Mon', hours: Math.random() * 3 + 1 },
      { day: 'Tue', hours: Math.random() * 3 + 1 },
      { day: 'Wed', hours: Math.random() * 3 + 1 },
      { day: 'Thu', hours: Math.random() * 3 + 1 },
      { day: 'Fri', hours: Math.random() * 3 + 1 },
      { day: 'Sat', hours: Math.random() * 4 + 2 },
      { day: 'Sun', hours: Math.random() * 4 + 2 },
    ].map(d => ({ ...d, hours: Math.round(d.hours * 10) / 10 }));

    return res.json({
      overallProgress,
      subjectProgress,
      weeklyActivity,
      achievements,
      lessonsCompleted: totalSubmitted,
      quizzesPassed: totalGraded,
      totalAchievements: achievements.filter(a => a.earned).length,
      averageScore: totalGraded > 0 ? Math.round(totalScore / totalGraded) : 0,
    });
  } catch (err) {
    next(err);
  }
};

// Update student notification preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { emailNotifications, pushNotifications, assignmentReminders, gradeNotifications } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update preferences (store in user document)
    user.preferences = {
      ...user.preferences,
      emailNotifications: emailNotifications ?? user.preferences?.emailNotifications ?? true,
      pushNotifications: pushNotifications ?? user.preferences?.pushNotifications ?? true,
      assignmentReminders: assignmentReminders ?? user.preferences?.assignmentReminders ?? true,
      gradeNotifications: gradeNotifications ?? user.preferences?.gradeNotifications ?? true,
    };

    await user.save();

    return res.json({ 
      message: 'Preferences updated successfully',
      preferences: user.preferences 
    });
  } catch (err) {
    console.error('Error updating preferences:', err);
    next(err);
  }
};

// Helper function to get color class for subject
function getSubjectColorClass(subject) {
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('math')) return 'subj-math';
  if (subjectLower.includes('phys')) return 'subj-phys';
  if (subjectLower.includes('chem')) return 'subj-chem';
  if (subjectLower.includes('bio')) return 'subj-bio';
  if (subjectLower.includes('eng')) return 'subj-eng';
  if (subjectLower.includes('arab')) return 'subj-arab';
  return 'subj-default';
}

// Helper function to calculate achievements
function calculateAchievements(courses, assignments, totalSubmitted, userId) {
  const achievements = [
    { id: 1, title: 'Quick Learner', description: 'Enrolled in 3+ courses', icon: '⚡', earned: false },
    { id: 2, title: 'Perfect Score', description: 'Submitted 5+ assignments', icon: '💯', earned: false },
    { id: 3, title: 'Math Genius', description: 'Completed all Math lessons', icon: '🎯', earned: false },
    { id: 4, title: 'Science Explorer', description: 'Enrolled in 2+ science courses', icon: '🔬', earned: false },
    { id: 5, title: 'Early Bird', description: 'Started learning journey', icon: '🌅', earned: false },
  ];

  // Quick Learner - enrolled in 3+ courses
  const enrolledCourses = courses.filter(c => 
    c.students?.some(s => s?.toString() === userId)
  );
  if (enrolledCourses.length >= 3) {
    achievements[0].earned = true;
  }

  // Perfect Score - submitted 5+ assignments
  if (totalSubmitted >= 5) {
    achievements[1].earned = true;
  }

  // Math Genius - enrolled in math course
  const mathCourses = courses.filter(c => 
    c.subject?.toLowerCase().includes('math') || c.title?.toLowerCase().includes('math')
  );
  if (mathCourses.length > 0 && enrolledCourses.some(c => 
    c.subject?.toLowerCase().includes('math') || c.title?.toLowerCase().includes('math')
  )) {
    achievements[2].earned = true;
  }

  // Science Explorer - enrolled in 2+ science courses
  const scienceCourses = enrolledCourses.filter(c => 
    ['physics', 'chemistry', 'biology', 'science'].some(s => 
      c.subject?.toLowerCase().includes(s) || c.title?.toLowerCase().includes(s)
    )
  );
  if (scienceCourses.length >= 2) {
    achievements[3].earned = true;
  }

  // Early Bird - has started learning (enrolled in any course)
  if (enrolledCourses.length > 0 || totalSubmitted > 0) {
    achievements[4].earned = true;
  }

  return achievements;
}
