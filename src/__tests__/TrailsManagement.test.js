import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('../firebaseConfig', () => ({
  db: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn()
}));

// Import Firestore functions for mocking
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="map-pin-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Flag: () => <div data-testid="flag-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  X: () => <div data-testid="x-icon" />
}));

// Mock child components
jest.mock('../components/admin/TrailCard', () => {
  return function MockTrailCard({ trail, onEdit, onDelete, onToggleExpansion, onDeleteReview, onDeleteAlert }) {
    return (
      <div data-testid={`trail-card-${trail.id}`}>
        <h3>{trail.name}</h3>
        <button onClick={() => onEdit(trail)} data-testid={`edit-${trail.id}`}>
          Edit
        </button>
        <button onClick={() => onDelete(trail.id, trail.name)} data-testid={`delete-${trail.id}`}>
          Delete
        </button>
        <button onClick={() => onToggleExpansion(trail.id)} data-testid={`expand-${trail.id}`}>
          Expand
        </button>
        <button onClick={() => onDeleteReview('review1', trail.id, trail.name)} data-testid={`delete-review-${trail.id}`}>
          Delete Review
        </button>
        <button onClick={() => onDeleteAlert('alert1')} data-testid={`delete-alert-${trail.id}`}>
          Delete Alert
        </button>
      </div>
    );
  };
});

jest.mock('../components/admin/DeleteConfirmationModal', () => {
  return function MockDeleteConfirmationModal({ isVisible, deleteConfirm, onConfirm, onCancel }) {
    if (!isVisible) return null;
    return (
      <div data-testid="delete-confirmation-modal">
        <p>Delete {deleteConfirm?.type}: {deleteConfirm?.name || deleteConfirm?.id}</p>
        <button onClick={onConfirm} data-testid="confirm-delete">Confirm</button>
        <button onClick={onCancel} data-testid="cancel-delete">Cancel</button>
      </div>
    );
  };
});

jest.mock('../components/admin/EditTrailModal', () => {
  return function MockEditTrailModal({ isVisible, editTrail, editForm, onClose, onSave, onFormChange }) {
    if (!isVisible) return null;
    return (
      <div data-testid="edit-trail-modal">
        <h3>Edit {editTrail?.name}</h3>
        <input
          data-testid="edit-name"
          value={editForm.name}
          onChange={(e) => onFormChange('name', e.target.value)}
        />
        <button onClick={onSave} data-testid="save-trail">Save</button>
        <button onClick={onClose} data-testid="close-edit">Close</button>
      </div>
    );
  };
});

jest.mock('../components/admin/TrailsSearchComponent', () => {
  return function MockTrailsSearchComponent({ onSearch, placeholder }) {
    return (
      <div data-testid="search-component">
        <input
          data-testid="search-input"
          placeholder={placeholder}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    );
  };
});

jest.mock('../components/SuccessPopup', () => {
  return function MockSuccessPopup({ isVisible, message, onClose }) {
    if (!isVisible) return null;
    return (
      <div data-testid="success-popup">
        <p>{message}</p>
        <button onClick={onClose} data-testid="close-success">Close</button>
      </div>
    );
  };
});

// Mock the hooks
jest.mock('../hooks/useTrailsData', () => ({
  useTrailsData: jest.fn()
}));

jest.mock('../hooks/useTrailReviews', () => ({
  useTrailReviews: jest.fn()
}));

jest.mock('../hooks/useTrailAlerts', () => ({
  useTrailAlerts: jest.fn()
}));

// Import the component after mocks are set up
import TrailsManagement from '../components/admin/TrailsManagement';
import { useTrailsData } from '../hooks/useTrailsData';
import { useTrailReviews } from '../hooks/useTrailReviews';
import { useTrailAlerts } from '../hooks/useTrailAlerts';

describe('TrailsManagement', () => {
  // Test data
  const defaultTrailsData = {
    trails: [
      {
        id: 'trail1',
        name: 'Test Trail 1',
        description: 'A test trail',
        difficulty: 'Easy',
        distance: 5.0,
        elevationGain: 100,
        tags: ['scenic', 'easy'],
        status: 'open',
        photos: ['photo1.jpg', 'photo2.jpg'],
        createdBy: 'user1',
        location: { lat: 40.7128, lng: -74.0060 },
        createdAt: new Date('2024-01-01'),
        lastUpdated: new Date('2024-01-01')
      }
    ],
    loading: false,
    error: null,
    deleteTrail: jest.fn().mockResolvedValue(true),
    updateTrail: jest.fn().mockResolvedValue(true),
    setError: jest.fn()
  };

  const defaultReviewsData = {
    trailReviews: {
      trail1: [
        {
          id: 'review1',
          rating: 4,
          comment: 'Great trail!',
          userId: 'user1',
          timestamp: new Date('2024-01-01')
        }
      ]
    },
    loadingStates: { reviews: { trail1: false } },
    fetchTrailReviews: jest.fn(),
    deleteReview: jest.fn().mockResolvedValue(true)
  };

  const defaultAlertsData = {
    trailAlerts: {
      trail1: [
        {
          id: 'alert1',
          type: 'maintenance',
          message: 'Trail under maintenance',
          isActive: true,
          timestamp: new Date('2024-01-01')
        }
      ]
    },
    loadingStates: { alerts: { trail1: false } },
    fetchTrailAlerts: jest.fn(),
    deleteAlert: jest.fn().mockResolvedValue({ success: true, trailId: 'trail1' })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Set default mock implementations
    useTrailsData.mockReturnValue({
      ...defaultTrailsData,
      deleteTrail: jest.fn().mockResolvedValue(true),
      updateTrail: jest.fn().mockResolvedValue(true)
    });
    useTrailReviews.mockReturnValue({
      ...defaultReviewsData,
      deleteReview: jest.fn().mockResolvedValue(true)
    });
    useTrailAlerts.mockReturnValue({
      ...defaultAlertsData,
      deleteAlert: jest.fn().mockResolvedValue({ success: true, trailId: 'trail1' })
    });
    
    // Mock Firestore functions for counts
    collection.mockImplementation((db, collectionName, docId, subCollection) => {
      if (subCollection === 'reviews') {
        return { path: `Trails/${docId}/reviews` };
      }
      if (collectionName === 'Alerts') {
        return { path: 'Alerts' };
      }
      if (collectionName === 'Reports') {
        return { path: 'Reports' };
      }
      return { path: 'mock-collection' };
    });
    
    getDocs.mockImplementation((ref) => {
      // Mock reviews count
      if (ref.path && ref.path.includes('reviews')) {
        return Promise.resolve({ size: 1 });
      }
      // Mock alerts count - handle both direct Alerts collection and queried results
      if (ref.path && ref.path.includes('Alerts')) {
        return Promise.resolve({ size: 1 });
      }
      // Mock reports
      if (ref.path && ref.path.includes('Reports')) {
        return Promise.resolve({ 
          docs: [],
          size: 0
        });
      }
      return Promise.resolve({ size: 0 });
    });
    
    query.mockReturnValue({ path: 'Alerts' });
    orderBy.mockReturnValue({});
    where.mockReturnValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders trails management interface', () => {
      render(<TrailsManagement />);

      expect(screen.getByText('Trails Management')).toBeInTheDocument();
      expect(screen.getByTestId('search-component')).toBeInTheDocument();
    });

    it('renders with correct CSS classes', () => {
      render(<TrailsManagement />);

      expect(document.querySelector('.trails-management')).toBeInTheDocument();
    });

    it('renders trail cards', () => {
      render(<TrailsManagement />);

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
    });

    it('renders trail stats', async () => {
      render(<TrailsManagement />);

      expect(screen.getByText('1 Trails')).toBeInTheDocument();
      
      // Wait for async operations to complete
      await waitFor(() => {
        expect(screen.getByText('1 Reviews')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('1 Alerts')).toBeInTheDocument();
      });
    });

    it('renders reports dropdown button', () => {
      render(<TrailsManagement />);

      expect(screen.getByText('Reports (0)')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state', () => {
      useTrailsData.mockReturnValue({
        ...defaultTrailsData,
        loading: true
      });

      render(<TrailsManagement />);

      expect(screen.getByText('Loading trails...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      useTrailsData.mockReturnValue({
        ...defaultTrailsData,
        loading: false,
        error: 'Failed to load trails'
      });

      render(<TrailsManagement />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load trails')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters trails by search term', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      expect(screen.getByText('Found 1 trail matching "Test"')).toBeInTheDocument();
    });

    it('shows no results when no trails match', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No trails found matching "nonexistent"')).toBeInTheDocument();
    });
  });

  describe('Trail Actions', () => {
    it('opens edit modal when edit button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));

      expect(screen.getByTestId('edit-trail-modal')).toBeInTheDocument();
    });

    it('opens delete confirmation when delete button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    });

    it('toggles trail expansion when expand button is clicked', () => {
      const mockFetchTrailReviews = jest.fn();
      const mockFetchTrailAlerts = jest.fn();
      
      useTrailReviews.mockReturnValue({
        ...defaultReviewsData,
        fetchTrailReviews: mockFetchTrailReviews
      });
      
      useTrailAlerts.mockReturnValue({
        ...defaultAlertsData,
        fetchTrailAlerts: mockFetchTrailAlerts
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('expand-trail1'));

      expect(mockFetchTrailReviews).toHaveBeenCalledWith('trail1');
      expect(mockFetchTrailAlerts).toHaveBeenCalledWith('trail1');
    });
  });

  describe('Reports Dropdown', () => {
    it('toggles reports dropdown when clicked', () => {
      render(<TrailsManagement />);

      const reportsButton = screen.getByText('Reports (0)');
      fireEvent.click(reportsButton);

      expect(screen.getByText('Recent Reports')).toBeInTheDocument();
    });

    it('shows loading state when fetching reports', async () => {
      render(<TrailsManagement />);

      const reportsButton = screen.getByText('Reports (0)');
      fireEvent.click(reportsButton);

      // The dropdown should show loading state
      expect(screen.getByText('Loading reports...')).toBeInTheDocument();
    });
  });

  describe('Delete Trail Functionality', () => {
    it('opens delete confirmation modal when delete button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    });

    it('calls deleteTrail when confirmed', async () => {
      const mockDeleteTrail = jest.fn().mockResolvedValue(true);
      useTrailsData.mockReturnValue({
        ...defaultTrailsData,
        deleteTrail: mockDeleteTrail
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockDeleteTrail).toHaveBeenCalledWith('trail1');
      });
    });

    it('shows success popup after successful deletion', async () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Trail Functionality', () => {
    it('opens edit modal when edit button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));

      expect(screen.getByTestId('edit-trail-modal')).toBeInTheDocument();
    });

    it('calls updateTrail when save button is clicked', async () => {
      const mockUpdateTrail = jest.fn().mockResolvedValue(true);
      useTrailsData.mockReturnValue({
        ...defaultTrailsData,
        updateTrail: mockUpdateTrail
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));
      
      const nameInput = screen.getByTestId('edit-name');
      fireEvent.change(nameInput, { target: { value: 'Updated Trail Name' } });
      
      fireEvent.click(screen.getByTestId('save-trail'));

      await waitFor(() => {
        expect(mockUpdateTrail).toHaveBeenCalled();
      });
    });

    it('shows success popup after successful update', async () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));
      fireEvent.click(screen.getByTestId('save-trail'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Review Functionality', () => {
    it('opens delete confirmation modal when delete review button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-review-trail1'));

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    });

    it('calls deleteReview when confirmed', async () => {
      const mockDeleteReview = jest.fn().mockResolvedValue(true);
      useTrailReviews.mockReturnValue({
        ...defaultReviewsData,
        deleteReview: mockDeleteReview
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-review-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockDeleteReview).toHaveBeenCalledWith('review1', 'trail1');
      });
    });

    it('shows success popup after successful review deletion', async () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-review-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Alert Functionality', () => {
    it('opens delete confirmation modal when delete alert button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-alert-trail1'));

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    });

    it('calls deleteAlert when confirmed', async () => {
      const mockDeleteAlert = jest.fn().mockResolvedValue({ success: true, trailId: 'trail1' });
      useTrailAlerts.mockReturnValue({
        ...defaultAlertsData,
        deleteAlert: mockDeleteAlert
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-alert-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockDeleteAlert).toHaveBeenCalledWith('alert1');
      });
    });

    it('shows success popup after successful alert deletion', async () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-alert-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
      });
    });
  });

  describe('Success Popup', () => {
    it('closes success popup when close button is clicked', async () => {
      render(<TrailsManagement />);

      // Trigger a success popup by editing a trail
      fireEvent.click(screen.getByTestId('edit-trail1'));
      fireEvent.click(screen.getByTestId('save-trail'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-success'));

      expect(screen.queryByTestId('success-popup')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty trails array', () => {
      useTrailsData.mockReturnValue({
        ...defaultTrailsData,
        trails: []
      });

      render(<TrailsManagement />);

      expect(screen.getByText('No trails found')).toBeInTheDocument();
    });

    it('handles trails with missing properties', () => {
      useTrailsData.mockReturnValue({
        ...defaultTrailsData,
        trails: [
          {
            id: 'trail1',
            name: null,
            description: null,
            difficulty: null,
            distance: null,
            elevationGain: null,
            tags: null,
            status: null,
            photos: null,
            createdBy: null,
            location: null,
            createdAt: null,
            lastUpdated: null
          }
        ]
      });

      render(<TrailsManagement />);

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
    });

    it('handles tags as non-array', () => {
      useTrailsData.mockReturnValue({
        ...defaultTrailsData,
        trails: [
          {
            ...defaultTrailsData.trails[0],
            tags: 'scenic,easy'
          }
        ]
      });

      render(<TrailsManagement />);

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
    });
  });

  describe('Console Logging', () => {
    it('logs debug information on render', () => {
      const consoleSpy = jest.spyOn(console, 'log');

      render(<TrailsManagement />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'TrailsManagement render - deleteConfirm:',
        null,
        'editTrail:',
        null
      );
    });

    it('logs when edit trail is called', () => {
      const consoleSpy = jest.spyOn(console, 'log');

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));

      expect(consoleSpy).toHaveBeenCalledWith('handleEditTrail called with:', expect.any(Object));
    });

    it('logs when delete trail is called', () => {
      const consoleSpy = jest.spyOn(console, 'log');

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));

      expect(consoleSpy).toHaveBeenCalledWith('Delete trail called with:', 'trail1', 'Test Trail 1');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<TrailsManagement />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Trails Management');
    });

    it('has proper button roles', () => {
      render(<TrailsManagement />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has proper form structure in edit modal', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));

      const input = screen.getByTestId('edit-name');
      expect(input).toBeInTheDocument();
    });
  });
});