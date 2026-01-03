const mongoose = require('mongoose');

// Track video watch progress per student
const videoProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  watchedVideoUrls: [{ type: String }], // Array of watched video URLs
  watchedUploadedVideos: [{ type: String }], // Array of watched uploaded video fileUrls
  completedAt: { type: Date }, // When student completed all videos
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
    // Additional fields for frontend compatibility
    subject: { type: String, trim: true },
    grade: { type: String, trim: true }, // e.g. 'Grade 9', 'grade10', or 'University'
    universityMajor: { type: String, trim: true }, // e.g. 'Computer Engineering', 'Civil Engineering'
    duration: { type: String, trim: true }, // e.g. '45 minutes', '1 hour'
    thumbnail: { type: String, trim: true }, // URL to course image
    progress: { type: Number, default: 0, min: 0, max: 100 }, // completion percentage
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' },
    // Zoom meeting link for live sessions
    zoomLink: { type: String, trim: true },
    zoomMeetingId: { type: String, trim: true },
    zoomPassword: { type: String, trim: true },
    scheduleTime: { type: Date }, // When the live session is scheduled
    // Video content for the course
    videoUrls: [{ type: String, trim: true }], // Online video links (YouTube, Vimeo, etc.)
    uploadedVideos: [{ 
      fileName: { type: String, trim: true },
      fileUrl: { type: String, trim: true }
    }],
    // Student video progress tracking
    videoProgress: [videoProgressSchema],
  },
  { timestamps: true }
);

// Virtual to get total video count
courseSchema.virtual('totalVideoCount').get(function () {
  const urlCount = this.videoUrls ? this.videoUrls.length : 0;
  const uploadedCount = this.uploadedVideos ? this.uploadedVideos.length : 0;
  return urlCount + uploadedCount;
});

// Method to calculate student progress
courseSchema.methods.getStudentProgress = function(studentId) {
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

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);
