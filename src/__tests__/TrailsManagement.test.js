import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailsManagement from '../components/admin/TrailsManagement';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {}
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="map-pin-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

// Mock custom hooks with default implementations
const mockUseTrailsData = jest.fn();
const mockUseTrailReviews = jest.fn();
const mockUseTrailAlerts = jest.fn();

jest.mock('../hooks/useTrailsData', () => ({
  useTrailsData: () => mockUseTrailsData()
}));

jest.mock('../hooks/useTrailReviews', () => ({
  useTrailReviews: () => mockUseTrailReviews()
}));

jest.mock('../hooks/useTrailAlerts', () => ({
  useTrailAlerts: () => mockUseTrailAlerts()
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

describe('TrailsManagement', () => {
  const defaultTrailsData = {
    trails: [
      {
        id: 'trail1',
        name: 'Mountain Peak Trail',
        description: 'A beautiful trail with scenic views',
        difficulty: 'Moderate',
        distance: 5.2,
        elevationGain: 300,
        tags: ['scenic', 'forest'],
        status: 'open',
        createdBy: 'user123',
        location: { lat: 40.7128, lng: -74.0060 },
        createdAt: new Date('2024-01-15'),
        lastUpdated: new Date('2024-01-16')
      },
      {
        id: 'trail2',
        name: 'Forest Walk',
        description: 'Easy walk through the forest',
        difficulty: 'Easy',
        distance: 2.1,
        elevationGain: 50,
        tags: ['forest', 'easy'],
        status: 'open',
        createdBy: 'user456',
        location: { lat: 40.7589, lng: -73.9851 },
        createdAt: new Date('2024-01-14'),
        lastUpdated: new Date('2024-01-15')
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
          userId: 'user789',
          timestamp: new Date('2024-01-16')
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
          message: 'Trail maintenance scheduled',
          isActive: true,
          timestamp: new Date('2024-01-17')
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
    mockUseTrailsData.mockReturnValue(defaultTrailsData);
    mockUseTrailReviews.mockReturnValue(defaultReviewsData);
    mockUseTrailAlerts.mockReturnValue(defaultAlertsData);
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
      expect(document.querySelector('.trails-header')).toBeInTheDocument();
      expect(document.querySelector('.trails-stats')).toBeInTheDocument();
    });

    it('renders all trail cards', () => {
      render(<TrailsManagement />);

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
      expect(screen.getByTestId('trail-card-trail2')).toBeInTheDocument();
    });

    it('renders stats with correct icons', () => {
      render(<TrailsManagement />);

      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
      expect(screen.getByTestId('message-square-icon')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading state when loading is true', () => {
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        loading: true
      });

      render(<TrailsManagement />);

      expect(screen.getByText('Loading trails...')).toBeInTheDocument();
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error state when error occurs', () => {
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        loading: false,
        error: 'Failed to load trails'
      });

      render(<TrailsManagement />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load trails')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls window.location.reload when retry button is clicked', () => {
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        loading: false,
        error: 'Failed to load trails'
      });

      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByText('Retry'));
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Stats Display', () => {
    it('displays correct trail count', () => {
      render(<TrailsManagement />);

      expect(screen.getByText('2 Trails')).toBeInTheDocument();
    });

    it('displays correct review count', () => {
      render(<TrailsManagement />);

      expect(screen.getByText('0 Reviews')).toBeInTheDocument();
    });

    it('displays correct alert count', () => {
      render(<TrailsManagement />);

      expect(screen.getByText('0 Alerts')).toBeInTheDocument();
    });

    it('handles zero counts correctly', () => {
      mockUseTrailReviews.mockReturnValue({
        ...defaultReviewsData,
        trailReviews: {}
      });
      mockUseTrailAlerts.mockReturnValue({
        ...defaultAlertsData,
        trailAlerts: {}
      });

      render(<TrailsManagement />);

      expect(screen.getByText('0 Reviews')).toBeInTheDocument();
      expect(screen.getByText('0 Alerts')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search component with correct placeholder', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search trails by name, description, difficulty, status, creator, or tags...');
    });

    it('filters trails by name', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Mountain' } });

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
      expect(screen.queryByTestId('trail-card-trail2')).not.toBeInTheDocument();
    });

    it('filters trails by description', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Easy walk' } });

      expect(screen.getByTestId('trail-card-trail2')).toBeInTheDocument();
      expect(screen.queryByTestId('trail-card-trail1')).not.toBeInTheDocument();
    });

    it('filters trails by difficulty', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Easy' } });

      expect(screen.getByTestId('trail-card-trail2')).toBeInTheDocument();
      expect(screen.queryByTestId('trail-card-trail1')).not.toBeInTheDocument();
    });

    it('filters trails by status', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'open' } });

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
      expect(screen.getByTestId('trail-card-trail2')).toBeInTheDocument();
    });

    it('filters trails by creator', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'user123' } });

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
      expect(screen.queryByTestId('trail-card-trail2')).not.toBeInTheDocument();
    });

    it('filters trails by tags', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'scenic' } });

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
      expect(screen.queryByTestId('trail-card-trail2')).not.toBeInTheDocument();
    });

    it('shows search results info when searching', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Mountain' } });

      expect(screen.getByText('Found 1 trail matching "Mountain"')).toBeInTheDocument();
    });

    it('shows plural form for multiple results', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'open' } });

      expect(screen.getByText('Found 2 trails matching "open"')).toBeInTheDocument();
    });

    it('shows empty state when no results found', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No trails found matching "nonexistent"')).toBeInTheDocument();
    });

    it('shows empty state when no trails exist', () => {
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        trails: []
      });

      render(<TrailsManagement />);

      expect(screen.getByText('No trails found')).toBeInTheDocument();
    });

    it('is case insensitive', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'MOUNTAIN' } });

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
      expect(screen.queryByTestId('trail-card-trail2')).not.toBeInTheDocument();
    });
  });

  describe('Trail Expansion', () => {
    it('calls fetchTrailReviews and fetchTrailAlerts when expanding trail', async () => {
      const mockFetchReviews = jest.fn();
      const mockFetchAlerts = jest.fn();

      mockUseTrailReviews.mockReturnValue({
        ...defaultReviewsData,
        fetchTrailReviews: mockFetchReviews
      });
      mockUseTrailAlerts.mockReturnValue({
        ...defaultAlertsData,
        fetchTrailAlerts: mockFetchAlerts
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('expand-trail1'));

      await waitFor(() => {
        expect(mockFetchReviews).toHaveBeenCalledWith('trail1');
        expect(mockFetchAlerts).toHaveBeenCalledWith('trail1');
      });
    });
  });

  describe('Edit Trail Functionality', () => {
    it('opens edit modal when edit button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));

      expect(screen.getByTestId('edit-trail-modal')).toBeInTheDocument();
      expect(screen.getByText('Edit Mountain Peak Trail')).toBeInTheDocument();
    });

    it('populates edit form with trail data', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));

      const nameInput = screen.getByTestId('edit-name');
      expect(nameInput).toHaveValue('Mountain Peak Trail');
    });

    it('updates form when input changes', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));

      const nameInput = screen.getByTestId('edit-name');
      fireEvent.change(nameInput, { target: { value: 'Updated Trail Name' } });

      expect(nameInput).toHaveValue('Updated Trail Name');
    });

    it('closes edit modal when close button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));
      expect(screen.getByTestId('edit-trail-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-edit'));
      expect(screen.queryByTestId('edit-trail-modal')).not.toBeInTheDocument();
    });

    it('calls updateTrail when save button is clicked', async () => {
      const mockUpdateTrail = jest.fn().mockResolvedValue(true);
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        updateTrail: mockUpdateTrail
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));
      fireEvent.click(screen.getByTestId('save-trail'));

      await waitFor(() => {
        expect(mockUpdateTrail).toHaveBeenCalledWith('trail1', expect.objectContaining({
          name: 'Mountain Peak Trail',
          description: 'A beautiful trail with scenic views',
          difficulty: 'Moderate',
          distance: 5.2,
          elevationGain: 300,
          tags: ['scenic', 'forest'],
          status: 'open',
          lastUpdated: expect.any(Date)
        }));
      });
    });

    it('shows success popup after successful update', async () => {
      const mockUpdateTrail = jest.fn().mockResolvedValue(true);
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        updateTrail: mockUpdateTrail
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('edit-trail1'));
      fireEvent.click(screen.getByTestId('save-trail'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
        expect(screen.getByText('Trail updated successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Trail Functionality', () => {
    it('opens delete confirmation modal when delete button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText('Delete trail: Mountain Peak Trail')).toBeInTheDocument();
    });

    it('calls deleteTrail when confirmed', async () => {
      const mockDeleteTrail = jest.fn().mockResolvedValue(true);
      mockUseTrailsData.mockReturnValue({
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
      const mockDeleteTrail = jest.fn().mockResolvedValue(true);
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        deleteTrail: mockDeleteTrail
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
        expect(screen.getByText('Trail "Mountain Peak Trail" has been deleted successfully!')).toBeInTheDocument();
      });
    });

    it('closes delete confirmation modal when cancelled', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));
      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('cancel-delete'));
      expect(screen.queryByTestId('delete-confirmation-modal')).not.toBeInTheDocument();
    });
  });

  describe('Delete Review Functionality', () => {
    it('opens delete confirmation modal when delete review button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-review-trail1'));

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText('Delete review: review1')).toBeInTheDocument();
    });

    it('calls deleteReview when confirmed', async () => {
      const mockDeleteReview = jest.fn().mockResolvedValue(true);
      mockUseTrailReviews.mockReturnValue({
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
      const mockDeleteReview = jest.fn().mockResolvedValue(true);
      mockUseTrailReviews.mockReturnValue({
        ...defaultReviewsData,
        deleteReview: mockDeleteReview
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-review-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
        expect(screen.getByText('Review has been deleted successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Alert Functionality', () => {
    it('opens delete confirmation modal when delete alert button is clicked', () => {
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-alert-trail1'));

      expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText('Delete alert: alert1')).toBeInTheDocument();
    });

    it('calls deleteAlert when confirmed', async () => {
      const mockDeleteAlert = jest.fn().mockResolvedValue({ success: true, trailId: 'trail1' });
      mockUseTrailAlerts.mockReturnValue({
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
      const mockDeleteAlert = jest.fn().mockResolvedValue({ success: true, trailId: 'trail1' });
      mockUseTrailAlerts.mockReturnValue({
        ...defaultAlertsData,
        deleteAlert: mockDeleteAlert
      });

      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-alert-trail1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
        expect(screen.getByText('Alert has been deleted successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Success Popup', () => {
    it('closes success popup when close button is clicked', async () => {
      const mockUpdateTrail = jest.fn().mockResolvedValue(true);
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        updateTrail: mockUpdateTrail
      });

      render(<TrailsManagement />);

      // Trigger a success popup by editing a trail
      fireEvent.click(screen.getByTestId('edit-trail1'));
      fireEvent.click(screen.getByTestId('save-trail'));

      // Wait for success popup to appear
      await waitFor(() => {
        expect(screen.getByTestId('success-popup')).toBeInTheDocument();
      });

      // Close the popup
      fireEvent.click(screen.getByTestId('close-success'));

      expect(screen.queryByTestId('success-popup')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles trails with missing data gracefully', () => {
      mockUseTrailsData.mockReturnValue({
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

    it('handles empty trails array', () => {
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        trails: []
      });

      render(<TrailsManagement />);

      expect(screen.getByText('No trails found')).toBeInTheDocument();
    });

    it('handles search with empty string', () => {
      render(<TrailsManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(screen.getByTestId('trail-card-trail1')).toBeInTheDocument();
      expect(screen.getByTestId('trail-card-trail2')).toBeInTheDocument();
    });

    it('handles tags as non-array', () => {
      mockUseTrailsData.mockReturnValue({
        ...defaultTrailsData,
        trails: [
          {
            id: 'trail1',
            name: 'Test Trail',
            description: 'Test description',
            difficulty: 'Easy',
            distance: 1.0,
            elevationGain: 10,
            tags: 'scenic,forest', // String instead of array
            status: 'open',
            createdBy: 'user123',
            location: { lat: 40.7128, lng: -74.0060 },
            createdAt: new Date('2024-01-15'),
            lastUpdated: new Date('2024-01-16')
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
      expect(consoleSpy).toHaveBeenCalledWith('Edit trail state set:', expect.any(Object));
    });

    it('logs when delete trail is called', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      render(<TrailsManagement />);

      fireEvent.click(screen.getByTestId('delete-trail1'));

      expect(consoleSpy).toHaveBeenCalledWith('Delete trail called with:', 'trail1', 'Mountain Peak Trail');
      expect(consoleSpy).toHaveBeenCalledWith('Delete confirm state set');
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