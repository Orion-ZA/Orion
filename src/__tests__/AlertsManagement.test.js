import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertsManagement from '../components/admin/AlertsManagement';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {},
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Trash2: () => <div data-testid='trash-icon' />,
  AlertTriangle: () => <div data-testid='alert-triangle-icon' />,
  Calendar: () => <div data-testid='calendar-icon' />,
  MapPin: () => <div data-testid='map-pin-icon' />,
  MessageSquare: () => <div data-testid='message-square-icon' />,
  Eye: () => <div data-testid='eye-icon' />,
  EyeOff: () => <div data-testid='eye-off-icon' />,
  Clock: () => <div data-testid='clock-icon' />,
  AlertCircle: () => <div data-testid='alert-circle-icon' />,
}));

describe('AlertsManagement', () => {
  const mockAlerts = [
    {
      id: 'alert1',
      type: 'emergency',
      message: 'Trail closed due to weather',
      trailId: 'trail123',
      isActive: true,
      timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
    },
    {
      id: 'alert2',
      type: 'community',
      message: 'Maintenance scheduled',
      trailId: 'trail456',
      isActive: false,
      timestamp: { toDate: () => new Date('2024-01-14T14:20:00Z') },
    },
    {
      id: 'alert3',
      type: 'authority',
      message: 'Parking restrictions',
      trailId: 'trail789',
      isActive: true,
      timestamp: { toDate: () => new Date('2024-01-13T09:15:00Z') },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    collection.mockReturnValue('alertsRef');
    orderBy.mockReturnValue('orderByQuery');
    query.mockReturnValue('finalQuery');
    doc.mockReturnValue('docRef');
  });

  describe('Component Rendering', () => {
    it('renders loading state initially', () => {
      getDocs.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AlertsManagement />);

      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
      expect(document.querySelector('.admin-loading-spinner')).toBeInTheDocument();
    });

    it('renders error state when fetch fails', async () => {
      const errorMessage = 'Network error';
      getDocs.mockRejectedValue(new Error(errorMessage));

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText(`Failed to fetch alerts: ${errorMessage}`)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('renders main component when data loads successfully', async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Alerts Management')).toBeInTheDocument();
        expect(screen.getByText('Total Alerts: 3')).toBeInTheDocument();
        expect(screen.getByText('Active: 2')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('calls Firebase functions with correct parameters', async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(collection).toHaveBeenCalledWith({}, 'Alerts');
        expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
        expect(query).toHaveBeenCalledWith('alertsRef', 'orderByQuery');
        expect(getDocs).toHaveBeenCalledWith('finalQuery');
      });
    });

    it('handles empty alerts list', async () => {
      const querySnapshot = { docs: [] };
      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No alerts found')).toBeInTheDocument();
        expect(screen.getByText('Total Alerts: 0')).toBeInTheDocument();
        expect(screen.getByText('Active: 0')).toBeInTheDocument();
      });
    });

    it('retries fetch when retry button is clicked', async () => {
      getDocs.mockRejectedValueOnce(new Error('Network error'));

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(getDocs).toHaveBeenCalledTimes(2);
    });
  });

  describe('Alert Display', () => {
    beforeEach(async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);
    });

    it('displays all alerts with correct information', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Trail closed due to weather')).toBeInTheDocument();
        expect(screen.getByText('Maintenance scheduled')).toBeInTheDocument();
        expect(screen.getByText('Parking restrictions')).toBeInTheDocument();
      });
    });

    it('displays alert types correctly', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('emergency')).toBeInTheDocument();
        expect(screen.getByText('community')).toBeInTheDocument();
        expect(screen.getByText('authority')).toBeInTheDocument();
      });
    });

    it('displays alert status correctly', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getAllByText('Active')).toHaveLength(2);
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('displays trail IDs correctly', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('trail123')).toBeInTheDocument();
        expect(screen.getByText('trail456')).toBeInTheDocument();
        expect(screen.getByText('trail789')).toBeInTheDocument();
      });
    });

    it('handles alerts with missing data gracefully', async () => {
      const alertsWithMissingData = [
        {
          id: 'alert1',
          type: null,
          message: null,
          trailId: null,
          isActive: true,
          timestamp: null,
        },
      ];

      const querySnapshot = {
        docs: alertsWithMissingData.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
        expect(screen.getByText('No message')).toBeInTheDocument();
        expect(screen.getAllByText('N/A')).toHaveLength(2); // Trail ID and Created date
      });
    });
  });

  describe('Alert Deletion', () => {
    beforeEach(async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);
    });

    it('opens delete confirmation modal when delete button is clicked', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete Alert');
        fireEvent.click(deleteButtons[0]);
      });

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this alert?')).toBeInTheDocument();
      expect(screen.getByText('"Trail closed due to weather"')).toBeInTheDocument();
      expect(screen.getByText('Type: emergency')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('cancels deletion when cancel button is clicked', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete Alert');
        fireEvent.click(deleteButtons[0]);
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });

    it('deletes alert when confirm button is clicked', async () => {
      deleteDoc.mockResolvedValue();

      render(<AlertsManagement />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete Alert');
        fireEvent.click(deleteButtons[0]);
      });

      const confirmButton = screen.getByText('Delete Alert');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteDoc).toHaveBeenCalledWith('docRef');
        expect(doc).toHaveBeenCalledWith({}, 'Alerts', 'alert1');
      });
    });

    it('handles deletion error gracefully', async () => {
      const errorMessage = 'Delete failed';
      deleteDoc.mockRejectedValue(new Error(errorMessage));

      render(<AlertsManagement />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete Alert');
        fireEvent.click(deleteButtons[0]);
      });

      const confirmButton = screen.getByText('Delete Alert');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(`Failed to delete alert: ${errorMessage}`)).toBeInTheDocument();
      });
    });
  });

  describe('Utility Functions', () => {
    beforeEach(async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);
    });

    it('formats dates correctly', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        // Check that dates are formatted and displayed
        const dateElements = screen.getAllByText(/2024\/01\/1[3-5]/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('handles null timestamps', async () => {
      const alertsWithNullTimestamp = [
        {
          id: 'alert1',
          type: 'emergency',
          message: 'Test alert',
          trailId: 'trail123',
          isActive: true,
          timestamp: null,
        },
      ];

      const querySnapshot = {
        docs: alertsWithNullTimestamp.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });

    it('displays correct colors for alert types', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        const emergencyAlert = screen.getByText('emergency');
        const communityAlert = screen.getByText('community');
        const authorityAlert = screen.getByText('authority');

        expect(emergencyAlert).toHaveStyle('color: #ff3b30');
        expect(communityAlert).toHaveStyle('color: #007aff');
        expect(authorityAlert).toHaveStyle('color: #ff9500');
      });
    });

    it('displays correct icons for alert types', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getAllByTestId('alert-triangle-icon')).toHaveLength(2); // emergency + default
        expect(screen.getByTestId('message-square-icon')).toBeInTheDocument(); // community
        expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument(); // authority
      });
    });
  });

  describe('Statistics Display', () => {
    it('calculates and displays correct statistics', async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Total Alerts: 3')).toBeInTheDocument();
        expect(screen.getByText('Active: 2')).toBeInTheDocument();
      });
    });

    it('updates statistics when alerts are deleted', async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);
      deleteDoc.mockResolvedValue();

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Total Alerts: 3')).toBeInTheDocument();
        expect(screen.getByText('Active: 2')).toBeInTheDocument();
      });

      // Delete an alert
      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete Alert');
        fireEvent.click(deleteButtons[0]);
      });

      const confirmButton = screen.getByText('Delete Alert');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Total Alerts: 2')).toBeInTheDocument();
        expect(screen.getByText('Active: 1')).toBeInTheDocument();
      });
    });
  });

  describe('Timed Alerts Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('displays timed alerts with countdown timer', async () => {
      const futureDate = new Date(Date.now() + 3661000); // 1 hour, 1 minute, 1 second from now
      const timedAlerts = [
        {
          id: 'timed1',
          type: 'emergency',
          message: 'Timed alert',
          trailId: 'trail123',
          isActive: true,
          isTimed: true,
          expiresAt: futureDate,
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
      ];

      const querySnapshot = {
        docs: timedAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Timed')).toBeInTheDocument();
        expect(screen.getAllByTestId('clock-icon')).toHaveLength(2); // One in badge, one in timer section
      });
    });

    it('displays permanent alerts without timer', async () => {
      const permanentAlerts = [
        {
          id: 'permanent1',
          type: 'community',
          message: 'Permanent alert',
          trailId: 'trail456',
          isActive: true,
          isTimed: false,
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
      ];

      const querySnapshot = {
        docs: permanentAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Permanent')).toBeInTheDocument();
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });

    it('updates countdown timer every second', async () => {
      const futureDate = new Date(Date.now() + 3661000); // 1 hour, 1 minute, 1 second from now
      const timedAlerts = [
        {
          id: 'timed1',
          type: 'emergency',
          message: 'Timed alert',
          trailId: 'trail123',
          isActive: true,
          isTimed: true,
          expiresAt: futureDate,
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
      ];

      const querySnapshot = {
        docs: timedAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Timed')).toBeInTheDocument();
      });

      // Advance time by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Timer should still be displayed
      expect(screen.getByText('Timed')).toBeInTheDocument();
    });

    it('handles expired alerts correctly', async () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const expiredAlerts = [
        {
          id: 'expired1',
          type: 'emergency',
          message: 'Expired alert',
          trailId: 'trail123',
          isActive: true,
          isTimed: true,
          expiresAt: pastDate,
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
      ];

      const querySnapshot = {
        docs: expiredAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Expired')).toBeInTheDocument();
      });
    });

    it('handles Firestore timestamp objects', async () => {
      const futureDate = new Date(Date.now() + 3661000);
      const alertsWithFirestoreTimestamp = [
        {
          id: 'firestore1',
          type: 'emergency',
          message: 'Firestore timestamp alert',
          trailId: 'trail123',
          isActive: true,
          isTimed: true,
          expiresAt: { toDate: () => futureDate },
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
      ];

      const querySnapshot = {
        docs: alertsWithFirestoreTimestamp.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Timed')).toBeInTheDocument();
      });
    });

    it('handles invalid expiresAt dates gracefully', async () => {
      const invalidDateAlerts = [
        {
          id: 'invalid1',
          type: 'emergency',
          message: 'Invalid date alert',
          trailId: 'trail123',
          isActive: true,
          isTimed: true,
          expiresAt: {
            toDate: () => {
              throw new Error('Invalid date conversion');
            },
          },
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
      ];

      const querySnapshot = {
        docs: invalidDateAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      // Mock console.warn to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Invalid date alert')).toBeInTheDocument();
        expect(screen.getByText('Timed')).toBeInTheDocument();
      });

      // Should have called console.warn for the invalid date
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking alert expiration:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('handles timer calculation errors gracefully', async () => {
      const errorDateAlerts = [
        {
          id: 'error1',
          type: 'emergency',
          message: 'Error date alert',
          trailId: 'trail123',
          isActive: true,
          isTimed: true,
          expiresAt: {
            toDate: () => {
              throw new Error('Timer calculation error');
            },
          },
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
      ];

      const querySnapshot = {
        docs: errorDateAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      // Mock console.warn to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Error date alert')).toBeInTheDocument();
      });

      // Advance time to trigger timer calculation
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should have called console.warn for the timer calculation error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error calculating time remaining:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('handles alerts with null or undefined properties', async () => {
      const nullAlerts = [
        {
          id: 'null1',
          type: null,
          message: null,
          trailId: null,
          isActive: true,
          isTimed: null,
          expiresAt: null,
          timestamp: null,
        },
      ];

      const querySnapshot = {
        docs: nullAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
        expect(screen.getByText('No message')).toBeInTheDocument();
        expect(screen.getAllByText('N/A')).toHaveLength(2); // Trail ID and Created date
      });
    });

    it('handles mixed timed and permanent alerts', async () => {
      const mixedAlerts = [
        {
          id: 'timed1',
          type: 'emergency',
          message: 'Timed alert',
          trailId: 'trail123',
          isActive: true,
          isTimed: true,
          expiresAt: new Date(Date.now() + 3600000),
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
        {
          id: 'permanent1',
          type: 'community',
          message: 'Permanent alert',
          trailId: 'trail456',
          isActive: true,
          isTimed: false,
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
      ];

      const querySnapshot = {
        docs: mixedAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Timed')).toBeInTheDocument();
        expect(screen.getByText('Permanent')).toBeInTheDocument();
        expect(screen.getAllByTestId('clock-icon')).toHaveLength(2); // One in badge, one in timer section
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles delete error with console warning', async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);
      deleteDoc.mockRejectedValue(new Error('Delete failed'));

      // Mock console.warn to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AlertsManagement />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete Alert');
        fireEvent.click(deleteButtons[0]);
      });

      const confirmButton = screen.getByText('Delete Alert');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete alert: Delete failed')).toBeInTheDocument();
      });

      // Should have called console.warn for the delete error
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting alert:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('handles fetch error gracefully', async () => {
      getDocs.mockRejectedValue(new Error('Network error'));

      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch alerts: Network error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert,
        })),
      };

      getDocs.mockResolvedValue(querySnapshot);
    });

    it('has proper button titles for accessibility', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete Alert');
        expect(deleteButtons).toHaveLength(3);
      });
    });

    it('has proper heading structure', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Alerts Management');
      });
    });

    it('has proper modal structure for delete confirmation', async () => {
      render(<AlertsManagement />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete Alert');
        fireEvent.click(deleteButtons[0]);
      });

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Confirm Deletion');
    });
  });
});
