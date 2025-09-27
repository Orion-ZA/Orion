import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage, { ProfileGlowCard } from '../pages/ProfilePage';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, collection, id) => ({ path: `${collection}/${id}` })),
  getDoc: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}));

// Mock child components
jest.mock('../components/FavouritesIcon', () => {
  return function FavouritesIcon() {
    return <div data-testid="favourites-icon">FavouritesIcon</div>;
  };
});

jest.mock('../components/PyramidLoader', () => {
  return function PyramidLoader() {
    return <div data-testid="pyramid-loader">Loading...</div>;
  };
});

jest.mock('../components/WishlistIcon', () => {
  return function WishlistIcon() {
    return <div data-testid="wishlist-icon">WishlistIcon</div>;
  };
});

jest.mock('../components/SubmittedIcon', () => {
  return function SubmittedIcon() {
    return <div data-testid="submitted-icon">SubmittedIcon</div>;
  };
});

jest.mock('../components/CompletedIcon', () => {
  return function CompletedIcon() {
    return <div data-testid="completed-icon">CompletedIcon</div>;
  };
});

describe('ProfilePage', () => {
  const mockNavigate = jest.fn();
  const mockOnAuthStateChanged = jest.fn();
  const mockGetDoc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    const { auth } = require('../firebaseConfig');
    auth.onAuthStateChanged = mockOnAuthStateChanged;
    getDoc.mockImplementation(mockGetDoc);
  });

  it('renders loading state initially', () => {
    mockOnAuthStateChanged.mockReturnValue(jest.fn()); // Return unsubscribe function
    render(<ProfilePage />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders login prompt when no user data', async () => {
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Please log in to view your profile')).toBeInTheDocument();
    });
  });

  it('renders profile with user data and trails', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg'
    };

    const mockUserData = {
      wishlist: ['/Trails/trail1', '/Trails/trail2'],
      favourites: ['/Trails/trail3'],
      completedHikes: ['/Trails/trail4'],
      submittedTrails: ['/Trails/trail5']
    };

    const mockTrailData = {
      id: 'trail1',
      name: 'Test Trail 1'
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => mockUserData })
      .mockResolvedValue({ exists: () => true, data: () => mockTrailData, id: 'trail1' });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('displays user avatar when photoURL is available', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg'
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    render(<ProfilePage />);
    
    await waitFor(() => {
      const avatar = screen.getByAltText('User Avatar');
      expect(avatar).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });
  });

  it('displays placeholder when no photoURL', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('No Image')).toBeInTheDocument();
    });
  });

  it('handles missing displayName', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: null,
      email: 'test@example.com',
      photoURL: null
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('No Name')).toBeInTheDocument();
    });
  });

  it('navigates to settings when edit button is clicked', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    render(<ProfilePage />);
    
    await waitFor(() => {
      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  it('displays wishlist trails', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    const mockUserData = {
      wishlist: ['/Trails/trail1'],
      favourites: [],
      completedHikes: [],
      submittedTrails: []
    };

    const mockTrailData = {
      id: 'trail1',
      name: 'Wishlist Trail 1'
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    // Mock getDoc to return user data first, then trail data
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => mockUserData })
      .mockResolvedValue({ exists: () => true, data: () => mockTrailData, id: 'trail1' });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Wishlist Trail 1')).toBeInTheDocument();
    });
  });

  it('displays favourites trails', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    const mockUserData = {
      wishlist: [],
      favourites: ['/Trails/trail1'],
      completedHikes: [],
      submittedTrails: []
    };

    const mockTrailData = {
      id: 'trail1',
      name: 'Favourite Trail 1'
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => mockUserData })
      .mockResolvedValue({ exists: () => true, data: () => mockTrailData, id: 'trail1' });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
    });
  });

  it('displays completed hikes', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    const mockUserData = {
      wishlist: [],
      favourites: [],
      completed: ['/Trails/trail1'],
      submittedTrails: []
    };

    const mockTrailData = {
      id: 'trail1',
      name: 'Completed Trail 1'
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => mockUserData })
      .mockResolvedValue({ exists: () => true, data: () => mockTrailData, id: 'trail1' });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Completed Trail 1')).toBeInTheDocument();
    });
  });

  it('displays submitted trails', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    const mockUserData = {
      wishlist: [],
      favourites: [],
      completedHikes: [],
      submittedTrails: ['/Trails/trail1']
    };

    const mockTrailData = {
      id: 'trail1',
      name: 'Submitted Trail 1'
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => mockUserData })
      .mockResolvedValue({ exists: () => true, data: () => mockTrailData, id: 'trail1' });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Submitted Trail 1')).toBeInTheDocument();
    });
  });

  it('displays empty state messages when no trails', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    const mockUserData = {
      wishlist: [],
      favourites: [],
      completedHikes: [],
      submittedTrails: []
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => mockUserData });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('No wishlist yet.')).toBeInTheDocument();
      expect(screen.getByText('No favourites yet.')).toBeInTheDocument();
      expect(screen.getByText('No completed hikes yet.')).toBeInTheDocument();
      expect(screen.getByText('No submitted trails yet.')).toBeInTheDocument();
    });
  });

  it('handles trail references as strings', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    const mockUserData = {
      wishlist: ['/Trails/trail1'],
      favourites: [],
      completedHikes: [],
      submittedTrails: []
    };

    const mockTrailData = {
      id: 'trail1',
      name: 'String Reference Trail'
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => mockUserData })
      .mockResolvedValue({ exists: () => true, data: () => mockTrailData, id: 'trail1' });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('String Reference Trail')).toBeInTheDocument();
    });
  });

  it('filters out non-existent trails', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    const mockUserData = {
      wishlist: ['/Trails/trail1', '/Trails/trail2'],
      favourites: [],
      completedHikes: [],
      submittedTrails: []
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => mockUserData })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ id: 'trail1', name: 'Valid Trail' }) })
      .mockResolvedValueOnce({ exists: () => false });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Valid Trail')).toBeInTheDocument();
      expect(screen.queryByText('Invalid Trail')).not.toBeInTheDocument();
    });
  });

  it('handles errors during data fetching', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc.mockRejectedValue(new Error('Firestore error'));

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user/trails:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('renders all section icons', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('wishlist-icon')).toHaveLength(2);
      expect(screen.getAllByTestId('favourites-icon')).toHaveLength(2);
      expect(screen.getAllByTestId('completed-icon')).toHaveLength(2);
      expect(screen.getAllByTestId('submitted-icon')).toHaveLength(2);
    });
  });

  it('cleans up auth state listener on unmount', () => {
    const mockUnsubscribe = jest.fn();
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<ProfilePage />);
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('handles trail references as Firestore DocumentReference objects', async () => {
    const mockUser = {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    };

    const mockUserData = {
      wishlist: [{ path: 'Trails/trail1' }], // Mock DocumentReference object
      favourites: [],
      completed: [],
      submittedTrails: []
    };

    const mockTrailData = {
      id: 'trail1',
      name: 'DocumentReference Trail'
    };

    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => mockUserData })
      .mockResolvedValue({ exists: () => true, data: () => mockTrailData, id: 'trail1' });

    render(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('DocumentReference Trail')).toBeInTheDocument();
    });
  });

  it('renders ProfileGlowCard component', () => {
    const { container } = render(
      <ProfileGlowCard 
        avatarUrl="https://example.com/avatar.jpg" 
        email="test@example.com" 
      />
    );
    
    expect(container.querySelector('.card')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(container.querySelector('.email')).toHaveTextContent('test@example.com');
  });

  it('renders ProfileGlowCard component without avatar', () => {
    const { container } = render(
      <ProfileGlowCard 
        avatarUrl={null} 
        email="test@example.com" 
      />
    );
    
    expect(container.querySelector('.card')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument(); // Should show SVG placeholder
    expect(container.querySelector('.email')).toHaveTextContent('test@example.com');
  });
});
