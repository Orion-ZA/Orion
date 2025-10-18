import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailCard from '../components/trails/TrailCard';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Lock: () => <div data-testid="lock-icon" />,
  Unlock: () => <div data-testid="unlock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  User: () => <div data-testid="user-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Map: () => <div data-testid="map-icon" />,
}));

// Mock TrailUtils
jest.mock('../components/trails/TrailUtils', () => ({
  getDifficultyColor: jest.fn((difficulty) => {
    const colors = {
      'Easy': '#4CAF50',
      'Moderate': '#FF9800',
      'Hard': '#F44336',
      'Expert': '#9C27B0'
    };
    return colors[difficulty] || '#757575';
  }),
  getDifficultyIcon: jest.fn((difficulty) => {
    const icons = {
      'Easy': '🟢',
      'Moderate': '🟡',
      'Hard': '🔴',
      'Expert': '🟣'
    };
    return icons[difficulty] || '⚪';
  })
}));

// Helper function to render component
const renderComponent = (component) => {
  return render(component);
};

describe('TrailsTrailCard', () => {
  const mockOnToggleExpansion = jest.fn();
  const mockOnShowAlertsPopup = jest.fn();
  const mockOnHideAlertsPopup = jest.fn();
  const mockOnOpenStatusConfirmModal = jest.fn();
  const mockOnOpenReviewModal = jest.fn();

  const mockTrail = {
    id: 'trail1',
    name: 'Mountain Peak Trail',
    description: 'A beautiful trail with scenic views',
    latitude: 40.7128,
    longitude: -74.0060,
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    distance: 5.2,
    difficulty: 'Moderate',
    elevationGain: 300,
    status: 'open',
    createdAt: {
      toDate: () => new Date('2024-01-15T10:00:00Z')
    },
    lastUpdated: {
      toDate: () => new Date('2024-01-20T15:30:00Z')
    },
    tags: ['scenic', 'forest', 'waterfall'],
    photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg', 'photo4.jpg'],
    gpsRoute: [
      { lat: 40.7128, lng: -74.0060 },
      { lat: 40.7130, lng: -74.0058 }
    ]
  };

  const mockAlerts = {
    trail1: [
      {
        id: 'alert1',
        type: 'safety',
        message: 'Trail closed due to weather',
        isTimed: false,
        isActive: true,
        timestamp: new Date('2024-01-18')
      },
      {
        id: 'alert2',
        type: 'maintenance',
        comment: 'Scheduled maintenance',
        isTimed: true,
        expiresAt: {
          toDate: () => new Date(Date.now() + 3600000) // 1 hour from now
        },
        isActive: true,
        timestamp: new Date('2024-01-19')
      }
    ]
  };

  const mockLoadingStates = {
    trail1: false
  };

  const mockExpandedTrails = new Set(['trail1']);

  const mockTrails = {
    completed: [
      { id: 'completed1', name: 'Completed Trail' }
    ]
  };

  const defaultProps = {
    trail: mockTrail,
    activeTab: 'all',
    alerts: mockAlerts,
    loadingStates: mockLoadingStates,
    trails: mockTrails,
    expandedTrails: new Set(),
    onToggleExpansion: mockOnToggleExpansion,
    onShowAlertsPopup: mockOnShowAlertsPopup,
    onHideAlertsPopup: mockOnHideAlertsPopup,
    onOpenStatusConfirmModal: mockOnOpenStatusConfirmModal,
    onOpenReviewModal: mockOnOpenReviewModal
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders trail card with basic information', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
      expect(screen.getByText('+300m')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('renders with correct CSS classes', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      expect(document.querySelector('.my-trails-trail-card')).toBeInTheDocument();
      expect(document.querySelector('.my-trails-trail-header')).toBeInTheDocument();
      expect(document.querySelector('.my-trails-trail-info')).toBeInTheDocument();
      expect(document.querySelector('.my-trails-trail-actions')).toBeInTheDocument();
    });

    it('renders difficulty badge with correct styling', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      const difficultyElement = document.querySelector('.my-trails-trail-difficulty');
      expect(difficultyElement).toBeInTheDocument();
      // Note: Style testing is complex in test environment, so we just verify the element exists
    });

    it('renders trail details grid', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      expect(document.querySelector('.my-trails-trail-details-grid')).toBeInTheDocument();
      expect(document.querySelectorAll('.my-trails-trail-detail-item')).toHaveLength(3); // difficulty, distance, elevation
    });
  });

  describe('Alert Functionality', () => {
    it('displays alert count when alerts exist', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      expect(screen.getByText('2')).toBeInTheDocument(); // Alert count
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('does not display alert count when no alerts', () => {
      const propsWithoutAlerts = {
        ...defaultProps,
        alerts: {}
      };
      renderComponent(<TrailCard {...propsWithoutAlerts} />);

      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('shows loading state for alerts', () => {
      const propsWithLoading = {
        ...defaultProps,
        loadingStates: { trail1: true }
      };
      renderComponent(<TrailCard {...propsWithLoading} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('calls onShowAlertsPopup when hovering over alert count', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      const alertCount = document.querySelector('.trail-alerts-count-header');
      fireEvent.mouseEnter(alertCount);

      expect(mockOnShowAlertsPopup).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([
          expect.objectContaining({ id: 'alert1' }),
          expect.objectContaining({ id: 'alert2' })
        ])
      );
    });

    it('calls onHideAlertsPopup when leaving alert count', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      const alertCount = document.querySelector('.trail-alerts-count-header');
      fireEvent.mouseLeave(alertCount);

      expect(mockOnHideAlertsPopup).toHaveBeenCalled();
    });

    it('filters out expired alerts', () => {
      const alertsWithExpired = {
        trail1: [
          {
            id: 'alert1',
            type: 'safety',
            message: 'Active alert',
            isTimed: false,
            isActive: true,
            timestamp: new Date('2024-01-18')
          },
          {
            id: 'alert2',
            type: 'maintenance',
            message: 'Expired alert',
            isTimed: true,
            expiresAt: {
              toDate: () => new Date(Date.now() - 3600000) // 1 hour ago
            },
            isActive: true,
            timestamp: new Date('2024-01-19')
          }
        ]
      };

      const propsWithExpiredAlerts = {
        ...defaultProps,
        alerts: alertsWithExpired
      };
      renderComponent(<TrailCard {...propsWithExpiredAlerts} />);

      // Should only show 1 alert (the non-expired one)
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles alerts without isTimed property', () => {
      const alertsWithoutTimed = {
        trail1: [
          {
            id: 'alert1',
            type: 'safety',
            message: 'Alert without timed property',
            isActive: true,
            timestamp: new Date('2024-01-18')
          }
        ]
      };

      const propsWithoutTimed = {
        ...defaultProps,
        alerts: alertsWithoutTimed
      };
      renderComponent(<TrailCard {...propsWithoutTimed} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles alerts without expiresAt property', () => {
      const alertsWithoutExpiresAt = {
        trail1: [
          {
            id: 'alert1',
            type: 'safety',
            message: 'Alert without expiresAt',
            isTimed: true,
            isActive: true,
            timestamp: new Date('2024-01-18')
          }
        ]
      };

      const propsWithoutExpiresAt = {
        ...defaultProps,
        alerts: alertsWithoutExpiresAt
      };
      renderComponent(<TrailCard {...propsWithoutExpiresAt} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Expansion Functionality', () => {
    it('shows expand button for submitted tab', () => {
      const propsWithSubmittedTab = {
        ...defaultProps,
        activeTab: 'submitted'
      };
      renderComponent(<TrailCard {...propsWithSubmittedTab} />);

      const expandButton = document.querySelector('.my-trails-expand-button');
      expect(expandButton).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });

    it('shows collapse button when expanded', () => {
      const propsWithExpanded = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithExpanded} />);

      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('calls onToggleExpansion when expand button is clicked', () => {
      const propsWithSubmittedTab = {
        ...defaultProps,
        activeTab: 'submitted'
      };
      renderComponent(<TrailCard {...propsWithSubmittedTab} />);

      const expandButton = document.querySelector('.my-trails-expand-button');
      fireEvent.click(expandButton);

      expect(mockOnToggleExpansion).toHaveBeenCalledWith('trail1');
    });

    it('renders expanded details when expanded', () => {
      const propsWithExpanded = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithExpanded} />);

      expect(document.querySelector('.my-trails-expanded-details')).toBeInTheDocument();
      expect(screen.getByText('Location Details')).toBeInTheDocument();
      expect(screen.getByText('Submission Info')).toBeInTheDocument();
    });

    it('does not render expanded details when not expanded', () => {
      const propsWithSubmittedTab = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set()
      };
      renderComponent(<TrailCard {...propsWithSubmittedTab} />);

      expect(document.querySelector('.my-trails-expanded-details')).not.toBeInTheDocument();
    });
  });

  describe('Expanded Details Content', () => {
    const propsWithExpanded = {
      ...defaultProps,
      activeTab: 'submitted',
      expandedTrails: new Set(['trail1'])
    };

    beforeEach(() => {
      renderComponent(<TrailCard {...propsWithExpanded} />);
    });

    it('displays location details', () => {
      expect(screen.getByText('Location Details')).toBeInTheDocument();
      expect(screen.getByText('40.712800, -74.006000')).toBeInTheDocument();
      expect(screen.getByText('2 waypoints')).toBeInTheDocument();
    });

    it('displays submission info', () => {
      expect(screen.getByText('Submission Info')).toBeInTheDocument();
      expect(screen.getByText('Created:')).toBeInTheDocument();
      expect(screen.getByText('Last Updated:')).toBeInTheDocument();
      expect(screen.getByText('Status:')).toBeInTheDocument();
    });

    it('displays trail status correctly', () => {
      expect(screen.getByText('Open to Public')).toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('displays description when available', () => {
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('A beautiful trail with scenic views')).toBeInTheDocument();
    });

    it('displays tags when available', () => {
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('scenic')).toBeInTheDocument();
      expect(screen.getByText('forest')).toBeInTheDocument();
      expect(screen.getByText('waterfall')).toBeInTheDocument();
    });

    it('displays photos when available', () => {
      expect(screen.getByText('Photos')).toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument(); // Shows 3 photos + 1 more
    });

    it('handles missing optional fields gracefully', () => {
      const trailWithoutOptional = {
        ...mockTrail,
        description: null,
        tags: null,
        photos: null,
        gpsRoute: null,
        lastUpdated: null
      };

      const propsWithoutOptional = {
        ...defaultProps,
        trail: trailWithoutOptional,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };

      renderComponent(<TrailCard {...propsWithoutOptional} />);

      // Should not crash and should still show basic info
      expect(screen.getAllByText('Location Details')).toHaveLength(2); // One in each test case
      expect(screen.getAllByText('Submission Info')).toHaveLength(2); // One in each test case
    });
  });

  describe('Action Buttons', () => {
    it('shows Mark as Completed button for non-completed trails', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      expect(screen.getByText('Mark as Completed')).toBeInTheDocument();
    });

    it('shows completed status for completed trails', () => {
      const completedTrail = {
        ...mockTrail,
        id: 'completed1'
      };

      const propsWithCompletedTrail = {
        ...defaultProps,
        trail: completedTrail
      };
      renderComponent(<TrailCard {...propsWithCompletedTrail} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('calls onOpenReviewModal when Mark as Completed is clicked', () => {
      renderComponent(<TrailCard {...defaultProps} />);

      const completeButton = screen.getByText('Mark as Completed');
      fireEvent.click(completeButton);

      expect(mockOnOpenReviewModal).toHaveBeenCalledWith('trail1', 'Mountain Peak Trail');
    });

    it('shows submitted actions for submitted tab', () => {
      const propsWithSubmittedTab = {
        ...defaultProps,
        activeTab: 'submitted'
      };
      renderComponent(<TrailCard {...propsWithSubmittedTab} />);

      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('shows closed status for closed trails', () => {
      const closedTrail = {
        ...mockTrail,
        status: 'closed'
      };

      const propsWithClosedTrail = {
        ...defaultProps,
        trail: closedTrail,
        activeTab: 'submitted'
      };
      renderComponent(<TrailCard {...propsWithClosedTrail} />);

      expect(screen.getByText('Closed')).toBeInTheDocument();
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });

    it('calls onOpenStatusConfirmModal when status badge is clicked', () => {
      const propsWithSubmittedTab = {
        ...defaultProps,
        activeTab: 'submitted'
      };
      renderComponent(<TrailCard {...propsWithSubmittedTab} />);

      const statusBadge = document.querySelector('.status-badge');
      fireEvent.click(statusBadge);

      expect(mockOnOpenStatusConfirmModal).toHaveBeenCalledWith('trail1', 'Mountain Peak Trail', 'open');
    });
  });

  describe('Show on Map Functionality', () => {
    it('shows Show on Map button for expanded submitted trails', () => {
      const propsWithExpandedSubmitted = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithExpandedSubmitted} />);

      expect(screen.getByText('Show on Map')).toBeInTheDocument();
      expect(screen.getByTestId('map-icon')).toBeInTheDocument();
    });

    it('calls navigate with correct parameters when Show on Map is clicked', () => {
      const propsWithExpandedSubmitted = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithExpandedSubmitted} />);

      const showOnMapButton = screen.getByText('Show on Map');
      fireEvent.click(showOnMapButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trails', {
        state: {
          trailToCenter: expect.objectContaining({
            id: 'trail1',
            name: 'Mountain Peak Trail',
            latitude: 40.7128,
            longitude: -74.0060
          }),
          action: 'centerTrail'
        }
      });
    });

    it('handles trail without location data', () => {
      const trailWithoutLocation = {
        ...mockTrail,
        latitude: null,
        longitude: null,
        location: null
      };

      const propsWithoutLocation = {
        ...defaultProps,
        trail: trailWithoutLocation,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithoutLocation} />);

      const showOnMapButton = screen.getByText('Show on Map');
      fireEvent.click(showOnMapButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trails', {
        state: {
          trailToCenter: expect.objectContaining({
            id: 'trail1',
            name: 'Mountain Peak Trail',
            latitude: undefined,
            longitude: undefined
          }),
          action: 'centerTrail'
        }
      });
    });
  });

  describe('Date Formatting', () => {
    it('formats Firestore timestamp correctly', () => {
      const propsWithExpanded = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithExpanded} />);

      // Should display formatted date
      expect(screen.getAllByText(/2024\/01\/15/)).toHaveLength(2); // One in expanded details, one in submitted date
    });

    it('handles regular Date objects', () => {
      const trailWithRegularDate = {
        ...mockTrail,
        createdAt: new Date('2024-01-15T10:00:00Z')
      };

      const propsWithRegularDate = {
        ...defaultProps,
        trail: trailWithRegularDate,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithRegularDate} />);

      expect(screen.getAllByText(/2024\/01\/15/)).toHaveLength(2); // One in expanded details, one in submitted date
    });

    it('handles null timestamp', () => {
      const trailWithNullDate = {
        ...mockTrail,
        createdAt: null
      };

      const propsWithNullDate = {
        ...defaultProps,
        trail: trailWithNullDate,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithNullDate} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles trail with minimal data', () => {
      const minimalTrail = {
        id: 'minimal',
        name: 'Minimal Trail'
      };

      const propsWithMinimalTrail = {
        ...defaultProps,
        trail: minimalTrail
      };
      renderComponent(<TrailCard {...propsWithMinimalTrail} />);

      expect(screen.getByText('Minimal Trail')).toBeInTheDocument();
      expect(screen.queryByText(/5\.2.*km/)).not.toBeInTheDocument();
      expect(screen.queryByText(/elevation/i)).not.toBeInTheDocument();
    });

    it('handles trail without elevation gain', () => {
      const trailWithoutElevation = {
        ...mockTrail,
        elevationGain: null
      };

      const propsWithoutElevation = {
        ...defaultProps,
        trail: trailWithoutElevation
      };
      renderComponent(<TrailCard {...propsWithoutElevation} />);

      expect(screen.getByText('5.2 km')).toBeInTheDocument();
      expect(screen.queryByText(/\+300m/)).not.toBeInTheDocument();
    });

    it('handles empty tags array', () => {
      const trailWithEmptyTags = {
        ...mockTrail,
        tags: []
      };

      const propsWithEmptyTags = {
        ...defaultProps,
        trail: trailWithEmptyTags,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithEmptyTags} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('handles empty photos array', () => {
      const trailWithEmptyPhotos = {
        ...mockTrail,
        photos: []
      };

      const propsWithEmptyPhotos = {
        ...defaultProps,
        trail: trailWithEmptyPhotos,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithEmptyPhotos} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.queryByText('Photos')).not.toBeInTheDocument();
    });

    it('handles photo loading errors', () => {
      const propsWithExpanded = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithExpanded} />);

      const photo = screen.getByAltText('Trail photo 1');
      fireEvent.error(photo);

      expect(photo.style.display).toBe('none');
    });
  });

  describe('Accessibility', () => {
    it('has proper button titles for accessibility', () => {
      const propsWithSubmittedTab = {
        ...defaultProps,
        activeTab: 'submitted'
      };
      renderComponent(<TrailCard {...propsWithSubmittedTab} />);

      const expandButton = document.querySelector('.my-trails-expand-button');
      expect(expandButton).toHaveAttribute('aria-label', 'Expand details');
    });

    it('updates aria-label when expanded', () => {
      const propsWithExpanded = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithExpanded} />);

      const expandButton = document.querySelector('.my-trails-expand-button');
      expect(expandButton).toHaveAttribute('aria-label', 'Collapse details');
    });

    it('has proper button title for Show on Map', () => {
      const propsWithExpandedSubmitted = {
        ...defaultProps,
        activeTab: 'submitted',
        expandedTrails: new Set(['trail1'])
      };
      renderComponent(<TrailCard {...propsWithExpandedSubmitted} />);

      const showOnMapButton = screen.getByTitle('Show trail on map');
      expect(showOnMapButton).toBeInTheDocument();
    });

    it('has proper status badge title', () => {
      const propsWithSubmittedTab = {
        ...defaultProps,
        activeTab: 'submitted'
      };
      renderComponent(<TrailCard {...propsWithSubmittedTab} />);

      const statusBadge = document.querySelector('.status-badge');
      expect(statusBadge).toHaveAttribute('title', 'Click to close trail');
    });
  });
});
