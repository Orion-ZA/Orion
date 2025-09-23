import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../pages/Settings';
import { ThemeProvider } from '../components/ThemeProvider';
import { ToastProvider } from '../components/ToastContext';

// Mock Firebase functions
const mockUpdateProfile = jest.fn();
const mockUpdateEmail = jest.fn();
const mockUpdatePassword = jest.fn();
const mockReauthenticateWithCredential = jest.fn();
const mockDeleteUser = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/auth', () => ({
  updateProfile: jest.fn(),
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  deleteUser: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn((email, password) => ({ email, password }))
  }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'mock-doc' })),
  updateDoc: jest.fn()
}));

jest.mock('../firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: jest.fn()
  },
  db: {
    // Mock Firestore instance
    collection: jest.fn(),
    doc: jest.fn()
  }
}));

// Mock react-router-dom
jest.mock('react-router-dom');

// Get the mocked functions
const { __mockNavigate: mockNavigate } = require('react-router-dom');
const { auth } = require('../firebaseConfig');
const mockOnAuthStateChanged = auth.onAuthStateChanged;

// Get the mocked Firebase functions
const { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, deleteUser } = require('firebase/auth');
const { updateDoc } = require('firebase/firestore');

// Assign the mock functions
Object.assign(mockUpdateProfile, updateProfile);
Object.assign(mockUpdateEmail, updateEmail);
Object.assign(mockUpdatePassword, updatePassword);
Object.assign(mockReauthenticateWithCredential, reauthenticateWithCredential);
Object.assign(mockDeleteUser, deleteUser);
Object.assign(mockUpdateDoc, updateDoc);

// Mock window.confirm and window.prompt
const mockConfirm = jest.fn();
const mockPrompt = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});
Object.defineProperty(window, 'prompt', {
  value: mockPrompt,
  writable: true
});

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </ThemeProvider>
);

describe('SettingsPage', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
    mockUpdateProfile.mockResolvedValue();
    mockUpdateEmail.mockResolvedValue();
    mockUpdatePassword.mockResolvedValue();
    mockReauthenticateWithCredential.mockResolvedValue();
    mockDeleteUser.mockResolvedValue();
    mockUpdateDoc.mockResolvedValue();
    mockConfirm.mockReturnValue(true);
    mockPrompt.mockReturnValue('test-password');
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByTestId('settings-loading')).toBeInTheDocument();
    });

    it('hides loading spinner when user is loaded', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate no user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](null);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('sets up auth state listener on mount', () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(expect.any(Function));
    });

    it('cleans up auth state listener on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });
    });

    it('shows profile tab by default', () => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });

    it('switches to security tab when clicked', () => {
      const securityTab = screen.getByText('Security');
      fireEvent.click(securityTab);

      expect(screen.getByText('Security Settings')).toBeInTheDocument();
      expect(screen.queryByText('Profile Information')).not.toBeInTheDocument();
    });

    it('switches to preferences tab when clicked', () => {
      const preferencesTab = screen.getByText('Preferences');
      fireEvent.click(preferencesTab);

      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.queryByText('Profile Information')).not.toBeInTheDocument();
    });

    it('switches to notifications tab when clicked', () => {
      const notificationsTab = screen.getByText('Notifications');
      fireEvent.click(notificationsTab);

      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.queryByText('Profile Information')).not.toBeInTheDocument();
    });

    it('highlights active tab', () => {
      const profileTab = screen.getByText('Profile');
      const securityTab = screen.getByText('Security');

      expect(profileTab.closest('button')).toHaveClass('active');
      expect(securityTab.closest('button')).not.toHaveClass('active');

      fireEvent.click(securityTab);

      expect(profileTab.closest('button')).not.toHaveClass('active');
      expect(securityTab.closest('button')).toHaveClass('active');
    });
  });

  describe('Profile Tab', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });
    });

    it('populates form with user data', () => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('updates form fields when user types', async () => {
      const displayNameInput = screen.getByDisplayValue('Test User');
      
      await userEvent.clear(displayNameInput);
      await userEvent.type(displayNameInput, 'New Name');

      expect(displayNameInput).toHaveValue('New Name');
    });

    it('saves profile changes successfully', async () => {
      const displayNameInput = screen.getByDisplayValue('Test User');
      const saveButton = screen.getByText('Save Changes');

      await userEvent.clear(displayNameInput);
      await userEvent.type(displayNameInput, 'Updated Name');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
          displayName: 'Updated Name'
        });
        expect(mockUpdateDoc).toHaveBeenCalled();
      });
    });

    it.skip('updates email when changed', async () => {
      // Wait for the component to render and user to be set
      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('test@example.com');
      const saveButton = screen.getByRole('button', { name: /save changes/i });

      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateEmail).toHaveBeenCalledWith(mockUser, 'newemail@example.com');
      });
    });

    it('does not update email when unchanged', async () => {
      const saveButton = screen.getByText('Save Changes');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateEmail).not.toHaveBeenCalled();
      });
    });

    it('handles profile update errors', async () => {
      mockUpdateProfile.mockRejectedValue(new Error('Update failed'));

      const saveButton = screen.getByText('Save Changes');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error updating profile/)).toBeInTheDocument();
      });
    });

    it('shows loading state while saving', async () => {
      let resolveUpdate;
      const updatePromise = new Promise(resolve => {
        resolveUpdate = resolve;
      });
      mockUpdateProfile.mockReturnValue(updatePromise);

      const saveButton = screen.getByText('Save Changes');
      await userEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      resolveUpdate();
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('cancels and navigates back', async () => {
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Security Tab', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });

      // Switch to security tab
      const securityTab = screen.getByText('Security');
      fireEvent.click(securityTab);
    });

    it('shows password change form', () => {
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your current password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your new password')).toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      const currentPasswordInput = screen.getByPlaceholderText('Enter your current password');
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(button => 
        button.classList.contains('password-toggle')
      );

      expect(currentPasswordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');

      await userEvent.click(toggleButton);
      expect(currentPasswordInput).toHaveAttribute('type', 'password');
    });

    it('validates password confirmation match', async () => {
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');
      const changeButton = screen.getByText('Change Password');

      await userEvent.type(newPasswordInput, 'newpass123');
      await userEvent.type(confirmPasswordInput, 'differentpass');
      await userEvent.click(changeButton);

      expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
      expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
    });

    it('validates password length', async () => {
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');
      const changeButton = screen.getByText('Change Password');

      await userEvent.type(newPasswordInput, '123');
      await userEvent.type(confirmPasswordInput, '123');
      await userEvent.click(changeButton);

      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
    });

    it('changes password successfully', async () => {
      const currentPasswordInput = screen.getByPlaceholderText('Enter your current password');
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');
      const changeButton = screen.getByText('Change Password');

      await userEvent.type(currentPasswordInput, 'currentpass');
      await userEvent.type(newPasswordInput, 'newpass123');
      await userEvent.type(confirmPasswordInput, 'newpass123');
      await userEvent.click(changeButton);

      await waitFor(() => {
        expect(mockReauthenticateWithCredential).toHaveBeenCalled();
        expect(mockUpdatePassword).toHaveBeenCalledWith(mockUser, 'newpass123');
        expect(screen.getByText('Password updated successfully!')).toBeInTheDocument();
      });
    });

    it('resets form after successful password change', async () => {
      const currentPasswordInput = screen.getByPlaceholderText('Enter your current password');
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');
      const changeButton = screen.getByText('Change Password');

      await userEvent.type(currentPasswordInput, 'currentpass');
      await userEvent.type(newPasswordInput, 'newpass123');
      await userEvent.type(confirmPasswordInput, 'newpass123');
      await userEvent.click(changeButton);

      await waitFor(() => {
        expect(currentPasswordInput).toHaveValue('');
        expect(newPasswordInput).toHaveValue('');
        expect(confirmPasswordInput).toHaveValue('');
      });
    });

    it('handles password change errors', async () => {
      mockReauthenticateWithCredential.mockRejectedValue(new Error('Invalid password'));

      const currentPasswordInput = screen.getByPlaceholderText('Enter your current password');
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');
      const changeButton = screen.getByText('Change Password');

      await userEvent.type(currentPasswordInput, 'wrongpass');
      await userEvent.type(newPasswordInput, 'newpass123');
      await userEvent.type(confirmPasswordInput, 'newpass123');
      await userEvent.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText(/Error changing password/)).toBeInTheDocument();
      });
    });

    it('shows danger zone with delete account button', () => {
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });

    it('deletes account when confirmed', async () => {
      mockConfirm.mockReturnValue(true);
      mockPrompt.mockReturnValue('test-password');

      const deleteButton = screen.getByText('Delete Account');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete your account? This action cannot be undone.');
        expect(mockPrompt).toHaveBeenCalledWith('Please enter your password to confirm account deletion:');
        expect(mockReauthenticateWithCredential).toHaveBeenCalled();
        expect(mockDeleteUser).toHaveBeenCalledWith(mockUser);
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('cancels account deletion when not confirmed', async () => {
      mockConfirm.mockReturnValue(false);

      const deleteButton = screen.getByText('Delete Account');
      await userEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockPrompt).not.toHaveBeenCalled();
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('cancels account deletion when password not provided', async () => {
      mockConfirm.mockReturnValue(true);
      mockPrompt.mockReturnValue('');

      const deleteButton = screen.getByText('Delete Account');
      await userEvent.click(deleteButton);

      expect(mockPrompt).toHaveBeenCalled();
      expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('handles account deletion errors', async () => {
      mockConfirm.mockReturnValue(true);
      mockPrompt.mockReturnValue('test-password');
      mockReauthenticateWithCredential.mockRejectedValue(new Error('Invalid password'));

      const deleteButton = screen.getByText('Delete Account');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Error deleting account/)).toBeInTheDocument();
      });
    });
  });

  describe('Preferences Tab', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });

      // Switch to preferences tab
      const preferencesTab = screen.getByText('Preferences');
      fireEvent.click(preferencesTab);
    });

    it('shows theme preferences', () => {
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    it('shows map preferences', () => {
      expect(screen.getByText('Map Preferences')).toBeInTheDocument();
      expect(screen.getByText('Default Map Type')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Standard')).toBeInTheDocument();
    });

    it('changes theme preference', async () => {
      const darkThemeOption = screen.getByLabelText(/dark/i);
      await userEvent.click(darkThemeOption);

      expect(darkThemeOption).toBeChecked();
    });

    it('changes map type preference', async () => {
      const mapTypeSelect = screen.getByDisplayValue('Standard');
      await userEvent.selectOptions(mapTypeSelect, 'satellite');

      expect(mapTypeSelect).toHaveValue('satellite');
    });

    it('saves preferences successfully', async () => {
      const saveButton = screen.getByText('Save Preferences');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
        expect(screen.getByText('Preferences saved successfully!')).toBeInTheDocument();
      });
    });

    it('handles preferences save errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Save failed'));

      const saveButton = screen.getByText('Save Preferences');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error saving preferences/)).toBeInTheDocument();
      });
    });
  });

  describe('Notifications Tab', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });

      // Switch to notifications tab
      const notificationsTab = screen.getByText('Notifications');
      fireEvent.click(notificationsTab);
    });

    it('shows notification preferences', () => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    });

    it('toggles email notifications', async () => {
      const emailNotificationsToggle = screen.getByLabelText(/trail recommendations and updates/i);
      
      expect(emailNotificationsToggle).toBeChecked();
      
      await userEvent.click(emailNotificationsToggle);
      expect(emailNotificationsToggle).not.toBeChecked();
    });

    it('toggles activity updates', async () => {
      const activityUpdatesToggle = screen.getByLabelText(/activity updates/i);
      
      expect(activityUpdatesToggle).toBeChecked();
      
      await userEvent.click(activityUpdatesToggle);
      expect(activityUpdatesToggle).not.toBeChecked();
    });

    it('toggles newsletter subscription', async () => {
      const newsletterToggle = screen.getByLabelText(/newsletter/i);
      
      expect(newsletterToggle).not.toBeChecked();
      
      await userEvent.click(newsletterToggle);
      expect(newsletterToggle).toBeChecked();
    });

    it('toggles public profile', async () => {
      const publicProfileToggle = screen.getByLabelText(/public profile/i);
      
      expect(publicProfileToggle).toBeChecked();
      
      await userEvent.click(publicProfileToggle);
      expect(publicProfileToggle).not.toBeChecked();
    });

    it('toggles activity status', async () => {
      const activityStatusToggle = screen.getByLabelText(/show activity status/i);
      
      expect(activityStatusToggle).toBeChecked();
      
      await userEvent.click(activityStatusToggle);
      expect(activityStatusToggle).not.toBeChecked();
    });

    it('saves notification preferences successfully', async () => {
      const saveButton = screen.getByText('Save Preferences');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
        expect(screen.getByText('Preferences saved successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });
    });

    it('updates profile form state correctly', async () => {
      const bioTextarea = screen.getByPlaceholderText('Tell us about yourself...');
      const locationInput = screen.getByPlaceholderText('Your city or region');
      const websiteInput = screen.getByPlaceholderText('https://example.com');

      await userEvent.type(bioTextarea, 'Test bio');
      await userEvent.type(locationInput, 'Test City');
      await userEvent.type(websiteInput, 'https://test.com');

      expect(bioTextarea).toHaveValue('Test bio');
      expect(locationInput).toHaveValue('Test City');
      expect(websiteInput).toHaveValue('https://test.com');
    });

    it('updates password form state correctly', async () => {
      // Switch to security tab
      const securityTab = screen.getByText('Security');
      fireEvent.click(securityTab);

      const currentPasswordInput = screen.getByPlaceholderText('Enter your current password');
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');

      await userEvent.type(currentPasswordInput, 'current');
      await userEvent.type(newPasswordInput, 'newpass');
      await userEvent.type(confirmPasswordInput, 'newpass');

      expect(currentPasswordInput).toHaveValue('current');
      expect(newPasswordInput).toHaveValue('newpass');
      expect(confirmPasswordInput).toHaveValue('newpass');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });
    });

    it('handles profile update errors gracefully', async () => {
      mockUpdateProfile.mockRejectedValue(new Error('Network error'));

      const saveButton = screen.getByText('Save Changes');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error updating profile/)).toBeInTheDocument();
      });
    });

    it('handles email update errors gracefully', async () => {
      mockUpdateEmail.mockRejectedValue(new Error('Email already in use'));

      const emailInput = screen.getByDisplayValue('test@example.com');
      const saveButton = screen.getByText('Save Changes');

      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'newemail@example.com');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error updating profile/)).toBeInTheDocument();
      });
    });

    it('handles Firestore update errors gracefully', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

      const saveButton = screen.getByText('Save Changes');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error updating profile/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });
    });

    it('has proper form labels', () => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Profile Information' })).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('shows current resolved theme in auto mode', async () => {
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      );

      // Simulate user authentication
      act(() => {
        mockOnAuthStateChanged.mock.calls[0][0](mockUser);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
      });

      // Switch to preferences tab
      const preferencesTab = screen.getByText('Preferences');
      fireEvent.click(preferencesTab);

      // Check that resolved theme is displayed
      expect(screen.getByText(/Active theme:/)).toBeInTheDocument();
    });
  });
});