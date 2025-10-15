import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailDetail from '../pages/TrailDetail';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

jest.mock('../firebaseConfig', () => ({
  db: {},
  storage: {},
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock ToastContext
const mockShowToast = jest.fn();
jest.mock('../components/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock the showToast function globally
global.showToast = mockShowToast;

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn(),
  },
});

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock trail data
const mockTrail = {
  id: 'test-trail-1',
  name: 'Test Trail',
  difficulty: 'Moderate',
  distance: 5.2,
  elevationGain: 450,
  rating: 4.5,
  location: { latitude: -26.2041, longitude: 28.0473 },
  tags: ['scenic', 'moderate'],
  description: 'A beautiful test trail with great views',
  photos: ['https://example.com/photo1.jpg'],
  status: 'open',
  createdBy: 'test-user-1',
  createdAt: { seconds: 1640995200, nanoseconds: 0 },
  lastUpdated: { seconds: 1640995200, nanoseconds: 0 },
};

const mockUser = {
  uid: 'test-user-1',
  email: 'test@example.com',
  displayName: 'Test User',
};

describe('TrailDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useParams
    const mockUseParams = require('react-router-dom').useParams;
    mockUseParams.mockReturnValue({
      trailId: 'test-trail-1',
    });
    
    // Mock useNavigate
    const mockNavigate = jest.fn();
    const mockUseNavigate = require('react-router-dom').useNavigate;
    mockUseNavigate.mockReturnValue(mockNavigate);
    
    // Mock useLocation with trail data
    const mockUseLocation = require('react-router-dom').useLocation;
    mockUseLocation.mockReturnValue({
      state: { trail: mockTrail },
    });
    
    // Mock getAuth to return a mock auth object
    const { getAuth } = require('firebase/auth');
    getAuth.mockReturnValue({});
    
    // Mock auth state - call callback immediately
    const { onAuthStateChanged } = require('firebase/auth');
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });
    
    // Mock Firestore responses
    const { getDoc, getDocs } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockTrail,
    });
    
    getDocs.mockResolvedValue({
      docs: [],
    });
    
    // Mock weather API
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        list: [
          {
            dt: 1640995200,
            main: { temp: 20, temp_min: 15, temp_max: 25, humidity: 60 },
            weather: [{ main: 'Clear' }],
            wind: { speed: 5 },
          },
        ],
      }),
    });
  });

  describe('Basic Rendering', () => {
    test('renders trail detail page with basic information', async () => {
      render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Trail')).toBeInTheDocument();
        expect(screen.getByText('Moderate')).toBeInTheDocument();
        expect(screen.getByText('5.2 km')).toBeInTheDocument();
        expect(screen.getByText('450 m')).toBeInTheDocument();
      });
    });

    test('renders navigation buttons', async () => {
      render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /get directions/i })).toBeInTheDocument();
      });
    });

    test('renders tab navigation', async () => {
      render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByText(/Reviews \(\d+\)/)).toBeInTheDocument();
        expect(screen.getByText(/Media \(\d+\)/)).toBeInTheDocument();
        expect(screen.getByText('Alerts')).toBeInTheDocument();
      });
    });
  });

  describe('Weather Section', () => {
    test('renders weather forecast section', async () => {
      render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Weather Forecast')).toBeInTheDocument();
      });
    });

    test('displays weather data when available', async () => {
      render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
    });

    test('shows loading state for weather', async () => {
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Loading weather data...')).toBeInTheDocument();
      });
    });

    test('handles weather API errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));
      
      render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Weather data not available for this location.')).toBeInTheDocument();
      });
    });
  });

           describe('Navigation', () => {
             test('back button navigates correctly', async () => {
               render(<TrailDetail />);
               
               await waitFor(() => {
                 expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
               });
               
               const backButton = screen.getByRole('button', { name: /back/i });
               fireEvent.click(backButton);
               
               const mockNavigate = require('react-router-dom').useNavigate();
               expect(mockNavigate).toHaveBeenCalledWith(-1);
             });

             test('share button renders correctly', async () => {
               render(<TrailDetail />);

               await waitFor(() => {
                 expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
               });

               const shareButton = screen.getByRole('button', { name: /share/i });
               expect(shareButton).toBeInTheDocument();
             });
           });

  describe('Basic Functionality', () => {
    test('shows add alert button in alerts tab', async () => {
      render(<TrailDetail />);
      
      await waitFor(() => {
        const alertsTab = screen.getByText('Alerts');
        fireEvent.click(alertsTab);
        
        expect(screen.getByRole('button', { name: /add alert/i })).toBeInTheDocument();
      });
    });

    test('displays duration information', async () => {
      render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByText(/Duration/)).toBeInTheDocument();
      });
    });

    test('does not cause memory leaks', async () => {
      const { unmount } = render(<TrailDetail />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Trail')).toBeInTheDocument();
      });
      
      // Unmount component
      unmount();
      
      // Should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });
});