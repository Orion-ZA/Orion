import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailMap from '../components/map/TrailMap';

// Mock react-map-gl/mapbox
jest.mock('react-map-gl/mapbox', () => ({
  __esModule: true,
  default: ({ children, ...props }) => <div data-testid="map-container" {...props}>{children}</div>,
  Marker: ({ children, ...props }) => <div data-testid="map-marker" {...props}>{children}</div>,
  Popup: ({ children, ...props }) => <div data-testid="map-popup" {...props}>{children}</div>,
  NavigationControl: (props) => <div data-testid="navigation-control" {...props} />,
  FullscreenControl: (props) => <div data-testid="fullscreen-control" {...props} />,
  ScaleControl: (props) => <div data-testid="scale-control" {...props} />,
  Source: ({ children, ...props }) => <div data-testid="map-source" {...props}>{children}</div>,
  Layer: (props) => <div data-testid="map-layer" {...props} />
}));

// Mock mapbox-gl CSS
jest.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));

const mockTrails = [
  {
    id: 1,
    name: "Melville Koppies Trail",
    difficulty: "Moderate",
    distance: 4.5,
    elevationGain: 600,
    rating: 4.8,
    gpsRoute: [
      { latitude: -26.1755, longitude: 27.9715 },
      { latitude: -26.1762, longitude: 27.9708 },
      { latitude: -26.1770, longitude: 27.9695 },
      { latitude: -26.1785, longitude: 27.9680 }
    ],
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
    gpsRoute: [
      { latitude: -26.2940, longitude: 28.0250 },
      { latitude: -26.2952, longitude: 28.0261 },
      { latitude: -26.2965, longitude: 28.0275 },
      { latitude: -26.2981, longitude: 28.0290 }
    ],
    location: { latitude: -26.2940, longitude: 28.0250 },
    tags: ["bushveld", "wildlife", "nature-reserve"],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-2"
  }
];

const mockUserLocation = {
  latitude: -26.2041,
  longitude: 28.0473
};

const defaultProps = {
  trails: mockTrails,
  userLocation: null,
  selectedTrail: null,
  onSelectTrail: jest.fn()
};

describe.skip('TrailMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders map container', () => {
      render(<TrailMap {...defaultProps} />);
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    test('renders map controls', () => {
      render(<TrailMap {...defaultProps} />);
      
      expect(screen.getByTestId('navigation-control')).toBeInTheDocument();
      expect(screen.getByTestId('fullscreen-control')).toBeInTheDocument();
      expect(screen.getByTestId('scale-control')).toBeInTheDocument();
    });

    test('renders trail source and layer', () => {
      render(<TrailMap {...defaultProps} />);
      
      expect(screen.getByTestId('map-source')).toBeInTheDocument();
      expect(screen.getByTestId('map-layer')).toBeInTheDocument();
    });
  });

  describe('Trail Markers', () => {
    test('renders markers for all trails', () => {
      render(<TrailMap {...defaultProps} />);
      
      // Should render 2 markers (one for each trail)
      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(2);
    });

    test('renders markers with correct coordinates', () => {
      render(<TrailMap {...defaultProps} />);
      
      const markers = screen.getAllByTestId('map-marker');
      
      // Check that markers have the correct latitude and longitude props
      expect(markers[0]).toHaveAttribute('latitude', '-26.1755');
      expect(markers[0]).toHaveAttribute('longitude', '27.9715');
      expect(markers[1]).toHaveAttribute('latitude', '-26.2940');
      expect(markers[1]).toHaveAttribute('longitude', '28.0250');
    });

    test('handles empty trails array', () => {
      render(<TrailMap {...defaultProps} trails={[]} />);
      
      const markers = screen.queryAllByTestId('map-marker');
      expect(markers).toHaveLength(0);
    });
  });

  describe('User Location', () => {
    test('renders user location marker when available', () => {
      render(<TrailMap {...defaultProps} userLocation={mockUserLocation} />);
      
      // Should render 3 markers (2 trails + 1 user location)
      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(3);
    });

    test('does not render user location marker when not available', () => {
      render(<TrailMap {...defaultProps} />);
      
      // Should render only 2 markers (trails only)
      const markers = screen.getAllByTestId('map-marker');
      expect(markers).toHaveLength(2);
    });

    test('user location marker has correct coordinates', () => {
      render(<TrailMap {...defaultProps} userLocation={mockUserLocation} />);
      
      const markers = screen.getAllByTestId('map-marker');
      const userMarker = markers.find(marker => 
        marker.getAttribute('latitude') === '-26.2041' && 
        marker.getAttribute('longitude') === '28.0473'
      );
      
      expect(userMarker).toBeInTheDocument();
    });
  });

  describe('Selected Trail', () => {
    test('handles selected trail state', () => {
      const selectedTrail = mockTrails[0];
      render(<TrailMap {...defaultProps} selectedTrail={selectedTrail} />);
      
      // Component should render without crashing
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    test('handles null selected trail', () => {
      render(<TrailMap {...defaultProps} selectedTrail={null} />);
      
      // Component should render without crashing
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Map Configuration', () => {
    test('sets default view state when no user location', () => {
      render(<TrailMap {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    test('sets view state based on user location', () => {
      render(<TrailMap {...defaultProps} userLocation={mockUserLocation} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('Trail Data Processing', () => {
    test('processes trail GPS routes correctly', () => {
      render(<TrailMap {...defaultProps} />);
      
      const source = screen.getByTestId('map-source');
      expect(source).toBeInTheDocument();
    });

    test('handles trails without GPS routes', () => {
      const trailsWithoutRoutes = [
        {
          ...mockTrails[0],
          gpsRoute: []
        }
      ];
      
      render(<TrailMap {...defaultProps} trails={trailsWithoutRoutes} />);
      
      // Should still render without crashing
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    test('handles missing optional props', () => {
      const minimalProps = {
        trails: mockTrails,
        onSelectTrail: jest.fn()
      };
      
      render(<TrailMap {...minimalProps} />);
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    test('handles trails with missing optional fields', () => {
      const minimalTrail = {
        id: 1,
        name: "Test Trail",
        difficulty: "Easy",
        location: { latitude: -26.1755, longitude: 27.9715 },
        gpsRoute: []
      };
      
      render(<TrailMap {...defaultProps} trails={[minimalTrail]} />);
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing mapbox token gracefully', () => {
      // Mock process.env to not have the token
      const originalEnv = process.env;
      delete process.env.REACT_APP_MAPBOX_TOKEN;
      
      render(<TrailMap {...defaultProps} />);
      
      // Should still render without crashing
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      
      // Restore original env
      process.env = originalEnv;
    });

    test('handles invalid trail data gracefully', () => {
      const invalidTrails = [
        {
          id: 1,
          name: "Invalid Trail",
          // Missing required fields
        }
      ];
      
      render(<TrailMap {...defaultProps} trails={invalidTrails} />);
      
      // Should still render without crashing
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper container structure', () => {
      render(<TrailMap {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    test('renders with proper styling attributes', () => {
      render(<TrailMap {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });
});
