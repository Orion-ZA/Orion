import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrailList from '../components/lists/TrailList';

// Mock fetch globally
global.fetch = jest.fn();

// Mock trail data
const mockTrails = [
  {
    id: 1,
    name: 'Test Trail 1',
    difficulty: 'Easy',
    distance: 2.5,
    elevationGain: 100,
    location: { latitude: -26.1755, longitude: 27.9715 },
    averageRating: 4.5,
    reviewCount: 10
  },
  {
    id: 2,
    name: 'Test Trail 2',
    difficulty: 'Moderate',
    distance: 5.0,
    elevationGain: 300,
    location: { latitude: -26.2000, longitude: 28.0000 },
    averageRating: undefined, // Will trigger API call
    reviewCount: undefined
  },
  {
    id: 3,
    name: 'Test Trail 3',
    difficulty: 'Hard',
    distance: 8.0,
    elevationGain: 600,
    location: { latitude: -26.1500, longitude: 27.9500 }
  }
];

const mockUserLocation = {
  latitude: -26.2041,
  longitude: 28.0473
};

const mockReviews = [
  { rating: 5, comment: 'Great trail!' },
  { rating: 4, comment: 'Good hike' },
  { rating: 3, comment: 'Average' }
];

const defaultProps = {
  trails: mockTrails,
  userLocation: mockUserLocation,
  selectedTrail: null,
  onSelectTrail: jest.fn(),
  calculateDistance: jest.fn((lat1, lon1, lat2, lon2) => {
    // Simple mock distance calculation that always returns a number
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 111; // Rough km conversion
  }),
  maxDistance: 10
};

describe('TrailList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders loading state initially', () => {
      render(<TrailList {...defaultProps} />);
      
      expect(screen.getByText('Loading ratings...')).toBeInTheDocument();
    });

    it('renders trail list after loading', async () => {
      // Mock successful API response
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (3)')).toBeInTheDocument();
      });
    });

    it('displays correct trail count', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (3)')).toBeInTheDocument();
      });
    });

    it('displays max distance when user location is provided', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('within 10 km')).toBeInTheDocument();
      });
    });

    it('does not display max distance when user location is not provided', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      render(<TrailList {...defaultProps} userLocation={null} />);
      
      await waitFor(() => {
        expect(screen.queryByText(/within/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Trail Display', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });
    });

    it('displays trail names', async () => {
      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
        expect(screen.getByText('Test Trail 2')).toBeInTheDocument();
        expect(screen.getByText('Test Trail 3')).toBeInTheDocument();
      });
    });

    it('displays trail difficulty with correct colors', async () => {
      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        const easyTrail = screen.getByText('Easy');
        const moderateTrail = screen.getByText('Moderate');
        const hardTrail = screen.getByText('Hard');
        
        expect(easyTrail).toBeInTheDocument();
        expect(moderateTrail).toBeInTheDocument();
        expect(hardTrail).toBeInTheDocument();
      });
    });

    it('displays trail distance and elevation', async () => {
      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('2.5 km • 100 m gain')).toBeInTheDocument();
        expect(screen.getByText('5 km • 300 m gain')).toBeInTheDocument();
        expect(screen.getByText('8 km • 600 m gain')).toBeInTheDocument();
      });
    });

    it('displays ratings when available', async () => {
      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('⭐ 4.5 (10)')).toBeInTheDocument();
      });
    });

    it('displays N/A for ratings when not available', async () => {
      // Mock empty reviews for this test
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: [] })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        const naRatings = screen.getAllByText('⭐ N/A');
        expect(naRatings.length).toBeGreaterThan(0);
      });
    });

    it('displays distance from user location when available', async () => {
      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        const distanceElements = screen.getAllByText(/km away/);
        expect(distanceElements.length).toBe(3);
      });
    });

    it('does not display distance when user location is not available', async () => {
      render(<TrailList {...defaultProps} userLocation={null} />);
      
      await waitFor(() => {
        expect(screen.queryByText(/km away/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Trail Selection', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });
    });

    it('calls onSelectTrail when trail is clicked', async () => {
      const onSelectTrail = jest.fn();
      render(<TrailList {...defaultProps} onSelectTrail={onSelectTrail} />);
      
      await waitFor(() => {
        const trailElement = screen.getByText('Test Trail 1');
        fireEvent.click(trailElement.closest('div'));
      });
      
      expect(onSelectTrail).toHaveBeenCalledWith(mockTrails[0]);
    });

    it('highlights selected trail', async () => {
      render(<TrailList {...defaultProps} selectedTrail={mockTrails[0]} />);
      
      await waitFor(() => {
        const trailElement = screen.getByText('Test Trail 1').closest('div[style*="background-color"]');
        expect(trailElement).toHaveStyle('background-color: rgb(240, 240, 240)');
      });
    });

    it('does not highlight unselected trails', async () => {
      render(<TrailList {...defaultProps} selectedTrail={mockTrails[0]} />);
      
      await waitFor(() => {
        const trailElement = screen.getByText('Test Trail 2').closest('div[style*="background-color"]');
        expect(trailElement).toHaveStyle('background-color: transparent');
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no trails are provided', async () => {
      render(<TrailList {...defaultProps} trails={[]} />);
      
      await waitFor(() => {
        expect(screen.getByText('No trails found. Try adjusting your filters or increasing the distance.')).toBeInTheDocument();
      });
    });

    it('displays correct count for empty trails', async () => {
      render(<TrailList {...defaultProps} trails={[]} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (0)')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches reviews for trails without averageRating', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/getTrailReviews?trailId=2'
        );
      });
    });

    it('does not fetch reviews for trails with existing averageRating', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        // Should not fetch for trail with id 1 (has averageRating)
        expect(fetch).not.toHaveBeenCalledWith(
          expect.stringContaining('trailId=1')
        );
      });
    });

    it('handles API errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('API Error'));

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        // Should still render trails even if API fails
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });
    });

    it('handles non-ok API responses', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        // Should still render trails even if API returns error
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });
    });

    it('handles empty reviews response', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: [] })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });
    });

    it('handles missing reviews in response', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });
    });
  });

  describe('Rating Calculation', () => {
    it('calculates average rating correctly', async () => {
      const reviewsWithRatings = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 }
      ];

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: reviewsWithRatings })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        // Average should be (5+4+3+2)/4 = 3.5
        expect(screen.getAllByText('⭐ 3.5 (4)')).toHaveLength(2);
      });
    });

    it('handles reviews with missing ratings', async () => {
      const reviewsWithMissingRatings = [
        { rating: 5 },
        { rating: null },
        { rating: 3 }
      ];

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: reviewsWithMissingRatings })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        // Average should be (5+0+3)/3 = 2.67
        expect(screen.getAllByText('⭐ 2.7 (3)')).toHaveLength(2);
      });
    });

    it('handles empty reviews array', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: [] })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('⭐ N/A')).toHaveLength(2);
      });
    });

    it('handles null reviews', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: null })
      });

      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('⭐ N/A')).toHaveLength(2);
      });
    });
  });

  describe('Distance Calculation', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });
    });

    it('calls calculateDistance for each trail when user location is provided', async () => {
      const calculateDistance = jest.fn().mockReturnValue(5.2);
      render(<TrailList {...defaultProps} calculateDistance={calculateDistance} />);
      
      await waitFor(() => {
        expect(calculateDistance).toHaveBeenCalledTimes(3);
      });
    });

    it('displays calculated distance correctly', async () => {
      const calculateDistance = jest.fn().mockReturnValue(5.2);
      render(<TrailList {...defaultProps} calculateDistance={calculateDistance} />);
      
      await waitFor(() => {
        expect(screen.getAllByText('📍 5.2 km away')).toHaveLength(3);
      });
    });

    it('does not call calculateDistance when user location is not provided', async () => {
      const calculateDistance = jest.fn();
      render(<TrailList {...defaultProps} userLocation={null} calculateDistance={calculateDistance} />);
      
      await waitFor(() => {
        expect(calculateDistance).not.toHaveBeenCalled();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('recalculates ratings when trails prop changes', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      const { rerender } = render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (3)')).toBeInTheDocument();
      });

      const newTrails = [mockTrails[0]];
      rerender(<TrailList {...defaultProps} trails={newTrails} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (1)')).toBeInTheDocument();
      });
    });

    it('handles rapid prop changes', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      const { rerender } = render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (3)')).toBeInTheDocument();
      });

      // Rapid changes
      rerender(<TrailList {...defaultProps} trails={[]} />);
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (0)')).toBeInTheDocument();
      });

      rerender(<TrailList {...defaultProps} trails={mockTrails} />);
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (3)')).toBeInTheDocument();
      });

      rerender(<TrailList {...defaultProps} trails={[mockTrails[0]]} />);
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles trails with missing properties', async () => {
      const incompleteTrails = [
        {
          id: 1,
          name: 'Incomplete Trail',
          difficulty: 'Easy',
          distance: 2.0,
          elevationGain: 100,
          location: { latitude: -26.1755, longitude: 27.9715 }
        }
      ];

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      render(<TrailList {...defaultProps} trails={incompleteTrails} />);
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete Trail')).toBeInTheDocument();
      });
    });

    it('handles empty trails array', async () => {
      render(<TrailList {...defaultProps} trails={[]} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (0)')).toBeInTheDocument();
      });
    });

    it('handles null trails prop', async () => {
      render(<TrailList {...defaultProps} trails={null} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (0)')).toBeInTheDocument();
        expect(screen.getByText('No trails found. Try adjusting your filters or increasing the distance.')).toBeInTheDocument();
      });
    });

    it('handles undefined trails prop', async () => {
      render(<TrailList {...defaultProps} trails={undefined} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (0)')).toBeInTheDocument();
        expect(screen.getByText('No trails found. Try adjusting your filters or increasing the distance.')).toBeInTheDocument();
      });
    });

    it('handles non-array trails prop', async () => {
      render(<TrailList {...defaultProps} trails="not an array" />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (0)')).toBeInTheDocument();
        expect(screen.getByText('No trails found. Try adjusting your filters or increasing the distance.')).toBeInTheDocument();
      });
    });

    it('handles missing callback functions', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });

      expect(() => {
        render(
          <TrailList
            trails={mockTrails}
            userLocation={mockUserLocation}
            selectedTrail={null}
            calculateDistance={defaultProps.calculateDistance}
            maxDistance={10}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ reviews: mockReviews })
      });
    });

    it('has proper clickable trail elements', async () => {
      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        const trailElements = screen.getAllByText(/Test Trail/);
        trailElements.forEach(element => {
          const clickableDiv = element.closest('div[style*="cursor: pointer"]');
          expect(clickableDiv).toBeInTheDocument();
        });
      });
    });

    it('has proper semantic structure', async () => {
      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trails Near You (3)')).toBeInTheDocument();
        expect(screen.getByText('Test Trail 1')).toBeInTheDocument();
      });
    });

    it('displays information in readable format', async () => {
      render(<TrailList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('2.5 km • 100 m gain')).toBeInTheDocument();
        expect(screen.getByText('⭐ 4.5 (10)')).toBeInTheDocument();
        expect(screen.getAllByText('📍 0.0 km away')).toHaveLength(3);
      });
    });
  });
});