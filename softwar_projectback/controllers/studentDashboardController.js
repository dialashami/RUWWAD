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

    // Check if userId is a valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({
        overallProgress: 0,
        subjectProgress: [],
        weeklyStats: { lessonsCompleted: 0, assignmentsSubmitted: 0, hoursSpent: 0 },
        achievements: [],
        coursesCount: 0,
        assignmentsCount: 0,
      });
    }

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

    // Calculate subject progress based on VIDEO PROGRESS
    const subjectMap = {};
    let totalWatchedVideos = 0;
    let totalVideos = 0;
    
    courses.forEach(course => {
      const subject = course.subject || course.title || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          name: subject,
          progress: 0,
          totalVideos: 0,
          watchedVideos: 0,
          coursesCount: 0,
          grade: '-',
          colorClass: getSubjectColorClass(subject),
        };
      }
      
      // Count videos in this course
      const courseVideoCount = (course.videoUrls?.length || 0) + (course.uploadedVideos?.length || 0);
      subjectMap[subject].totalVideos += courseVideoCount;
      subjectMap[subject].coursesCount += 1;
      totalVideos += courseVideoCount;
      
      // Find student's video progress for this course
      const studentProgress = course.videoProgress?.find(
        vp => vp.student && vp.student.toString() === userId
      );
      
      if (studentProgress) {
        const watchedCount = 
          (studentProgress.watchedVideoUrls?.length || 0) + 
          (studentProgress.watchedUploadedVideos?.length || 0);
        subjectMap[subject].watchedVideos += watchedCount;
        totalWatchedVideos += watchedCount;
      }
    });

    // Calculate completion based on assignments
    let totalSubmitted = 0;
    let totalGraded = 0;
    let totalScore = 0;

    assignments.forEach(assignment => {
      // Check if student has submitted
      const studentSubmission = assignment.submissions?.find(
        s => s.student?.toString() === userId
      );
      
      if (studentSubmission) {
        totalSubmitted++;
        
        if (studentSubmission.isGraded && studentSubmission.grade !== undefined) {
          totalGraded++;
          totalScore += studentSubmission.grade;
        }
      }
    });

    // Calculate percentages and grades for each subject
    Object.values(subjectMap).forEach(subject => {
      if (subject.totalVideos > 0) {
        subject.progress = Math.round((subject.watchedVideos / subject.totalVideos) * 100);
      }
      
      // Assign grade based on progress
      if (subject.progress >= 90) subject.grade = 'A+';
      else if (subject.progress >= 80) subject.grade = 'A';
      else if (subject.progress >= 70) subject.grade = 'B+';
      else if (subject.progress >= 60) subject.grade = 'B';
      else if (subject.progress >= 50) subject.grade = 'C';
      else if (subject.progress > 0) subject.grade = 'D';
      else subject.grade = '-';
    });

    const subjectProgress = Object.values(subjectMap);
    
    // Calculate overall progress based on videos watched
    const overallProgress = totalVideos > 0
      ? Math.round((totalWatchedVideos / totalVideos) * 100)
      : 0;

    // Calculate achievements
    const achievements = calculateAchievements(courses, assignments, totalSubmitted, userId);

    // Weekly stats
    const weeklyStats = {
      lessonsCompleted: totalWatchedVideos,
      assignmentsSubmitted: totalSubmitted,
      hoursSpent: Math.round(totalWatchedVideos * 0.5), // Estimate 30 min per video
    };

    return res.json({
      overallProgress,
      subjectProgress,
      weeklyStats,
      achievements: achievements.filter(a => a.earned).map(a => ({
        title: a.title,
        icon: a.icon,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      })),
      coursesCount: courses.length,
      assignmentsCount: assignments.length,
      totalVideos,
      totalWatchedVideos,
      averageScore: totalGraded > 0 ? Math.round(totalScore / totalGraded) : 0,
    });
  } catch (err) {
    console.error('Error in getProgress:', err);
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
