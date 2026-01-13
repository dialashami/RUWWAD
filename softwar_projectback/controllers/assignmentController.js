const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const User = require('../models/user_model');
const { resolveUserId, isValidObjectId } = require('../utils/userIdResolver');

exports.createAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.create(req.body);
    
    // Create notifications for students matching the assignment's grade
    try {
      const grade = assignment.grade;
      let studentFilter = { role: 'student' };
      
      if (grade) {
        // Match students by grade
        if (grade.toLowerCase() === 'university' || grade.toLowerCase().includes('engineering')) {
          studentFilter.studentType = 'university';
          if (grade.toLowerCase().includes('engineering')) {
            studentFilter.universityMajor = new RegExp(grade, 'i');
          }
        } else {
          studentFilter.studentType = 'school';
          // Convert "Grade 10" to "grade10" format
          const gradeNum = grade.replace(/\D/g, '');
          if (gradeNum) {
            studentFilter.schoolGrade = `grade${gradeNum}`;
          }
        }
      }
      
      const students = await User.find(studentFilter).select('_id');
      
      if (students.length > 0) {
        const notifications = students.map(student => ({
          user: student._id,
          title: 'New Assignment Posted',
          message: `A new assignment "${assignment.title}" has been posted. Due date: ${new Date(assignment.dueDate).toLocaleDateString()}.`,
          type: 'assignment',
          isRead: false,
        }));
        
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Error creating assignment notifications:', notifErr);
      // Don't fail the assignment creation if notifications fail
    }
    
    try {
      const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
      if (adminUser) {
        await Notification.create({
          user: adminUser._id,
          title: 'New assignment created',
          message: `Assignment "${assignment.title}" was created.`,
          type: 'assignment',
          isRead: false,
        });
      }
    } catch (adminNotifErr) {
      console.error('Error creating admin notification for assignment creation:', adminNotifErr);
    }

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
};

// GET /api/assignments with optional query filters:
// ?teacher=<id> - filter by teacher
// ?course=<id> - filter by course
// ?grade=<grade> - filter by grade (for students)
// ?specialization=<major> - filter by grade field matching university major
// ?subject=<subject> - filter by subject
// ?status=<status> - filter by status (active, upcoming, closed)
exports.getAssignments = async (req, res, next) => {
  try {
    let { teacher, course, grade, specialization, subject, status } = req.query;
    const filter = {};
    const userId = req.userId;
    const userRole = req.User?.role;

    // Resolve teacher ID if it's 'admin' or invalid ObjectId
    if (teacher) {
      if (!isValidObjectId(teacher)) {
        teacher = await resolveUserId(teacher);
      }
      if (teacher) {
        filter.teacher = teacher;
      }
    }

    if (course) {
      filter.course = course;
    }

    // Grade filter: match exact grade or normalize
    if (grade) {
      const normalizedGrade = grade.toLowerCase().replace(/\s+/g, '');
      filter.$or = [
        { grade: grade },
        { grade: new RegExp(normalizedGrade, 'i') },
        { grade: new RegExp(grade.replace('grade', 'Grade '), 'i') },
      ];
    }

    // Specialization filter for university students
    if (specialization) {
      filter.grade = new RegExp(specialization, 'i');
    }

    if (subject) {
      filter.subject = new RegExp(subject, 'i');
    }

    if (status) {
      filter.status = status;
    }

    const assignments = await Assignment.find(filter)
      .populate('course', 'title subject grade')
      .populate('teacher', 'firstName lastName email')
      .sort({ dueDate: 1 });

    // For students, sanitize submissions to only show their own
    if (userRole === 'student') {
      const sanitizedAssignments = assignments.map(assignment => {
        const assignmentObj = assignment.toObject();
        
        // Find only this student's submission
        const studentSubmission = assignmentObj.submissions?.find(
          s => s.student && s.student.toString() === userId
        );
        
        // Replace submissions array with only the student's submission info
        return {
          ...assignmentObj,
          submissions: undefined, // Remove all submissions
          mySubmission: studentSubmission || null,
          hasSubmitted: !!studentSubmission,
          submittedCount: assignment.submissions?.length || 0, // Keep count for display
        };
      });
      return res.json(sanitizedAssignments);
    }

    res.json(assignments);
  } catch (err) {
    next(err);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userRole = req.User?.role;
    
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title subject grade')
      .populate('teacher', 'firstName lastName email')
      .populate('submissions.student', 'firstName lastName email');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    
    // For students, only show their own submission
    if (userRole === 'student') {
      const assignmentObj = assignment.toObject();
      const studentSubmission = assignmentObj.submissions?.find(
        s => s.student && (s.student._id?.toString() === userId || s.student.toString() === userId)
      );
      
      return res.json({
        ...assignmentObj,
        submissions: undefined,
        mySubmission: studentSubmission || null,
        hasSubmitted: !!studentSubmission,
        submittedCount: assignment.submissions?.length || 0,
      });
    }
    
    res.json(assignment);
  } catch (err) {
    next(err);
  }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    next(err);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
};

// Submit an assignment (student)
exports.submitAssignment = async (req, res, next) => {
  try {
    const { studentId, file, fileName, comment } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      s => s.student.toString() === studentId
    );
    if (existingSubmission) {
      return res.status(400).json({ message: 'Already submitted' });
    }

    assignment.submissions.push({
      student: studentId,
      file: file || null,
      fileName: fileName || null,
      comment: comment || null,
      submittedAt: new Date(),
    });

    await assignment.save();
    res.json(assignment);
  } catch (err) {
    next(err);
  }
};

// Grade a submission (teacher)
exports.gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId, grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const submission = assignment.submissions.id(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.isGraded = true;

    await assignment.save();
    
    // Create notification for the student about their grade
    try {
      const student = await User.findById(submission.student).select('firstName lastName parentEmail');
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Your child';
      
      await Notification.create({
        user: submission.student,
        title: 'Assignment Graded',
        message: `Your assignment "${assignment.title}" has been graded. You received ${grade}%.${feedback ? ` Feedback: ${feedback}` : ''}`,
        type: 'grade',
        isRead: false,
      });
      
      // Notify the parent if they exist
      if (student && student.parentEmail) {
        const parent = await User.findOne({ email: student.parentEmail, role: 'parent' }).select('_id');
        if (parent) {
          await Notification.create({
            user: parent._id,
            title: 'Child\'s Assignment Graded',
            message: `${studentName}'s assignment "${assignment.title}" has been graded. Grade: ${grade}%.${feedback ? ` Feedback: ${feedback}` : ''}`,
            type: 'grade',
            isRead: false,
          });
        }
      }
    } catch (notifErr) {
      console.error('Error creating grade notification:', notifErr);
    }
    
    res.json(assignment);
  } catch (err) {
    next(err);
  }
};
