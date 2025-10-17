import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  Trash2: () => <div data-testid="trash-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
}));

describe('AlertsManagement', () => {
  const mockAlerts = [
    {
      id: 'alert1',
      type: 'emergency',
      message: 'Trail closed due to weather',
      trailId: 'trail123',
      isActive: true,
      timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') }
    },
    {
      id: 'alert2',
      type: 'community',
      message: 'Maintenance scheduled',
      trailId: 'trail456',
      isActive: false,
      timestamp: { toDate: () => new Date('2024-01-14T14:20:00Z') }
    },
    {
      id: 'alert3',
      type: 'authority',
      message: 'Parking restrictions',
      trailId: 'trail789',
      isActive: true,
      timestamp: { toDate: () => new Date('2024-01-13T09:15:00Z') }
    }
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
          data: () => alert
        }))
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
          data: () => alert
        }))
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
          data: () => alert
        }))
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
          timestamp: null
        }
      ];
      
      const querySnapshot = {
        docs: alertsWithMissingData.map(alert => ({
          id: alert.id,
          data: () => alert
        }))
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
          data: () => alert
        }))
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
          data: () => alert
        }))
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
          timestamp: null
        }
      ];
      
      const querySnapshot = {
        docs: alertsWithNullTimestamp.map(alert => ({
          id: alert.id,
          data: () => alert
        }))
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
          data: () => alert
        }))
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
          data: () => alert
        }))
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

  describe('Accessibility', () => {
    beforeEach(async () => {
      const querySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => alert
        }))
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
