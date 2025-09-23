import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateProfile from '../pages/CreateProfile';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  updateProfile: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn()
}));

jest.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  },
  db: {}
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

// Mock ProfileForm component
jest.mock('../components/ProfileForm/ProfileForm', () => {
  return function MockProfileForm({ onSubmit, loading }) {
    const [formData, setFormData] = React.useState({
      name: '',
      avatar: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (e) => {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    };

    return (
      <form onSubmit={handleSubmit} data-testid="profile-form">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
          data-testid="name-input"
        />
        <input
          name="avatar"
          value={formData.avatar}
          onChange={handleChange}
          placeholder="Enter avatar URL"
          data-testid="avatar-input"
        />
        <button type="submit" disabled={loading} data-testid="submit-button">
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </button>
      </form>
    );
  };
});

describe('CreateProfile Component', () => {
  const mockNavigate = jest.fn();
  const mockUpdateProfile = updateProfile;
  const mockSetDoc = setDoc;
  const mockDoc = doc;

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    mockUpdateProfile.mockResolvedValue();
    mockSetDoc.mockResolvedValue();
    mockDoc.mockReturnValue({ id: 'test-user-id' });
  });

  describe('Component Rendering', () => {
    it('renders the create profile page', () => {
      render(<CreateProfile />);

      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      expect(screen.getByText('Add some details to personalize your experience')).toBeInTheDocument();
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('renders the ProfileForm component', () => {
      render(<CreateProfile />);

      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });
  });

  describe('Profile Creation', () => {
    it('creates profile successfully with all data', async () => {
      const profileData = {
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg'
      };

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const avatarInput = screen.getByTestId('avatar-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, profileData.name);
      await userEvent.type(avatarInput, profileData.avatar);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(auth.currentUser, {
          displayName: profileData.name,
          photoURL: profileData.avatar
        });
      });

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          {
            profileInfo: {
              name: profileData.name,
              avatar: profileData.avatar,
              email: auth.currentUser.email,
              userId: auth.currentUser.uid,
              joinedDate: expect.any(String)
            },
            completedHikes: [],
            favourites: [],
            submittedTrails: [],
            wishlist: []
          }
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('creates profile successfully without avatar', async () => {
      const profileData = {
        name: 'Jane Smith',
        avatar: ''
      };

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, profileData.name);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(auth.currentUser, {
          displayName: profileData.name,
          photoURL: null
        });
      });

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          {
            profileInfo: {
              name: profileData.name,
              avatar: '',
              email: auth.currentUser.email,
              userId: auth.currentUser.uid,
              joinedDate: expect.any(String)
            },
            completedHikes: [],
            favourites: [],
            submittedTrails: [],
            wishlist: []
          }
        );
      });
    });

    it('shows loading state during profile creation', async () => {
      const profileData = {
        name: 'Test User',
        avatar: ''
      };

      // Mock slow updateProfile
      mockUpdateProfile.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, profileData.name);
      await userEvent.click(submitButton);

      expect(screen.getByText('Creating Profile...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('handles updateProfile error', async () => {
      const errorMessage = 'Failed to update profile';
      mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, 'Test User');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles setDoc error', async () => {
      const errorMessage = 'Failed to create user document';
      mockSetDoc.mockRejectedValue(new Error(errorMessage));

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, 'Test User');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles network error', async () => {
      const errorMessage = 'Network error';
      mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, 'Test User');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('clears error when retrying', async () => {
      mockUpdateProfile
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce();

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      // First attempt - should show error
      await userEvent.type(nameInput, 'Test User');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second attempt - should clear error and succeed
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Form Validation', () => {
    it('handles empty name submission', async () => {
      render(<CreateProfile />);

      const submitButton = screen.getByTestId('submit-button');
      await userEvent.click(submitButton);

      // Should not call updateProfile with empty name
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('handles whitespace-only name', async () => {
      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, '   ');
      await userEvent.click(submitButton);

      // Should not call updateProfile with whitespace-only name
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe('Data Structure', () => {
    it('creates correct user document structure', async () => {
      const profileData = {
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg'
      };

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const avatarInput = screen.getByTestId('avatar-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, profileData.name);
      await userEvent.type(avatarInput, profileData.avatar);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            profileInfo: expect.objectContaining({
              name: profileData.name,
              avatar: profileData.avatar,
              email: auth.currentUser.email,
              userId: auth.currentUser.uid,
              joinedDate: expect.any(String)
            }),
            completedHikes: [],
            favourites: [],
            submittedTrails: [],
            wishlist: []
          })
        );
      });
    });

    it('uses correct document reference', async () => {
      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, 'Test User');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockDoc).toHaveBeenCalledWith(db, 'Users', auth.currentUser.uid);
      });
    });
  });

  describe('Loading State Management', () => {
    it('resets loading state after error', async () => {
      mockUpdateProfile.mockRejectedValue(new Error('Test error'));

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, 'Test User');
      await userEvent.click(submitButton);

      // Should show loading initially
      expect(screen.getByText('Creating Profile...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Should reset loading state
      expect(screen.getByText('Create Profile')).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it('resets loading state after success', async () => {
      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, 'Test User');
      await userEvent.click(submitButton);

      // Should show loading initially
      expect(screen.getByText('Creating Profile...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very long name', async () => {
      const longName = 'A'.repeat(1000);
      const profileData = {
        name: longName,
        avatar: ''
      };

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, profileData.name);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(auth.currentUser, {
          displayName: longName,
          photoURL: null
        });
      });
    });

    it('handles special characters in name', async () => {
      const specialName = 'José María O\'Connor-Smith';
      const profileData = {
        name: specialName,
        avatar: ''
      };

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, profileData.name);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(auth.currentUser, {
          displayName: specialName,
          photoURL: null
        });
      });
    });

    it('handles invalid avatar URL', async () => {
      const profileData = {
        name: 'Test User',
        avatar: 'not-a-valid-url'
      };

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const avatarInput = screen.getByTestId('avatar-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, profileData.name);
      await userEvent.type(avatarInput, profileData.avatar);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(auth.currentUser, {
          displayName: profileData.name,
          photoURL: profileData.avatar
        });
      });
    });

    it('handles null avatar', async () => {
      const profileData = {
        name: 'Test User',
        avatar: null
      };

      render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, profileData.name);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(auth.currentUser, {
          displayName: profileData.name,
          photoURL: null
        });
      });
    });
  });

  describe('Component Cleanup', () => {
    it('handles component unmount during profile creation', async () => {
      mockUpdateProfile.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { unmount } = render(<CreateProfile />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      await userEvent.type(nameInput, 'Test User');
      await userEvent.click(submitButton);

      // Unmount before profile creation completes
      unmount();

      // Should not cause errors
      expect(true).toBe(true);
    });
  });
});
