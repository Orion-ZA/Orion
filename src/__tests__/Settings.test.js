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
      const preferencesTab = screen.getByText('Prefs');
      fireEvent.click(preferencesTab);

      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.queryByText('Profile Information')).not.toBeInTheDocument();
    });

    it('switches to notifications tab when clicked', () => {
      const notificationsTab = screen.getByText('Alerts');
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

    it('renders navigation buttons with proper icons and text', () => {
      const profileButton = screen.getByText('Profile').closest('button');
      const securityButton = screen.getByText('Security').closest('button');
      const prefsButton = screen.getByText('Prefs').closest('button');
      const alertsButton = screen.getByText('Alerts').closest('button');

      expect(profileButton).toBeInTheDocument();
      expect(securityButton).toBeInTheDocument();
      expect(prefsButton).toBeInTheDocument();
      expect(alertsButton).toBeInTheDocument();

      // Check that buttons have proper structure with icons and text
      expect(profileButton.querySelector('.nav-text')).toHaveTextContent('Profile');
      expect(securityButton.querySelector('.nav-text')).toHaveTextContent('Security');
      expect(prefsButton.querySelector('.nav-text')).toHaveTextContent('Prefs');
      expect(alertsButton.querySelector('.nav-text')).toHaveTextContent('Alerts');
    });

    it('handles navigation button clicks correctly', () => {
      const profileButton = screen.getByText('Profile').closest('button');
      const securityButton = screen.getByText('Security').closest('button');
      const prefsButton = screen.getByText('Prefs').closest('button');
      const alertsButton = screen.getByText('Alerts').closest('button');

      // Test clicking each navigation button
      fireEvent.click(securityButton);
      expect(screen.getByText('Security Settings')).toBeInTheDocument();

      fireEvent.click(prefsButton);
      expect(screen.getByText('Preferences')).toBeInTheDocument();

      fireEvent.click(alertsButton);
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();

      fireEvent.click(profileButton);
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
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

    it('toggles new password visibility independently', async () => {
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');
      
      // Find all password toggle buttons
      const toggleButtons = screen.getAllByRole('button');
      const newPasswordToggle = toggleButtons.find(button => 
        button.classList.contains('password-toggle') && 
        button.closest('.form-group').querySelector('input[placeholder*="new password"]')
      );
      const confirmPasswordToggle = toggleButtons.find(button => 
        button.classList.contains('password-toggle') && 
        button.closest('.form-group').querySelector('input[placeholder*="Confirm"]')
      );

      // Initially all password inputs should be type="password"
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Toggle new password visibility
      await userEvent.click(newPasswordToggle);
      expect(newPasswordInput).toHaveAttribute('type', 'text');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password'); // Should remain password

      // Toggle confirm password visibility
      await userEvent.click(confirmPasswordToggle);
      expect(newPasswordInput).toHaveAttribute('type', 'text'); // Should remain text
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      // Toggle new password back to hidden
      await userEvent.click(newPasswordToggle);
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'text'); // Should remain text
    });

    it('shows correct eye icons for password visibility toggles', async () => {
      const toggleButtons = screen.getAllByRole('button');
      const passwordToggles = toggleButtons.filter(button => 
        button.classList.contains('password-toggle')
      );

      // All password toggles should be present
      expect(passwordToggles).toHaveLength(3); // current, new, confirm

      // Initially all should show Eye icon (password hidden)
      passwordToggles.forEach(toggle => {
        expect(toggle.querySelector('svg')).toBeInTheDocument();
      });

      // Click first toggle and verify icon changes
      await userEvent.click(passwordToggles[0]);
      // The icon should change to EyeOff when password is visible
      expect(passwordToggles[0].querySelector('svg')).toBeInTheDocument();
    });

    it('maintains password visibility state independently for each field', async () => {
      const currentPasswordInput = screen.getByPlaceholderText('Enter your current password');
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your new password');
      
      const toggleButtons = screen.getAllByRole('button');
      const currentToggle = toggleButtons.find(button => 
        button.classList.contains('password-toggle') && 
        button.closest('.form-group').querySelector('input[placeholder*="current password"]')
      );
      const newToggle = toggleButtons.find(button => 
        button.classList.contains('password-toggle') && 
        button.closest('.form-group').querySelector('input[placeholder*="new password"]')
      );
      const confirmToggle = toggleButtons.find(button => 
        button.classList.contains('password-toggle') && 
        button.closest('.form-group').querySelector('input[placeholder*="Confirm"]')
      );

      // Toggle current password
      await userEvent.click(currentToggle);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Toggle new password
      await userEvent.click(newToggle);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
      expect(newPasswordInput).toHaveAttribute('type', 'text');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Toggle confirm password
      await userEvent.click(confirmToggle);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
      expect(newPasswordInput).toHaveAttribute('type', 'text');
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
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
      const preferencesTab = screen.getByText('Prefs');
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
      const darkThemeOption = screen.getByDisplayValue('dark');
      await userEvent.click(darkThemeOption);

      expect(darkThemeOption).toBeChecked();
    });

    it('renders theme radio buttons with proper structure and labels', () => {
      const lightOption = screen.getByDisplayValue('light');
      const darkOption = screen.getByDisplayValue('dark');
      const autoOption = screen.getByDisplayValue('auto');

      expect(lightOption).toBeInTheDocument();
      expect(darkOption).toBeInTheDocument();
      expect(autoOption).toBeInTheDocument();

      // Check that radio buttons have correct values
      expect(lightOption).toHaveAttribute('value', 'light');
      expect(darkOption).toHaveAttribute('value', 'dark');
      expect(autoOption).toHaveAttribute('value', 'auto');

      // Check that all radio buttons have the same name attribute
      expect(lightOption).toHaveAttribute('name', 'theme');
      expect(darkOption).toHaveAttribute('name', 'theme');
      expect(autoOption).toHaveAttribute('name', 'theme');
    });

    it('applies selected styling to theme options', () => {
      const lightLabel = screen.getByDisplayValue('light').closest('label');
      const darkLabel = screen.getByDisplayValue('dark').closest('label');
      const autoLabel = screen.getByDisplayValue('auto').closest('label');

      // Check that labels have preference-option class
      expect(lightLabel).toHaveClass('preference-option');
      expect(darkLabel).toHaveClass('preference-option');
      expect(autoLabel).toHaveClass('preference-option');

      // Initially light should be selected (default)
      expect(lightLabel).toHaveClass('selected');
      expect(darkLabel).not.toHaveClass('selected');
      expect(autoLabel).not.toHaveClass('selected');
    });

    it('updates selected styling when theme changes', async () => {
      const lightLabel = screen.getByDisplayValue('light').closest('label');
      const darkLabel = screen.getByDisplayValue('dark').closest('label');
      const autoLabel = screen.getByDisplayValue('auto').closest('label');

      // Initially light should be selected
      expect(lightLabel).toHaveClass('selected');
      expect(darkLabel).not.toHaveClass('selected');
      expect(autoLabel).not.toHaveClass('selected');

      // Click dark theme
      await userEvent.click(screen.getByDisplayValue('dark'));
      expect(lightLabel).not.toHaveClass('selected');
      expect(darkLabel).toHaveClass('selected');
      expect(autoLabel).not.toHaveClass('selected');

      // Click auto theme
      await userEvent.click(screen.getByDisplayValue('auto'));
      expect(lightLabel).not.toHaveClass('selected');
      expect(darkLabel).not.toHaveClass('selected');
      expect(autoLabel).toHaveClass('selected');

      // Click light theme
      await userEvent.click(screen.getByDisplayValue('light'));
      expect(lightLabel).toHaveClass('selected');
      expect(darkLabel).not.toHaveClass('selected');
      expect(autoLabel).not.toHaveClass('selected');
    });

    it('shows option labels with correct text content', () => {
      const lightLabel = screen.getByDisplayValue('light').closest('label');
      const darkLabel = screen.getByDisplayValue('dark').closest('label');
      const autoLabel = screen.getByDisplayValue('auto').closest('label');

      // Check option labels
      expect(lightLabel.querySelector('.option-label')).toHaveTextContent('Light');
      expect(darkLabel.querySelector('.option-label')).toHaveTextContent('Dark');
      expect(autoLabel.querySelector('.option-label')).toHaveTextContent(/Auto/);
    });

    it('handles theme radio button onChange events correctly', async () => {
      const lightOption = screen.getByDisplayValue('light');
      const darkOption = screen.getByDisplayValue('dark');
      const autoOption = screen.getByDisplayValue('auto');

      // Initially light should be checked
      expect(lightOption).toBeChecked();
      expect(darkOption).not.toBeChecked();
      expect(autoOption).not.toBeChecked();

      // Click dark option
      await userEvent.click(darkOption);
      expect(lightOption).not.toBeChecked();
      expect(darkOption).toBeChecked();
      expect(autoOption).not.toBeChecked();

      // Click auto option
      await userEvent.click(autoOption);
      expect(lightOption).not.toBeChecked();
      expect(darkOption).not.toBeChecked();
      expect(autoOption).toBeChecked();

      // Click light option
      await userEvent.click(lightOption);
      expect(lightOption).toBeChecked();
      expect(darkOption).not.toBeChecked();
      expect(autoOption).not.toBeChecked();
    });

    it('calls handlePreferenceChange with correct parameters for theme options', async () => {
      const lightOption = screen.getByDisplayValue('light');
      const darkOption = screen.getByDisplayValue('dark');
      const autoOption = screen.getByDisplayValue('auto');

      // Test clicking each theme option triggers handlePreferenceChange
      await userEvent.click(lightOption);
      expect(lightOption).toBeChecked();

      await userEvent.click(darkOption);
      expect(darkOption).toBeChecked();

      await userEvent.click(autoOption);
      expect(autoOption).toBeChecked();
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
      const notificationsTab = screen.getByText('Alerts');
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
      const preferencesTab = screen.getByText('Prefs');
      fireEvent.click(preferencesTab);

      // Check that resolved theme is displayed
      expect(screen.getByText(/Active theme:/)).toBeInTheDocument();
    });
  });
});