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
    
    // Verify parent has access to this child
    const parent = await User.findById(userId);
    if (!parent) return res.status(404).json({ message: 'User not found' });
    if (parent.role !== 'parent') return res.status(403).json({ message: 'Only parents can view child data' });
    if (!parent.children || !parent.children.map(id => id.toString()).includes(childId)) {
      return res.status(403).json({ message: 'You do not have access to this child\'s data' });
    }
    
    // Get child info
    const child = await User.findById(childId).select('-password');
    if (!child) return res.status(404).json({ message: 'Child not found' });
    
    // Get child's courses
    const Course = require('../models/Course');
    const Assignment = require('../models/Assignment');
    
    // Find courses matching child's grade
    let courseFilter = {};
    if (child.studentType === 'university') {
      courseFilter.grade = { $regex: /university|engineering/i };
    } else if (child.schoolGrade) {
      const gradeNum = child.schoolGrade.replace('grade', '');
      courseFilter.grade = { $regex: new RegExp(`grade\\s*${gradeNum}|${gradeNum}`, 'i') };
    }
    
    const courses = await Course.find(courseFilter).lean();
    
    // Get assignments for these courses
    const courseIds = courses.map(c => c._id);
    const assignments = await Assignment.find({ course: { $in: courseIds } }).lean();
    
    // Get child's submissions and grades
    const childAssignments = assignments.map(assignment => {
      const submission = assignment.submissions?.find(
        s => s.student?.toString() === childId
      );
      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        course: courses.find(c => c._id.toString() === assignment.course?.toString()),
        submitted: !!submission,
        grade: submission?.grade || null,
        feedback: submission?.feedback || null,
        isGraded: submission?.isGraded || false,
      };
    });
    
    // Calculate stats
    const totalAssignments = childAssignments.length;
    const completedAssignments = childAssignments.filter(a => a.submitted).length;
    const gradedAssignments = childAssignments.filter(a => a.isGraded);
    const averageGrade = gradedAssignments.length > 0 
      ? Math.round(gradedAssignments.reduce((sum, a) => sum + (a.grade || 0), 0) / gradedAssignments.length)
      : 0;
    
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
      courses,
      assignments: childAssignments,
      stats: {
        totalCourses: courses.length,
        totalAssignments,
        completedAssignments,
        pendingAssignments: totalAssignments - completedAssignments,
        averageGrade,
        gradedAssignments: gradedAssignments.length,
      }
    });
  } catch (err) {
    next(err);
  }
};
