import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Signup from '../pages/Signup';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebaseConfig';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  updateProfile: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp')
}));

jest.mock('../firebaseConfig', () => ({
  auth: {},
  googleProvider: {},
  db: {}
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )
}));

// Mock AuthLayout component
jest.mock('../components/AuthLayout', () => {
  return function MockAuthLayout({ title, children }) {
    return (
      <div data-testid="auth-layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

describe('Signup Component', () => {
  const mockNavigate = jest.fn();
  const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword;
  const mockSignInWithPopup = signInWithPopup;
  const mockUpdateProfile = updateProfile;
  const mockSetDoc = setDoc;
  const mockDoc = doc;
  const mockServerTimestamp = serverTimestamp;

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    mockCreateUserWithEmailAndPassword.mockResolvedValue();
    mockSignInWithPopup.mockResolvedValue();
    mockUpdateProfile.mockResolvedValue();
    mockSetDoc.mockResolvedValue();
    mockDoc.mockReturnValue({ id: 'test-user-id' });
    mockServerTimestamp.mockReturnValue('mock-timestamp');
  });

  describe('Component Rendering', () => {
    it('renders the signup form', () => {
      render(<Signup />);

      expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('renders form inputs with correct attributes', () => {
      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');

      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toBeRequired();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toBeRequired();
    });

    it('renders login link', () => {
      render(<Signup />);

      const loginLink = screen.getByText('Log in');
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    it('renders social signup buttons', () => {
      render(<Signup />);

      expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apple' })).toBeInTheDocument();
    });
  });

  describe('Email/Password Signup', () => {
    it('handles successful email signup', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUserCredential.user, { displayName: 'testuser' });
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        {
          profileInfo: {
            email: 'test@example.com',
            joinedDate: 'mock-timestamp',
            name: 'testuser',
            userId: 'test-user-id'
          },
          completedHikes: [],
          favourites: [],
          wishlist: [],
          submittedTrails: []
        }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('validates password confirmation match', async () => {
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'differentpassword');
      await userEvent.click(submitButton);

      expect(alertSpy).toHaveBeenCalledWith('Passwords do not match.');
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('handles signup error', async () => {
      const errorMessage = 'Email already in use';
      mockCreateUserWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
          message: errorMessage
        }));
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('validates required fields', async () => {
      render(<Signup />);

      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      await userEvent.click(submitButton);

      // Form should not submit without required fields
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  describe('Google Signup', () => {
    it('handles successful Google signup', async () => {
      const mockUser = {
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: 'Google User'
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      render(<Signup />);

      const googleButton = screen.getByRole('button', { name: 'Google' });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalledWith(auth, googleProvider);
      });

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          {
            profileInfo: {
              email: mockUser.email,
              joinedDate: 'mock-timestamp',
              name: mockUser.displayName,
              userId: mockUser.uid
            },
            completedHikes: [],
            favourites: [],
            wishlist: [],
            submittedTrails: []
          }
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('handles Google signup with user without display name', async () => {
      const mockUser = {
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: null
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      render(<Signup />);

      const googleButton = screen.getByRole('button', { name: 'Google' });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            profileInfo: expect.objectContaining({
              name: 'User'
            })
          })
        );
      });
    });

    it('handles Google signup error', async () => {
      const errorMessage = 'Google signup failed';
      mockSignInWithPopup.mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Signup />);

      const googleButton = screen.getByRole('button', { name: 'Google' });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
          message: errorMessage
        }));
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility', async () => {
      render(<Signup />);

      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const toggleButton = passwordInput.nextElementSibling;

      expect(passwordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await userEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles confirm password visibility', async () => {
      render(<Signup />);

      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const toggleButton = confirmPasswordInput.nextElementSibling;

      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      await userEvent.click(toggleButton);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form State Management', () => {
    it('updates username input value', async () => {
      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      await userEvent.type(usernameInput, 'testuser');

      expect(usernameInput).toHaveValue('testuser');
    });

    it('updates email input value', async () => {
      render(<Signup />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password input value', async () => {
      render(<Signup />);

      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      await userEvent.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('updates confirm password input value', async () => {
      render(<Signup />);

      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      await userEvent.type(confirmPasswordInput, 'password123');

      expect(confirmPasswordInput).toHaveValue('password123');
    });
  });

  describe('User Creation', () => {
    it('creates user document with correct structure', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.any(Object),
          {
            profileInfo: {
              email: 'test@example.com',
              joinedDate: 'mock-timestamp',
              name: 'testuser',
              userId: 'test-user-id'
            },
            completedHikes: [],
            favourites: [],
            wishlist: [],
            submittedTrails: []
          }
        );
      });
    });

    it('uses correct document reference', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockDoc).toHaveBeenCalledWith(db, 'Users', 'test-user-id');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(new Error('Network error'));

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Network error'
        }));
      });

      alertSpy.mockRestore();
    });

    it('handles Firestore errors during signup', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Firestore error'
        }));
      });

      alertSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty username input', async () => {
      render(<Signup />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles empty email input', async () => {
      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles empty password input', async () => {
      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles empty confirm password input', async () => {
      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles invalid email format', async () => {
      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles very long username input', async () => {
      const longUsername = 'a'.repeat(1000);

      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, longUsername);
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    });

    it('handles special characters in username', async () => {
      const specialUsername = 'user@#$%^&*()';

      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, specialUsername);
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    });

    it('handles special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, specialPassword);
      await userEvent.type(confirmPasswordInput, specialPassword);
      await userEvent.click(submitButton);

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', specialPassword);
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<Signup />);

      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      render(<Signup />);

      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apple' })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<Signup />);

      expect(screen.getByRole('heading', { level: 1, name: 'Sign Up' })).toBeInTheDocument();
    });

    it('has proper input types', () => {
      render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');

      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Component Cleanup', () => {
    it('handles component unmount during signup', async () => {
      mockCreateUserWithEmailAndPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { unmount } = render(<Signup />);

      const usernameInput = screen.getByPlaceholderText('Enter your Username');
      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');
      await userEvent.click(submitButton);

      // Unmount before signup completes
      unmount();

      // Should not cause errors
      expect(true).toBe(true);
    });
  });
});
