 import React, { useRef, useState, useEffect } from "react";
import {
  User,
  Bell,
  Lock,
  Palette,
  Mail,
  Shield,
  Moon,
  Sun,
  Image as ImageIcon,
  Trash2,
  X,
} from "lucide-react";
import { API_CONFIG } from '../../../config/api.config';
 

export default function Settings() {
  // ===========================
  // STATE
  // ===========================
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [gradeNotifications, setGradeNotifications] = useState(true);

  // profile info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subjectLevel, setSubjectLevel] = useState("");
  const [teacherType, setTeacherType] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");

  // avatar state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  // save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifSaveSuccess, setNotifSaveSuccess] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // modal state
  const [modalType, setModalType] = useState(null); // 'password', '2fa', 'delete'
  const [showModal, setShowModal] = useState(false);

  // password temp form (for modal)
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // ===========================
  // EFFECTS
  // ===========================
  // Load user data and preferences from backend on mount
  useEffect(() => {
    const fetchUserData = async () => {
      // First, load from localStorage immediately
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.firstName) setFirstName(parsed.firstName);
          if (parsed.lastName) setLastName(parsed.lastName);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.bio) setBio(parsed.bio);
          if (parsed.subject) setSubjectLevel(parsed.subject);
          if (parsed.teacherType) setTeacherType(parsed.teacherType);
          if (parsed.specialization) setSpecialization(parsed.specialization);
          if (parsed.profileImage) setAvatarUrl(parsed.profileImage);
        }
      } catch (e) {
        console.error('Error loading user from localStorage:', e);
      }

      // Then fetch from backend for latest data
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_CONFIG.BASE_URL}/api/users/profile`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName) setLastName(data.lastName);
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
          if (data.bio) setBio(data.bio);
          if (data.subject) setSubjectLevel(data.subject);
          if (data.teacherType) setTeacherType(data.teacherType);
          if (data.specialization) setSpecialization(data.specialization);
          if (data.profileImage) setAvatarUrl(data.profileImage);
          // Load notification preferences
          if (data.preferences) {
            setEmailNotifications(data.preferences.emailNotifications ?? true);
            setPushNotifications(data.preferences.pushNotifications ?? true);
            setAssignmentReminders(data.preferences.assignmentReminders ?? true);
            setGradeNotifications(data.preferences.gradeNotifications ?? true);
          }
          // Load 2FA status
          if (data.twoFactorEnabled !== undefined) {
            setTwoFAEnabled(data.twoFactorEnabled);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchUserData();
  }, []);

  // handle dark mode body class toggle and save to localStorage
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-active");
    } else {
      document.body.classList.remove("dark-active");
    }
    // Save to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // auto-clear save success after a bit
  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  useEffect(() => {
    if (notifSaveSuccess) {
      const t = setTimeout(() => setNotifSaveSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [notifSaveSuccess]);

  // Save notification preferences
  const handleSaveNotificationPreferences = async () => {
    setSavingNotifications(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const res = await fetch(`${API_CONFIG.BASE_URL}/api/teacher/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
          assignmentReminders,
          gradeNotifications,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to save notification preferences');
        return;
      }

      setNotifSaveSuccess(true);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      alert('Error saving preferences. Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  };

  // ===========================
  // HANDLERS
  // ===========================
  const handleAvatarClick = () => {
    // simulate clicking hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // preview locally
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const handleRemoveAvatar = () => {
    // reset to fallback (remove img)
    setAvatarUrl(null);
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const res = await fetch(`${API_CONFIG.BASE_URL}/api/teacher/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          bio,
          subject: subjectLevel,
          teacherType,
          specialization,
          profileImage: avatarUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to save changes');
        return;
      }

      // Update localStorage user
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.firstName = firstName;
          parsed.lastName = lastName;
          parsed.email = email;
          parsed.phone = phone;
          parsed.bio = bio;
          parsed.subject = subjectLevel;
          parsed.teacherType = teacherType;
          parsed.specialization = specialization;
          parsed.profileImage = avatarUrl;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving changes. Please try again.');
    }
  };

  const handleOpenModal = (type) => {
    setModalType(type); // 'password' | '2fa' | 'delete'
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
    setCurrentPass("");
    setNewPass("");
  };

  const handleConfirmAction = async () => {
    if (modalType === "password") {
      // Validate passwords
      if (!currentPass || !newPass) {
        alert('Please fill in both current and new password fields.');
        return;
      }
      if (newPass.length < 6) {
        alert('New password must be at least 6 characters.');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Not authenticated. Please log in again.');
          return;
        }

        const res = await fetch(`${API_CONFIG.BASE_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: currentPass,
            newPassword: newPass,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || 'Failed to change password.');
          return;
        }

        alert('Password changed successfully!');
        handleCloseModal();
      } catch (err) {
        console.error('Error changing password:', err);
        alert('Error changing password. Please try again.');
      }
      return;
    } else if (modalType === "2fa") {
      // toggle 2fa via API
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Not authenticated. Please log in again.');
          return;
        }

        const newStatus = !twoFAEnabled;
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/auth/toggle-2fa`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ enabled: newStatus }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || 'Failed to update 2FA settings.');
          return;
        }

        setTwoFAEnabled(newStatus);
        alert(data.message);
      } catch (err) {
        console.error('Error toggling 2FA:', err);
        alert('Error updating 2FA settings. Please try again.');
      }
    } else if (modalType === "delete") {
      // delete account via API
      const confirmDelete = window.confirm(
        'Are you absolutely sure you want to delete your account? This action cannot be undone.'
      );
      
      if (!confirmDelete) {
        handleCloseModal();
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Not authenticated. Please log in again.');
          return;
        }

        const res = await fetch(`${API_CONFIG.BASE_URL}/api/auth/delete-account`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || 'Failed to delete account.');
          return;
        }

        alert('Account deleted successfully. You will be logged out.');
        // Clear local storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      } catch (err) {
        console.error('Error deleting account:', err);
        alert('Error deleting account. Please try again.');
      }
    }
    handleCloseModal();
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1 className="settings-title">
          Settings
        </h1>
        <p className="settings-subtitle">
          Manage your account and preferences
        </p>
      </div>

      <div className="settings-grid">
        {/* LEFT NAV / SIDEBAR */}
        <div className="settings-nav-wrapper">
          <div className="settings-card settings-sticky-card">
            <nav className="settings-nav-list">
              {[
                { icon: User, label: "Profile", id: "profile" },
                { icon: Bell, label: "Notifications", id: "notifications" },
                { icon: Lock, label: "Privacy", id: "privacy" },
                { icon: Palette, label: "Appearance", id: "appearance" },
               
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className="settings-nav-btn"
                    // ممكن تحوّليها مستقبلاً للـscroll to section أو routing
                    onClick={() => {
                      // placeholder scroll-to-behavior
                      const el = document.querySelector(
                        `[data-section="${item.id}"]`
                      );
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                  >
                    <Icon className="settings-nav-icon" />
                    <span className="settings-nav-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="settings-main-col">
          {/* PROFILE SETTINGS */}
          <div className="settings-card" data-section="profile">
            <div className="settings-card-head">
              <User className="settings-card-head-icon" />
              <h2 className="settings-card-head-title">Profile Information</h2>
            </div>

            {/* Profile Picture Row */}
            <div className="settings-avatar-row">
              <div className="settings-avatar-circle">
                {avatarUrl ? (
                  <img
                    className="settings-avatar-img"
                    src={avatarUrl}
                    alt="avatar"
                  />
                ) : (
                  <div className="settings-avatar-fallback">
                    {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h3 className="settings-avatar-name">{`${firstName} ${lastName}`}</h3>
                <div className="settings-avatar-actions">
                  <button
                    className="btn-gradient-primary btn-sm"
                    onClick={handleAvatarClick}
                  >
                    <ImageIcon size={16} />
                    <span>Change Photo</span>
                  </button>

                  <button
                    className="btn-outline btn-sm"
                    onClick={handleRemoveAvatar}
                  >
                    <Trash2 size={16} />
                    <span>Remove</span>
                  </button>

                  {/* hidden file input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleAvatarFileChange}
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="settings-section-fields">
              <div className="settings-two-col">
                <div className="settings-field">
                  <label className="settings-label" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="settings-input"
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="settings-input"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="settings-input"
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="settings-input"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="teacherType">
                  Teacher Type
                </label>
                <div className="select-wrapper">
                  <select
                    id="teacherType"
                    value={teacherType}
                    onChange={(e) => {
                      setTeacherType(e.target.value);
                      setSpecialization(""); // Reset specialization when type changes
                    }}
                    className="settings-select"
                  >
                    <option value="">Select Type</option>
                    <option value="school">School Teacher</option>
                    <option value="university">University Teacher</option>
                  </select>
                </div>
              </div>

              {teacherType === 'school' && (
                <div className="settings-field">
                  <label className="settings-label" htmlFor="subject">
                    Subject
                  </label>
                  <div className="select-wrapper">
                    <select
                      id="subject"
                      value={subjectLevel}
                      onChange={(e) => setSubjectLevel(e.target.value)}
                      className="settings-select"
                    >
                      <option value="">Select Subject</option>
                      <option value="math">Mathematics</option>
                      <option value="english">English</option>
                      <option value="science">Science</option>
                      <option value="history">History</option>
                      <option value="arabic">Arabic</option>
                      <option value="islamic">Islamic Studies</option>
                      <option value="biology">Biology</option>
                      <option value="physics">Physics</option>
                      <option value="chemistry">Chemistry</option>
                    </select>
                  </div>
                </div>
              )}

              {teacherType === 'university' && (
                <div className="settings-field">
                  <label className="settings-label" htmlFor="specialization">
                    Specialization
                  </label>
                  <div className="select-wrapper">
                    <select
                      id="specialization"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="settings-select"
                    >
                      <option value="">Select Specialization</option>
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Architectural Engineering">Architectural Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Industrial Engineering">Industrial Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Mechatronics Engineering">Mechatronics Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="settings-field">
                <label className="settings-label" htmlFor="bio">
                  Bio
                </label>
                <input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="settings-input"
                />
              </div>

              <div className="settings-save-row">
                <button
                  className="btn-gradient-primary btn-lg w-full-mobile"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </button>

                {saveSuccess && (
                  <div className="save-toast">
                    <span className="save-toast-dot" />
                    <span>Saved</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NOTIFICATION SETTINGS */}
          <div className="settings-card" data-section="notifications">
            <div className="settings-card-head">
              <Bell className="settings-card-head-icon" />
              <h2 className="settings-card-head-title">
                Notification Preferences
              </h2>
            </div>

            <div className="settings-toggles-list">
              {/* Email Notifications */}
              <div className="settings-toggle-row">
                <div className="settings-toggle-left">
                  <Mail className="settings-toggle-icon" />
                  <div>
                    <p className="settings-toggle-title">Email Notifications</p>
                    <p className="settings-toggle-desc">
                      Receive email updates about your courses
                    </p>
                  </div>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* Push Notifications */}
              <div className="settings-toggle-row">
                <div className="settings-toggle-left">
                  <Bell className="settings-toggle-icon" />
                  <div>
                    <p className="settings-toggle-title">Push Notifications</p>
                    <p className="settings-toggle-desc">
                      Get push notifications on your device
                    </p>
                  </div>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="settings-separator" />

              {/* Assignment Reminders */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-title">Assignment Reminders</p>
                  <p className="settings-toggle-desc">
                    Get reminded about upcoming deadlines
                  </p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={assignmentReminders}
                    onChange={(e) =>
                      setAssignmentReminders(e.target.checked)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* Grade Notifications */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-title">Grade Notifications</p>
                  <p className="settings-toggle-desc">
                    Be notified when grades are posted
                  </p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={gradeNotifications}
                    onChange={(e) =>
                      setGradeNotifications(e.target.checked)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* Save Button */}
              <div className="settings-save-row" style={{ marginTop: '1.5rem' }}>
                <button
                  className="btn-gradient-primary btn-lg w-full-mobile"
                  onClick={handleSaveNotificationPreferences}
                  disabled={savingNotifications}
                >
                  {savingNotifications ? 'Saving...' : 'Save Preferences'}
                </button>

                {notifSaveSuccess && (
                  <div className="save-toast">
                    <span className="save-toast-dot" />
                    <span>Saved</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* APPEARANCE */}
          <div className="settings-card" data-section="appearance">
            <div className="settings-card-head">
              <Palette className="settings-card-head-icon" />
              <h2 className="settings-card-head-title">Appearance</h2>
            </div>

            <div className="settings-toggles-list">
              {/* Dark Mode */}
              <div className="settings-toggle-row">
                <div className="settings-toggle-left">
                  {darkMode ? (
                    <Moon className="settings-toggle-icon" />
                  ) : (
                    <Sun className="settings-toggle-icon" />
                  )}
                  <div>
                    <p className="settings-toggle-title">Dark Mode</p>
                    <p className="settings-toggle-desc">
                      Switch to dark theme for comfortable viewing
                    </p>
                  </div>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              
            </div>
          </div>

          {/* PRIVACY & SECURITY */}
          <div className="settings-card" data-section="privacy">
            <div className="settings-card-head">
              <Shield className="settings-card-head-icon" />
              <h2 className="settings-card-head-title">
                Privacy &amp; Security
              </h2>
            </div>

            <div className="settings-privacy-list">
              <button
                className="btn-outline w-full justify-start"
                onClick={() => handleOpenModal("password")}
              >
                <Lock className="btn-outline-icon" />
                <span>Change Password</span>
              </button>

              <button
                className="btn-outline w-full justify-start"
                onClick={() => handleOpenModal("2fa")}
              >
                <Shield className="btn-outline-icon" />
                <span>Two-Factor Authentication</span>
                {twoFAEnabled && (
                  <span className="badge-active">ON</span>
                )}
              </button>

              <button
                className="btn-outline btn-danger w-full justify-start"
                onClick={() => handleOpenModal("delete")}
              >
                <Shield className="btn-outline-icon" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="settings-modal-overlay" onClick={handleCloseModal}>
          <div
            className={`settings-modal-card ${
              modalType === "delete" ? "settings-modal-danger" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <div className="settings-modal-header-left">
                {modalType === "password" && (
                  <>
                    <Lock className="settings-modal-icon" />
                    <div className="settings-modal-title">
                      Change Password
                    </div>
                  </>
                )}

                {modalType === "2fa" && (
                  <>
                    <Shield className="settings-modal-icon" />
                    <div className="settings-modal-title">
                      Two-Factor Authentication
                    </div>
                  </>
                )}

                {modalType === "delete" && (
                  <>
                    <Shield className="settings-modal-icon danger" />
                    <div className="settings-modal-title danger">
                      Delete Account
                    </div>
                  </>
                )}
              </div>

              <button
                className="settings-modal-close"
                onClick={handleCloseModal}
              >
                <X size={18} />
              </button>
            </div>

            <div className="settings-modal-body">
              {modalType === "password" && (
                <>
                  <div className="settings-field">
                    <label className="settings-label">
                      Current Password
                    </label>
                    <input
                      className="settings-input"
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">
                      New Password
                    </label>
                    <input
                      className="settings-input"
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                    />
                  </div>
                </>
              )}

              {modalType === "2fa" && (
                <>
                  <p className="settings-modal-text">
                    Two-factor authentication adds an extra layer of security
                    to your account. You will be asked for a verification code
                    when you sign in.
                  </p>

                  <div className="settings-toggle-row modal-inline-toggle">
                    <div className="settings-toggle-left">
                      <Shield className="settings-toggle-icon" />
                      <div>
                        <p className="settings-toggle-title">
                          Enable 2FA
                        </p>
                        <p className="settings-toggle-desc">
                          Require a code on sign in
                        </p>
                      </div>
                    </div>

                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={twoFAEnabled}
                        onChange={() =>
                          setTwoFAEnabled((prev) => !prev)
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </>
              )}

              {modalType === "delete" && (
                <>
                  <p className="settings-modal-text danger">
                    This will permanently delete your account and all
                    associated data. This action cannot be undone.
                  </p>
                </>
              )}
            </div>

            <div className="settings-modal-footer">
              <button
                className="btn-outline modal-cancel-btn"
                onClick={handleCloseModal}
              >
                Cancel
              </button>

              <button
                className={`btn-gradient-primary modal-confirm-btn ${
                  modalType === "delete" ? "modal-confirm-danger" : ""
                }`}
                onClick={handleConfirmAction}
              >
                {modalType === "delete"
                  ? "Yes, Delete"
                  : modalType === "password"
                  ? "Save Password"
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
