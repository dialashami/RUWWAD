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
import { useStudent } from '../context/StudentContext';

export default function Settings() {
  // Get student data from context
  const { student, updateStudent, saveStudentProfile, refreshData } = useStudent();

  // STATE
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [gradeNotifications, setGradeNotifications] = useState(true);

  // profile info - initialized from context
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [universityMajor, setUniversityMajor] = useState("");
  const [bio, setBio] = useState("");

  // avatar state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  // save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifSaveSuccess, setNotifSaveSuccess] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // modal state
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // password temp form
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Load user data from context on mount and when context changes
  useEffect(() => {
    if (student) {
      setFirstName(student.firstName || "");
      setLastName(student.lastName || "");
      setEmail(student.email || "");
      setPhone(student.phone || "");
      setBio(student.bio || "");
      // Check studentType first, then grade
      if (student.studentType === 'university' || student.grade === 'University') {
        setGradeLevel('University');
      } else if (student.grade) {
        // Extract just the number from grade (handles "10", "Grade 10", "grade10")
        const gradeNum = student.grade.toString().replace(/\D/g, '');
        setGradeLevel(gradeNum || "");
      } else {
        setGradeLevel("");
      }
      setUniversityMajor(student.universityMajor || "");
      setAvatarUrl(student.profilePicture || null);
    }
  }, [student]);

  // Load notification preferences from backend on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/users/profile`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setEmailNotifications(data.preferences.emailNotifications ?? true);
            setPushNotifications(data.preferences.pushNotifications ?? true);
            setAssignmentReminders(data.preferences.assignmentReminders ?? true);
            setGradeNotifications(data.preferences.gradeNotifications ?? true);
          }
          if (data.twoFactorEnabled !== undefined) {
            setTwoFAEnabled(data.twoFactorEnabled);
          }
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    };

    loadPreferences();
  }, []);

  // handle dark mode body class toggle
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-active");
    } else {
      document.body.classList.remove("dark-active");
    }
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
        alert('Not authenticated. Please log in again.');
        setSavingNotifications(false);
        return;
      }

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/student/preferences`, {
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 || data.message?.toLowerCase().includes('expired') || data.message?.toLowerCase().includes('jwt')) {
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        alert(data.message || 'Failed to save notification preferences');
        setSavingNotifications(false);
        return;
      }

      setNotifSaveSuccess(true);
      alert('Preferences saved successfully!');
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      alert('Error saving preferences. Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
  };

  // State for tracking if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track changes to enable auto-save detection
  useEffect(() => {
    if (student) {
      const studentGrade = student.studentType === 'university' ? 'University' : (student.grade || '');
      const hasChanges = 
        firstName !== (student.firstName || '') ||
        lastName !== (student.lastName || '') ||
        email !== (student.email || '') ||
        phone !== (student.phone || '') ||
        bio !== (student.bio || '') ||
        gradeLevel !== studentGrade ||
        universityMajor !== (student.universityMajor || '');
      setHasUnsavedChanges(hasChanges);
    }
  }, [firstName, lastName, email, phone, bio, gradeLevel, universityMajor, student]);

  const handleSaveChanges = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      // Use context's saveStudentProfile if available, otherwise direct API call
      const profileData = {
        firstName,
        lastName,
        email,
        phone,
        bio,
        profilePicture: avatarUrl,
        grade: gradeLevel === 'University' ? 'University' : `Grade ${gradeLevel}`,
        universityMajor: gradeLevel === 'University' ? universityMajor : null,
      };

      if (saveStudentProfile) {
        const result = await saveStudentProfile(profileData);
        if (!result.success) {
          if (result.error?.toLowerCase().includes('expired') || result.error?.toLowerCase().includes('jwt')) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
          alert(result.error || 'Failed to save changes');
          return;
        }
      } else {
        // Fallback to direct API call
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Not authenticated');
          return;
        }

        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          if (res.status === 401 || errorData.message?.toLowerCase().includes('expired') || errorData.message?.toLowerCase().includes('jwt')) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
          alert(errorData.message || 'Failed to save changes');
          return;
        }

        // Update context and localStorage
        updateStudent({
          firstName,
          lastName,
          email,
          phone,
          bio,
          profilePicture: avatarUrl,
          grade: gradeLevel === 'University' ? 'University' : gradeLevel,
          studentType: gradeLevel === 'University' ? 'university' : 'school',
          universityMajor: gradeLevel === 'University' ? universityMajor : null,
        });
      }

      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      
      // Refresh data across all components
      if (refreshData) {
        refreshData();
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenModal = (type) => {
    setModalType(type);
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

        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/auth/change-password`, {
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
      setTwoFAEnabled((prev) => !prev);
    } else if (modalType === "delete") {
      console.log("Account deleted.");
    }
    handleCloseModal();
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account and preferences</p>
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
                    onClick={() => {
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
                  <div className="settings-avatar-fallback">AM</div>
                )}
              </div>

              <div>
                <h3 className="settings-avatar-name">{firstName} {lastName}</h3>
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
                <label className="settings-label" htmlFor="grade">
                  Grade Level
                </label>
                <div className="select-wrapper">
                  <select
                    id="grade"
                    value={gradeLevel}
                    onChange={(e) => {
                      setGradeLevel(e.target.value);
                      if (e.target.value !== 'University') {
                        setUniversityMajor('');
                      }
                    }}
                    className="settings-select"
                  >
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                    <option value="University">University</option>
                  </select>
                </div>
              </div>

              {gradeLevel === 'University' && (
                <div className="settings-field">
                  <label className="settings-label" htmlFor="universityMajor">
                    Specialization
                  </label>
                  <div className="select-wrapper">
                    <select
                      id="universityMajor"
                      value={universityMajor}
                      onChange={(e) => setUniversityMajor(e.target.value)}
                      className="settings-select"
                    >
                      <option value="">Select specialization</option>
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
                  disabled={isSaving}
                  style={{ 
                    opacity: isSaving ? 0.7 : 1,
                    position: 'relative'
                  }}
                >
                  {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Changes'}
                </button>

                {saveSuccess && (
                  <div className="save-toast">
                    <span className="save-toast-dot" />
                    <span>Saved</span>
                  </div>
                )}
                
                {hasUnsavedChanges && !saveSuccess && (
                  <div className="save-toast" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                    <span className="save-toast-dot" style={{ backgroundColor: '#f59e0b' }} />
                    <span>Unsaved changes</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NOTIFICATION SETTINGS */}
          <div className="settings-card" data-section="notifications">
            <div className="settings-card-head">
              <Bell className="settings-card-head-icon" />
              <h2 className="settings-card-head-title">Notification Preferences</h2>
            </div>

            <div className="settings-toggles-list">
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
                    onChange={(e) => setAssignmentReminders(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

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
                    onChange={(e) => setGradeNotifications(e.target.checked)}
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
              <h2 className="settings-card-head-title">Privacy &amp; Security</h2>
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
                {twoFAEnabled && <span className="badge-active">ON</span>}
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
                    <div className="settings-modal-title">Change Password</div>
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
                    <label className="settings-label">Current Password</label>
                    <input
                      className="settings-input"
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">New Password</label>
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
                        <p className="settings-toggle-title">Enable 2FA</p>
                        <p className="settings-toggle-desc">
                          Require a code on sign in
                        </p>
                      </div>
                    </div>

                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={twoFAEnabled}
                        onChange={() => setTwoFAEnabled((prev) => !prev)}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </>
              )}

              {modalType === "delete" && (
                <p className="settings-modal-text danger">
                  This will permanently delete your account and all
                  associated data. This action cannot be undone.
                </p>
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
