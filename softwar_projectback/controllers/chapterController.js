const Chapter = require('../models/Chapter');
const Course = require('../models/Course');
const QuizAttempt = require('../models/QuizAttempt');
const pdfParse = require('pdf-parse');

// Get all chapters for a course
exports.getChaptersByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.query.studentId || req.userId;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const chapters = await Chapter.find({ course: courseId })
      .sort({ chapterNumber: 1 });
    
    // Get student's course progress
    const courseStatus = course.getStudentChapterStatus(studentId);
    
    // Add unlock status and progress for each chapter
    const chaptersWithStatus = chapters.map(chapter => {
      const chapterObj = chapter.toObject();
      const isUnlocked = chapter.chapterNumber === 1 || 
        courseStatus.chaptersCompleted?.includes(chapter.chapterNumber - 1);
      const progress = chapter.getStudentProgress(studentId);
      
      return {
        ...chapterObj,
        // Include slide content info but not full text in list view
        slideContent: chapterObj.slideContent ? `${chapterObj.slideContent.length} characters` : null,
        hasSlideContent: !!(chapterObj.slideContent && chapterObj.slideContent.length > 100),
        slideContentLength: chapterObj.slideContent?.length || 0,
        isUnlocked,
        studentProgress: progress,
        // Don't expose quiz answers
        quiz: chapter.quiz?.isGenerated ? {
          isGenerated: true,
          questionsCount: chapter.quiz.questions?.length || 0,
          passingScore: chapter.quiz.passingScore
        } : { isGenerated: false }
      };
    });
    
    res.json({
      chapters: chaptersWithStatus,
      courseProgress: courseStatus
    });
  } catch (err) {
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
    const isUnlocked = chapter.chapterNumber === 1 || 
      courseStatus.chaptersCompleted?.includes(chapter.chapterNumber - 1);
    
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
