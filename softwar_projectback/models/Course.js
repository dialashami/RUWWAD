const mongoose = require('mongoose');

// Track video watch progress per student (legacy - for courses without chapters)
const videoProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  watchedVideoUrls: [{ type: String }], // Array of watched video URLs
  watchedUploadedVideos: [{ type: String }], // Array of watched uploaded video fileUrls
  completedAt: { type: Date }, // When student completed all videos
});

// Track student progress through entire course (chapter-based)
const courseProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentChapter: { type: Number, default: 1 }, // Which chapter student is currently on
  chaptersCompleted: [{ type: Number }], // Array of completed chapter numbers
  overallProgress: { type: Number, default: 0, min: 0, max: 100 }, // Overall percentage
  lastAccessedAt: { type: Date, default: Date.now },
  courseCompletedAt: { type: Date }
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    
    // ===== NEW: Subject type and chapter structure =====
    subjectType: { 
      type: String, 
      enum: ['mathematics', 'science', 'physics', 'chemistry', 'biology', 'english', 'arabic', 'history', 'geography', 'computer_science', 'programming', 'other'],
      trim: true 
    },
    numberOfChapters: { type: Number, default: 1, min: 1 },
    chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
    isChapterBased: { type: Boolean, default: true }, // New courses are chapter-based by default
    
    // Track student progress (chapter-based courses)
    studentCourseProgress: [courseProgressSchema],
    
    // ===== END NEW =====
    
    // Additional fields for frontend compatibility
    subject: { type: String, trim: true },
    grade: { type: String, trim: true }, // e.g. 'Grade 9', 'grade10', or 'University'
    universityMajor: { type: String, trim: true }, // e.g. 'Computer Engineering', 'Civil Engineering'
    duration: { type: String, trim: true }, // e.g. '45 minutes', '1 hour'
    thumbnail: { type: String, trim: true }, // URL to course image
    progress: { type: Number, default: 0, min: 0, max: 100 }, // completion percentage (legacy)
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' },
    // Zoom meeting link for live sessions
    zoomLink: { type: String, trim: true },
    zoomMeetingId: { type: String, trim: true },
    zoomPassword: { type: String, trim: true },
    scheduleTime: { type: Date }, // When the live session is scheduled
    // Video content for the course (legacy - non-chapter courses)
    videoUrls: [{ type: String, trim: true }], // Online video links (YouTube, Vimeo, etc.)
    uploadedVideos: [{ 
      fileName: { type: String, trim: true },
      fileUrl: { type: String, trim: true }
    }],
    // Student video progress tracking (legacy - non-chapter courses)
    videoProgress: [videoProgressSchema],
  },
  { timestamps: true }
);

// Virtual to get total video count (legacy - non-chapter courses)
courseSchema.virtual('totalVideoCount').get(function () {
  const urlCount = this.videoUrls ? this.videoUrls.length : 0;
  const uploadedCount = this.uploadedVideos ? this.uploadedVideos.length : 0;
  return urlCount + uploadedCount;
});

// Method to calculate student progress (legacy - non-chapter courses)
courseSchema.methods.getStudentProgress = function(studentId) {
  // For chapter-based courses, use studentCourseProgress
  if (this.isChapterBased && this.numberOfChapters > 0) {
    const courseProgress = this.studentCourseProgress?.find(
      p => p.student.toString() === studentId.toString()
    );
    return courseProgress?.overallProgress || 0;
  }
  
  // Legacy: video-based progress
  const totalVideos = this.totalVideoCount;
  if (totalVideos === 0) return 100; // No videos = course is complete

  const studentProgress = this.videoProgress.find(
    vp => vp.student.toString() === studentId.toString()
  );

  if (!studentProgress) return 0;

  const watchedCount = 
    (studentProgress.watchedVideoUrls?.length || 0) + 
    (studentProgress.watchedUploadedVideos?.length || 0);

  return Math.round((watchedCount / totalVideos) * 100);
};

// Method to get student's current chapter and unlock status
courseSchema.methods.getStudentChapterStatus = function(studentId) {
  if (!this.isChapterBased) {
    return { isChapterBased: false };
  }
  
  const courseProgress = this.studentCourseProgress?.find(
    p => p.student.toString() === studentId.toString()
  );
  
  return {
    isChapterBased: true,
    totalChapters: this.numberOfChapters,
    currentChapter: courseProgress?.currentChapter || 1,
    chaptersCompleted: courseProgress?.chaptersCompleted || [],
    overallProgress: courseProgress?.overallProgress || 0,
    lastAccessedAt: courseProgress?.lastAccessedAt,
    courseCompleted: courseProgress?.courseCompletedAt != null
  };
};

// Method to update student's course progress after completing a chapter
courseSchema.methods.updateStudentProgress = function(studentId, completedChapter) {
  let progressEntry = this.studentCourseProgress?.find(
    p => p.student.toString() === studentId.toString()
  );
  
  if (!progressEntry) {
    this.studentCourseProgress = this.studentCourseProgress || [];
    progressEntry = {
      student: studentId,
      currentChapter: 1,
      chaptersCompleted: [],
      overallProgress: 0,
      lastAccessedAt: new Date()
    };
    this.studentCourseProgress.push(progressEntry);
  }
  
  // Add completed chapter if not already completed
  if (!progressEntry.chaptersCompleted.includes(completedChapter)) {
    progressEntry.chaptersCompleted.push(completedChapter);
  }
  
  // Update current chapter to next one
  if (completedChapter >= progressEntry.currentChapter && completedChapter < this.numberOfChapters) {
    progressEntry.currentChapter = completedChapter + 1;
  }
  
  // Calculate overall progress
  progressEntry.overallProgress = Math.round(
    (progressEntry.chaptersCompleted.length / this.numberOfChapters) * 100
  );
  
  // Check if course is completed
  if (progressEntry.chaptersCompleted.length >= this.numberOfChapters) {
    progressEntry.courseCompletedAt = new Date();
  }
  
  progressEntry.lastAccessedAt = new Date();
  
  return progressEntry;
};

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);
