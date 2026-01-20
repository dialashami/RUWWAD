// Script to check for courses with malformed IDs
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aboodjamal684_db_user:Abd123456@abd.lvp2v4i.mongodb.net/ruwwad_test?retryWrites=true&w=majority&appName=abd';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const Course = mongoose.model('Course', new mongoose.Schema({}, { strict: false }));
    
    console.log('\n📊 Checking all courses...\n');
    const courses = await Course.find({}).select('_id title subject grade').lean();
    
    console.log(`Found ${courses.length} courses:\n`);
    courses.forEach((course, index) => {
      const idStr = course._id.toString();
      const isValid = idStr.length === 24;
      const status = isValid ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ID: ${idStr} (${idStr.length} chars) - ${course.title}`);
    });
    
    console.log('\n🔍 Specific course check:');
    const targetId1 = '69624d03a66ec8693ddbe1c85'; // With double 6
    const targetId2 = '69624d03a6ec8693ddbe1c85';  // With single 6
    
    console.log(`\nLooking for: ${targetId1} (double 6)`);
    const course1 = await Course.findById(targetId1).lean().catch(() => null);
    console.log(course1 ? `   ✅ Found: ${course1.title}` : `   ❌ Not found`);
    
    console.log(`\nLooking for: ${targetId2} (single 6)`);
    const course2 = await Course.findById(targetId2).lean().catch(() => null);
    console.log(course2 ? `   ✅ Found: ${course2.title}` : `   ❌ Not found`);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
