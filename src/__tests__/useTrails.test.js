import { renderHook, act } from '@testing-library/react';
import useTrails from '../components/hooks/useTrails';


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

describe('useTrails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('returns initial state with default values', () => {
      const { result } = renderHook(() => useTrails());

      expect(result.current.filters).toEqual({
        difficulty: 'all',
        tags: 'all',
        minDistance: 0,
        maxDistance: 20,
        maxLocationDistance: 80
      });
      expect(result.current.userLocation).toBeNull();
      expect(result.current.locationError).toBeNull();
      expect(result.current.isLoadingLocation).toBe(false);
      expect(result.current.filteredTrails).toHaveLength(6); // Default sample trails
    });
  });

  describe('Filtering', () => {
    test('filters trails by difficulty', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('difficulty', 'Easy');
      });

      expect(result.current.filters.difficulty).toBe('Easy');
      expect(result.current.filteredTrails).toHaveLength(2); // Only Easy trails
      expect(result.current.filteredTrails.every(trail => trail.difficulty === 'Easy')).toBe(true);
    });

    test('filters trails by tags', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('tags', 'waterfall');
      });

      expect(result.current.filters.tags).toBe('waterfall');
      expect(result.current.filteredTrails).toHaveLength(1); // Only waterfall trail
      expect(result.current.filteredTrails[0].name).toBe('Walter Sisulu Waterfall Trail');
    });

    test('combines multiple filters', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('difficulty', 'Easy');
        result.current.handleFilterChange('maxDistance', 5);
      });

      expect(result.current.filteredTrails).toHaveLength(2); // Easy trails with distance <= 5km
      expect(result.current.filteredTrails.every(trail => 
        trail.difficulty === 'Easy' && trail.distance <= 5
      )).toBe(true);
    });

    test('resets to all trails when filters are cleared', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('difficulty', 'Easy');
      });

      expect(result.current.filteredTrails).toHaveLength(2);

      act(() => {
        result.current.handleFilterChange('difficulty', 'all');
      });

      expect(result.current.filteredTrails).toHaveLength(6);
    });
  });

  describe('Location Services', () => {
    test('calls geolocation API when getUserLocation is called', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.getUserLocation();
      });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });

    test('sets loading state when getting location', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.getUserLocation();
      });

      expect(result.current.isLoadingLocation).toBe(true);
    });

    test('sets user location on successful geolocation', async () => {
      const mockPosition = {
        coords: {
          latitude: -26.2041,
          longitude: 28.0473
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useTrails());

      await act(async () => {
        result.current.getUserLocation();
      });

      expect(result.current.userLocation).toEqual({
        latitude: -26.2041,
        longitude: 28.0473
      });
      expect(result.current.isLoadingLocation).toBe(false);
      expect(result.current.locationError).toBeNull();
    });

    test('sets error on geolocation failure', async () => {
      const mockError = new Error('User denied geolocation');

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useTrails());

      await act(async () => {
        result.current.getUserLocation();
      });

      expect(result.current.locationError).toBe('Unable to retrieve your location: User denied geolocation');
      expect(result.current.isLoadingLocation).toBe(false);
      expect(result.current.userLocation).toBeNull();
    });

    test('handles geolocation not supported', () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.getUserLocation();
      });

      expect(result.current.locationError).toBe('Geolocation is not supported by your browser');
      expect(result.current.isLoadingLocation).toBe(false);
    });
  });

  describe('Distance Filtering', () => {
    test('filters trails by distance when user location is available', () => {
      const { result } = renderHook(() => useTrails());

      // Set user location
      act(() => {
        const mockPosition = {
          coords: {
            latitude: -26.2041,
            longitude: 28.0473
          }
        };
        mockGeolocation.getCurrentPosition.mockImplementation((success) => {
          success(mockPosition);
        });
        result.current.getUserLocation();
      });

      // Set max location distance
      act(() => {
        result.current.handleFilterChange('maxLocationDistance', 10);
      });

      // Should filter trails based on distance from user location
      expect(result.current.filteredTrails.length).toBeLessThanOrEqual(6);
    });

    test('does not filter by distance when user location is not available', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('maxLocationDistance', 10);
      });

      // Should show all trails when no user location
      expect(result.current.filteredTrails).toHaveLength(6);
    });

    test('shows all trails when maxLocationDistance is 0', () => {
      const { result } = renderHook(() => useTrails());

      // Set user location
      act(() => {
        const mockPosition = {
          coords: {
            latitude: -26.2041,
            longitude: 28.0473
          }
        };
        mockGeolocation.getCurrentPosition.mockImplementation((success) => {
          success(mockPosition);
        });
        result.current.getUserLocation();
      });

      // Set max location distance to 0
      act(() => {
        result.current.handleFilterChange('maxLocationDistance', 0);
      });

      // Should show all trails
      expect(result.current.filteredTrails).toHaveLength(6);
    });
  });

  describe('Distance Calculation', () => {
    test('calculates distance between two points correctly', () => {
      const { result } = renderHook(() => useTrails());

      const distance = result.current.calculateDistance(
        -26.2041, 28.0473, // Johannesburg
        -26.1755, 27.9715  // Melville Koppies
      );

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(100); // Should be reasonable distance
    });

    test('returns 0 distance for same coordinates', () => {
      const { result } = renderHook(() => useTrails());

      const distance = result.current.calculateDistance(
        -26.2041, 28.0473,
        -26.2041, 28.0473
      );

      expect(distance).toBe(0);
    });
  });

  describe('Filter State Management', () => {
    test('updates filter state correctly', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('difficulty', 'Hard');
        result.current.handleFilterChange('tags', 'wildlife');
        result.current.handleFilterChange('maxDistance', 15);
      });

      expect(result.current.filters).toEqual({
        difficulty: 'Hard',
        tags: 'wildlife',
        minDistance: 0,
        maxDistance: 15,
        maxLocationDistance: 80
      });
    });

    test('preserves other filters when updating one filter', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('difficulty', 'Easy');
        result.current.handleFilterChange('maxDistance', 10);
      });

      act(() => {
        result.current.handleFilterChange('tags', 'forest');
      });

      expect(result.current.filters.difficulty).toBe('Easy');
      expect(result.current.filters.maxDistance).toBe(10);
      expect(result.current.filters.tags).toBe('forest');
    });
  });

  describe('Memoization', () => {
    test('memoizes filtered trails to prevent unnecessary recalculations', () => {
      const { result, rerender } = renderHook(() => useTrails());

      const initialTrails = result.current.filteredTrails;

      // Rerender without changing filters
      rerender();

      expect(result.current.filteredTrails).toBe(initialTrails);
    });

    test('recalculates filtered trails when filters change', () => {
      const { result } = renderHook(() => useTrails());

      const initialTrails = result.current.filteredTrails;

      act(() => {
        result.current.handleFilterChange('difficulty', 'Easy');
      });

      expect(result.current.filteredTrails).not.toBe(initialTrails);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty trail list gracefully', () => {
      // This would require mocking the sampleTrails array
      // For now, we test with the default sample data
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('difficulty', 'NonExistent');
      });

      expect(result.current.filteredTrails).toHaveLength(0);
    });

    test('handles case-insensitive tag filtering', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('tags', 'WATERFALL');
      });

      expect(result.current.filteredTrails).toHaveLength(1);
      expect(result.current.filteredTrails[0].name).toBe('Walter Sisulu Waterfall Trail');
    });

    test('handles partial tag matching', () => {
      const { result } = renderHook(() => useTrails());

      act(() => {
        result.current.handleFilterChange('tags', 'forest');
      });

      expect(result.current.filteredTrails).toHaveLength(1);
      expect(result.current.filteredTrails[0].tags).toContain('forest');
    });
  });
});
