const User = require('../models/user_model');
const Notification = require('../models/Notification');

// Generic user management endpoints (admin / profile management)

exports.getUsers = async (req, res, next) => {
  try {
    // Exclude admin users from the list
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// Get current user's profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update current user's profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    const { firstName, lastName, email, phone, bio, profileImage } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email, phone, bio, profileImage },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    const { emailNotifications, pushNotifications, assignmentReminders, gradeNotifications } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        preferences: {
          emailNotifications,
          pushNotifications,
          assignmentReminders,
          gradeNotifications,
        }
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    const { currentPassword, newPassword } = req.body;
    
    // Must explicitly select password since it has select: false in the model
    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// Toggle 2FA
exports.toggle2FA = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    const { enabled } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { twoFactorEnabled: enabled },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: `2FA ${enabled ? 'enabled' : 'disabled'}`, twoFactorEnabled: user.twoFactorEnabled });
  } catch (err) {
    next(err);
  }
};

// Delete own account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Add child by email (for parents)
exports.addChild = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    const { childEmail } = req.body;
    if (!childEmail) return res.status(400).json({ message: 'Child email is required' });
    
    // Find the parent
    const parent = await User.findById(userId);
    if (!parent) return res.status(404).json({ message: 'User not found' });
    if (parent.role !== 'parent') return res.status(403).json({ message: 'Only parents can add children' });
    
    // Find the child by email
    const child = await User.findOne({ email: childEmail.toLowerCase(), role: 'student' });
    if (!child) return res.status(404).json({ message: 'Student not found with this email' });
    
    // Check if already linked
    if (parent.children && parent.children.includes(child._id)) {
      return res.status(400).json({ message: 'This child is already linked to your account' });
    }
    
    // Add child to parent's children array
    if (!parent.children) parent.children = [];
    parent.children.push(child._id);
    await parent.save();
    
    try {
      const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
      if (adminUser) {
        const parentName = `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || parent.email;
        const childName = `${child.firstName || ''} ${child.lastName || ''}`.trim() || child.email;
        await Notification.create({
          user: adminUser._id,
          title: 'Parent linked child',
          message: `${parentName} linked child ${childName}.`,
          type: 'relationship',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for child link:', notifErr);
    }

    res.json({ 
      message: 'Child linked successfully',
      child: {
        _id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        email: child.email,
        studentType: child.studentType,
        schoolGrade: child.schoolGrade,
        universityMajor: child.universityMajor,
      }
    });
  } catch (err) {
    next(err);
  }
};

// Remove child (for parents)
exports.removeChild = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { childId } = req.params;
    
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    const parent = await User.findById(userId);
    if (!parent) return res.status(404).json({ message: 'User not found' });
    if (parent.role !== 'parent') return res.status(403).json({ message: 'Only parents can remove children' });
    
    // Remove child from array
    parent.children = parent.children.filter(id => id.toString() !== childId);
    await parent.save();
    
    try {
      const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
      if (adminUser) {
        const parentName = `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || parent.email;
        const child = await User.findById(childId).select('firstName lastName email');
        const childName = child
          ? `${child.firstName || ''} ${child.lastName || ''}`.trim() || child.email
          : childId;
        await Notification.create({
          user: adminUser._id,
          title: 'Parent removed child',
          message: `${parentName} removed child ${childName}.`,
          type: 'relationship',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for child removal:', notifErr);
    }

    res.json({ message: 'Child removed successfully' });
  } catch (err) {
    next(err);
  }
};

// ... (rest of the code remains the same)
exports.getChildren = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    // Check if userId is a valid ObjectId (not the hardcoded "admin")
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(403).json({ message: 'Only parents can view children' });
    }
    
    const parent = await User.findById(userId).populate('children', '-password');
    if (!parent) return res.status(404).json({ message: 'User not found' });
    if (parent.role !== 'parent') return res.status(403).json({ message: 'Only parents can view children' });
    
    res.json(parent.children || []);
  } catch (err) {
    next(err);
  }
};

// Get child dashboard data (courses, assignments, grades)
exports.getChildDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { childId } = req.params;
    
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    
    // Check if userId is a valid ObjectId (not the hardcoded "admin")
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(403).json({ message: 'Only parents can view child data' });
    }
    
    // Verify parent has access to this child
    const parent = await User.findById(userId);
    if (!parent) return res.status(404).json({ message: 'User not found' });
    if (parent.role !== 'parent') return res.status(403).json({ message: 'Only parents can view child data' });
    if (!parent.children || !parent.children.map(id => id.toString()).includes(childId)) {
      return res.status(403).json({ message: 'You do not have access to this child\'s data' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return res.status(400).json({ message: 'Invalid child ID' });
    }

    const childObjectId = new mongoose.Types.ObjectId(childId);

    // Get child info
    const child = await User.findById(childId).select('-password').lean();
    if (!child) return res.status(404).json({ message: 'Child not found' });
    
    // Get child's courses
    const Course = require('../models/Course');
    const Assignment = require('../models/Assignment');
    const Chapter = require('../models/Chapter');

    // Find courses matching child's grade
    let courseFilter = {};
    let assignmentGradeFilter = {};
    
    if (child.studentType === 'university') {
      courseFilter.grade = { $regex: /university|engineering/i };
      assignmentGradeFilter.grade = { $regex: /university|engineering/i };
    } else if (child.schoolGrade) {
      const gradeNum = child.schoolGrade.replace('grade', '');
      const gradeRegex = new RegExp(`grade\\s*${gradeNum}|${gradeNum}`, 'i');
      courseFilter.grade = { $regex: gradeRegex };
      assignmentGradeFilter.grade = { $regex: gradeRegex };
    }

    // Fetch courses (lean, minimal fields)
    const courses = await Course.find(courseFilter)
      .select('title subject grade universityMajor numberOfChapters isChapterBased chapters')
      .lean();

    // Get assignments - both course-linked and grade-based (limit submissions to this child)
    const courseIds = courses.map(c => c._id);
    
    // Fetch assignments that either:
    // 1. Belong to one of the child's courses, OR
    // 2. Match the child's grade directly (for assignments not linked to courses)
    let assignments = [];
    
    if (Object.keys(assignmentGradeFilter).length > 0) {
      // Has grade filter - search by course OR by grade
      const assignmentQuery = {
        $or: [
          { course: { $in: courseIds } },
          assignmentGradeFilter
        ]
      };
      assignments = await Assignment.find(assignmentQuery)
        .select('title description dueDate points course grade submissions')
        .select({ submissions: { $elemMatch: { student: childObjectId } } })
        .lean();
    } else {
      // No grade filter - just get course-based assignments
      assignments = await Assignment.find({ course: { $in: courseIds } })
        .select('title description dueDate points course grade submissions')
        .select({ submissions: { $elemMatch: { student: childObjectId } } })
        .lean();
    }

    // Get child's submissions and grades
    const courseMap = new Map(courses.map(c => [c._id.toString(), c]));

    const childAssignments = assignments.map(assignment => {
      const submission = assignment.submissions?.[0] || null;
      const courseInfo = assignment.course
        ? courseMap.get(assignment.course.toString())
        : null;
      
      // Determine assignment status
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      let status = 'pending';
      if (submission) {
        if (submission.isGraded) {
          status = 'graded';
        } else {
          status = 'submitted';
        }
      } else if (dueDate < now) {
        status = 'overdue';
      }
      
      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        points: assignment.points || 100,
        course: courseInfo ? {
          _id: courseInfo._id,
          title: courseInfo.title,
          subject: courseInfo.subject,
          grade: courseInfo.grade,
        } : null,
        submitted: !!submission,
        submittedAt: submission?.submittedAt || null,
        grade: submission?.grade ?? null,
        feedback: submission?.feedback || null,
        isGraded: submission?.isGraded || false,
        status: status,
        isOverdue: dueDate < now && !submission,
        fileName: submission?.fileName || null,
      };
    });

    const courseObjectIds = courseIds.map(id => new mongoose.Types.ObjectId(id));
    const chapters = courseObjectIds.length > 0
      ? await Chapter.aggregate([
          { $match: { course: { $in: courseObjectIds } } },
          {
            $project: {
              course: 1,
              chapterNumber: 1,
              title: 1,
              description: 1,
              isPublished: 1,
              isLocked: 1,
              order: 1,
              quiz: {
                isGenerated: '$quiz.isGenerated',
                passingScore: '$quiz.passingScore',
                maxAttempts: '$quiz.maxAttempts',
                timeLimit: '$quiz.timeLimit'
              },
              studentProgress: {
                $filter: {
                  input: { $ifNull: ['$studentProgress', []] },
                  as: 'p',
                  cond: { $eq: ['$$p.student', childObjectId] }
                }
              }
            }
          }
        ])
      : [];

    const chaptersByCourse = new Map();
    chapters.forEach((chapter) => {
      const key = chapter.course.toString();
      if (!chaptersByCourse.has(key)) {
        chaptersByCourse.set(key, []);
      }
      chaptersByCourse.get(key).push(chapter);
    });

    const detailedCourses = courses.map((course) => {
      const chaptersForCourse = chaptersByCourse.get(course._id.toString()) || [];

      const detailedChapters = chaptersForCourse.map((chapter) => {
        const progress = chapter.studentProgress?.[0] || {};
        const quiz = chapter.quiz || {};
        const quizAttempts = (progress.quizAttempts || []).map(a => ({
          attemptNumber: a.attemptNumber,
          score: a.score,
          correctAnswers: a.correctAnswers,
          totalQuestions: a.totalQuestions,
          passed: a.passed,
          attemptedAt: a.attemptedAt,
        }));

        let calculatedBestScore = progress.bestScore || 0;
        if (quizAttempts.length > 0) {
          const maxFromAttempts = Math.max(...quizAttempts.map(a => a.score || 0));
          calculatedBestScore = Math.max(calculatedBestScore, maxFromAttempts);
        }

        return {
          _id: chapter._id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          description: chapter.description,
          isPublished: chapter.isPublished,
          isLocked: chapter.isLocked,
          order: chapter.order,
          progress: {
            slidesViewed: progress.slidesViewed || false,
            lecturesWatched: progress.lecturesWatched || [],
            allLecturesCompleted: progress.allLecturesCompleted || false,
            quizPassed: progress.quizPassed || false,
            bestScore: calculatedBestScore,
            chapterCompleted: progress.chapterCompleted || false,
            chapterCompletedAt: progress.chapterCompletedAt || null,
          },
          quiz: {
            isGenerated: quiz.isGenerated || false,
            passingScore: quiz.passingScore || 60,
            maxAttempts: quiz.maxAttempts || 0,
            timeLimit: quiz.timeLimit || 0,
            attempts: quizAttempts,
            bestScore: calculatedBestScore,
            quizPassed: progress.quizPassed || (calculatedBestScore >= (quiz.passingScore || 60)),
            quizPassedAt: progress.quizPassedAt || null,
          }
        };
      });

      return {
        _id: course._id,
        title: course.title,
        subject: course.subject,
        grade: course.grade,
        universityMajor: course.universityMajor,
        numberOfChapters: course.numberOfChapters,
        isChapterBased: course.isChapterBased,
        chapters: detailedChapters,
      };
    });

    // Calculate stats
    const totalAssignments = childAssignments.length;
    const completedAssignments = childAssignments.filter(a => a.submitted).length;
    const gradedAssignments = childAssignments.filter(a => a.isGraded);
    const averageGrade = gradedAssignments.length > 0 
      ? Math.round(gradedAssignments.reduce((sum, a) => sum + (a.grade || 0), 0) / gradedAssignments.length)
      : 0;

    // Calculate quiz stats across all courses
    let totalQuizzes = 0;
    let passedQuizzes = 0;
    let totalQuizScore = 0;
    let quizzesTaken = 0;
    
    detailedCourses.forEach(course => {
      (course.chapters || []).forEach(chapter => {
        if (chapter.quiz?.isGenerated) {
          totalQuizzes++;
          if (chapter.quiz.quizPassed) passedQuizzes++;
          if (chapter.quiz.attempts?.length > 0) {
            quizzesTaken++;
            totalQuizScore += chapter.quiz.bestScore || 0;
          }
        }
      });
    });
    
    const averageQuizScore = quizzesTaken > 0 ? Math.round(totalQuizScore / quizzesTaken) : 0;

    res.json({
      child: {
        _id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        email: child.email,
        studentType: child.studentType,
        schoolGrade: child.schoolGrade,
        universityMajor: child.universityMajor,
        profileImage: child.profileImage,
      },
      courses: detailedCourses,
      assignments: childAssignments,
      stats: {
        totalCourses: detailedCourses.length,
        totalAssignments,
        completedAssignments,
        pendingAssignments: totalAssignments - completedAssignments,
        averageGrade,
        gradedAssignments: gradedAssignments.length,
        // Quiz stats
        totalQuizzes,
        passedQuizzes,
        quizzesTaken,
        averageQuizScore,
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get student count by grade (for teachers when creating assignments)
exports.getStudentCountByGrade = async (req, res, next) => {
  try {
    const { grade, universityMajor } = req.query;
    
    if (!grade) {
      return res.status(400).json({ message: 'Grade is required' });
    }
    
    let query = { role: 'student' };
    
    // Handle different grade formats
    if (grade === 'University') {
      query.studentType = 'university';
      if (universityMajor) {
        query.universityMajor = universityMajor;
      }
    } else {
      // Convert "Grade 1", "Grade 2", etc. to "grade1", "grade2", etc.
      const gradeNumber = grade.replace('Grade ', '').trim();
      const schoolGradeValue = `grade${gradeNumber}`;
      query.studentType = 'school';
      query.schoolGrade = schoolGradeValue;
    }
    
    const count = await User.countDocuments(query);
    
    res.json({ 
      count,
      grade,
      universityMajor: universityMajor || null
    });
  } catch (err) {
    next(err);
  }
};
