import { useState, useEffect } from 'react';
import { Save, Globe, Mail, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_BASE = (process.env.REACT_APP_API_BASE_URL || window.location.origin) + '/api';

export function SystemSettings() {
  const { t, i18n } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    platformName: 'Ruwwad Educational Platform',
    platformVersion: 'v1.0.0',
    defaultLanguage: 'ar',
    timezone: 'Asia/Riyadh',
    adminEmail: 'aboodjamal684@gmail.com',
    supportEmail: 'support@ruwwad.edu',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/system-settings`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await res.json();
        setSettings({
          platformName: data.platformName || 'Ruwwad Educational Platform',
          platformVersion: data.platformVersion || 'v1.0.0',
          defaultLanguage: data.defaultLanguage || i18n.language || 'ar',
          timezone: data.timezone || 'Asia/Riyadh',
          adminEmail: data.adminEmail || 'aboodjamal684@gmail.com',
          supportEmail: data.supportEmail || 'support@ruwwad.edu',
        });
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [i18n.language]);

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      defaultLanguage: i18n.language
    }));
  }, [i18n.language]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    console.log('[SystemSettings] Saving settings:', settings);

    try {
      const res = await fetch(`${API_BASE}/system-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      console.log('[SystemSettings] Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[SystemSettings] Error response:', errorData);
        throw new Error(errorData.message || `Failed to save settings (${res.status})`);
      }

      const data = await res.json();
      console.log('[SystemSettings] Settings saved successfully:', data);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[SystemSettings] Error saving settings:', err);
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'defaultLanguage') {
      i18n.changeLanguage(value);
      localStorage.setItem('language', value);
      document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = value;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">{t('settings.systemSettings')}</h1>
          <p className="text-gray-600">{t('settings.configureSettings')}</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? t('settings.saved') : t('settings.saveChanges')}
        </button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-blue-600" />
            <h3 className="text-gray-900">{t('settings.generalSettings')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">
                {t('settings.platformName')}
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                {t('settings.platformVersion')}
              </label>
              <input
                type="text"
                value={settings.platformVersion}
                onChange={(e) => handleChange('platformVersion', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                {t('settings.defaultLanguage')}
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">{t('settings.english')}</option>
                <option value="ar">{t('settings.arabic')}</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                {t('settings.timezone')}
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Middle East">
                  <option value="Asia/Jerusalem">Palestine/Jerusalem (GMT+2)</option>
                  <option value="Asia/Gaza">Gaza (GMT+2)</option>
                  <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                  <option value="Asia/Dubai">Dubai (GMT+4)</option>
                  <option value="Asia/Kuwait">Kuwait (GMT+3)</option>
                  <option value="Asia/Amman">Amman (GMT+2)</option>
                  <option value="Asia/Beirut">Beirut (GMT+2)</option>
                  <option value="Asia/Damascus">Damascus (GMT+2)</option>
                </optgroup>
                <optgroup label="Africa">
                  <option value="Africa/Cairo">Cairo (GMT+2)</option>
                  <option value="Africa/Casablanca">Casablanca (GMT+1)</option>
                  <option value="Africa/Johannesburg">Johannesburg (GMT+2)</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Europe/Paris">Paris (GMT+1)</option>
                  <option value="Europe/Berlin">Berlin (GMT+1)</option>
                  <option value="Europe/Istanbul">Istanbul (GMT+3)</option>
                  <option value="Europe/Moscow">Moscow (GMT+3)</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="Asia/Karachi">Karachi (GMT+5)</option>
                  <option value="Asia/Kolkata">Kolkata (GMT+5:30)</option>
                  <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                  <option value="Asia/Singapore">Singapore (GMT+8)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                </optgroup>
                <optgroup label="Americas">
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="America/Chicago">Chicago (GMT-6)</option>
                  <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                  <option value="America/Toronto">Toronto (GMT-5)</option>
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                </optgroup>
                <optgroup label="Pacific">
                  <option value="Australia/Sydney">Sydney (GMT+10)</option>
                  <option value="Pacific/Auckland">Auckland (GMT+12)</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-blue-600" />
            <h3 className="text-gray-900">{t('settings.emailSettings')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">
                {t('settings.adminEmail')}
              </label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleChange('adminEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                {t('settings.supportEmail')}
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      
      </div>
    </div>
  );
}