const mongoose = require('mongoose');

// Track student progress through a chapter
const chapterProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slidesViewed: { type: Boolean, default: false },
  slidesViewedAt: { type: Date },
  lecturesWatched: [{ type: String }], // Array of watched lecture URLs/fileUrls
  allLecturesCompleted: { type: Boolean, default: false },
  lecturesCompletedAt: { type: Date },
  quizAttempts: [{
    attemptNumber: { type: Number, required: true },
    score: { type: Number, required: true }, // Percentage score (0-100)
    correctAnswers: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
    answers: [{
      questionIndex: { type: Number },
      selectedAnswer: { type: Number },
      isCorrect: { type: Boolean }
    }]
  }],
  quizPassed: { type: Boolean, default: false },
  quizPassedAt: { type: Date },
  chapterCompleted: { type: Boolean, default: false },
  chapterCompletedAt: { type: Date }
});

// Quiz question schema embedded in chapter
const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // Array of 4 options (A, B, C, D)
  correctAnswer: { type: Number, required: true }, // Index of correct option (0-3)
  explanation: { type: String }, // Optional explanation for the answer
  sourceSlide: { type: Number }, // Which slide this question is derived from
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

const chapterSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    chapterNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    // Slides for this chapter (uploaded files or URLs)
    slides: [{
      fileName: { type: String, trim: true },
      fileUrl: { type: String, trim: true },
      fileType: { type: String, trim: true }, // pdf, pptx, etc.
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Text content extracted from slides (used for AI quiz generation)
    slideContent: { type: String, trim: true },
    
    // Lectures/videos for this chapter
    lectures: [{
      title: { type: String, trim: true },
      videoUrl: { type: String, trim: true }, // YouTube, Vimeo, etc.
      uploadedVideo: {
        fileName: { type: String, trim: true },
        fileUrl: { type: String, trim: true }
      },
      duration: { type: String, trim: true },
      order: { type: Number, default: 0 }
    }],
    
    // Additional resources (images, files, text, links)
    resources: [{
      type: { type: String, enum: ['image', 'file', 'text', 'link'], default: 'file' },
      title: { type: String, trim: true },
      url: { type: String, trim: true },
      content: { type: String, trim: true }, // For text type resources
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // AI-generated quiz for this chapter
    quiz: {
      isGenerated: { type: Boolean, default: false },
      generatedAt: { type: Date },
      questions: [quizQuestionSchema],
      passingScore: { type: Number, default: 60 }, // Percentage to pass (default 60%)
      maxAttempts: { type: Number, default: 0 }, // 0 = unlimited attempts
      timeLimit: { type: Number, default: 0 } // Minutes, 0 = no time limit
    },
    
    // Student progress tracking
    studentProgress: [chapterProgressSchema],
    
    // Chapter status
    isPublished: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: true }, // First chapter is unlocked by default
    
    // Order in course
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Index for efficient queries
chapterSchema.index({ course: 1, chapterNumber: 1 });
chapterSchema.index({ course: 1, order: 1 });

// Method to check if a student has unlocked this chapter
chapterSchema.methods.isUnlockedForStudent = function(studentId) {
  // First chapter is always unlocked
  if (this.chapterNumber === 1) return true;
  
  // Check if student has passed the quiz (this would need to check previous chapter)
  // This is handled in the controller with course context
  return !this.isLocked;
};

// Method to get student's progress in this chapter
chapterSchema.methods.getStudentProgress = function(studentId) {
  const progress = this.studentProgress.find(
    p => p.student.toString() === studentId.toString()
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
  
  const totalLectures = this.lectures.length;
  const watchedLectures = progress.lecturesWatched?.length || 0;
  const lecturesProgress = totalLectures > 0 
    ? Math.round((watchedLectures / totalLectures) * 100) 
    : 100;
  
  const bestScore = progress.quizAttempts.length > 0
    ? Math.max(...progress.quizAttempts.map(a => a.score))
    : 0;
  
  return {
    slidesViewed: progress.slidesViewed,
    slidesViewedAt: progress.slidesViewedAt,
    lecturesProgress,
    lecturesWatched: watchedLectures,
    totalLectures,
    allLecturesCompleted: progress.allLecturesCompleted,
    quizAttempts: progress.quizAttempts.length,
    quizPassed: progress.quizPassed,
    quizPassedAt: progress.quizPassedAt,
    bestScore,
    lastAttempt: progress.quizAttempts.length > 0 
      ? progress.quizAttempts[progress.quizAttempts.length - 1] 
      : null,
    chapterCompleted: progress.chapterCompleted,
    chapterCompletedAt: progress.chapterCompletedAt
  };
};

// Ensure virtuals are included in JSON
chapterSchema.set('toJSON', { virtuals: true });
chapterSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Chapter', chapterSchema);
