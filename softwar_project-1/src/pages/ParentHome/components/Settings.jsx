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
  Plus,
  Users,
} from "lucide-react";

export default function Settings() {
  // ===========================
  // STATE
  // ===========================
  const [darkMode, setDarkMode] = useState(() => {
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
  const [bio, setBio] = useState("");

  // avatar state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  // save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifSaveSuccess, setNotifSaveSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // modal state
  const [modalType, setModalType] = useState(null); // 'password', '2fa', 'delete'
  const [showModal, setShowModal] = useState(false);

  // password temp form (for modal)
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Children state
  const [children, setChildren] = useState([]);
  const [newChildEmail, setNewChildEmail] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [childError, setChildError] = useState("");

  // ===========================
  // EFFECTS
  // ===========================
  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      // First, load from localStorage as fallback
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.firstName) setFirstName(parsed.firstName);
          if (parsed.lastName) setLastName(parsed.lastName);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.bio) setBio(parsed.bio);
          if (parsed.profileImage) setAvatarUrl(parsed.profileImage);
        }
      } catch (e) {
        console.error('Error loading user from localStorage:', e);
      }

      // Then fetch from backend for latest data
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('http://localhost:3000/api/users/profile', {
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
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch linked children on mount
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('http://localhost:3000/api/users/children', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setChildren(data || []);
        }
      } catch (err) {
        console.error('Error fetching children:', err);
      }
    };

    fetchChildren();
  }, []);

  // handle dark mode body class toggle
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-active");
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove("dark-active");
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // auto-clear save success after a bit
  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  // auto-clear notification save success
  useEffect(() => {
    if (notifSaveSuccess) {
      const t = setTimeout(() => setNotifSaveSuccess(false), 2500);
      return () => clearTimeout(t);
    }
  }, [notifSaveSuccess]);

  // ===========================
  // HANDLERS
  // ===========================
  // Add child by email
  const handleAddChild = async () => {
    if (!newChildEmail.trim()) {
      setChildError('Please enter an email address');
      return;
    }
    
    setAddingChild(true);
    setChildError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setChildError('Please log in to add a child');
        return;
      }

      const res = await fetch('http://localhost:3000/api/users/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ childEmail: newChildEmail.trim() }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setChildError(data.message || 'Failed to add child');
        return;
      }

      // Add the new child to the list
      setChildren(prev => [...prev, data.child]);
      setNewChildEmail('');
    } catch (err) {
      console.error('Error adding child:', err);
      setChildError('Error adding child. Please try again.');
    } finally {
      setAddingChild(false);
    }
  };

  // Remove child
  const handleRemoveChild = async (childId) => {
    if (!window.confirm('Are you sure you want to remove this child from your account?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`http://localhost:3000/api/users/children/${childId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setChildren(prev => prev.filter(c => c._id !== childId));
      }
    } catch (err) {
      console.error('Error removing child:', err);
    }
  };

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

  // Save profile changes to backend
  const handleSaveChanges = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to save changes');
        return;
      }

      const res = await fetch('http://localhost:3000/api/users/profile', {
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
          profileImage: avatarUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to save profile');
        return;
      }

      // Update localStorage user data
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.firstName = firstName;
          parsed.lastName = lastName;
          parsed.email = email;
          parsed.phone = phone;
          parsed.bio = bio;
          parsed.profileImage = avatarUrl;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save notification preferences
  const handleSaveNotificationPreferences = async () => {
    setSavingNotifications(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to save preferences');
        return;
      }

      const res = await fetch('http://localhost:3000/api/users/preferences', {
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
    const token = localStorage.getItem('token');
    
    if (modalType === "password") {
      if (!currentPass || !newPass) {
        alert('Please fill in both password fields');
        return;
      }
      try {
        const res = await fetch('http://localhost:3000/api/users/change-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: currentPass,
            newPassword: newPass,
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          alert(errorData.message || 'Failed to change password');
          return;
        }
        
        alert('Password changed successfully!');
      } catch (err) {
        console.error('Error changing password:', err);
        alert('Error changing password. Please try again.');
        return;
      }
    } else if (modalType === "2fa") {
      try {
        const res = await fetch('http://localhost:3000/api/users/toggle-2fa', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enabled: !twoFAEnabled }),
        });
        
        if (res.ok) {
          setTwoFAEnabled((prev) => !prev);
        } else {
          alert('Failed to update 2FA settings');
          return;
        }
      } catch (err) {
        console.error('Error toggling 2FA:', err);
        alert('Error updating 2FA. Please try again.');
        return;
      }
    } else if (modalType === "delete") {
      if (!window.confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
        return;
      }
      try {
        const res = await fetch('http://localhost:3000/api/users/account', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          alert('Failed to delete account');
          return;
        }
      } catch (err) {
        console.error('Error deleting account:', err);
        alert('Error deleting account. Please try again.');
        return;
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
                { icon: Users, label: "My Children", id: "children" },
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
                  <div className="settings-avatar-fallback">{firstName.charAt(0)}{lastName.charAt(0)}</div>
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
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
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

          {/* CHILDREN SETTINGS */}
          <div className="settings-card" data-section="children">
            <div className="settings-card-head">
              <Users className="settings-card-head-icon" />
              <h2 className="settings-card-head-title">My Children</h2>
            </div>

            <div className="settings-section-fields">
              <p className="settings-toggle-desc" style={{ marginBottom: '1rem' }}>
                Link your children's accounts to view their academic progress, courses, and grades.
              </p>

              {/* Existing children list */}
              {children.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {children.map((child) => (
                    <div 
                      key={child._id} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 500, margin: 0 }}>
                          {child.firstName} {child.lastName}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #666)', margin: 0 }}>
                          {child.email}
                        </p>
                      </div>
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => handleRemoveChild(child._id)}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new child */}
              <div className="settings-field">
                <label className="settings-label">Add Child by Email</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    value={newChildEmail}
                    onChange={(e) => {
                      setNewChildEmail(e.target.value);
                      setChildError('');
                    }}
                    className="settings-input"
                    placeholder="Enter child's email address"
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn-gradient-primary"
                    onClick={handleAddChild}
                    disabled={addingChild}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={18} />
                    {addingChild ? 'Adding...' : 'Add'}
                  </button>
                </div>
                {childError && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {childError}
                  </p>
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

              {/* Save Notification Preferences Button */}
              <div className="settings-save-row" style={{ marginTop: '1rem' }}>
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
