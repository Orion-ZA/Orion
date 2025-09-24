import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../pages/Home';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));

// Mock firebaseConfig
jest.mock('../firebaseConfig', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  }
}));

// Mock child components
jest.mock('../components/BottomNav', () => {
  const React = require('react');
  return function BottomNav({ activeTab, setActiveTab }) {
    return React.createElement('div', { 'data-testid': 'bottom-nav' },
      React.createElement('button', { onClick: () => setActiveTab('home') }, 'Home'),
      React.createElement('button', { onClick: () => setActiveTab('stats') }, 'Stats'),
      React.createElement('button', { onClick: () => setActiveTab('challenges') }, 'Challenges'),
      React.createElement('button', { onClick: () => setActiveTab('account') }, 'Account')
    );
  };
});

jest.mock('../pages/Dashboard/Home', () => {
  const React = require('react');
  return function Home({ userData, trailDetails }) {
    return React.createElement('div', { 'data-testid': 'home-tab' }, 
      `Home Tab - ${userData?.profileInfo?.name || 'No Name'}`
    );
  };
});

jest.mock('../pages/Dashboard/Stats', () => {
  const React = require('react');
  return function Stats({ userData }) {
    return React.createElement('div', { 'data-testid': 'stats-tab' }, 'Stats Tab');
  };
});

jest.mock('../pages/Dashboard/Challenges', () => {
  const React = require('react');
  return function Challenges({ userData }) {
    return React.createElement('div', { 'data-testid': 'challenges-tab' }, 'Challenges Tab');
  };
});

jest.mock('../pages/Dashboard/Account', () => {
  const React = require('react');
  return function Account({ user, userData, handleLogout }) {
    return React.createElement('div', { 'data-testid': 'account-tab' },
      'Account Tab',
      React.createElement('button', { onClick: handleLogout }, 'Logout')
    );
  };
});

describe('Home (Dashboard) Page', () => {
  const mockUser = {
    uid: 'test-uid',
    displayName: 'Test User',
    email: 'test@example.com'
  };

  const mockUserData = {
    profileInfo: {
      name: 'Test User'
    },
    completedHikes: ['/Trails/trail1'],
    favourites: ['/Trails/trail2'],
    wishlist: ['/Trails/trail3'],
    submittedTrails: ['/Trails/trail4']
  };

  const mockTrailData = {
    name: 'Test Trail',
    difficulty: 'Easy'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  // it('renders loading state initially', () => {
  //   render(React.createElement(Home, { user: mockUser }));
    
  //   // Check for loading container - the component shows a loading spinner initially
  //   expect(screen.getAllByRole('generic')[0]).toBeInTheDocument();
  // });

  it('renders dashboard with user data', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByText("Test User's Dashboard")).toBeInTheDocument();
      expect(screen.getByText('Track your hiking adventures')).toBeInTheDocument();
    });
  });

  it('renders mobile header', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });
  });

  it('renders desktop header with user name', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByText("Test User's Dashboard")).toBeInTheDocument();
      expect(screen.getByText('Track your hiking adventures')).toBeInTheDocument();
    });
  });

  it('renders default name when no user data', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => ({})
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByText("Explorer's Dashboard")).toBeInTheDocument();
    });
  });

  it('switches tabs correctly', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByTestId('home-tab')).toBeInTheDocument();
    });

    // Switch to stats tab
    fireEvent.click(screen.getByText('Stats'));
    expect(screen.getByTestId('stats-tab')).toBeInTheDocument();

    // Switch to challenges tab
    fireEvent.click(screen.getByText('Challenges'));
    expect(screen.getByTestId('challenges-tab')).toBeInTheDocument();

    // Switch to account tab
    fireEvent.click(screen.getByText('Account'));
    expect(screen.getByTestId('account-tab')).toBeInTheDocument();
  });

  it('handles logout successfully', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    signOut.mockResolvedValue();

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByTestId('home-tab')).toBeInTheDocument();
    });

    // Switch to account tab and logout
    fireEvent.click(screen.getByText('Account'));
    fireEvent.click(screen.getByText('Logout'));

    expect(signOut).toHaveBeenCalled();
  });

  it('handles logout error', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    const error = new Error('Logout failed');
    signOut.mockRejectedValue(error);

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByTestId('home-tab')).toBeInTheDocument();
    });

    // Switch to account tab and logout
    fireEvent.click(screen.getByText('Account'));
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Logout failed');
    });
  });

  it('fetches trail details for user data', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(getDoc).toHaveBeenCalledTimes(4); // One for each trail reference
    });
  });

  it('handles missing user data gracefully', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => false
      });
      return mockUnsubscribe;
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByText("Explorer's Dashboard")).toBeInTheDocument();
    });
  });

  it('handles onSnapshot error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockUnsubscribe = jest.fn();
    
    onSnapshot.mockImplementation((ref, callback, errorCallback) => {
      errorCallback(new Error('Firestore error'));
      return mockUnsubscribe;
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('does not fetch data when no user', () => {
    render(React.createElement(Home, { user: null }));
    
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('cleans up onSnapshot listener on unmount', () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockReturnValue(mockUnsubscribe);

    const { unmount } = render(React.createElement(Home, { user: mockUser }));
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('handles trail references with different formats', async () => {
    const mockUnsubscribe = jest.fn();
    const userDataWithTrails = {
      ...mockUserData,
      completedHikes: ['/Trails/trail1', 'invalid-ref'],
      favourites: ['/Trails/trail2']
    };

    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => userDataWithTrails
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrailData
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      // Should call getDoc for all trail references (valid and invalid)
      expect(getDoc).toHaveBeenCalledTimes(4);
    });
  });

  it('filters out non-existent trails', async () => {
    const mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData
      });
      return mockUnsubscribe;
    });

    getDoc.mockResolvedValue({
      exists: () => false
    });

    render(React.createElement(Home, { user: mockUser }));
    
    await waitFor(() => {
      expect(screen.getByTestId('home-tab')).toBeInTheDocument();
    });
  });
});
