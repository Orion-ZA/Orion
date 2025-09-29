// SettingsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, MapPin, Globe, Lock, Bell, Eye, EyeOff, 
  Save, X, Upload, Trash2, Shield, Palette 
} from 'lucide-react';
import { 
  updateProfile, 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useToast } from '../components/ToastContext';
import './Settings.css';
import { useTheme } from '../components/ThemeProvider';

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { show } = useToast();

  // Form states
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    email: '',
    bio: '',
    location: '',
    website: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { mode: themeMode, setMode: setThemeMode, resolved: resolvedTheme } = useTheme();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    activityUpdates: true,
    newsletter: false,
    publicProfile: true,
    showActivityStatus: true,
    mapType: 'standard',
    theme: themeMode || 'auto'
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setProfileForm({
          displayName: user.displayName || '',
          email: user.email || '',
          bio: '',
          location: '',
          website: ''
        });
        // In a real app, you would fetch these from Firestore
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (name, value) => {
    setPreferences(prev => ({ ...prev, [name]: value }));
    if (name === 'theme') {
      setThemeMode(value);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update profile in Firebase Auth
      await updateProfile(user, {
        displayName: profileForm.displayName
      });

      // Update email if changed
      if (user.email !== profileForm.email) {
        await updateEmail(user, profileForm.email);
      }

      // Update additional info in Firestore
      const userRef = doc(db, 'Users', user.uid);
      await updateDoc(userRef, {
        'profileInfo.displayName': profileForm.displayName,
        'profileInfo.bio': profileForm.bio,
        'profileInfo.location': profileForm.location,
        'profileInfo.website': profileForm.website,
        lastUpdated: new Date()
      });

      show('Profile updated successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      show(`Error updating profile: ${error.message}`, { type: 'error' });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      show('New passwords do not match', { type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      show('Password must be at least 6 characters', { type: 'error' });
      return;
    }

    setSaving(true);
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email, 
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordForm.newPassword);
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      show('Password updated successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error changing password:', error);
      show(`Error changing password: ${error.message}`, { type: 'error' });
    }
    setSaving(false);
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save preferences to Firestore
      const userRef = doc(db, 'Users', user.uid);
      await updateDoc(userRef, {
        preferences: preferences,
        lastUpdated: new Date()
      });

      show('Preferences saved successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      show(`Error saving preferences: ${error.message}`, { type: 'error' });
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // Reauthenticate first
      const password = prompt('Please enter your password to confirm account deletion:');
      if (!password) return;

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user from Auth
      await deleteUser(user);
      
      // In a real app, you would also delete user data from Firestore
      
      show('Account deleted successfully', { type: 'success' });
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      show(`Error deleting account: ${error.message}`, { type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="settings-spinner"></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and settings</p>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <nav className="settings-nav">
              <button 
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} />
                Profile
              </button>
              <button 
                className={activeTab === 'security' ? 'active' : ''}
                onClick={() => setActiveTab('security')}
              >
                <Lock size={18} />
                Security
              </button>
              <button 
                className={activeTab === 'preferences' ? 'active' : ''}
                onClick={() => setActiveTab('preferences')}
              >
                <Palette size={18} />
                Preferences
              </button>
              <button 
                className={activeTab === 'notifications' ? 'active' : ''}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} />
                Notifications
              </button>
            </nav>
          </div>

          <div className="settings-main">
            {activeTab === 'profile' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Profile Information</h2>
                  <p>Update your personal information</p>
                </div>

                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="displayName">
                      <User size={16} />
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={profileForm.displayName}
                      onChange={handleProfileChange}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      <Mail size={16} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      placeholder="Tell us about yourself..."
                      rows="4"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="location">
                        <MapPin size={16} />
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={profileForm.location}
                        onChange={handleProfileChange}
                        placeholder="Your city or region"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="website">
                        <Globe size={16} />
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={profileForm.website}
                        onChange={handleProfileChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate('/profile')}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Security Settings</h2>
                  <p>Manage your password and security preferences</p>
                </div>

                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="password-input">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                      />
                      <button 
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="password-input">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your new password"
                      />
                      <button 
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="password-input">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm your new password"
                      />
                      <button 
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-primary"
                      onClick={handleChangePassword}
                      disabled={saving}
                    >
                      <Lock size={16} />
                      {saving ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                <div className="danger-zone">
                  <h3>
                    <Shield size={18} />
                    Danger Zone
                  </h3>
                  <p>Once you delete your account, there is no going back. Please be certain.</p>
                  <button 
                    className="btn-danger"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Preferences</h2>
                  <p>Customize your application experience</p>
                </div>

                <div className="settings-form">
                  <div className="preference-group">
                    <h3>Theme</h3>
                    <div className="preference-options">
                      <label className={`preference-option ${preferences.theme === 'light' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={preferences.theme === 'light'}
                          onChange={() => handlePreferenceChange('theme', 'light')}
                        />
                        <span className="option-label">Light</span>
                      </label>
                      <label className={`preference-option ${preferences.theme === 'dark' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={preferences.theme === 'dark'}
                          onChange={() => handlePreferenceChange('theme', 'dark')}
                        />
                        <span className="option-label">Dark</span>
                      </label>
                      <label className={`preference-option ${preferences.theme === 'auto' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="auto"
                          checked={preferences.theme === 'auto'}
                          onChange={() => handlePreferenceChange('theme', 'auto')}
                        />
                        <span className="option-label">Auto <small style={{opacity:.65}}>(System → {resolvedTheme})</small></span>
                      </label>
                      <div style={{marginTop:'0.75rem', fontSize:'0.8rem', color:'var(--muted)'}}>Active theme: <strong>{resolvedTheme}</strong></div>
                    </div>
                  </div>

                  <div className="preference-group">
                    <h3>Map Preferences</h3>
                    <div className="form-group">
                      <label htmlFor="mapType">Default Map Type</label>
                      <select
                        id="mapType"
                        value={preferences.mapType}
                        onChange={(e) => handlePreferenceChange('mapType', e.target.value)}
                      >
                        <option value="standard">Standard</option>
                        <option value="satellite">Satellite</option>
                        <option value="terrain">Terrain</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-primary"
                      onClick={handleSavePreferences}
                      disabled={saving}
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Notification Preferences</h2>
                  <p>Manage how we communicate with you</p>
                </div>

                <div className="settings-form">
                  <div className="preference-group">
                    <h3>Email Notifications</h3>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">Trail recommendations and updates</span>
                    </label>

                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.activityUpdates}
                        onChange={(e) => handlePreferenceChange('activityUpdates', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">Activity updates</span>
                    </label>

                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.newsletter}
                        onChange={(e) => handlePreferenceChange('newsletter', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">Newsletter</span>
                    </label>
                  </div>

                  <div className="preference-group">
                    <h3>Privacy Settings</h3>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.publicProfile}
                        onChange={(e) => handlePreferenceChange('publicProfile', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">Public profile</span>
                    </label>

                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.showActivityStatus}
                        onChange={(e) => handlePreferenceChange('showActivityStatus', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">Show activity status</span>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-primary"
                      onClick={handleSavePreferences}
                      disabled={saving}
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;