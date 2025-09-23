import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertsUpdates from '../pages/AlertsUpdates';
import { getAuth } from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn()
}));

// Mock fetch globally
global.fetch = jest.fn();

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

describe('AlertsUpdates Component', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com'
  };

  const mockSavedTrails = {
    favourites: [
      { id: 'trail-1', name: 'Test Trail 1' },
      { id: 'trail-2', name: 'Test Trail 2' }
    ],
    wishlist: [
      { id: 'trail-3', name: 'Test Trail 3' }
    ],
    completed: [
      { id: 'trail-4', name: 'Test Trail 4' }
    ]
  };

  const mockAlerts = {
    'trail-1': [
      { id: 'alert-1', type: 'authority', message: 'Trail closed due to weather', date: '2024-01-01T00:00:00Z' },
      { id: 'alert-2', type: 'condition', message: 'Slippery conditions reported', date: '2024-01-02T00:00:00Z' }
    ],
    'trail-2': [],
    'trail-3': [
      { id: 'alert-3', type: 'authority', message: 'Maintenance scheduled', date: '2024-01-03T00:00:00Z' }
    ],
    'trail-4': []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getAuth to return user
    getAuth.mockReturnValue({
      currentUser: mockUser
    });

    // Mock successful fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('getsavedtrails')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSavedTrails)
        });
      }
      if (url.includes('gettrailalerts')) {
        const trailId = url.split('trailId=')[1];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ alerts: mockAlerts[trailId] || [] })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  describe('Component Rendering', () => {
    it('renders the alerts and updates page', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      expect(screen.getByText('Alerts & Updates')).toBeInTheDocument();
      expect(screen.getByText('Active Alerts for Your Saved Trails')).toBeInTheDocument();
      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    });

    it('shows loading state initially', async () => {
      // Mock slow fetch to ensure loading state is visible
      global.fetch.mockImplementation((url) => {
        return new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ favourites: [], wishlist: [], completed: [] })
          }), 100);
        });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });

    it('renders alerts for saved trails', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('Trail closed due to weather')).toBeInTheDocument();
        expect(screen.getByText('Slippery conditions reported')).toBeInTheDocument();
        expect(screen.getByText('Maintenance scheduled')).toBeInTheDocument();
      });
    });

    it('displays trail names with alerts', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('Trail:', { exact: false })).toHaveLength(3);
        expect(screen.getAllByText('Test Trail 1')).toHaveLength(2);
        expect(screen.getByText('Test Trail 3')).toBeInTheDocument();
      });
    });

    it('shows alert types correctly', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('Closure')).toHaveLength(2);
        expect(screen.getByText('Condition')).toBeInTheDocument();
      });
    });

    it('displays alert dates', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('Posted:', { exact: false })).toHaveLength(3);
        expect(screen.getByText('2024/01/01', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('2024/01/02', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('2024/01/03', { exact: false })).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication', () => {
    it('handles unauthenticated user', async () => {
      getAuth.mockReturnValue({
        currentUser: null
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('No saved trails found. Add trails to your favorites, wishlist, or completed list to see alerts.')).toBeInTheDocument();
      });
    });

    it('fetches saved trails for authenticated user', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://getsavedtrails-fqtduxc7ua-uc.a.run.app?uid=test-user-id'
        );
      });
    });
  });

  describe('Data Fetching', () => {
    it('fetches alerts for all saved trails', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://gettrailalerts-fqtduxc7ua-uc.a.run.app?trailId=trail-1'
        );
        expect(global.fetch).toHaveBeenCalledWith(
          'https://gettrailalerts-fqtduxc7ua-uc.a.run.app?trailId=trail-2'
        );
        expect(global.fetch).toHaveBeenCalledWith(
          'https://gettrailalerts-fqtduxc7ua-uc.a.run.app?trailId=trail-3'
        );
        expect(global.fetch).toHaveBeenCalledWith(
          'https://gettrailalerts-fqtduxc7ua-uc.a.run.app?trailId=trail-4'
        );
      });
    });

    it('handles empty saved trails', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ favourites: [], wishlist: [], completed: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('No saved trails found. Add trails to your favorites, wishlist, or completed list to see alerts.')).toBeInTheDocument();
      });
    });

    it('handles no alerts for saved trails', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSavedTrails)
          });
        }
        if (url.includes('gettrailalerts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ alerts: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('No active alerts for your saved trails at this time.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles saved trails fetch error', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('No saved trails found. Add trails to your favorites, wishlist, or completed list to see alerts.')).toBeInTheDocument();
      });
    });

    it('handles individual trail alerts fetch error', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSavedTrails)
          });
        }
        if (url.includes('gettrailalerts')) {
          const trailId = url.split('trailId=')[1];
          if (trailId === 'trail-1') {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ alerts: mockAlerts[trailId] || [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      // Should still show alerts for other trails
      await waitFor(() => {
        expect(screen.getByText('Maintenance scheduled')).toBeInTheDocument();
      });
    });

    it('handles malformed saved trails data', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}) // Missing arrays
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('No saved trails found. Add trails to your favorites, wishlist, or completed list to see alerts.')).toBeInTheDocument();
      });
    });
  });

  describe('Subscription Section', () => {
    it('renders subscription form', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
      expect(screen.getByText('Subscribe')).toBeInTheDocument();
    });

    it('displays saved trails count', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tracking alerts for', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getAllByText('saved trails', { exact: false })).toHaveLength(3);
      });
    });

    it('displays alerts count when alerts exist', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tracking alerts for', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getAllByText('saved trails', { exact: false })).toHaveLength(3);
        expect(screen.getByText('with', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getAllByText('active alerts', { exact: false })).toHaveLength(2);
      });
    });

    it('handles subscription form interaction', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      const emailInput = screen.getByPlaceholderText('Email address');
      const subscribeButton = screen.getByText('Subscribe');

      expect(emailInput).toBeInTheDocument();
      expect(subscribeButton).toBeInTheDocument();
    });
  });

  describe('Alert Display', () => {
    it('displays alerts with correct styling', async () => {
      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        const closureBadges = screen.getAllByText('Closure');
        const conditionBadge = screen.getByText('Condition');
        
        expect(closureBadges[0]).toHaveClass('badge', 'danger');
        expect(conditionBadge).toHaveClass('badge', 'warning');
      });
    });

    it('handles alerts without dates', async () => {
      const alertsWithoutDates = {
        'trail-1': [
          { id: 'alert-1', type: 'authority', message: 'Trail closed due to weather' }
        ]
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSavedTrails)
          });
        }
        if (url.includes('gettrailalerts')) {
          const trailId = url.split('trailId=')[1];
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ alerts: alertsWithoutDates[trailId] || [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('Trail closed due to weather')).toBeInTheDocument();
        // Should not show date if not provided
        expect(screen.queryByText('Posted:', { exact: false })).not.toBeInTheDocument();
      });
    });

    it('handles alerts without trail names', async () => {
      const alertsWithoutTrailNames = {
        'trail-1': [
          { id: 'alert-1', type: 'authority', message: 'Trail closed due to weather', date: '2024-01-01T00:00:00Z' }
        ]
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              favourites: [{ id: 'trail-1' }], // No name property
              wishlist: [],
              completed: []
            })
          });
        }
        if (url.includes('gettrailalerts')) {
          const trailId = url.split('trailId=')[1];
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ alerts: alertsWithoutTrailNames[trailId] || [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('Trail closed due to weather')).toBeInTheDocument();
        // Should not show trail name if not provided
        expect(screen.queryByText('Trail:', { exact: false })).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading while fetching user data', async () => {
      // Mock slow user data fetch
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return new Promise(resolve => {
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve(mockSavedTrails)
            }), 100);
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });

    it('shows loading while fetching alerts', async () => {
      // Mock slow alerts fetch
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSavedTrails)
          });
        }
        if (url.includes('gettrailalerts')) {
          return new Promise(resolve => {
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve({ alerts: [] })
            }), 100);
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null or undefined alert arrays', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSavedTrails)
          });
        }
        if (url.includes('gettrailalerts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ alerts: null })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText('No active alerts for your saved trails at this time.')).toBeInTheDocument();
      });
    });

    it('handles duplicate alerts', async () => {
      const duplicateAlerts = {
        'trail-1': [
          { id: 'alert-1', type: 'authority', message: 'Trail closed', date: '2024-01-01T00:00:00Z' },
          { id: 'alert-1', type: 'authority', message: 'Trail closed', date: '2024-01-01T00:00:00Z' }
        ]
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              favourites: [{ id: 'trail-1', name: 'Test Trail 1' }],
              wishlist: [],
              completed: []
            })
          });
        }
        if (url.includes('gettrailalerts')) {
          const trailId = url.split('trailId=')[1];
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ alerts: duplicateAlerts[trailId] || [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        // Should display both alerts even if they're duplicates
        const alertElements = screen.getAllByText('Trail closed');
        expect(alertElements).toHaveLength(2);
      });
    });

    it('handles very long alert messages', async () => {
      const longMessage = 'This is a very long alert message that should be displayed properly without breaking the layout or causing any issues with the component rendering. It should wrap correctly and maintain readability.';
      
      const longAlert = {
        'trail-1': [
          { id: 'alert-1', type: 'authority', message: longMessage, date: '2024-01-01T00:00:00Z' }
        ]
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              favourites: [{ id: 'trail-1', name: 'Test Trail 1' }],
              wishlist: [],
              completed: []
            })
          });
        }
        if (url.includes('gettrailalerts')) {
          const trailId = url.split('trailId=')[1];
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ alerts: longAlert[trailId] || [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<AlertsUpdates />);
      });

      await waitFor(() => {
        expect(screen.getByText(longMessage)).toBeInTheDocument();
      });
    });
  });
});
