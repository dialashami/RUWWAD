const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Notification = require('../models/Notification');
const User = require('../models/user_model');

exports.createCourse = async (req, res, next) => {
  try {
    console.log('Creating course with data:', req.body);
    
    // Extract chapter-based course fields
    const { subjectType, numberOfChapters = 1, isChapterBased = true, ...courseData } = req.body;
    
    // Create the course
    const course = await Course.create({
      ...courseData,
      subjectType,
      numberOfChapters: Math.max(1, numberOfChapters),
      isChapterBased,
      chapters: []
    });
    
    console.log('Course created:', course._id);
    
    // Auto-create empty chapters if chapter-based
    if (isChapterBased && numberOfChapters > 0) {
      const chapterPromises = [];
      for (let i = 1; i <= numberOfChapters; i++) {
        chapterPromises.push(
          Chapter.create({
            course: course._id,
            chapterNumber: i,
            title: `Chapter ${i}`,
            description: '',
            order: i,
            isLocked: i > 1, // First chapter is unlocked
            isPublished: false
          })
        );
      }
      
      const chapters = await Promise.all(chapterPromises);
      course.chapters = chapters.map(c => c._id);
      await course.save();
      console.log('Created', chapters.length, 'chapters for course');
    }
    
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
          message: `Course "${course.title}" was created with ${numberOfChapters} chapters.`,
          type: 'course',
          isRead: false,
        });
      }
    } catch (adminNotifErr) {
      console.error('Error creating admin notification for course creation:', adminNotifErr);
    }
    
    // Populate chapters before returning
    const populatedCourse = await Course.findById(course._id).populate('chapters');
    res.status(201).json(populatedCourse);
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
      .populate('chapters', '_id chapterNumber title isPublished slides lectures resources')
      .sort({ createdAt: -1 });

    console.log('getCourses found', courses.length, 'courses');
    
    // For students, sanitize the course data to hide other students' information
    const userId = req.userId;
    const userRole = req.User?.role;
    
    console.log('getCourses - userId:', userId, 'userRole:', userRole, 'req.User:', JSON.stringify(req.User));
    
    // Check if user is a student (case-insensitive)
    const isStudent = userRole && userRole.toLowerCase() === 'student';
    
    if (isStudent) {
      const sanitizedCourses = courses.map(course => {
        const courseObj = course.toObject();
        
        console.log('Course:', course.title, 'students array:', courseObj.students?.map(s => s._id?.toString() || s.toString()));
        
        // Check if current student is enrolled BEFORE removing students array
        const isEnrolled = courseObj.students?.some(
          s => (s._id?.toString() || s.toString()) === userId
        );
        
        console.log('Course:', course.title, 'isEnrolled:', isEnrolled, 'userId:', userId);
        
        // Find only this student's video progress
        const studentProgress = courseObj.videoProgress?.find(
          vp => vp.student && vp.student.toString() === userId
        );
        
        // Calculate progress for this student
        const totalVideos = (courseObj.videoUrls?.length || 0) + (courseObj.uploadedVideos?.length || 0);
        let watchedCount = 0;
        if (studentProgress) {
          watchedCount = 
            (studentProgress.watchedVideoUrls?.length || 0) + 
            (studentProgress.watchedUploadedVideos?.length || 0);
        }
        const progressPercent = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0;
        
        // Remove sensitive data (other students' info)
        delete courseObj.videoProgress;
        delete courseObj.students;
        
        // Count chapters that have actual content (slides, lectures, or resources) or are published
        const chaptersWithContent = courseObj.chapters?.filter(ch => {
          const hasSlides = ch.slides && ch.slides.length > 0;
          const hasLectures = ch.lectures && ch.lectures.length > 0;
          const hasResources = ch.resources && ch.resources.length > 0;
          return ch.isPublished || hasSlides || hasLectures || hasResources;
        }).length || 0;
        
        console.log('Course:', courseObj.title, 'chapters count:', courseObj.chapters?.length, 'chaptersWithContent:', chaptersWithContent);
        
        return {
          ...courseObj,
          isEnrolled, // Add enrollment status for frontend
          progress: progressPercent,
          totalVideos,
          watchedVideos: watchedCount,
          chaptersWithContent, // Number of chapters with actual content
        };
      });
      return res.json(sanitizedCourses);
    }
    
    // For non-students (teachers, etc), still add chaptersWithContent
    const coursesWithChapterCount = courses.map(course => {
      const courseObj = course.toObject();
      const chaptersWithContent = courseObj.chapters?.filter(ch => {
        const hasSlides = ch.slides && ch.slides.length > 0;
        const hasLectures = ch.lectures && ch.lectures.length > 0;
        const hasResources = ch.resources && ch.resources.length > 0;
        return ch.isPublished || hasSlides || hasLectures || hasResources;
      }).length || 0;
      
      return {
        ...courseObj,
        chaptersWithContent
      };
    });
    
    res.json(coursesWithChapterCount);
  } catch (err) {
    next(err);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userRole = req.User?.role;
    
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // For students, sanitize the course data
    if (userRole === 'student') {
      const courseObj = course.toObject();
      
      // Check if current student is enrolled BEFORE removing students array
      const isEnrolled = courseObj.students?.some(
        s => (s._id?.toString() || s.toString()) === userId
      );
      
      // Find only this student's video progress
      const studentProgress = courseObj.videoProgress?.find(
        vp => vp.student && vp.student.toString() === userId
      );
      
      // Calculate progress for this student
      const totalVideos = (courseObj.videoUrls?.length || 0) + (courseObj.uploadedVideos?.length || 0);
      let watchedCount = 0;
      if (studentProgress) {
        watchedCount = 
          (studentProgress.watchedVideoUrls?.length || 0) + 
          (studentProgress.watchedUploadedVideos?.length || 0);
      }
      const progressPercent = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0;
      
      // Remove sensitive data (other students' info)
      delete courseObj.videoProgress;
      delete courseObj.students;
      
      return res.json({
        ...courseObj,
        isEnrolled, // Add enrollment status for frontend
        progress: progressPercent,
        totalVideos,
        watchedVideos: watchedCount,
      });
    }
    
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

    // Calculate progress for each course and mark enrollment status
    const coursesWithProgress = courses.map(course => {
      const courseObj = course.toObject();
      
      // Check if student is enrolled in this course
      const isEnrolled = course.students?.some(
        s => s && s.toString() === studentId
      );
      
      // Find student's video progress (only if enrolled)
      const studentProgress = isEnrolled ? course.videoProgress?.find(
        vp => vp.student && vp.student.toString() === studentId
      ) : null;
      
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
        isEnrolled: isEnrolled, // indicates if student is enrolled
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
    console.log('Enroll request - courseId:', req.params.id, 'studentId:', studentId);
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      console.log('Course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Current students in course:', course.students.map(s => s.toString()));
    
    // Check if already enrolled using string comparison
    const isAlreadyEnrolled = course.students.some(s => s.toString() === studentId.toString());
    
    if (!isAlreadyEnrolled) {
      course.students.push(studentId);
      await course.save();
      console.log('Student enrolled successfully. Updated students:', course.students.map(s => s.toString()));
      
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
    } else {
      console.log('Student already enrolled in course');
    }

    // Return course with isEnrolled status
    res.json({
      ...course.toObject(),
      isEnrolled: true,
      message: isAlreadyEnrolled ? 'Already enrolled' : 'Successfully enrolled'
    });
  } catch (err) {
    console.error('Error in enrollStudent:', err);
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
