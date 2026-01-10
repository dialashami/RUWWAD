const Course = require('../models/Course');
const Notification = require('../models/Notification');
const User = require('../models/user_model');

exports.createCourse = async (req, res, next) => {
  try {
    console.log('Creating course with data:', req.body);
    const course = await Course.create(req.body);
    console.log('Course created:', course);
    
    // Create notifications for students matching the course's grade
    try {
      const grade = course.grade;
      let studentFilter = { role: 'student' };
      
      if (grade) {
        if (grade.toLowerCase() === 'university' || grade.toLowerCase().includes('engineering')) {
          studentFilter.studentType = 'university';
          if (grade.toLowerCase().includes('engineering')) {
            studentFilter.universityMajor = new RegExp(grade, 'i');
          }
        } else {
          studentFilter.studentType = 'school';
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
          title: 'New Course Available',
          message: `A new course "${course.title}" is now available for you.`,
          type: 'lesson',
          isRead: false,
        }));
        
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Error creating course notifications:', notifErr);
    }
    
    try {
      const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
      if (adminUser) {
        await Notification.create({
          user: adminUser._id,
          title: 'New course created',
          message: `Course "${course.title}" was created.`,
          type: 'course',
          isRead: false,
        });
      }
    } catch (adminNotifErr) {
      console.error('Error creating admin notification for course creation:', adminNotifErr);
    }
    
    res.status(201).json(course);
  } catch (err) {
    console.error('Error creating course:', err);
    next(err);
  }
};

// GET /api/courses with optional query filters:
// ?teacher=<id> - filter by teacher
// ?grade=<grade> - filter by grade (for students)
// ?specialization=<major> - filter by grade field matching university major
// ?subject=<subject> - filter by subject
// ?isActive=true/false - filter by active status
exports.getCourses = async (req, res, next) => {
  try {
    const { teacher, grade, specialization, subject, isActive } = req.query;
    const filter = {};

    console.log('getCourses query params:', { teacher, grade, specialization, subject, isActive });

    if (teacher) {
      filter.teacher = teacher;
    }

    // Grade filter: match exact grade or normalize (e.g. 'grade9' matches 'Grade 9')
    if (grade) {
      const normalizedGrade = grade.toLowerCase().replace(/\s+/g, '');
      filter.$or = [
        { grade: grade },
        { grade: new RegExp(normalizedGrade, 'i') },
        { grade: new RegExp(grade.replace('grade', 'Grade '), 'i') },
      ];
    }

    // Specialization filter for university students (stored in grade field)
    if (specialization) {
      filter.grade = new RegExp(specialization, 'i');
    }

    if (subject) {
      filter.subject = new RegExp(subject, 'i');
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    console.log('getCourses filter:', JSON.stringify(filter));
    
    const courses = await Course.find(filter)
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log('getCourses found', courses.length, 'courses');
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    next(err);
  }
};

// Get student's courses with their individual video progress
exports.getStudentCourses = async (req, res, next) => {
  try {
    const studentId = req.userId;
    
    // Check if userId is a valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      // Return empty array for invalid user IDs (like "admin" string)
      return res.json([]);
    }
    
    const student = await User.findById(studentId);
    
    if (!student) {
      return res.json([]); // Return empty array if student not found
    }

    // Build grade filter based on student type
    const gradeFilter = { isActive: true };
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

    const courses = await Course.find(gradeFilter)
      .populate('teacher', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Calculate progress for each course
    const coursesWithProgress = courses.map(course => {
      const courseObj = course.toObject();
      
      // Find student's video progress
      const studentProgress = course.videoProgress?.find(
        vp => vp.student && vp.student.toString() === studentId
      );
      
      // Calculate total videos
      const totalVideos = (course.videoUrls?.length || 0) + (course.uploadedVideos?.length || 0);
      
      let progressPercent = 0;
      let watchedCount = 0;
      
      if (studentProgress) {
        watchedCount = 
          (studentProgress.watchedVideoUrls?.length || 0) + 
          (studentProgress.watchedUploadedVideos?.length || 0);
        progressPercent = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0;
      }
      
      return {
        _id: courseObj._id,
        id: courseObj._id,
        title: courseObj.title,
        subject: courseObj.subject || 'Course',
        description: courseObj.description,
        teacher: courseObj.teacher,
        grade: courseObj.grade,
        duration: courseObj.duration || `${totalVideos} video${totalVideos !== 1 ? 's' : ''}`,
        progress: progressPercent,
        totalVideos,
        watchedVideos: watchedCount,
        isCompleted: studentProgress?.completedAt ? true : false,
        completedAt: studentProgress?.completedAt || null,
        videoUrls: courseObj.videoUrls,
        uploadedVideos: courseObj.uploadedVideos,
      };
    });

    res.json(coursesWithProgress);
  } catch (err) {
    console.error('Error getting student courses:', err);
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    console.log('Updating course:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    console.log('Updated course videoUrls:', course.videoUrls);
    console.log('Updated course uploadedVideos:', course.uploadedVideos);
    
    res.json(course);
  } catch (err) {
    console.error('Error updating course:', err);
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    next(err);
  }
};

// Enroll a student in a course
exports.enrollStudent = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (!course.students.includes(studentId)) {
      course.students.push(studentId);
      await course.save();
      
      try {
        const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
        if (adminUser) {
          const student = await User.findById(studentId).select('firstName lastName email');
          const studentName = student
            ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email
            : 'Student';
          await Notification.create({
            user: adminUser._id,
            title: 'Student enrolled in course',
            message: `${studentName} enrolled in course "${course.title}".`,
            type: 'enrollment',
            isRead: false,
          });
        }
      } catch (adminNotifErr) {
        console.error('Error creating admin notification for enrollment:', adminNotifErr);
      }
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
};

// Unenroll a student from a course
exports.unenrollStudent = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.students = course.students.filter(s => s.toString() !== studentId);
    await course.save();
    
    try {
      const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
      if (adminUser) {
        const student = await User.findById(studentId).select('firstName lastName email');
        const studentName = student
          ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email
          : 'Student';
        await Notification.create({
          user: adminUser._id,
          title: 'Student unenrolled from course',
          message: `${studentName} left course "${course.title}".`,
          type: 'enrollment',
          isRead: false,
        });
      }
    } catch (adminNotifErr) {
      console.error('Error creating admin notification for unenrollment:', adminNotifErr);
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
};

// Mark a video as watched (student)
exports.markVideoWatched = async (req, res, next) => {
  try {
    const { studentId, videoUrl, videoType } = req.body; // videoType: 'url' or 'uploaded'
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Find or create student's progress record
    let studentProgress = course.videoProgress.find(
      vp => vp.student.toString() === studentId
    );

    if (!studentProgress) {
      course.videoProgress.push({
        student: studentId,
        watchedVideoUrls: [],
        watchedUploadedVideos: [],
      });
      studentProgress = course.videoProgress[course.videoProgress.length - 1];
    }

    // Add video to watched list if not already watched
    if (videoType === 'url') {
      if (!studentProgress.watchedVideoUrls.includes(videoUrl)) {
        studentProgress.watchedVideoUrls.push(videoUrl);
      }
    } else if (videoType === 'uploaded') {
      if (!studentProgress.watchedUploadedVideos.includes(videoUrl)) {
        studentProgress.watchedUploadedVideos.push(videoUrl);
      }
    }

    // Calculate progress
    const totalVideos = (course.videoUrls?.length || 0) + (course.uploadedVideos?.length || 0);
    const watchedCount = 
      (studentProgress.watchedVideoUrls?.length || 0) + 
      (studentProgress.watchedUploadedVideos?.length || 0);
    
    const progressPercent = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 100;

    // If all videos are watched, mark as completed
    if (progressPercent >= 100 && !studentProgress.completedAt) {
      studentProgress.completedAt = new Date();
      
      // Send notification to student
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          user: studentId,
          title: 'Course Completed! 🎉',
          message: `Congratulations! You have completed the course "${course.title}".`,
          type: 'achievement',
          isRead: false,
        });
      } catch (notifErr) {
        console.error('Error creating completion notification:', notifErr);
      }
    }

    await course.save();

    res.json({
      message: 'Video marked as watched',
      progress: progressPercent,
      isCompleted: progressPercent >= 100,
      watchedVideoUrls: studentProgress.watchedVideoUrls,
      watchedUploadedVideos: studentProgress.watchedUploadedVideos,
    });
  } catch (err) {
    next(err);
  }
};

// Get course with student's video progress
exports.getCourseWithProgress = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName email');
    
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const courseObj = course.toObject();
    
    if (studentId) {
      const studentProgress = course.videoProgress.find(
        vp => vp.student.toString() === studentId
      );
      
      const totalVideos = (course.videoUrls?.length || 0) + (course.uploadedVideos?.length || 0);
      let progressPercent = 0;
      
      if (studentProgress) {
        const watchedCount = 
          (studentProgress.watchedVideoUrls?.length || 0) + 
          (studentProgress.watchedUploadedVideos?.length || 0);
        progressPercent = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 100;
        
        courseObj.studentVideoProgress = {
          watchedVideoUrls: studentProgress.watchedVideoUrls || [],
          watchedUploadedVideos: studentProgress.watchedUploadedVideos || [],
          completedAt: studentProgress.completedAt,
        };
      } else {
        courseObj.studentVideoProgress = {
          watchedVideoUrls: [],
          watchedUploadedVideos: [],
          completedAt: null,
        };
      }
      
      courseObj.progress = progressPercent;
      courseObj.isCompleted = progressPercent >= 100;
      courseObj.totalVideoCount = totalVideos;
    }
    
    res.json(courseObj);
  } catch (err) {
    next(err);
  }
};
