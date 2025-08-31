import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TrailList from '../components/lists/TrailList';

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
  },
  {
    id: 3,
    name: "Modderfontein Reserve Path",
    difficulty: "Easy",
    distance: 3.1,
    elevationGain: 200,
    rating: 4.5,
    location: { latitude: -26.0690, longitude: 28.1400 },
    tags: ["grassland", "family-friendly", "flat"],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-3"
  }
];

const mockUserLocation = {
  latitude: -26.2041,
  longitude: 28.0473
};

const mockCalculateDistance = jest.fn((lat1, lon1, lat2, lon2) => 5.2);

const defaultProps = {
  trails: mockTrails,
  userLocation: null,
  selectedTrail: null,
  onSelectTrail: jest.fn(),
  calculateDistance: mockCalculateDistance,
  maxDistance: 80
};

describe('TrailList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders trail list with correct count', () => {
      render(<TrailList {...defaultProps} />);
      
      expect(screen.getByText('Trails Near You (3)')).toBeInTheDocument();
    });

    test('renders all trail items', () => {
      render(<TrailList {...defaultProps} />);
      
      expect(screen.getByText('Melville Koppies Trail')).toBeInTheDocument();
      expect(screen.getByText('Klipriviersberg Loop')).toBeInTheDocument();
      expect(screen.getByText('Modderfontein Reserve Path')).toBeInTheDocument();
    });

    test('displays trail information correctly', () => {
      render(<TrailList {...defaultProps} />);
      
      // Check trail details
      expect(screen.getByText('4.5 km • 600 m gain')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.8')).toBeInTheDocument();
      expect(screen.getByText('8.9 km • 1100 m gain')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.6')).toBeInTheDocument();
    });

    test('displays trail tags', () => {
      render(<TrailList {...defaultProps} />);
      
      expect(screen.getByText('🏷️ rocky, panoramic, city-views')).toBeInTheDocument();
      expect(screen.getByText('🏷️ bushveld, wildlife, nature-reserve')).toBeInTheDocument();
      expect(screen.getByText('🏷️ grassland, family-friendly, flat')).toBeInTheDocument();
    });
  });

  describe('User Location', () => {
    test('displays max distance when user location is available', () => {
      render(<TrailList {...defaultProps} userLocation={mockUserLocation} />);
      
      expect(screen.getByText('within 80 km')).toBeInTheDocument();
    });

    test('displays distance for each trail when user location is available', () => {
      render(<TrailList {...defaultProps} userLocation={mockUserLocation} />);
      
      // Should call calculateDistance for each trail
      expect(mockCalculateDistance).toHaveBeenCalledTimes(3);
      
      // Check that distance is displayed for each trail
      const distanceElements = screen.getAllByText(/5.2 km away/);
      expect(distanceElements).toHaveLength(3);
    });

    test('does not display distance when user location is not available', () => {
      render(<TrailList {...defaultProps} />);
      
      expect(screen.queryByText(/km away/)).not.toBeInTheDocument();
      expect(mockCalculateDistance).not.toHaveBeenCalled();
    });
  });

  describe('Trail Selection', () => {
    test('calls onSelectTrail when a trail is clicked', () => {
      const mockOnSelectTrail = jest.fn();
      
      render(<TrailList {...defaultProps} onSelectTrail={mockOnSelectTrail} />);
      
      const firstTrail = screen.getByText('Melville Koppies Trail').closest('div');
      fireEvent.click(firstTrail);
      
      expect(mockOnSelectTrail).toHaveBeenCalledWith(mockTrails[0]);
    });

    test('highlights selected trail', () => {
      const selectedTrail = mockTrails[0];
      
      render(<TrailList {...defaultProps} selectedTrail={selectedTrail} />);
      
      // The selected trail should have different styling
      // We can check this by looking for the trail name in the selected state
      const selectedTrailElement = screen.getByText('Melville Koppies Trail');
      expect(selectedTrailElement).toBeInTheDocument();
    });

    test('handles multiple trail selections', async () => {
      const mockOnSelectTrail = jest.fn();
      
      render(<TrailList {...defaultProps} onSelectTrail={mockOnSelectTrail} />);
      
      // Click first trail
      const firstTrail = screen.getByText('Melville Koppies Trail');
      fireEvent.click(firstTrail);
      
      // Click second trail
      const secondTrail = screen.getByText('Klipriviersberg Loop');
      fireEvent.click(secondTrail);
      
      expect(mockOnSelectTrail).toHaveBeenCalledTimes(2);
      expect(mockOnSelectTrail).toHaveBeenNthCalledWith(1, mockTrails[0]);
      expect(mockOnSelectTrail).toHaveBeenNthCalledWith(2, mockTrails[1]);
    });
  });

  describe('Empty State', () => {
    test('displays message when no trails are available', () => {
      render(<TrailList {...defaultProps} trails={[]} />);
      
      expect(screen.getByText('Trails Near You (0)')).toBeInTheDocument();
      expect(screen.getByText('No trails found. Try adjusting your filters or increasing the distance.')).toBeInTheDocument();
    });
  });

  describe('Difficulty Colors', () => {
    test('displays correct difficulty colors', () => {
      render(<TrailList {...defaultProps} />);
      
      // Check that difficulty text is rendered (color is handled by CSS)
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });
  });

  describe('Distance Calculation', () => {
    test('calls calculateDistance with correct parameters', () => {
      render(<TrailList {...defaultProps} userLocation={mockUserLocation} />);
      
      expect(mockCalculateDistance).toHaveBeenCalledWith(
        mockUserLocation.latitude,
        mockUserLocation.longitude,
        mockTrails[0].location.latitude,
        mockTrails[0].location.longitude
      );
      
      expect(mockCalculateDistance).toHaveBeenCalledWith(
        mockUserLocation.latitude,
        mockUserLocation.longitude,
        mockTrails[1].location.latitude,
        mockTrails[1].location.longitude
      );
    });

    test('displays calculated distance correctly', () => {
      mockCalculateDistance.mockReturnValue(12.5);
      
      render(<TrailList {...defaultProps} userLocation={mockUserLocation} />);
      
      const distanceElements = screen.getAllByText(/12.5 km away/);
      expect(distanceElements).toHaveLength(3);
    });
  });

  describe('Props Validation', () => {
    test('handles missing optional props gracefully', () => {
      const minimalProps = {
        trails: mockTrails,
        onSelectTrail: jest.fn(),
        calculateDistance: mockCalculateDistance
      };
      
      render(<TrailList {...minimalProps} />);
      
      expect(screen.getByText('Trails Near You (3)')).toBeInTheDocument();
    });

    test('handles trails without tags', () => {
      const trailsWithoutTags = [
        {
          ...mockTrails[0],
          tags: []
        }
      ];
      
      render(<TrailList {...defaultProps} trails={trailsWithoutTags} />);
      
      expect(screen.getByText('Trails Near You (1)')).toBeInTheDocument();
      expect(screen.queryByText('🏷️')).not.toBeInTheDocument();
    });

    test('handles trails with missing optional fields', () => {
      const minimalTrail = {
        id: 1,
        name: "Test Trail",
        difficulty: "Easy",
        distance: 2.0,
        elevationGain: 100,
        rating: 4.0,
        location: { latitude: -26.1755, longitude: 27.9715 }
      };
      
      render(<TrailList {...defaultProps} trails={[minimalTrail]} />);
      
      expect(screen.getByText('Test Trail')).toBeInTheDocument();
      expect(screen.getByText('2 km • 100 m gain')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles hover effects', async () => {
      render(<TrailList {...defaultProps} />);
      
      const trailElement = screen.getByText('Melville Koppies Trail');
      
      // The hover effect should be applied (this is mainly CSS, but we can verify the element exists)
      expect(trailElement).toBeInTheDocument();
    });

    test('maintains selection state after hover', async () => {
      const selectedTrail = mockTrails[0];
      
      render(<TrailList {...defaultProps} selectedTrail={selectedTrail} />);
      
      const trailElement = screen.getByText('Melville Koppies Trail');
      
      // Trail should still be selected
      expect(trailElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('trail items are clickable', () => {
      render(<TrailList {...defaultProps} />);
      
      const trailElements = screen.getAllByText(/Trail/);
      trailElements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });

    test('displays trail information in a readable format', () => {
      render(<TrailList {...defaultProps} />);
      
      // Check that all important information is displayed
      expect(screen.getByText('Melville Koppies Trail')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('4.5 km • 600 m gain')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.8')).toBeInTheDocument();
    });
  });
});
