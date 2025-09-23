import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Login from '../pages/Login';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebaseConfig';
import { setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useLoader } from '../components/LoaderContext';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  getDoc: jest.fn()
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

// Mock LoaderContext
jest.mock('../components/LoaderContext.js', () => ({
  useLoader: jest.fn()
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

describe('Login Component', () => {
  const mockNavigate = jest.fn();
  const mockTriggerLoader = jest.fn();
  const mockSignInWithEmailAndPassword = signInWithEmailAndPassword;
  const mockSignInWithPopup = signInWithPopup;
  const mockSetDoc = setDoc;
  const mockGetDoc = getDoc;
  const mockDoc = doc;
  const mockServerTimestamp = serverTimestamp;

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLoader.mockReturnValue({ triggerLoader: mockTriggerLoader });
    mockSignInWithEmailAndPassword.mockResolvedValue();
    mockSignInWithPopup.mockResolvedValue();
    mockSetDoc.mockResolvedValue();
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockDoc.mockReturnValue({ id: 'test-user-id' });
    mockServerTimestamp.mockReturnValue('mock-timestamp');
  });

  describe('Component Rendering', () => {
    it('renders the login form', () => {
      render(<Login />);

      expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
      expect(screen.getByText('Log In')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('renders form inputs with correct attributes', () => {
      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
    });

    it('renders remember me checkbox', () => {
      render(<Login />);

      expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      render(<Login />);

      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('renders sign up link', () => {
      render(<Login />);

      const signUpLink = screen.getByText('Sign Up');
      expect(signUpLink.closest('a')).toHaveAttribute('href', '/signup');
    });

    it('renders social login buttons', () => {
      render(<Login />);

      expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apple' })).toBeInTheDocument();
    });
  });

  describe('Email/Password Login', () => {
    it('handles successful email login', async () => {
      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
      expect(mockTriggerLoader).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('handles email login error', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
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
      render(<Login />);

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      await userEvent.click(submitButton);

      // Form should not submit without required fields
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  describe('Google Login', () => {
    it('handles successful Google login for new user', async () => {
      const mockUser = {
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: 'Google User'
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({ exists: () => false });

      render(<Login />);

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

      expect(mockTriggerLoader).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('handles successful Google login for existing user', async () => {
      const mockUser = {
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: 'Google User'
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({ exists: () => true });

      render(<Login />);

      const googleButton = screen.getByRole('button', { name: 'Google' });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalledWith(auth, googleProvider);
      });

      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(mockTriggerLoader).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('handles Google login error', async () => {
      const errorMessage = 'Google login failed';
      mockSignInWithPopup.mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Login />);

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
      render(<Login />);

      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const toggleButton = passwordInput.nextElementSibling;

      expect(passwordInput).toHaveAttribute('type', 'password');

      await userEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await userEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form State Management', () => {
    it('updates email input value', async () => {
      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password input value', async () => {
      render(<Login />);

      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      await userEvent.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('toggles remember me checkbox', async () => {
      render(<Login />);

      const rememberCheckbox = screen.getByLabelText('Remember me');
      expect(rememberCheckbox).not.toBeChecked();

      await userEvent.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();

      await userEvent.click(rememberCheckbox);
      expect(rememberCheckbox).not.toBeChecked();
    });
  });

  describe('User Creation for Google Login', () => {
    it('creates user document with correct structure', async () => {
      const mockUser = {
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: 'Google User'
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({ exists: () => false });

      render(<Login />);

      const googleButton = screen.getByRole('button', { name: 'Google' });
      await userEvent.click(googleButton);

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
    });

    it('handles user without display name', async () => {
      const mockUser = {
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: null
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({ exists: () => false });

      render(<Login />);

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

    it('uses correct document reference', async () => {
      const mockUser = {
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: 'Google User'
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({ exists: () => false });

      render(<Login />);

      const googleButton = screen.getByRole('button', { name: 'Google' });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(mockDoc).toHaveBeenCalledWith(db, 'Users', mockUser.uid);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error('Network error'));

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Network error'
        }));
      });

      alertSpy.mockRestore();
    });

    it('handles Firestore errors during Google login', async () => {
      const mockUser = {
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: 'Google User'
      };

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({ exists: () => false });
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<Login />);

      const googleButton = screen.getByRole('button', { name: 'Google' });
      await userEvent.click(googleButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
          message: 'Firestore error'
        }));
      });

      alertSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty email input', async () => {
      render(<Login />);

      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles empty password input', async () => {
      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles invalid email format', async () => {
      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('handles very long email input', async () => {
      const longEmail = 'a'.repeat(1000) + '@example.com';

      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, longEmail);
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(auth, longEmail, 'password123');
    });

    it('handles special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, specialPassword);
      await userEvent.click(submitButton);

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', specialPassword);
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<Login />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      render(<Login />);

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apple' })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<Login />);

      expect(screen.getByRole('heading', { level: 1, name: 'Log In' })).toBeInTheDocument();
    });

    it('has proper input types', () => {
      render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Component Cleanup', () => {
    it('handles component unmount during login', async () => {
      mockSignInWithEmailAndPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { unmount } = render(<Login />);

      const emailInput = screen.getByPlaceholderText('Enter your Email');
      const passwordInput = screen.getByPlaceholderText('Enter your Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // Unmount before login completes
      unmount();

      // Should not cause errors
      expect(true).toBe(true);
    });
  });
});
