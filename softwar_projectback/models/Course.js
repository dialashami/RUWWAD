const mongoose = require('mongoose');

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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
