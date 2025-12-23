const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    platformName: { type: String, default: 'Ruwwad Educational Platform' },
    platformVersion: { type: String, default: 'v1.0.0' },
    defaultLanguage: { type: String, enum: ['en', 'ar'], default: 'ar' },
    timezone: { type: String, default: 'Asia/Riyadh' },
    adminEmail: { type: String, default: 'aboodjamal684@gmail.com' },
    supportEmail: { type: String, default: 'support@ruwwad.edu' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
