/**
 * Migration Script: Sync Courses with Chapters
 * 
 * This script ensures:
 * 1. All courses have their chapters array populated with valid Chapter IDs
 * 2. All chapters have their course field set correctly
 * 3. Orphan chapters are linked to their courses
 * 4. Courses without chapters get chapters created
 * 
 * Run: node utils/syncCourseChapters.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Course = require('../models/Course');
const Chapter = require('../models/Chapter');

// Direct MongoDB connection with extended timeouts
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://aboodjamal684_db_user:Abd123456@abd.lvp2v4i.mongodb.net/ruwwad_test?retryWrites=true&w=majority&appName=abd';

async function syncCourseChapters() {
  try {
    console.log('🔧 Connecting to database...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 120000,
      connectTimeoutMS: 30000,
    });
    
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Syncing Courses and Chapters...\n');

    // Get all courses
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses\n`);

    let fixed = 0;
    let chaptersCreated = 0;
    let chaptersLinked = 0;

    for (const course of courses) {
      const courseId = course._id;
      const courseName = course.title || 'Untitled';
      
      console.log(`\n📚 Processing: "${courseName}" (${courseId})`);

      // Find all chapters that reference this course
      const existingChapters = await Chapter.find({ course: courseId }).sort({ chapterNumber: 1 });
      console.log(`   Found ${existingChapters.length} chapters referencing this course`);

      // Check if course.chapters array is empty but chapters exist
      if (existingChapters.length > 0 && (!course.chapters || course.chapters.length === 0)) {
        // Link existing chapters to course
        course.chapters = existingChapters.map(c => c._id);
        course.numberOfChapters = existingChapters.length;
        await course.save();
        console.log(`   ✅ Linked ${existingChapters.length} existing chapters to course`);
        chaptersLinked += existingChapters.length;
        fixed++;
        continue;
      }

      // Check if course.chapters array has IDs but chapters don't exist
      if (course.chapters && course.chapters.length > 0) {
        const validChapters = [];
        for (const chapterId of course.chapters) {
          const chapterExists = await Chapter.findById(chapterId);
          if (chapterExists) {
            // Make sure the chapter's course field is set
            if (!chapterExists.course || chapterExists.course.toString() !== courseId.toString()) {
              chapterExists.course = courseId;
              await chapterExists.save();
              console.log(`   ✅ Fixed chapter ${chapterId} course reference`);
            }
            validChapters.push(chapterId);
          } else {
            console.log(`   ⚠️ Chapter ${chapterId} not found in database`);
          }
        }

        // Update course with only valid chapter IDs
        if (validChapters.length !== course.chapters.length) {
          course.chapters = validChapters;
          await course.save();
          console.log(`   ✅ Cleaned up invalid chapter references`);
          fixed++;
        }

        // If we have valid chapters, we're done with this course
        if (validChapters.length > 0) {
          console.log(`   ✓ Course has ${validChapters.length} valid chapters`);
          continue;
        }
      }

      // If course is chapter-based but has no chapters, create them
      if (course.isChapterBased !== false) {
        const numChapters = course.numberOfChapters || 1;
        console.log(`   Creating ${numChapters} chapters for course...`);

        const newChapters = [];
        for (let i = 1; i <= numChapters; i++) {
          const chapter = await Chapter.create({
            course: courseId,
            chapterNumber: i,
            title: `Chapter ${i}`,
            description: `Chapter ${i} of ${courseName}`,
            isPublished: true
          });
          newChapters.push(chapter._id);
          chaptersCreated++;
        }

        course.chapters = newChapters;
        await course.save();
        console.log(`   ✅ Created ${numChapters} chapters`);
        fixed++;
      }
    }

    console.log('\n\n📊 Summary:');
    console.log(`   Total courses processed: ${courses.length}`);
    console.log(`   Courses fixed: ${fixed}`);
    console.log(`   Chapters created: ${chaptersCreated}`);
    console.log(`   Chapters linked: ${chaptersLinked}`);

    // Verify the fix
    console.log('\n🔍 Verification:');
    const coursesWithChapters = await Course.find({ 'chapters.0': { $exists: true } }).countDocuments();
    const totalChapters = await Chapter.countDocuments();
    const orphanChapters = await Chapter.countDocuments({ course: { $exists: false } });

    console.log(`   Courses with chapters: ${coursesWithChapters}/${courses.length}`);
    console.log(`   Total chapters: ${totalChapters}`);
    console.log(`   Orphan chapters: ${orphanChapters}`);

    console.log('\n🎉 Course-Chapter sync complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncCourseChapters();
