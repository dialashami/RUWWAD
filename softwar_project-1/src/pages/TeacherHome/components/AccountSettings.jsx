import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../../../config/api.config';
import '../styles/AccountSettings.css';

export function AccountSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showProfilePage, setShowProfilePage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // User data
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    bio: "",
    role: "teacher",
    experience: 0
  });

  // Form data
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    subject: '',
    bio: '',
    email: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false
  });

  // Fetch teacher profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // Try to get data from localStorage user
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            const name = `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'Teacher';
            setUserData({
              name,
              email: parsed.email || '',
              phone: parsed.phone || '',
              subject: parsed.subject || 'math',
              bio: parsed.bio || '',
              role: parsed.role || 'teacher',
              experience: parsed.experience || 0
            });
            setProfileForm({
              name,
              phone: parsed.phone || '',
              subject: parsed.subject || 'math',
              bio: parsed.bio || '',
              email: parsed.email || '',
            });
            setPreferences(parsed.preferences || {
              emailNotifications: true,
              pushNotifications: true,
              weeklyReports: false
            });
          }
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_CONFIG.BASE_URL}/api/teacher/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch profile:', res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log('Profile data received:', data);

        const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Teacher';
        
        setUserData({
          name,
          email: data.email || '',
          phone: data.phone || '',
          subject: data.subject || 'math',
          bio: data.bio || '',
          role: 'teacher',
          experience: data.experience || 0
        });

        setProfileForm({
          name,
          phone: data.phone || '',
          subject: data.subject || 'math',
          bio: data.bio || '',
          email: data.email || '',
        });

        setPreferences(data.preferences || {
          emailNotifications: true,
          pushNotifications: true,
          weeklyReports: false
        });

      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  // Save profile function
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/teacher/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profileForm.name,
            phone: profileForm.phone,
            subject: profileForm.subject,
            bio: profileForm.bio,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Failed to update profile:', res.status, errorData);
          throw new Error(errorData.message || 'Failed to update profile');
        }

        const data = await res.json();
        console.log('Profile updated:', data);
      }

      // Update local state
      setUserData(prevData => ({
        ...prevData,
        name: profileForm.name,
        phone: profileForm.phone,
        subject: profileForm.subject,
        bio: profileForm.bio,
        email: profileForm.email,
      }));

      // Show profile page
      setShowProfilePage(true);
      
      // Success message
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Could not update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save preferences function
  const handleSavePreferences = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/teacher/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(preferences),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Failed to update preferences:', res.status, errorData);
          throw new Error(errorData.message || 'Failed to update preferences');
        }

        const data = await res.json();
        console.log('Preferences updated:', data);
      }

      alert('Preferences saved successfully!');
    } catch (err) {
      console.error('Error updating preferences:', err);
      alert('Could not update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Back to settings function
  const handleBackToSettings = () => {
    setShowProfilePage(false);
  };

  // Show profile page
  if (showProfilePage) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button 
            className="back-button"
            onClick={handleBackToSettings}
          >
            ← Back to Settings
          </button>
          <h1>Profile</h1>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="profile-info-main">
              <h2>{userData.name}</h2>
              <p className="profile-role">{userData.role === 'teacher' ? 'Teacher' : 'Student'} • {getSubjectName(userData.subject)}</p>
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="info-card">
              {/* <div className="info-icon"></div> */}
              <div className="info-content">
                <h3>Email</h3>
                <p>{userData.email}</p>
              </div>
            </div>

            <div className="info-card">
              {/* <div className="info-icon"></div> */}
              <div className="info-content">
                <h3>Phone Number</h3>
                <p>{userData.phone}</p>
              </div>
            </div>

            <div className="info-card">
              {/* <div className="info-icon"></div> */}
              <div className="info-content">
                <h3>Subject</h3>
                <p>{getSubjectName(userData.subject)}</p>
              </div>
            </div>

            <div className="info-card">
              {/* <div className="info-icon">🎓</div> */}
              <div className="info-content">
                <h3>Experience</h3>
                <p>5 years</p>
              </div>
            </div>
          </div>

          <div className="bio-section">
            <h3>About Me</h3>
            <div className="bio-content">
              <p>{userData.bio}</p>
            </div>
          </div>

          <div className="profile-actions">
            <button 
              className="btn btn-primary"
              onClick={handleBackToSettings}
            >
              ✏️ Edit Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-settings">
      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              <div className="tab-indicator"></div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-panel active">
              <div className="panel-header">
                <h2>Profile Information</h2>
                <p>Manage your personal information and profile details</p>
              </div>
              
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      className="form-input"
                      placeholder="Enter your full name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
  type="email"
  id="email"
  className="form-input"
  placeholder="your@email.com"
  value={profileForm.email}
  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
/>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-input"
                      placeholder="+966 50 123 4567"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <select 
                      className="form-input"
                      value={profileForm.subject}
                      onChange={(e) => setProfileForm({...profileForm, subject: e.target.value})}
                    >
                      <option value="">Select Subject</option>
                      <option value="math">Mathematics</option>
                      <option value="science">Science</option>
                      <option value="english">English</option>
                      <option value="history">History</option>
                      <option value="arabic">Arabic</option>
                      <option value="islamic">Islamic Studies</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="physics">Physics</option>
                      <option value="biology">Biology</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    className="form-textarea"
                    placeholder="Tell us about yourself..."
                    rows="4"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <span>💾</span>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="tab-panel active">
              <div className="panel-header">
                <h2>Preferences</h2>
                <p>Customize your application preferences</p>
              </div>

              <div className="preferences-content">
                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Email Notifications</h4>
                    <p>Receive email updates about your activity</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.emailNotifications}
                      onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Push Notifications</h4>
                    <p>Get notified about important updates</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.pushNotifications}
                      onChange={(e) => setPreferences({...preferences, pushNotifications: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Weekly Reports</h4>
                    <p>Receive weekly summary of your activity</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.weeklyReports}
                      onChange={(e) => setPreferences({...preferences, weeklyReports: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="form-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={handleSavePreferences}
                    disabled={saving}
                  >
                    <span>💾</span>
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get subject name
function getSubjectName(subject) {
  const subjects = {
    math: 'Mathematics',
    science: 'Science',
    english: 'English',
    history: 'History',
    arabic: 'Arabic',
    islamic: 'Islamic Studies',
    chemistry: 'Chemistry',
    physics: 'Physics',
    biology: 'Biology'
  };
  return subjects[subject] || subject || 'Not Set';
}