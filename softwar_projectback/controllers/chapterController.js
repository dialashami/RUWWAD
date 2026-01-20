const mongoose = require('mongoose');
const Chapter = require('../models/Chapter');
const Course = require('../models/Course');
const QuizAttempt = require('../models/QuizAttempt');
const pdfParse = require('pdf-parse');
const { CacheManager } = require('../utils/dbOptimizer');

// Get all chapters for a course
exports.getChaptersByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.query.studentId || req.userId;
    
    console.log(`📚 getChaptersByCourse called - CourseID: ${courseId}, StudentID: ${studentId}`);
    
    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log(`❌ Invalid course ID format: ${courseId}`);
      return res.status(400).json({ message: 'Invalid course ID format' });
    }
    
    // Validate studentId format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.log(`❌ Invalid student ID format: ${studentId}`);
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    
    const cacheKey = `chapters:${courseId}:${studentId}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      console.log(`✅ Returning cached chapters for course ${courseId}`);
      return res.json(cached);
    }

    console.log(`🔍 Fetching course from database...`);
    const course = await Course.findById(courseId)
      .select('isChapterBased numberOfChapters studentCourseProgress')
      .maxTimeMS(5000) // 5 second timeout
      .lean();
    if (!course) {
      console.log(`❌ Course not found: ${courseId}`);
      return res.status(404).json({ 
        message: 'Course not found',
        courseId: courseId,
        hint: 'Please check if the course ID is correct'
      });
    }
    
    console.log(`✅ Course found. Fetching chapters...`);

    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    // Optimized query - fetch chapters with necessary fields only
    console.log(`🔍 Fetching chapters for course...`);
    const chapters = await Chapter.find({ course: courseObjectId })
      .select('course chapterNumber title description slides lectures isPublished isLocked order quiz.isGenerated quiz.passingScore quiz.maxAttempts quiz.timeLimit quiz.questions studentProgress')
      .sort({ chapterNumber: 1 })
      .maxTimeMS(5000) // 5 second timeout
      .lean();
    
    console.log(`✅ Found ${chapters.length} chapters`);

    const courseProgress = (course.studentCourseProgress || []).find(
      p => p.student && p.student.toString() === studentId.toString()
    );
    
    // Get student's course progress
    const courseStatus = {
      isChapterBased: !!course.isChapterBased,
      totalChapters: course.numberOfChapters || chapters.length,
      currentChapter: courseProgress?.currentChapter || 1,
      chaptersCompleted: courseProgress?.chaptersCompleted || [],
      overallProgress: courseProgress?.overallProgress || 0,
      lastAccessedAt: courseProgress?.lastAccessedAt,
      courseCompleted: courseProgress?.courseCompletedAt != null
    };
    
    console.log(`📊 Processing ${chapters.length} chapters...`);
    
    // Add unlock status and progress for each chapter
    const buildStudentProgress = (chapterObj) => {
      // Filter student progress array to find this student's progress
      const progress = chapterObj.studentProgress?.find(
        p => p.student && p.student.toString() === studentId.toString()
      );

      if (!progress) {
        return {
          slidesViewed: false,
          lecturesProgress: 0,
          allLecturesCompleted: false,
          quizAttempts: 0,
          quizPassed: false,
          bestScore: 0,
          chapterCompleted: false
        };
      }

      const totalLectures = chapterObj.lectures?.length || 0;
      const watchedLectures = progress.lecturesWatched?.length || 0;
      const lecturesProgress = totalLectures > 0
        ? Math.round((watchedLectures / totalLectures) * 100)
        : 100;

      return {
        slidesViewed: progress.slidesViewed,
        slidesViewedAt: progress.slidesViewedAt,
        lecturesProgress,
        lecturesWatched: watchedLectures,
        totalLectures,
        allLecturesCompleted: progress.allLecturesCompleted,
        quizAttempts: progress.quizAttempts?.length || 0,
        quizPassed: progress.quizPassed,
        quizPassedAt: progress.quizPassedAt,
        bestScore: progress.bestScore || 0,
        lastAttempt: progress.quizAttempts && progress.quizAttempts.length > 0
          ? progress.quizAttempts[progress.quizAttempts.length - 1]
          : null,
        chapterCompleted: progress.chapterCompleted,
        chapterCompletedAt: progress.chapterCompletedAt
      };
    };

    const chaptersWithStatus = chapters.map((chapter, index) => {
      const chapterObj = chapter;
      
      // Filter studentProgress to only include this student's data
      const filteredProgress = chapterObj.studentProgress?.filter(
        p => p.student && p.student.toString() === studentId.toString()
      ) || [];
      
      const progress = buildStudentProgress({ ...chapterObj, studentProgress: filteredProgress });
      
      // Primary check: courseStatus.chaptersCompleted array
      let isUnlocked = chapter.chapterNumber === 1 || 
        courseStatus.chaptersCompleted?.includes(chapter.chapterNumber - 1);
      
      // Fallback check: Check if previous chapter's quiz was passed
      if (!isUnlocked && index > 0) {
        const prevChapter = chapters[index - 1];
        const prevFilteredProgress = prevChapter.studentProgress?.filter(
          p => p.student && p.student.toString() === studentId.toString()
        ) || [];
        const prevProgress = buildStudentProgress({ ...prevChapter, studentProgress: prevFilteredProgress });
        if (prevProgress?.quizPassed) {
          isUnlocked = true;
        }
      }
      
      // Calculate quiz questions count
      const questionsCount = chapterObj.quiz?.questions?.length || 0;
      
      // Return chapter without exposing other students' progress
      return {
        _id: chapterObj._id,
        course: chapterObj.course,
        chapterNumber: chapterObj.chapterNumber,
        title: chapterObj.title,
        description: chapterObj.description,
        slides: chapterObj.slides,
        lectures: chapterObj.lectures,
        isPublished: chapterObj.isPublished,
        isLocked: chapterObj.isLocked,
        order: chapterObj.order,
        slideContent: undefined,
        hasSlideContent: false,
        slideContentLength: 0,
        isUnlocked,
        studentProgress: progress,
        // Don't expose quiz answers
        quiz: chapterObj.quiz?.isGenerated ? {
          isGenerated: true,
          questionsCount,
          passingScore: chapterObj.quiz.passingScore,
          maxAttempts: chapterObj.quiz.maxAttempts,
          timeLimit: chapterObj.quiz.timeLimit
        } : { isGenerated: false }
      };
    });
    
    console.log(`✅ Chapters processed successfully. Caching and sending response...`);
    
    const responsePayload = {
      chapters: chaptersWithStatus,
      courseProgress: courseStatus
    };

    CacheManager.set(cacheKey, responsePayload, 15000);

    res.json(responsePayload);
  } catch (err) {
    console.error(`❌ Error in getChaptersByCourse:`, err.message);
    next(err);
  }
};

// Get single chapter details
exports.getChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const userId = req.userId;
    
    const chapter = await Chapter.findById(chapterId)
      .populate('course', 'title numberOfChapters studentCourseProgress teacher');
    
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    const course = chapter.course;
    const isTeacher = course.teacher.toString() === userId;
    
    // Teachers always have access
    if (isTeacher) {
      // Return full chapter data for teacher
      res.json({
        ...chapter.toObject(),
        isUnlocked: true,
        isTeacher: true
      });
      return;
    }
    
    // Check if student has access (chapter is unlocked)
    const courseStatus = course.getStudentChapterStatus(userId);
    
    // Primary check: courseStatus.chaptersCompleted array
    let isUnlocked = chapter.chapterNumber === 1 || 
      courseStatus.chaptersCompleted?.includes(chapter.chapterNumber - 1);
    
    // Fallback check: If course progress doesn't show previous chapter complete,
    // check the previous chapter's studentProgress directly
    if (!isUnlocked && chapter.chapterNumber > 1) {
      const previousChapter = await Chapter.findOne({
        course: course._id,
        chapterNumber: chapter.chapterNumber - 1
      });
      
      if (previousChapter) {
        const prevChapterProgress = previousChapter.studentProgress?.find(
          p => p.student.toString() === userId.toString()
        );
        
        // If previous chapter quiz was passed, unlock this chapter
        if (prevChapterProgress?.quizPassed) {
          isUnlocked = true;
          
          // Also update the course progress to fix the inconsistency
          course.updateStudentProgress(userId, chapter.chapterNumber - 1);
          await course.save();
        }
      }
    }
    
    if (!isUnlocked) {
      return res.status(403).json({ 
        message: 'Chapter is locked. Complete the previous chapter quiz first.',
        isLocked: true,
        requiredChapter: chapter.chapterNumber - 1
      });
    }
    
    const progress = chapter.getStudentProgress(userId);
    
    // Return chapter without quiz answers for students
    const chapterData = chapter.toObject();
    if (chapterData.quiz?.questions) {
      chapterData.quiz.questions = chapterData.quiz.questions.map(q => ({
        question: q.question,
        options: q.options,
        // Don't send correctAnswer or explanation until quiz is submitted
      }));
    }
    
    res.json({
      ...chapterData,
      isUnlocked: true,
      studentProgress: progress
    });
  } catch (err) {
    next(err);
  }
};

// Create a new chapter for a course
exports.createChapter = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, chapterNumber } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify the user is the course teacher
    if (course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the course teacher can add chapters' });
    }
    
    // Determine chapter number
    const existingChapters = await Chapter.countDocuments({ course: courseId });
    const newChapterNumber = chapterNumber || existingChapters + 1;
    
    // Auto-update course numberOfChapters if needed
    if (newChapterNumber > (course.numberOfChapters || 0)) {
      course.numberOfChapters = newChapterNumber;
    }
    
    const chapter = new Chapter({
      course: courseId,
      chapterNumber: newChapterNumber,
      title: title || `Chapter ${newChapterNumber}`,
      description,
      order: newChapterNumber,
      isLocked: newChapterNumber > 1
    });
    
    await chapter.save();
    
    // Add chapter to course
    course.chapters.push(chapter._id);
    await course.save();
    
    res.status(201).json(chapter);
  } catch (err) {
    next(err);
  }
};

// Update chapter details
exports.updateChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const updates = req.body;
    
    const chapter = await Chapter.findById(chapterId).populate('course');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Verify the user is the course teacher
    if (chapter.course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the course teacher can edit chapters' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'isPublished'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        chapter[field] = updates[field];
      }
    });

    if (updates.quiz) {
      const nextQuiz = chapter.quiz || {};

      if (Array.isArray(updates.quiz.questions)) {
        const sanitizedQuestions = updates.quiz.questions
          .filter(q => q && typeof q.question === 'string' && Array.isArray(q.options))
          .map(q => {
            const options = q.options.map(opt => `${opt ?? ''}`.trim()).filter(Boolean);
            const correctAnswer = Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0;

            return {
              question: `${q.question}`.trim(),
              options: options.slice(0, 4),
              correctAnswer: Math.min(Math.max(correctAnswer, 0), 3),
              explanation: q.explanation ? `${q.explanation}` : undefined,
              difficulty: q.difficulty || 'medium'
            };
          })
          .filter(q => q.question && q.options.length === 4);

        nextQuiz.questions = sanitizedQuestions;
        nextQuiz.isGenerated = sanitizedQuestions.length > 0;
        nextQuiz.generatedAt = nextQuiz.generatedAt || new Date();
      }

      if (updates.quiz.passingScore !== undefined) {
        nextQuiz.passingScore = updates.quiz.passingScore;
      }
      if (updates.quiz.maxAttempts !== undefined) {
        nextQuiz.maxAttempts = updates.quiz.maxAttempts;
      }
      if (updates.quiz.timeLimit !== undefined) {
        nextQuiz.timeLimit = updates.quiz.timeLimit;
      }

      chapter.quiz = nextQuiz;
    }
    
    await chapter.save();
    res.json(chapter);
  } catch (err) {
    next(err);
  }
};

// Add slides to a chapter
exports.addSlides = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { slides, slideContent, resources } = req.body;
    
    const chapter = await Chapter.findById(chapterId).populate('course');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Verify the user is the course teacher
    if (chapter.course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the course teacher can add slides' });
    }
    
    // Add new slides
    if (Array.isArray(slides)) {
      // Replace slides instead of appending
      chapter.slides = slides;
    }
    
    // Update slide content (text for AI quiz generation)
    if (slideContent !== undefined) {
      chapter.slideContent = slideContent;
    }
    
    // Update resources if provided
    if (Array.isArray(resources)) {
      chapter.resources = resources;
    }
    
    await chapter.save();
    res.json(chapter);
  } catch (err) {
    next(err);
  }
};

// Add lectures to a chapter
exports.addLectures = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { lectures } = req.body;
    
    const chapter = await Chapter.findById(chapterId).populate('course');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Verify the user is the course teacher
    if (chapter.course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the course teacher can add lectures' });
    }
    
    if (Array.isArray(lectures)) {
      // Set order for new lectures
      const currentMaxOrder = chapter.lectures.length;
      const lecturesWithOrder = lectures.map((lec, i) => ({
        ...lec,
        order: currentMaxOrder + i + 1
      }));
      chapter.lectures.push(...lecturesWithOrder);
    }
    
    await chapter.save();
    res.json(chapter);
  } catch (err) {
    next(err);
  }
};

// Mark slides as viewed by student
exports.markSlidesViewed = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const studentId = req.body.studentId || req.userId;
    
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    let progress = chapter.studentProgress.find(
      p => p.student.toString() === studentId.toString()
    );
    
    if (!progress) {
      chapter.studentProgress.push({
        student: studentId,
        slidesViewed: true,
        slidesViewedAt: new Date()
      });
    } else {
      progress.slidesViewed = true;
      progress.slidesViewedAt = progress.slidesViewedAt || new Date();
    }
    
    await chapter.save();
    res.json({ message: 'Slides marked as viewed', progress: chapter.getStudentProgress(studentId) });
  } catch (err) {
    next(err);
  }
};

// Mark lecture as watched by student
exports.markLectureWatched = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { lectureId, lectureUrl } = req.body;
    const studentId = req.body.studentId || req.userId;
    
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    let progress = chapter.studentProgress.find(
      p => p.student.toString() === studentId.toString()
    );
    
    if (!progress) {
      progress = {
        student: studentId,
        lecturesWatched: [lectureUrl || lectureId]
      };
      chapter.studentProgress.push(progress);
    } else {
      if (!progress.lecturesWatched) {
        progress.lecturesWatched = [];
      }
      const identifier = lectureUrl || lectureId;
      if (!progress.lecturesWatched.includes(identifier)) {
        progress.lecturesWatched.push(identifier);
      }
    }
    
    // Check if all lectures are completed
    if (progress.lecturesWatched.length >= chapter.lectures.length) {
      progress.allLecturesCompleted = true;
      progress.lecturesCompletedAt = new Date();
    }
    
    await chapter.save();
    res.json({ 
      message: 'Lecture marked as watched', 
      progress: chapter.getStudentProgress(studentId) 
    });
  } catch (err) {
    next(err);
  }
};

// Delete a chapter
exports.deleteChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    
    const chapter = await Chapter.findById(chapterId).populate('course');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Verify the user is the course teacher
    if (chapter.course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the course teacher can delete chapters' });
    }
    
    // Remove from course
    await Course.findByIdAndUpdate(chapter.course._id, {
      $pull: { chapters: chapterId }
    });
    
    // Delete all quiz attempts for this chapter
    await QuizAttempt.deleteMany({ chapter: chapterId });
    
    // Delete the chapter
    await Chapter.findByIdAndDelete(chapterId);
    
    res.json({ message: 'Chapter deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Extract text from PDF slide for quiz generation
exports.extractPdfText = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { pdfDataUrl } = req.body; // Base64 data URL of the PDF
    
    const chapter = await Chapter.findById(chapterId).populate('course');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Verify the user is the course teacher
    if (chapter.course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the course teacher can extract slide content' });
    }
    
    if (!pdfDataUrl) {
      return res.status(400).json({ message: 'No PDF data provided' });
    }
    
    // Extract base64 data from data URL
    const base64Data = pdfDataUrl.split(',')[1];
    if (!base64Data) {
      return res.status(400).json({ message: 'Invalid PDF data format' });
    }
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    // Parse PDF and extract text using pdf-parse v1.x API
    const pdfData = await pdfParse(pdfBuffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Could not extract text from PDF. The PDF may be image-based or empty.',
        suggestion: 'Try copying text manually from the slides or use a PDF with selectable text.'
      });
    }
    
    // Clean up the extracted text
    let extractedText = pdfData.text
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n')  // Remove empty lines
      .trim();
    
    // Optionally save to chapter
    chapter.slideContent = extractedText;
    await chapter.save();
    
    res.json({
      success: true,
      message: 'Text extracted successfully',
      extractedText,
      pageCount: pdfData.numpages,
      charCount: extractedText.length
    });
  } catch (err) {
    console.error('PDF extraction error:', err);
    if (err.message?.includes('Invalid PDF')) {
      return res.status(400).json({ 
        message: 'Invalid PDF file. Please upload a valid PDF.',
        error: err.message
      });
    }
    next(err);
  }
};
