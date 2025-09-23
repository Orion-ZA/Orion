import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../pages/Dashboard';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  signOut: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn()
}));

jest.mock('../firebaseConfig', () => ({
  auth: {},
  db: {}
}));

// Mock child components
jest.mock('../components/BottomNav', () => {
  return function MockBottomNav({ activeTab, setActiveTab }) {
    return (
      <div data-testid="bottom-nav">
        <button onClick={() => setActiveTab('home')} data-testid="home-tab">Home</button>
        <button onClick={() => setActiveTab('stats')} data-testid="stats-tab">Stats</button>
        <button onClick={() => setActiveTab('challenges')} data-testid="challenges-tab">Challenges</button>
        <button onClick={() => setActiveTab('account')} data-testid="account-tab">Account</button>
      </div>
    );
  };
});

jest.mock('../pages/Dashboard/Home', () => {
  return function MockHome({ userData, trailDetails }) {
    return (
      <div data-testid="home-component">
        <h2>Home Dashboard</h2>
        <p>User: {userData?.profileInfo?.name || 'Unknown'}</p>
        <p>Favourites: {trailDetails?.favourites?.length || 0}</p>
        <p>Completed: {trailDetails?.completedHikes?.length || 0}</p>
        <p>Wishlist: {trailDetails?.wishlist?.length || 0}</p>
        <p>Submitted: {trailDetails?.submittedTrails?.length || 0}</p>
      </div>
    );
  };
});

jest.mock('../pages/Dashboard/Stats', () => {
  return function MockStats({ userData }) {
    return (
      <div data-testid="stats-component">
        <h2>Stats Dashboard</h2>
        <p>User: {userData?.profileInfo?.name || 'Unknown'}</p>
      </div>
    );
  };
});

jest.mock('../pages/Dashboard/Challenges', () => {
  return function MockChallenges({ userData }) {
    return (
      <div data-testid="challenges-component">
        <h2>Challenges Dashboard</h2>
        <p>User: {userData?.profileInfo?.name || 'Unknown'}</p>
      </div>
    );
  };
});

jest.mock('../pages/Dashboard/Account', () => {
  return function MockAccount({ user, userData, handleLogout }) {
    return (
      <div data-testid="account-component">
        <h2>Account Dashboard</h2>
        <p>User: {user?.email || 'Unknown'}</p>
        <p>Profile: {userData?.profileInfo?.name || 'Unknown'}</p>
        <button onClick={handleLogout} data-testid="logout-button">Logout</button>
      </div>
    );
  };
});

describe('Dashboard Component', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockUserData = {
    profileInfo: {
      name: 'Test User',
      email: 'test@example.com',
      userId: 'test-user-id',
      joinedDate: '2024-01-01T00:00:00Z'
    },
    completedHikes: ['/Trails/trail-1', '/Trails/trail-2'],
    favourites: ['/Trails/trail-3'],
    wishlist: ['/Trails/trail-4'],
    submittedTrails: ['/Trails/trail-5']
  };

  const mockTrailData = {
    'trail-1': { id: 'trail-1', name: 'Test Trail 1', difficulty: 'Easy' },
    'trail-2': { id: 'trail-2', name: 'Test Trail 2', difficulty: 'Medium' },
    'trail-3': { id: 'trail-3', name: 'Test Trail 3', difficulty: 'Hard' },
    'trail-4': { id: 'trail-4', name: 'Test Trail 4', difficulty: 'Easy' },
    'trail-5': { id: 'trail-5', name: 'Test Trail 5', difficulty: 'Medium' }
  };

  const mockUnsubscribe = jest.fn();
  const mockSignOut = signOut;
  const mockOnSnapshot = onSnapshot;
  const mockGetDoc = getDoc;
  const mockDoc = doc;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue();
    mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
      // Simulate successful snapshot
      setTimeout(() => {
        callback({
          exists: () => true,
          data: () => mockUserData
        });
      }, 100);
      return mockUnsubscribe;
    });
    mockGetDoc.mockImplementation((docRef) => {
      const trailId = docRef.path.split('/')[1];
      return Promise.resolve({
        exists: () => true,
        data: () => mockTrailData[trailId]
      });
    });
    mockDoc.mockImplementation((db, collection, id) => ({
      path: `${collection}/${id}`
    }));
  });

  describe('Component Rendering', () => {
    it('renders loading state initially', () => {
      render(<Dashboard user={mockUser} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders dashboard after loading', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
        expect(screen.getByText('Explorer\'s Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Track your hiking adventures')).toBeInTheDocument();
      });
    });

    it('renders home tab by default', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
        expect(screen.getByText('Home Dashboard')).toBeInTheDocument();
      });
    });

    it('renders bottom navigation', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
      expect(screen.getByTestId('home-tab')).toBeInTheDocument();
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
      expect(screen.getByTestId('challenges-tab')).toBeInTheDocument();
      expect(screen.getByTestId('account-tab')).toBeInTheDocument();
    });
  });

  describe('User Data Loading', () => {
    it('loads user data from Firestore', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(mockOnSnapshot).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it('fetches trail details for each reference array', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourites: 1')).toBeInTheDocument();
        expect(screen.getByText('Completed: 2')).toBeInTheDocument();
        expect(screen.getByText('Wishlist: 1')).toBeInTheDocument();
        expect(screen.getByText('Submitted: 1')).toBeInTheDocument();
      });
    });

    it('handles missing user data gracefully', async () => {
      mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
        setTimeout(() => {
          callback({
            exists: () => false
          });
        }, 100);
        return mockUnsubscribe;
      });

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });
    });

    it('handles Firestore error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
        setTimeout(() => {
          errorCallback(new Error('Firestore error'));
        }, 100);
        return mockUnsubscribe;
      });

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to stats tab', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });

      const statsTab = screen.getByTestId('stats-tab');
      await act(async () => {
        statsTab.click();
      });

      expect(screen.getByTestId('stats-component')).toBeInTheDocument();
      expect(screen.getByText('Stats Dashboard')).toBeInTheDocument();
    });

    it('switches to challenges tab', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });

      const challengesTab = screen.getByTestId('challenges-tab');
      await act(async () => {
        challengesTab.click();
      });

      expect(screen.getByTestId('challenges-component')).toBeInTheDocument();
      expect(screen.getByText('Challenges Dashboard')).toBeInTheDocument();
    });

    it('switches to account tab', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });

      const accountTab = screen.getByTestId('account-tab');
      await act(async () => {
        accountTab.click();
      });

      expect(screen.getByTestId('account-component')).toBeInTheDocument();
      expect(screen.getByText('Account Dashboard')).toBeInTheDocument();
    });

    it('switches back to home tab', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });

      // Switch to stats first
      const statsTab = screen.getByTestId('stats-tab');
      await act(async () => {
        statsTab.click();
      });

      expect(screen.getByTestId('stats-component')).toBeInTheDocument();

      // Switch back to home
      const homeTab = screen.getByTestId('home-tab');
      await act(async () => {
        homeTab.click();
      });

      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('handles logout successfully', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });

      // Switch to account tab
      const accountTab = screen.getByTestId('account-tab');
      await act(async () => {
        accountTab.click();
      });

      const logoutButton = screen.getByTestId('logout-button');
      await act(async () => {
        logoutButton.click();
      });

      expect(mockSignOut).toHaveBeenCalledWith(auth);
    });

    it('handles logout error', async () => {
      const errorMessage = 'Logout failed';
      mockSignOut.mockRejectedValue(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });

      // Switch to account tab
      const accountTab = screen.getByTestId('account-tab');
      await act(async () => {
        accountTab.click();
      });

      const logoutButton = screen.getByTestId('logout-button');
      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
          message: errorMessage
        }));
      });

      alertSpy.mockRestore();
    });
  });

  describe('Trail Data Processing', () => {
    it('processes trail references correctly', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourites: 1')).toBeInTheDocument();
        expect(screen.getByText('Completed: 2')).toBeInTheDocument();
        expect(screen.getByText('Wishlist: 1')).toBeInTheDocument();
        expect(screen.getByText('Submitted: 1')).toBeInTheDocument();
      });
    });

    it('handles empty trail arrays', async () => {
      const emptyUserData = {
        ...mockUserData,
        completedHikes: [],
        favourites: [],
        wishlist: [],
        submittedTrails: []
      };

      mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
        setTimeout(() => {
          callback({
            exists: () => true,
            data: () => emptyUserData
          });
        }, 100);
        return mockUnsubscribe;
      });

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourites: 0')).toBeInTheDocument();
        expect(screen.getByText('Completed: 0')).toBeInTheDocument();
        expect(screen.getByText('Wishlist: 0')).toBeInTheDocument();
        expect(screen.getByText('Submitted: 0')).toBeInTheDocument();
      });
    });

    it('handles invalid trail references', async () => {
      const invalidUserData = {
        ...mockUserData,
        completedHikes: ['invalid-ref', '/Trails/trail-1'],
        favourites: ['not-a-trail-ref']
      };

      mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
        setTimeout(() => {
          callback({
            exists: () => true,
            data: () => invalidUserData
          });
        }, 100);
        return mockUnsubscribe;
      });

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Completed: 1')).toBeInTheDocument();
        expect(screen.getByText('Favourites: 0')).toBeInTheDocument();
      });
    });

    it('handles missing trail documents', async () => {
      mockGetDoc.mockImplementation((docRef) => {
        const trailId = docRef.path.split('/')[1];
        return Promise.resolve({
          exists: () => false,
          data: () => null
        });
      });

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourites: 0')).toBeInTheDocument();
        expect(screen.getByText('Completed: 0')).toBeInTheDocument();
        expect(screen.getByText('Wishlist: 0')).toBeInTheDocument();
        expect(screen.getByText('Submitted: 0')).toBeInTheDocument();
      });
    });
  });

  describe('Component Cleanup', () => {
    it('unsubscribes from Firestore listener on unmount', async () => {
      const { unmount } = await act(async () => {
        return render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('handles unmount during loading', async () => {
      mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
        // Don't call callback immediately
        return mockUnsubscribe;
      });

      const { unmount } = await act(async () => {
        return render(<Dashboard user={mockUser} />);
      });

      // Unmount before data loads
      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles null user prop', async () => {
      await act(async () => {
        render(<Dashboard user={null} />);
      });

      // Should not call onSnapshot when user is null
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it('handles user without uid', async () => {
      const userWithoutUid = { email: 'test@example.com' };

      await act(async () => {
        render(<Dashboard user={userWithoutUid} />);
      });

      // Should not call onSnapshot when user has no uid
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it('handles malformed user data', async () => {
      const malformedUserData = {
        profileInfo: null,
        completedHikes: 'not-an-array',
        favourites: undefined
      };

      mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
        setTimeout(() => {
          callback({
            exists: () => true,
            data: () => malformedUserData
          });
        }, 100);
        return mockUnsubscribe;
      });

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });
    });

    it('handles getDoc errors', async () => {
      mockGetDoc.mockRejectedValue(new Error('Failed to fetch trail'));

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('home-component')).toBeInTheDocument();
      });
    });
  });

  describe('User Display', () => {
    it('displays user name in desktop header', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test User\'s Dashboard')).toBeInTheDocument();
      });
    });

    it('displays default name when profile info is missing', async () => {
      const userDataWithoutProfile = {
        ...mockUserData,
        profileInfo: null
      };

      mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
        setTimeout(() => {
          callback({
            exists: () => true,
            data: () => userDataWithoutProfile
          });
        }, 100);
        return mockUnsubscribe;
      });

      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Explorer\'s Dashboard')).toBeInTheDocument();
      });
    });

    it('passes correct props to child components', async () => {
      await act(async () => {
        render(<Dashboard user={mockUser} />);
      });

      await waitFor(() => {
        expect(screen.getByText('User: Test User')).toBeInTheDocument();
        expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
      });
    });
  });
});
