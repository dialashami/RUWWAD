// Migration script to add fileUrl to existing slides
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Chapter = require('./models/Chapter');
    const chapters = await Chapter.find({});
    
    let updated = 0;
    for (const ch of chapters) {
      if (!ch.slides || ch.slides.length === 0) continue;
      
      let changed = false;
      ch.slides = ch.slides.map(slide => {
        // If slide has content but no fileUrl, copy it
        if (!slide.fileUrl && slide.content) {
          slide.fileUrl = slide.content;
          changed = true;
        }
        return slide;
      });
      
      if (changed) {
        await ch.save();
        updated++;
        console.log('Updated chapter:', ch.title, '- added fileUrl to', ch.slides.length, 'slides');
      }
    }
    
    console.log('\nMigration complete!');
    console.log('Total chapters updated:', updated);
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
