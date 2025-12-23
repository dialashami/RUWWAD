const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/user_model');

// Teacher dashboard: aggregate key stats and recent activity for logged-in teacher
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    // Log for debugging
    console.log('Teacher Dashboard - userId:', userId, 'role:', userPayload?.role);

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Allow teacher role (case-insensitive check)
    const role = (userPayload?.role || '').toLowerCase();
    if (role !== 'teacher') {
      return res.status(403).json({ message: `Teacher access required. Current role: ${userPayload?.role || 'unknown'}` });
    }

    // Fetch all data in parallel
    const [
      courses,
      assignments,
      allStudents,
      sentMessages,
      receivedMessages,
      notifications,
      allTeachers
    ] = await Promise.all([
      Course.find({ teacher: userId }),
      Assignment.find({ teacher: userId }),
      User.find({ role: 'student' }),
      Message.find({ sender: userId }),
      Message.find({ receiver: userId }),
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(20),
      User.find({ role: 'teacher' }),
    ]);

    // Calculate real stats
    // 1. Total students in system (or enrolled in teacher's courses)
    const studentIds = new Set();
    courses.forEach((course) => {
      (course.students || []).forEach((s) => {
        studentIds.add(String(s));
      });
    });
    // If no students enrolled in courses, show total students in system
    const totalStudents = studentIds.size > 0 ? studentIds.size : allStudents.length;

    // 2. Active courses count
    const activeCourses = courses.filter((c) => c.isActive !== false).length;

    // 3. Total assignments
    const totalAssignments = assignments.length;

    // 4. Calculate submissions count
    let totalSubmissions = 0;
    let pendingSubmissions = 0;
    assignments.forEach((a) => {
      const subs = a.submissions || [];
      totalSubmissions += subs.length;
      pendingSubmissions += subs.filter(s => !s.grade && !s.feedback).length;
    });

    // 5. Activity rate (percentage based on recent activity)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentAssignments = assignments.filter((a) => new Date(a.createdAt) >= sevenDaysAgo);
    const recentMessages = [...sentMessages, ...receivedMessages].filter((m) => new Date(m.createdAt) >= sevenDaysAgo);
    // Calculate activity rate as percentage (max 100)
    const activityScore = recentAssignments.length * 10 + recentMessages.length * 5;
    const activityRate = Math.min(activityScore, 100);

    // 6. Unread messages count
    const unreadMessages = receivedMessages.filter(m => !m.isRead).length;

    // Build recent activities from multiple sources
    const recentActivities = [];

    // Add recent assignments
    assignments.slice(0, 5).forEach((a) => {
      recentActivities.push({
        type: 'assignment',
        id: a._id,
        title: `Created: ${a.title}`,
        description: a.description?.substring(0, 50) || '',
        createdAt: a.createdAt,
      });
    });

    // Add recent submissions
    assignments.forEach((a) => {
      (a.submissions || []).slice(0, 3).forEach((sub) => {
        recentActivities.push({
          type: 'submission',
          id: sub._id || a._id,
          title: `Submission on ${a.title}`,
          description: sub.studentId ? 'Student submitted work' : 'New submission',
          createdAt: sub.submittedAt || a.updatedAt,
        });
      });
    });

    // Add recent messages
    receivedMessages.slice(0, 5).forEach((m) => {
      recentActivities.push({
        type: 'message',
        id: m._id,
        title: 'New message received',
        description: m.content?.substring(0, 50) || '',
        createdAt: m.createdAt,
      });
    });

    // Sort by date and limit
    recentActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedActivities = recentActivities.slice(0, 10);

    // Build upcoming lessons from courses with schedule
    const upcomingLessons = courses
      .filter(c => c.isActive !== false)
      .slice(0, 5)
      .map((c, index) => ({
        id: c._id,
        title: c.title,
        grade: c.grade || 'All Grades',
        subject: c.subject || 'Course',
        time: c.scheduleTime 
          ? new Date(c.scheduleTime).toLocaleString()
          : index === 0 ? 'Today, 10:00 AM' : index === 1 ? 'Today, 2:00 PM' : 'This week',
        room: c.zoomLink ? 'Online (Zoom)' : `Room ${100 + index}`,
        zoomLink: c.zoomLink,
      }));

    return res.json({
      teacherId: userId,
      stats: {
        totalStudents,
        activeCourses,
        totalAssignments,
        totalSubmissions,
        pendingSubmissions,
        activityRate,
        unreadMessages,
        totalTeachers: allTeachers.length,
      },
      courses: courses.map(c => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        subject: c.subject,
        grade: c.grade,
        students: c.students || [],
        isActive: c.isActive,
        zoomLink: c.zoomLink,
        createdAt: c.createdAt,
      })),
      recentActivities: limitedActivities,
      upcomingLessons,
    });
  } catch (err) {
    console.error('Teacher Dashboard Error:', err);
    next(err);
  }
};
