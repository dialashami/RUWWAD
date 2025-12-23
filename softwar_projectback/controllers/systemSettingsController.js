const SystemSettings = require('../models/SystemSettings');

// Get system settings (returns single settings document or creates default)
exports.getSystemSettings = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || userPayload.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.json(settings);
  } catch (err) {
    next(err);
  }
};

// Update system settings
exports.updateSystemSettings = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    console.log('[updateSystemSettings] Request from userId:', userId, 'role:', userPayload?.role);
    console.log('[updateSystemSettings] Request body:', req.body);

    if (!userId || !userPayload || userPayload.role !== 'admin') {
      console.log('[updateSystemSettings] Access denied - not admin');
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { platformName, platformVersion, defaultLanguage, timezone, adminEmail, supportEmail } = req.body;

    let settings = await SystemSettings.findOne();
    console.log('[updateSystemSettings] Existing settings:', settings ? 'Found' : 'Not found');

    if (!settings) {
      console.log('[updateSystemSettings] Creating new settings document');
      settings = await SystemSettings.create(req.body);
    } else {
      console.log('[updateSystemSettings] Updating existing settings');
      settings.platformName = platformName || settings.platformName;
      settings.platformVersion = platformVersion || settings.platformVersion;
      settings.defaultLanguage = defaultLanguage || settings.defaultLanguage;
      settings.timezone = timezone || settings.timezone;
      settings.adminEmail = adminEmail || settings.adminEmail;
      settings.supportEmail = supportEmail || settings.supportEmail;
      
      await settings.save();
    }

    console.log('[updateSystemSettings] Settings saved successfully');
    res.json(settings);
  } catch (err) {
    console.error('[updateSystemSettings] Error:', err);
    next(err);
  }
};
