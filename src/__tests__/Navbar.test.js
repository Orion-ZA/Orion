import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Navbar from '../components/Navbar';
import { auth } from '../firebaseConfig';

// Mock Firebase Auth
jest.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
}));

// Mock child components
jest.mock('../components/LogoutButton.js', () => {
  return function MockLogoutButton() {
    return <button data-testid="logout-button">Logout</button>;
  };
});

jest.mock('../components/ProfileIcon', () => {
  return function MockProfileIcon({ className }) {
    return <div data-testid="profile-icon" className={className}>ProfileIcon</div>;
  };
});

jest.mock('../components/SettingsIcon', () => {
  return function MockSettingsIcon({ className }) {
    return <div data-testid="settings-icon" className={className}>SettingsIcon</div>;
  };
});

jest.mock('../components/FeedbackIcon', () => {
  return function MockFeedbackIcon({ className }) {
    return <div data-testid="feedback-icon" className={className}>FeedbackIcon</div>;
  };
});

jest.mock('../components/HelpCenterIcon', () => {
  return function MockHelpCenterIcon({ className }) {
    return <div data-testid="help-center-icon" className={className}>HelpCenterIcon</div>;
  };
});

// Mock ToastContext
const mockShow = jest.fn();
jest.mock('../components/ToastContext', () => ({
  useToast: () => ({
    show: mockShow,
  }),
}));

// Mock router hooks
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/' };

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => {
  const React = require('react');
  const RR = require('react-router');
  
  return {
    ...RR,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    Link: ({ to, children, ...rest }) => 
      React.createElement('a', { href: typeof to === 'string' ? to : '#', ...rest }, children),
    NavLink: ({ to, children, ...rest }) => 
      React.createElement('a', { href: typeof to === 'string' ? to : '#', ...rest }, children),
    MemoryRouter: ({ children, initialEntries }) => 
      React.createElement(RR.MemoryRouter, { initialEntries }, children),
  };
});

// Mock logo asset
jest.mock('../assets/orion_logo_clear.png', () => 'mocked-logo.png');

// Helper function to render Navbar with router
const renderNavbar = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Navbar />
    </MemoryRouter>
  );
};

// Helper function to create mock user
const createMockUser = (overrides = {}) => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  ...overrides,
});

describe('Navbar', () => {
  let mockUnsubscribe;
  let mockOnAuthStateChanged;
  let mockSignInWithPopup;
  let mockSignInWithRedirect;
  let mockGoogleAuthProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    
    // Get the mocked functions
    const firebaseAuth = require('firebase/auth');
    mockOnAuthStateChanged = firebaseAuth.onAuthStateChanged;
    mockSignInWithPopup = firebaseAuth.signInWithPopup;
    mockSignInWithRedirect = firebaseAuth.signInWithRedirect;
    mockGoogleAuthProvider = firebaseAuth.GoogleAuthProvider;
    
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
    mockGoogleAuthProvider.mockImplementation(() => ({}));
    mockLocation.pathname = '/';
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('renders navbar with logo and navigation links', () => {
      renderNavbar();
      
      expect(screen.getByAltText('Orion')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
    });

    it('applies landing class when on landing page', () => {
      mockLocation.pathname = '/';
      renderNavbar();
      
      const navbar = screen.getByRole('banner');
      expect(navbar).toHaveClass('landing');
    });

    it('applies landing class when on trails page', () => {
      mockLocation.pathname = '/trails';
      renderNavbar();
      
      const navbar = screen.getByRole('banner');
      expect(navbar).toHaveClass('landing');
    });

    it('does not apply landing class on other pages', () => {
      mockLocation.pathname = '/dashboard';
      renderNavbar();
      
      const navbar = screen.getByRole('banner');
      expect(navbar).not.toHaveClass('landing');
    });

    it('renders mobile menu toggle button', () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Authentication State Management', () => {
    it('sets up auth state listener on mount', () => {
      renderNavbar();
      
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
    });

    it('cleans up auth state listener on unmount', () => {
      const { unmount } = renderNavbar();
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('shows login button when user is not authenticated', () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      const loginButtons = screen.getAllByText('Login');
      expect(loginButtons).toHaveLength(2); // Desktop and mobile
      expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
    });

    it('shows profile dropdown when user is authenticated', () => {
      const mockUser = createMockUser();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.getByAltText('User Avatar')).toBeInTheDocument();
    });

    it('shows profile icon when user has no photo', () => {
      const mockUser = createMockUser({ photoURL: null });
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('navigates to trails page when Trails button is clicked', async () => {
      renderNavbar();
      
      const trailsButton = screen.getByRole('banner').querySelector('.desktop-nav .as-link');
      await userEvent.click(trailsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/trails');
    });

    it('shows warning toast when trying to access protected route without login', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      const reviewsButton = screen.getByRole('banner').querySelectorAll('.desktop-nav .as-link')[1];
      await userEvent.click(reviewsButton);
      
      expect(mockShow).toHaveBeenCalledWith('Please log in first', { type: 'warn' });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates to protected routes when user is authenticated', async () => {
      const mockUser = createMockUser();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      const reviewsButton = screen.getByRole('banner').querySelectorAll('.desktop-nav .as-link')[1];
      await userEvent.click(reviewsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/reviews');
      expect(mockShow).not.toHaveBeenCalled();
    });

    it('sets active class for current route', () => {
      mockLocation.pathname = '/trails';
      renderNavbar();
      
      const trailsButton = screen.getByRole('banner').querySelector('.desktop-nav .as-link');
      expect(trailsButton).toHaveClass('active');
    });

    it('closes mobile menu when navigating', async () => {
      renderNavbar();
      
      // Open mobile menu
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      
      // Click on trails link (mobile version) - this is a NavLink, not a button
      const trailsLink = screen.getByRole('banner').querySelector('.mobile-nav-links a');
      fireEvent.click(trailsLink);
      
      // NavLink doesn't trigger navigate, it just changes the href
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Mobile Menu', () => {
    it('toggles mobile menu when burger button is clicked', async () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      const mobileMenu = screen.getByRole('banner').querySelector('.mobile-menu');
      
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(mobileMenu).not.toHaveClass('open');
      
      await userEvent.click(toggle);
      
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(mobileMenu).toHaveClass('open');
    });

    it('shows mobile navigation links', async () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      
      expect(screen.getByRole('banner').querySelector('.mobile-nav-links')).toBeInTheDocument();
    });

    it('shows mobile profile section when user is authenticated', async () => {
      const mockUser = createMockUser();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows mobile login button when user is not authenticated', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      
      const loginButtons = screen.getAllByText('Login');
      expect(loginButtons).toHaveLength(2); // Desktop and mobile
    });
  });

  describe('Profile Dropdown', () => {
    let mockUser;

    beforeEach(() => {
      mockUser = createMockUser();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
    });

    it('opens profile dropdown on mouse enter', async () => {
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      
      // Initially dropdown should not be visible
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      
      await userEvent.hover(profileContainer);
      
      // After hover, dropdown should be visible
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('closes profile dropdown after delay on mouse leave', async () => {
      jest.useFakeTimers();
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      let profileDropdown;
      
      // Open dropdown
      await userEvent.hover(profileContainer);
      profileDropdown = screen.getByRole('banner').querySelector('.profile-dropdown');
      expect(profileDropdown).toBeInTheDocument();
      
      // Leave container
      await userEvent.unhover(profileContainer);
      
      // Fast forward time but not enough to close
      act(() => {
        jest.advanceTimersByTime(100);
      });
      profileDropdown = screen.getByRole('banner').querySelector('.profile-dropdown');
      expect(profileDropdown).toBeInTheDocument();
      
      // Fast forward enough time to close
      act(() => {
        jest.advanceTimersByTime(150);
      });
      profileDropdown = screen.getByRole('banner').querySelector('.profile-dropdown');
      expect(profileDropdown).not.toBeInTheDocument();
      
      jest.useRealTimers();
    });

    it('cancels close timer when re-entering profile container', async () => {
      jest.useFakeTimers();
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      let profileDropdown;
      
      // Open dropdown
      await userEvent.hover(profileContainer);
      profileDropdown = screen.getByRole('banner').querySelector('.profile-dropdown');
      expect(profileDropdown).toBeInTheDocument();
      
      // Leave container
      await userEvent.unhover(profileContainer);
      
      // Re-enter before timer expires
      act(() => {
        jest.advanceTimersByTime(100);
      });
      await userEvent.hover(profileContainer);
      
      // Fast forward past original timer
      act(() => {
        jest.advanceTimersByTime(150);
      });
      profileDropdown = screen.getByRole('banner').querySelector('.profile-dropdown');
      expect(profileDropdown).toBeInTheDocument();
      
      jest.useRealTimers();
    });

    it('shows user information in dropdown', async () => {
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      await userEvent.hover(profileContainer);
      
      // Check for desktop dropdown specifically
      const profileName = screen.getByRole('banner').querySelector('.profile-name');
      const profileEmail = screen.getByRole('banner').querySelector('.profile-email');
      
      expect(profileName).toHaveTextContent('Test User');
      expect(profileEmail).toHaveTextContent('test@example.com');
    });

    it('shows email as name when displayName is not available', async () => {
      const userWithoutDisplayName = createMockUser({ displayName: null });
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(userWithoutDisplayName);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      await userEvent.hover(profileContainer);
      
      // Check for desktop dropdown specifically
      const profileName = screen.getByRole('banner').querySelector('.profile-name');
      expect(profileName).toHaveTextContent('test@example.com');
    });

    it('navigates to profile page when Profile menu item is clicked', async () => {
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      await userEvent.hover(profileContainer);
      
      const profileMenuItem = screen.getByText('Profile');
      await userEvent.click(profileMenuItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('navigates to help center when Help Center menu item is clicked', async () => {
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      await userEvent.hover(profileContainer);
      
      const helpMenuItem = screen.getByText('Help Center');
      await userEvent.click(helpMenuItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/help');
    });

    it('navigates to settings when Settings menu item is clicked', async () => {
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      await userEvent.hover(profileContainer);
      
      const settingsMenuItem = screen.getByRole('banner').querySelector('.profile-menu-item:nth-child(3)');
      await userEvent.click(settingsMenuItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('navigates to feedback when Feedback menu item is clicked', async () => {
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      await userEvent.hover(profileContainer);
      
      const feedbackMenuItem = screen.getByRole('banner').querySelector('.profile-menu-item:nth-child(4)');
      await userEvent.click(feedbackMenuItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/feedback');
    });

    it('shows logout button in dropdown', async () => {
      renderNavbar();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      await userEvent.hover(profileContainer);
      
      // Check for desktop dropdown logout button specifically
      const desktopLogoutButton = screen.getByRole('banner').querySelector('.profile-dropdown [data-testid="logout-button"]');
      expect(desktopLogoutButton).toBeInTheDocument();
    });

    it('shows chevron that changes direction when dropdown opens', async () => {
      renderNavbar();
      
      const chevron = screen.getByText('▼');
      expect(chevron).toBeInTheDocument();
      
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      await userEvent.hover(profileContainer);
      
      expect(screen.getByText('▲')).toBeInTheDocument();
      expect(screen.queryByText('▼')).not.toBeInTheDocument();
    });
  });

  describe('Google Login', () => {
    beforeEach(() => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });
    });

    it('shows loading state during authentication', async () => {
      mockSignInWithPopup.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderNavbar();
      
      const loginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      // Check for desktop login button specifically
      const desktopLoginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      expect(desktopLoginButton).toHaveTextContent('Connecting…');
      expect(desktopLoginButton).toBeDisabled();
    });

    it('successfully logs in with Google popup', async () => {
      mockSignInWithPopup.mockResolvedValue({});
      
      renderNavbar();
      
      const loginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
        expect(mockShow).toHaveBeenCalledWith('Logged in with Google', { type: 'success' });
      });
    });

    it('handles popup blocked error by falling back to redirect', async () => {
      const popupError = new Error('Popup blocked');
      popupError.code = 'auth/popup-blocked';
      mockSignInWithPopup.mockRejectedValue(popupError);
      mockSignInWithRedirect.mockResolvedValue({});
      
      renderNavbar();
      
      const loginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
        expect(mockSignInWithRedirect).toHaveBeenCalled();
      });
    });

    it('handles cancelled popup request error by falling back to redirect', async () => {
      const popupError = new Error('Popup cancelled');
      popupError.code = 'auth/cancelled-popup-request';
      mockSignInWithPopup.mockRejectedValue(popupError);
      mockSignInWithRedirect.mockResolvedValue({});
      
      renderNavbar();
      
      const loginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
        expect(mockSignInWithRedirect).toHaveBeenCalled();
      });
    });

    it('shows error message when redirect sign-in fails', async () => {
      const popupError = new Error('Popup blocked');
      popupError.code = 'auth/popup-blocked';
      const redirectError = new Error('Redirect failed');
      mockSignInWithPopup.mockRejectedValue(popupError);
      mockSignInWithRedirect.mockRejectedValue(redirectError);
      
      renderNavbar();
      
      const loginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith('Redirect failed', { type: 'error' });
      });
    });

    it('shows error message when popup sign-in fails with other error', async () => {
      const popupError = new Error('Network error');
      mockSignInWithPopup.mockRejectedValue(popupError);
      
      renderNavbar();
      
      const loginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith('Network error', { type: 'error' });
      });
    });

    it('shows generic error message when error has no message', async () => {
      const popupError = new Error();
      mockSignInWithPopup.mockRejectedValue(popupError);
      
      renderNavbar();
      
      const loginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith('Google sign-in failed', { type: 'error' });
      });
    });

    it('does not attempt login when user is already authenticated', async () => {
      const mockUser = createMockUser();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      // Should not show login button when user is authenticated
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    it('does not attempt login when already loading', async () => {
      mockSignInWithPopup.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderNavbar();
      
      const loginButton = screen.getByRole('banner').querySelector('.desktop-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      // Try to click again while loading
      await userEvent.click(loginButton);
      
      // Should only be called once
      expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    });

    it('closes mobile menu after successful login', async () => {
      mockSignInWithPopup.mockResolvedValue({});
      
      renderNavbar();
      
      // Open mobile menu
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      
      // Click login button
      const loginButton = screen.getByRole('banner').querySelector('.mobile-actions .nav-login-btn');
      await userEvent.click(loginButton);
      
      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Mobile Profile Navigation', () => {
    let mockUser;

    beforeEach(() => {
      mockUser = createMockUser();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
    });

    it('navigates to favorites when mobile favorites button is clicked', async () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      
      const favoritesButton = screen.getByText('Favorites');
      await userEvent.click(favoritesButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/favorites');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('navigates to settings when mobile settings button is clicked', async () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      
      const settingsButton = screen.getByText('Settings');
      await userEvent.click(settingsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('navigates to feedback when mobile feedback button is clicked', async () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      
      const feedbackButton = screen.getByText('Feedback');
      await userEvent.click(feedbackButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/feedback');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows logout button in mobile menu', async () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      await userEvent.click(toggle);
      
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for toggle button', () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      expect(toggle).toHaveAttribute('aria-label', 'Toggle menu');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('has proper ARIA label for brand link', () => {
      renderNavbar();
      
      const brandLink = screen.getByLabelText('Orion Home');
      expect(brandLink).toHaveAttribute('aria-label', 'Orion Home');
    });

    it('updates aria-expanded when mobile menu is toggled', async () => {
      renderNavbar();
      
      const toggle = screen.getByLabelText('Toggle menu');
      
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Edge Cases', () => {
    it('handles auth state changes during component lifecycle', () => {
      let authCallback;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      // Initially no user
      expect(screen.getAllByText('Login')).toHaveLength(2); // Desktop and mobile
      
      // Simulate user login
      act(() => {
        authCallback(createMockUser());
      });
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.getByAltText('User Avatar')).toBeInTheDocument();
      
      // Simulate user logout
      act(() => {
        authCallback(null);
      });
      
      expect(screen.getAllByText('Login')).toHaveLength(2); // Desktop and mobile
      expect(screen.queryByAltText('User Avatar')).not.toBeInTheDocument();
    });

    it('cleans up timers on unmount', () => {
      jest.useFakeTimers();
      const mockUser = createMockUser();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      const { unmount } = renderNavbar();
      
      // Start a timer by opening profile dropdown
      const profileContainer = screen.getByRole('banner').querySelector('.profile-container');
      fireEvent.mouseEnter(profileContainer);
      fireEvent.mouseLeave(profileContainer);
      
      // Unmount component
      unmount();
      
      // Fast forward time - should not cause errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
      
      jest.useRealTimers();
    });

    it('handles missing user photo gracefully', () => {
      const mockUser = createMockUser({ photoURL: null });
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
      expect(screen.queryByAltText('User Avatar')).not.toBeInTheDocument();
    });

    it('handles missing user displayName gracefully', () => {
      const mockUser = createMockUser({ displayName: null });
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });
      
      renderNavbar();
      
      expect(screen.getByAltText('User Avatar')).toBeInTheDocument();
    });
  });
});