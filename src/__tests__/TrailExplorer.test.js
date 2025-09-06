import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TrailExplorerPage from '../pages/TrailExplorer';

// Mock the custom hook
jest.mock('../components/hooks/useTrails', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the child components
jest.mock('../components/map/TrailMap', () => {
  return function MockTrailMap({ trails, userLocation, selectedTrail, onSelectTrail }) {
    return (
      <div data-testid="trail-map">
        <div data-testid="map-trails-count">{trails.length} trails</div>
        {userLocation && (
          <div data-testid="user-location">
            {userLocation.latitude}, {userLocation.longitude}
          </div>
        )}
        {selectedTrail && (
          <div data-testid="selected-trail">{selectedTrail.name}</div>
        )}
        <button 
          onClick={() => onSelectTrail(trails[0])}
          data-testid="select-trail-button"
        >
          Select First Trail
        </button>
      </div>
    );
  };
});

jest.mock('../components/lists/TrailList', () => {
  return function MockTrailList({ trails, userLocation, selectedTrail, onSelectTrail, calculateDistance, maxDistance }) {
    return (
      <div data-testid="trail-list">
        <div data-testid="list-trails-count">{trails.length} trails</div>
        {userLocation && (
          <div data-testid="list-user-location">
            Max distance: {maxDistance}km
          </div>
        )}
        {selectedTrail && (
          <div data-testid="list-selected-trail">{selectedTrail.name}</div>
        )}
        {trails.map(trail => (
          <div 
            key={trail.id} 
            data-testid={`trail-item-${trail.id}`}
            onClick={() => onSelectTrail(trail)}
          >
            {trail.name} - {trail.difficulty}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../components/filters/FilterPanel', () => {
  return function MockFilterPanel({ filters, onFilterChange }) {
    return (
      <div data-testid="filter-panel">
        <div data-testid="current-filters">
          Difficulty: {filters.difficulty}, 
          Tags: {filters.tags}, 
          Max Distance: {filters.maxDistance}, 
          Max Location Distance: {filters.maxLocationDistance}
        </div>
        <button 
          onClick={() => onFilterChange('difficulty', 'Easy')}
          data-testid="filter-difficulty-easy"
        >
          Filter Easy
        </button>
        <button 
          onClick={() => onFilterChange('maxDistance', 10)}
          data-testid="filter-max-distance"
        >
          Set Max Distance 10
        </button>
      </div>
    );
  };
});

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('TrailExplorerPage', () => {
  const mockUseTrails = require('../components/hooks/useTrails').default;
  
  const mockTrails = [
    {
      id: 1,
      name: "Melville Koppies Trail",
      difficulty: "Moderate",
      distance: 4.5,
      elevationGain: 600,
      rating: 4.8,
      location: { latitude: -26.1755, longitude: 27.9715 },
      tags: ["rocky", "panoramic", "city-views"],
      status: { status: "open", lastUpdated: new Date() },
      createdBy: "sample-user-1"
    },
    {
      id: 2,
      name: "Klipriviersberg Loop",
      difficulty: "Hard",
      distance: 8.9,
      elevationGain: 1100,
      rating: 4.6,
      location: { latitude: -26.2940, longitude: 28.0250 },
      tags: ["bushveld", "wildlife", "nature-reserve"],
      status: { status: "open", lastUpdated: new Date() },
      createdBy: "sample-user-2"
    }
  ];

  const defaultMockReturn = {
    filteredTrails: mockTrails,
    filters: {
      difficulty: 'all',
      tags: 'all',
      minDistance: 0,
      maxDistance: 20,
      maxLocationDistance: 80
    },
    handleFilterChange: jest.fn(),
    userLocation: null,
    locationError: null,
    isLoadingLocation: false,
    getUserLocation: jest.fn(),
    calculateDistance: jest.fn((lat1, lon1, lat2, lon2) => 5.2)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTrails.mockReturnValue(defaultMockReturn);
  });

  describe('Rendering', () => {
    test('renders the main heading and description', () => {
      render(<TrailExplorerPage />);
      
      expect(screen.getByText('Trail Explorer')).toBeInTheDocument();
      expect(screen.getByText('Find trails near your current location')).toBeInTheDocument();
    });

    test('renders filter toggle button', () => {
      render(<TrailExplorerPage />);
      
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });

    test('renders location button', () => {
      render(<TrailExplorerPage />);
      
      expect(screen.getByText('📍 Find My Location')).toBeInTheDocument();
    });

    test('renders map and trail list components', () => {
      render(<TrailExplorerPage />);
      
      expect(screen.getByTestId('trail-map')).toBeInTheDocument();
      expect(screen.getByTestId('trail-list')).toBeInTheDocument();
    });

    test('displays correct number of trails in map and list', () => {
      render(<TrailExplorerPage />);
      
      expect(screen.getByTestId('map-trails-count')).toHaveTextContent('2 trails');
      expect(screen.getByTestId('list-trails-count')).toHaveTextContent('2 trails');
    });
  });

  describe('Filter Panel Toggle', () => {
    test('shows filter panel when toggle button is clicked', async () => {
      render(<TrailExplorerPage />);
      
      const toggleButton = screen.getByText('Show Filters');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Hide Filters')).toBeInTheDocument();
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    });

    test('hides filter panel when toggle button is clicked again', async () => {
      render(<TrailExplorerPage />);
      
      const toggleButton = screen.getByText('Show Filters');
      fireEvent.click(toggleButton);
      fireEvent.click(screen.getByText('Hide Filters'));
      
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
      expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
    });
  });

  describe('Location Services', () => {
    test('calls getUserLocation on component mount', () => {
      render(<TrailExplorerPage />);
      
      expect(defaultMockReturn.getUserLocation).toHaveBeenCalledTimes(1);
    });

    test('calls getUserLocation when location button is clicked', async () => {
      render(<TrailExplorerPage />);
      
      const locationButton = screen.getByText('📍 Find My Location');
      fireEvent.click(locationButton);
      
      expect(defaultMockReturn.getUserLocation).toHaveBeenCalledTimes(2);
    });

    test('displays loading state when getting location', () => {
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        isLoadingLocation: true
      });
      
      render(<TrailExplorerPage />);
      
      expect(screen.getByText('Locating...')).toBeInTheDocument();
      expect(screen.getByText('Locating...')).toBeDisabled();
    });

    test('displays user location when available', () => {
      const mockLocation = { latitude: -26.2041, longitude: 28.0473 };
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        userLocation: mockLocation
      });
      
      render(<TrailExplorerPage />);
      
      expect(screen.getByText(/Your location: -26.2041, 28.0473/)).toBeInTheDocument();
    });

    test('displays location error when there is an error', () => {
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        locationError: 'Geolocation is not supported by your browser'
      });
      
      render(<TrailExplorerPage />);
      
      expect(screen.getByText('⚠️ Geolocation is not supported by your browser')).toBeInTheDocument();
    });
  });

  describe('Trail Selection', () => {
    test('allows selecting a trail from the map', async () => {
      render(<TrailExplorerPage />);
      
      const selectButton = screen.getByTestId('select-trail-button');
      fireEvent.click(selectButton);
      
      expect(screen.getByTestId('selected-trail')).toHaveTextContent('Melville Koppies Trail');
    });

    test('allows selecting a trail from the list', async () => {
      render(<TrailExplorerPage />);
      
      const firstTrailItem = screen.getByTestId('trail-item-1');
      fireEvent.click(firstTrailItem);
      
      expect(screen.getByTestId('list-selected-trail')).toHaveTextContent('Melville Koppies Trail');
    });

    test('displays selected trail in both map and list', async () => {
      render(<TrailExplorerPage />);
      
      const selectButton = screen.getByTestId('select-trail-button');
      fireEvent.click(selectButton);
      
      expect(screen.getByTestId('selected-trail')).toHaveTextContent('Melville Koppies Trail');
      expect(screen.getByTestId('list-selected-trail')).toHaveTextContent('Melville Koppies Trail');
    });
  });

  describe('Filtering', () => {
    test('displays current filter values in filter panel', () => {
      render(<TrailExplorerPage />);
      
      // Show filters first
      fireEvent.click(screen.getByText('Show Filters'));
      
      expect(screen.getByTestId('current-filters')).toHaveTextContent(
        'Difficulty: all, Tags: all, Max Distance: 20, Max Location Distance: 80'
      );
    });

    test('calls handleFilterChange when filter is applied', async () => {
      render(<TrailExplorerPage />);
      
      // Show filters first
      fireEvent.click(screen.getByText('Show Filters'));
      
      const filterButton = screen.getByTestId('filter-difficulty-easy');
      fireEvent.click(filterButton);
      
      expect(defaultMockReturn.handleFilterChange).toHaveBeenCalledWith('difficulty', 'Easy');
    });

    test('updates trail list when filters change', () => {
      const filteredTrails = [mockTrails[0]]; // Only one trail after filtering
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        filteredTrails
      });
      
      render(<TrailExplorerPage />);
      
      expect(screen.getByTestId('map-trails-count')).toHaveTextContent('1 trails');
      expect(screen.getByTestId('list-trails-count')).toHaveTextContent('1 trails');
    });
  });

  describe('Empty States', () => {
    test('handles empty trail list gracefully', () => {
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        filteredTrails: []
      });
      
      render(<TrailExplorerPage />);
      
      expect(screen.getByTestId('map-trails-count')).toHaveTextContent('0 trails');
      expect(screen.getByTestId('list-trails-count')).toHaveTextContent('0 trails');
    });
  });

  describe('Component Integration', () => {
    test('passes correct props to TrailMap component', () => {
      const mockLocation = { latitude: -26.2041, longitude: 28.0473 };
      const selectedTrail = mockTrails[0];
      
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        userLocation: mockLocation,
        filteredTrails: mockTrails
      });
      
      render(<TrailExplorerPage />);
      
      // Select a trail
      fireEvent.click(screen.getByTestId('select-trail-button'));
      
      expect(screen.getByTestId('user-location')).toHaveTextContent('-26.2041, 28.0473');
      expect(screen.getByTestId('selected-trail')).toHaveTextContent('Melville Koppies Trail');
    });

    test('passes correct props to TrailList component', () => {
      const mockLocation = { latitude: -26.2041, longitude: 28.0473 };
      
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        userLocation: mockLocation,
        filteredTrails: mockTrails
      });
      
      render(<TrailExplorerPage />);
      
      expect(screen.getByTestId('list-user-location')).toHaveTextContent('Max distance: 80km');
    });

    test('passes correct props to FilterPanel component', () => {
      render(<TrailExplorerPage />);
      
      // Show filters first
      fireEvent.click(screen.getByText('Show Filters'));
      
      expect(screen.getByTestId('current-filters')).toHaveTextContent(
        'Difficulty: all, Tags: all, Max Distance: 20, Max Location Distance: 80'
      );
    });
  });

  describe('Accessibility', () => {
    test('has proper button labels and states', () => {
      render(<TrailExplorerPage />);
      
      const filterButton = screen.getByText('Show Filters');
      const locationButton = screen.getByText('📍 Find My Location');
      
      expect(filterButton).toBeInTheDocument();
      expect(locationButton).toBeInTheDocument();
    });

    test('location button is disabled when loading', () => {
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        isLoadingLocation: true
      });
      
      render(<TrailExplorerPage />);
      
      const locationButton = screen.getByText('Locating...');
      expect(locationButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('displays location error message', () => {
      mockUseTrails.mockReturnValue({
        ...defaultMockReturn,
        locationError: 'Unable to retrieve your location'
      });
      
      render(<TrailExplorerPage />);
      
      expect(screen.getByText('⚠️ Unable to retrieve your location')).toBeInTheDocument();
    });

    test('handles missing geolocation gracefully', () => {
      // Mock navigator.geolocation as undefined
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });
      
      render(<TrailExplorerPage />);
      
      // The component should still render without crashing
      expect(screen.getByText('Trail Explorer')).toBeInTheDocument();
    });
  });
});
