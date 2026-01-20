/**
 * Database Index Creator
 * Creates compound indexes for optimal query performance
 * Run once: node utils/createIndexes.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDB } = require('../config/db');

// Load models
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const User = require('../models/user_model');
const Chapter = require('../models/Chapter');
const Notification = require('../models/Notification');

async function createIndexes() {
  try {
    console.log('🔧 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Creating optimized indexes...\n');

    // Course indexes
    console.log('📚 Creating Course indexes...');
    await Course.collection.createIndex({ teacher: 1, isActive: 1 });
    await Course.collection.createIndex({ grade: 1, isActive: 1 });
    await Course.collection.createIndex({ subject: 1, grade: 1 });
    await Course.collection.createIndex({ createdAt: -1 });
    await Course.collection.createIndex({ students: 1 }); // For enrollment lookups
    console.log('   ✅ Course indexes created');

    // Assignment indexes
    console.log('📝 Creating Assignment indexes...');
    await Assignment.collection.createIndex({ teacher: 1, status: 1 });
    await Assignment.collection.createIndex({ course: 1, dueDate: 1 });
    await Assignment.collection.createIndex({ grade: 1, status: 1 });
    await Assignment.collection.createIndex({ dueDate: 1 });
    await Assignment.collection.createIndex({ 'submissions.student': 1 }); // For student submission lookups
    console.log('   ✅ Assignment indexes created');

    // User indexes
    console.log('👤 Creating User indexes...');
    await User.collection.createIndex({ role: 1, isActive: 1 });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ studentType: 1, schoolGrade: 1 });
    await User.collection.createIndex({ studentType: 1, universityMajor: 1 });
    await User.collection.createIndex({ parentId: 1 }); // For parent-child lookups
    console.log('   ✅ User indexes created');

    // Chapter indexes
    console.log('📖 Creating Chapter indexes...');
    await Chapter.collection.createIndex({ course: 1, chapterNumber: 1 });
    await Chapter.collection.createIndex({ course: 1, isPublished: 1 });
    console.log('   ✅ Chapter indexes created');

    // Notification indexes
    console.log('🔔 Creating Notification indexes...');
    await Notification.collection.createIndex({ user: 1, isRead: 1 });
    await Notification.collection.createIndex({ user: 1, createdAt: -1 });
    await Notification.collection.createIndex({ type: 1, createdAt: -1 });
    console.log('   ✅ Notification indexes created');

    console.log('\n✨ All indexes created successfully!\n');

    // Show index stats
    console.log('📈 Index Statistics:');
    const collections = ['courses', 'assignments', 'users', 'chapters', 'notifications'];
    
    for (const collName of collections) {
      try {
        const indexes = await mongoose.connection.db.collection(collName).indexes();
        console.log(`   ${collName}: ${indexes.length} indexes`);
      } catch (e) {
        console.log(`   ${collName}: collection may not exist yet`);
      }
    }

    console.log('\n🎉 Database optimization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
