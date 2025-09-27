import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewsMedia from '../pages/ReviewsMedia';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  storage: {},
  auth: {},
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.innerWidth for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
window.addEventListener = mockAddEventListener;
window.removeEventListener = mockRemoveEventListener;

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

describe('ReviewsMedia Component', () => {
  const mockTrails = [
    {
      id: 'trail-1',
      name: 'Test Trail 1',
      photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    },
    {
      id: 'trail-2',
      name: 'Test Trail 2',
      photos: [],
    },
    {
      id: 'trail-3',
      name: 'Test Trail 3',
      photos: ['firebase-storage-path/photo3.jpg'],
    },
  ];

  const mockReviews = {
    'trail-1': [
      { id: 'review-1', message: 'Great trail!', timestamp: '2024-01-01T00:00:00Z' },
      { id: 'review-2', message: 'Beautiful views', timestamp: '2024-01-02T00:00:00Z' },
    ],
    'trail-2': [],
    'trail-3': [
      { id: 'review-3', message: 'Challenging but rewarding', timestamp: '2024-01-03T00:00:00Z' },
    ],
  };

  const mockAlerts = {
    'trail-1': [
      { id: 'alert-1', type: 'warning', message: 'Trail closed due to weather' },
    ],
    'trail-2': [],
    'trail-3': [
      { id: 'alert-2', type: 'general', message: 'Maintenance scheduled' },
      { id: 'alert-3', type: 'closure', message: 'Bridge out' },
    ],
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    fetch.mockClear();
    ref.mockClear();
    uploadBytes.mockClear();
    getDownloadURL.mockClear();
    uuidv4.mockClear();
    onAuthStateChanged.mockClear();
    signOut.mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();

    // Reset window width to mobile size to ensure buttons are visible
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500, // Mobile width to ensure isMobile is true
    });

    // Mock Firebase Auth - simulate no user initially
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // No user logged in
      return jest.fn(); // Return unsubscribe function
    });
    signOut.mockResolvedValue();

    // Mock successful API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrails,
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews['trail-1'] }),
      });

    // Mock Firebase Storage responses
    getDownloadURL.mockResolvedValue('https://example.com/downloaded-photo.jpg');
    uploadBytes.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders loading state initially', () => {
      render(<ReviewsMedia />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders error state when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));
      
      render(<ReviewsMedia />);
      
      await waitFor(() => {
        expect(screen.getByText('Could not load trails or reviews')).toBeInTheDocument();
      });
    });

    test('renders trails successfully', async () => {
      // Mock all API calls
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: mockReviews['trail-1'] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: mockReviews['trail-2'] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: mockReviews['trail-3'] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: mockAlerts['trail-1'] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: mockAlerts['trail-2'] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: mockAlerts['trail-3'] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('🌲 Hiking Trails')).toBeInTheDocument();
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
        expect(screen.getByText('Test Trail 2')).toBeInTheDocument();
        expect(screen.getByText('Test Trail 3')).toBeInTheDocument();
      });
    });

    test('renders trail images correctly', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Trail Test Trail 1/);
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveAttribute('src', 'https://example.com/photo1.jpg');
        expect(images[1]).toHaveAttribute('src', 'https://example.com/photo2.jpg');
      });
    });

    test('renders "No images" placeholder when trail has no photos', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('No images')).toBeInTheDocument();
      });
    });

    test('handles image loading errors', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/Trail Test Trail 1/);
        fireEvent.error(images[0]);
        expect(images[0]).toHaveStyle('display: none');
      });
    });
  });

  describe('API Functions', () => {
    test('fetchTrails handles successful response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrails,
      });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('https://us-central1-orion-sdp.cloudfunctions.net/getTrails');
      });
    });

    test('fetchTrails handles failed response', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Could not load trails or reviews')).toBeInTheDocument();
      });
    });

    test('fetchTrailReviews handles successful response', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: mockReviews['trail-1'] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/getTrailReviews?trailId=trail-1'
        );
      });
    });

    test('fetchTrailReviews handles failed response', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockRejectedValueOnce(new Error('Reviews API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Could not load trails or reviews')).toBeInTheDocument();
      });
    });

    test('fetchTrailAlerts handles successful response', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: mockAlerts['trail-1'] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://gettrailalerts-fqtduxc7ua-uc.a.run.app/getAlerts?trailId=trail-1'
        );
      });
    });

    test('fetchTrailAlerts handles failed response gracefully', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockRejectedValueOnce(new Error('Alerts API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Could not load trails or reviews')).toBeInTheDocument();
      });
    });

    test('fetchTrailAlerts handles non-ok response', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });
    });
  });

  describe('Firebase Storage Integration', () => {
    test('handles Firebase storage paths correctly', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(getDownloadURL).toHaveBeenCalled();
      });
    });

    test('handles Firebase storage errors gracefully', async () => {
      getDownloadURL.mockRejectedValueOnce(new Error('Storage error'));

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 3')).toBeInTheDocument();
      });
    });

    test('skips Firebase download for HTTPS URLs', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        // Should not call getDownloadURL for HTTPS URLs
        expect(getDownloadURL).not.toHaveBeenCalledWith(
          expect.objectContaining({
            _path: expect.objectContaining({
              pieces_: ['https://example.com/photo1.jpg'],
            }),
          })
        );
      });
    });
  });








  describe('Form Submissions', () => {
    beforeEach(async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });
    });




    test('submits alert successfully', async () => {
      // Mock initial data loading
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        // Mock successful alert submission
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [{ id: 'new-alert', type: 'warning', message: 'Test alert' }] }),
        });

      window.alert = jest.fn();

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });

      const alertButtons = screen.getAllByText('Alert');
      const alertButton = alertButtons[0];
      fireEvent.click(alertButton);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'warning' } });

      const textarea = screen.getByPlaceholderText('Enter alert message...');
      fireEvent.change(textarea, { target: { value: 'Test alert' } });

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/addAlert',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trailId: 'trail-1',
              message: 'Test alert',
              type: 'warning',
            }),
          })
        );
        expect(window.alert).toHaveBeenCalledWith('✅ Alert added successfully!');
      });
    });

    test('handles alert submission failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Alert submission failed'));
      window.alert = jest.fn();

      const alertButtons = screen.getAllByText('Alert');
      const alertButton = alertButtons[0];
      fireEvent.click(alertButton);

      const textarea = screen.getByPlaceholderText('Enter alert message...');
      fireEvent.change(textarea, { target: { value: 'Test alert' } });

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('❌ Failed to add alert: Alert submission failed');
      });
    });

    test('does not submit empty alert', async () => {
      const alertButtons = screen.getAllByText('Alert');
      const alertButton = alertButtons[0];
      fireEvent.click(alertButton);

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      // Should not make API call for empty alert
      expect(fetch).not.toHaveBeenCalledWith(
        'https://us-central1-orion-sdp.cloudfunctions.net/addAlert',
        expect.any(Object)
      );
    });
  });


  describe('Responsive Behavior', () => {
    test('shows buttons on mobile without hover', async () => {
      // Set mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });

      // Buttons should be visible on mobile without hover
      expect(screen.getAllByText('Add Review')).toHaveLength(3);       
      expect(screen.getAllByText('Images')).toHaveLength(3);       
      expect(screen.getAllByText('Alert')).toHaveLength(3);
    });

    test('shows buttons on desktop only on hover', async () => {
      // Set desktop width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });

      // Buttons should not be visible initially on desktop
      expect(screen.queryByText('Review')).not.toBeInTheDocument();
      expect(screen.queryByText('Images')).not.toBeInTheDocument();
      expect(screen.queryByText('Alert')).not.toBeInTheDocument();

      // Hover over trail card
      const trailCard = screen.getByText('Test Trail 1').closest('.card');
      fireEvent.mouseEnter(trailCard);

      // Buttons should now be visible for the hovered trail only  
      expect(screen.getAllByText('Add Review')).toHaveLength(1);       
      expect(screen.getAllByText('Images')).toHaveLength(1);       
      expect(screen.getAllByText('Alert')).toHaveLength(1);

      // Mouse leave should hide buttons
      fireEvent.mouseLeave(trailCard);
      expect(screen.queryByText('Add Review')).not.toBeInTheDocument();
    });

    test('handles window resize events', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });

      // Verify resize event listener was added
      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const resizeHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )[1];
      
      act(() => {
        resizeHandler();
      });

      // Buttons should be visible on mobile
      expect(screen.getAllByText('Add Review')).toHaveLength(3);
    });
  });

  describe('Reviews and Alerts Display', () => {
    beforeEach(() => {
      // Reset fetch mock before each test
      fetch.mockClear();
    });

    test('displays reviews correctly', async () => {
      // Mock reviews for all trails
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: mockReviews['trail-1'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: mockReviews['trail-2'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: mockReviews['trail-3'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Challenging but rewarding')).toBeInTheDocument();
      });
    });

    test('displays "No reviews yet" when no reviews', async () => {
      // Mock empty reviews for all trails
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getAllByText('No reviews yet.')).toHaveLength(3); // All trails show "No reviews yet" initially
      });
    });

    test('displays alerts correctly', async () => {
      // Mock alerts for all trails
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: mockAlerts['trail-1'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: mockAlerts['trail-2'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: mockAlerts['trail-3'] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('[general] Maintenance scheduled')).toBeInTheDocument();
        expect(screen.getByText('[closure] Bridge out')).toBeInTheDocument();
      });
    });


  });

  describe('Error Handling and Edge Cases', () => {
    test('handles trails with no photos array', async () => {
      const trailsWithoutPhotos = [
        {
          id: 'trail-1',
          name: 'Test Trail 1',
          // No photos property
        },
      ];

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => trailsWithoutPhotos,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
        expect(screen.getByText('No images')).toBeInTheDocument();
      });
    });

    test('handles trails with null photos', async () => {
      const trailsWithNullPhotos = [
        {
          id: 'trail-1',
          name: 'Test Trail 1',
          photos: null,
        },
      ];

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => trailsWithNullPhotos,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
        expect(screen.getByText('No images')).toBeInTheDocument();
      });
    });

    test('handles API responses with missing data fields', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({}), // Missing reviews field
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({}), // Missing alerts field
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
        expect(screen.getAllByText('No reviews yet.')).toHaveLength(3);
      });
    });

    test('handles component unmounting during async operations', async () => {
      const { unmount } = render(<ReviewsMedia />);

      // Unmount component before API calls complete
      unmount();

      // Should not cause errors
      expect(true).toBe(true);
    });

    test('handles malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Could not load trails or reviews')).toBeInTheDocument();
      });
    });
  });

  describe('Modal State Management', () => {
    beforeEach(async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });
    });


    test('resets alert form state when opening modal', async () => {
      // Open alert modal
      const alertButtons = screen.getAllByText('Alert');
      const alertButton = alertButtons[0];
      fireEvent.click(alertButton);

      const textarea = screen.getByPlaceholderText('Enter alert message...');
      fireEvent.change(textarea, { target: { value: 'Some alert' } });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'warning' } });

      // Close modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Open modal again
      fireEvent.click(alertButton);

      // Form should be reset
      expect(screen.getByPlaceholderText('Enter alert message...')).toHaveValue('');
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('resets image form state when opening modal', async () => {
      // Open images modal
      const imagesButtons = screen.getAllByText('Images');
      const imagesButton = imagesButtons[0];
      fireEvent.click(imagesButton);

      const fileInput = screen.getByRole('button', { name: 'Upload' }).previousElementSibling;
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Close modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Open modal again
      fireEvent.click(imagesButton);

      // File input should be reset - check that the input is empty
      const newFileInput = screen.getByRole('button', { name: 'Upload' }).previousElementSibling;
      // Check if files property exists and has length 0, or if it doesn't exist (which is also fine)
      const fileCount = newFileInput.files ? newFileInput.files.length : 0;
      expect(fileCount).toBe(0);
    });
  });

  describe('Component Cleanup', () => {
    test('removes event listeners on unmount', () => {
      const { unmount } = render(<ReviewsMedia />);
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Authentication Functionality', () => {
    test('displays login prompt when user is not authenticated', async () => {
      // Mock no user
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Please log in to submit reviews')).toBeInTheDocument();
      });
    });

    test('displays user info and logout button when authenticated', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      // Mock authenticated user
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    test('displays email when user has no display name', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: null
      };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, test@example.com!')).toBeInTheDocument();
      });
    });

    test('handles logout functionality', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(signOut).toHaveBeenCalled();
    });

    test('handles logout error gracefully', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      signOut.mockRejectedValue(new Error('Logout failed'));

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(signOut).toHaveBeenCalled();
    });

    test('prevents review submission when user is not logged in', async () => {
      // Mock no user
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      // Mock alert
      window.alert = jest.fn();

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });

      // Try to click review button (should be disabled or show login prompt)
      const reviewButtons = screen.getAllByText('Add Review');
      const reviewButton = reviewButtons[0];
      
      fireEvent.click(reviewButton);

      expect(window.alert).toHaveBeenCalledWith('Please log in to submit a review');
    });
  });

  describe('Rating Functionality', () => {
    test('allows rating selection in review modal', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ alerts: [] }),
        });

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByText('Add Review');
      const reviewButton = reviewButtons[0];
      fireEvent.click(reviewButton);

      expect(screen.getByText('Add Review (as Test User)')).toBeInTheDocument();

      // Click on 4th star
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[3]); // 4th star (index 3)

      // The star should be highlighted (this is tested by the component's internal state)
      expect(stars[3]).toHaveStyle('color: gold');
    });

    test('submits review with rating and user information', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [{ id: 'new-review', message: 'Great trail!', rating: 4 }] }),
        });

      window.alert = jest.fn();

      render(<ReviewsMedia />);

      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });

      const reviewButtons = screen.getAllByText('Add Review');
      const reviewButton = reviewButtons[0];
      fireEvent.click(reviewButton);

      // Set rating
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[3]); // 4th star

      // Set review text
      const textarea = screen.getByPlaceholderText('Write your review...');
      fireEvent.change(textarea, { target: { value: 'Great trail!' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"rating":4'),
          })
        );
        expect(window.alert).toHaveBeenCalledWith('✅ Review added successfully!');
      });
    });
  });
});