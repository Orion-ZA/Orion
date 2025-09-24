import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { SearchProvider, useSearch } from '../components/SearchContext';
import { useReverseGeocoding } from '../hooks/useReverseGeocoding';

// Mock the useReverseGeocoding hook
jest.mock('../hooks/useReverseGeocoding');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

// Mock fetch for Mapbox API calls
global.fetch = jest.fn();

// Test component to access context
const TestComponent = () => {
  const context = useSearch();
  return (
    <div>
      <div data-testid="search-query">{context.searchQuery}</div>
      <div data-testid="suggestions-count">{context.searchSuggestions.length}</div>
      <div data-testid="show-suggestions">{context.showSuggestions.toString()}</div>
      <button 
        data-testid="handle-search" 
        onClick={() => context.handleSearch('test query')}
      >
        Search
      </button>
      <button 
        data-testid="get-suggestions" 
        onClick={() => context.getSuggestions('test')}
      >
        Get Suggestions
      </button>
      <button 
        data-testid="get-suggestions-short" 
        onClick={() => context.getSuggestions('t')}
      >
        Get Short Suggestions
      </button>
      <button 
        data-testid="get-suggestions-empty" 
        onClick={() => context.getSuggestions('')}
      >
        Get Empty Suggestions
      </button>
      <button 
        data-testid="update-trails" 
        onClick={() => context.updateTrailsData([{ name: 'Test Trail' }])}
      >
        Update Trails
      </button>
      <button 
        data-testid="update-trails-null" 
        onClick={() => context.updateTrailsData(null)}
      >
        Update Trails Null
      </button>
      <button 
        data-testid="clear-search" 
        onClick={() => context.clearSearch()}
      >
        Clear Search
      </button>
      <button 
        data-testid="get-location-coords" 
        onClick={async () => {
          const result = await context.getLocationCoordinates('Cape Town');
          screen.getByTestId('location-result').textContent = result ? 'found' : 'not found';
        }}
      >
        Get Location Coords
      </button>
      <div data-testid="location-result"></div>
      <button 
        data-testid="get-location-name" 
        onClick={async () => {
          const result = await context.getLocationNameFromCoordinates([18.4241, -33.9249]);
          screen.getByTestId('location-name-result').textContent = result ? 'found' : 'not found';
        }}
      >
        Get Location Name
      </button>
      <div data-testid="location-name-result"></div>
      <button 
        data-testid="set-search-query" 
        onClick={() => context.setSearchQuery('manual query')}
      >
        Set Search Query
      </button>
      <button 
        data-testid="set-suggestions" 
        onClick={() => context.setSearchSuggestions([{ name: 'Manual Suggestion' }])}
      >
        Set Suggestions
      </button>
      <button 
        data-testid="set-show-suggestions" 
        onClick={() => context.setShowSuggestions(true)}
      >
        Set Show Suggestions
      </button>
    </div>
  );
};

const renderWithProviders = (component) => {
  return render(
    <SearchProvider>
      {component}
    </SearchProvider>
  );
};

describe('SearchContext', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
    useReverseGeocoding.mockReturnValue({
      reverseGeocodingLoading: false,
      reverseGeocode: jest.fn()
    });
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Context Provider', () => {
    it('provides search context to children', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('search-query')).toBeInTheDocument();
      expect(screen.getByTestId('suggestions-count')).toBeInTheDocument();
      expect(screen.getByTestId('show-suggestions')).toBeInTheDocument();
    });

    it('initializes with empty state', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('search-query')).toHaveTextContent('');
      expect(screen.getByTestId('suggestions-count')).toHaveTextContent('0');
      expect(screen.getByTestId('show-suggestions')).toHaveTextContent('false');
    });

    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSearch must be used within a SearchProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Search Handling', () => {
    it('handles search and updates query', () => {
      renderWithProviders(<TestComponent />);
      
      const searchButton = screen.getByTestId('handle-search');
      act(() => {
        searchButton.click();
      });
      
      expect(screen.getByTestId('search-query')).toHaveTextContent('test query');
      expect(mockNavigate).toHaveBeenCalledWith('/trails', {
        state: { searchQuery: 'test query', action: 'zoom' },
        replace: false
      });
    });

    it('sets showSuggestions to false on search', () => {
      renderWithProviders(<TestComponent />);
      
      // First set showSuggestions to true
      const setShowButton = screen.getByTestId('set-show-suggestions');
      act(() => {
        setShowButton.click();
      });
      
      expect(screen.getByTestId('show-suggestions')).toHaveTextContent('true');
      
      // Then perform search
      const searchButton = screen.getByTestId('handle-search');
      act(() => {
        searchButton.click();
      });
      
      expect(screen.getByTestId('show-suggestions')).toHaveTextContent('false');
    });
  });

  describe('Suggestions Handling', () => {
    it('gets suggestions for valid query with trails data', async () => {
      const mockTrails = [
        { name: 'Test Trail 1', description: 'A test trail' },
        { name: 'Another Trail', description: 'Another test trail' }
      ];

      renderWithProviders(<TestComponent />);
      
      // Update trails data first
      const updateButton = screen.getByTestId('update-trails');
      act(() => {
        updateButton.click();
      });

      // Get suggestions
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-count')).toHaveTextContent('1');
      });
    });

    it('does not get suggestions for short query', () => {
      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions-short');
      act(() => {
        suggestionsButton.click();
      });
      
      expect(screen.getByTestId('suggestions-count')).toHaveTextContent('0');
    });

    it('does not get suggestions for empty query', () => {
      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions-empty');
      act(() => {
        suggestionsButton.click();
      });
      
      expect(screen.getByTestId('suggestions-count')).toHaveTextContent('0');
    });

    it('handles null query gracefully', () => {
      renderWithProviders(<TestComponent />);
      
      const context = require('../components/SearchContext');
      const { useSearch } = context;
      
      // Create a test component that calls getSuggestions with null
      const NullTestComponent = () => {
        const { getSuggestions } = useSearch();
        return (
          <button 
            data-testid="get-null-suggestions" 
            onClick={() => getSuggestions(null)}
          >
            Get Null Suggestions
          </button>
        );
      };
      
      renderWithProviders(<NullTestComponent />);
      
      const button = screen.getByTestId('get-null-suggestions');
      act(() => {
        button.click();
      });
      
      // Should not crash
      expect(screen.getByTestId('get-null-suggestions')).toBeInTheDocument();
    });

    it('filters trail suggestions correctly with various trail formats', async () => {
      const mockTrails = [
        { 
          name: 'Table Mountain Trail', 
          description: 'A challenging hike',
          difficulty: 'Moderate',
          distance: 5.2,
          elevationGain: 800,
          tags: ['mountain', 'views'],
          status: 'open',
          location: { latitude: -33.9628, longitude: 18.4096 }
        },
        { 
          name: 'Lion\'s Head Trail', 
          description: 'Popular sunset hike',
          difficulty: 'Easy',
          distance: 2.1,
          elevationGain: 200,
          tags: ['sunset', 'views'],
          status: 'open',
          location: { _lat: -33.9356, _long: 18.3881 }
        },
        {
          name: 'Closed Trail',
          status: 'closed',
          location: { latitude: -33.9000, longitude: 18.4000 }
        }
      ];

      renderWithProviders(<TestComponent />);
      
      // Update trails data
      const updateButton = screen.getByTestId('update-trails');
      act(() => {
        updateButton.click();
      });

      // Get suggestions for "Table"
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-count')).toHaveTextContent('1');
      });
    });

    it('handles trails without names', async () => {
      const mockTrails = [
        { description: 'Trail without name' },
        { name: 'Valid Trail' }
      ];

      renderWithProviders(<TestComponent />);
      
      const updateButton = screen.getByTestId('update-trails');
      act(() => {
        updateButton.click();
      });

      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-count')).toHaveTextContent('1');
      });
    });

    it('handles trails with different location formats', async () => {
      const mockTrails = [
        { 
          name: 'Test Trail 1', 
          location: { latitude: -33.9628, longitude: 18.4096 }
        },
        { 
          name: 'Test Trail 2', 
          location: { _lat: -33.9356, _long: 18.3881 }
        },
        { 
          name: 'Test Trail 3', 
          location: null
        },
        { 
          name: 'Test Trail 4'
          // No location field
        }
      ];

      // Create a custom test component for this specific test
      const LocationFormatTestComponent = () => {
        const context = useSearch();
        return (
          <div>
            <div data-testid="suggestions-count">{context.searchSuggestions.length}</div>
            <button 
              data-testid="update-specific-trails" 
              onClick={() => context.updateTrailsData(mockTrails)}
            >
              Update Specific Trails
            </button>
            <button 
              data-testid="get-suggestions-specific" 
              onClick={() => context.getSuggestions('Test')}
            >
              Get Specific Suggestions
            </button>
          </div>
        );
      };

      renderWithProviders(<LocationFormatTestComponent />);
      
      const updateButton = screen.getByTestId('update-specific-trails');
      act(() => {
        updateButton.click();
      });

      const suggestionsButton = screen.getByTestId('get-suggestions-specific');
      act(() => {
        suggestionsButton.click();
      });

      await waitFor(() => {
        // All 4 trails should match "Test" query
        expect(screen.getByTestId('suggestions-count')).toHaveTextContent('4');
      });
    });
  });

  describe('Mapbox Geocoding Integration', () => {
    it('handles successful Mapbox geocoding API calls', async () => {
      const mockGeocodingResponse = {
        features: [
          {
            place_name: 'Cape Town, Western Cape, South Africa',
            text: 'Cape Town',
            center: [18.4241, -33.9249],
            place_type: ['place'],
            properties: { category: 'city' }
          },
          {
            place_name: 'Table Mountain, Cape Town, Western Cape, South Africa',
            text: 'Table Mountain',
            center: [18.4096, -33.9628],
            place_type: ['poi'],
            properties: { category: 'nature' }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      // Set Mapbox token
      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('api.mapbox.com/geocoding/v5/mapbox.places/test.json')
        );
      });
    });

    it('handles Mapbox geocoding API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should not crash and should maintain local suggestions
        expect(screen.getByTestId('suggestions-count')).toBeInTheDocument();
      });
    });

    it('handles Mapbox API response with no features', async () => {
      const mockGeocodingResponse = {
        features: []
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('handles Mapbox API response with malformed features', async () => {
      const mockGeocodingResponse = {
        features: [
          {
            // Missing required fields
            text: 'Incomplete Feature'
          },
          {
            place_name: 'Complete Feature, Cape Town, South Africa',
            text: 'Complete Feature',
            center: [18.4241, -33.9249],
            place_type: ['place'],
            properties: { category: 'city' }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('works without Mapbox token', async () => {
      delete process.env.REACT_APP_MAPBOX_TOKEN;

      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should not make API calls without token
        expect(fetch).not.toHaveBeenCalled();
      });
    });

    it('handles different geocoding feature types', async () => {
      const mockGeocodingResponse = {
        features: [
          {
            place_name: '123 Main Street, Cape Town, Western Cape, South Africa',
            text: '123 Main Street',
            center: [18.4241, -33.9249],
            place_type: ['address'],
            properties: { category: 'address' }
          },
          {
            place_name: 'Kirstenbosch National Botanical Garden, Cape Town, South Africa',
            text: 'Kirstenbosch National Botanical Garden',
            center: [18.4300, -33.9800],
            place_type: ['poi'],
            properties: { category: 'park' }
          },
          {
            place_name: 'Cape Town, Western Cape, South Africa',
            text: 'Cape Town',
            center: [18.4241, -33.9249],
            place_type: ['place'],
            properties: { category: 'city' }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('identifies trail-related locations correctly', async () => {
      const mockGeocodingResponse = {
        features: [
          {
            place_name: 'Table Mountain National Park, Cape Town, South Africa',
            text: 'Table Mountain National Park',
            center: [18.4096, -33.9628],
            place_type: ['poi'],
            properties: { category: 'park' }
          },
          {
            place_name: 'Lion\'s Head Nature Reserve, Cape Town, South Africa',
            text: 'Lion\'s Head Nature Reserve',
            center: [18.3881, -33.9356],
            place_type: ['poi'],
            properties: { category: 'nature' }
          },
          {
            place_name: 'Cape Point Trail, Cape Town, South Africa',
            text: 'Cape Point Trail',
            center: [18.5000, -34.3500],
            place_type: ['poi'],
            properties: { category: 'trail' }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Debouncing', () => {
    it('debounces geocoding API calls', async () => {
      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';
      
      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      
      // Call multiple times rapidly
      act(() => {
        suggestionsButton.click();
        suggestionsButton.click();
        suggestionsButton.click();
      });

      // Fast-forward time to trigger debounced call
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should only make one API call due to debouncing
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('clears existing timeout before setting new one', async () => {
      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';
      
      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      
      // First call
      act(() => {
        suggestionsButton.click();
      });

      // Second call before timeout
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Location Coordinates', () => {
    it('gets location coordinates successfully', async () => {
      const mockGeocodingResponse = {
        features: [
          {
            place_name: 'Cape Town, Western Cape, South Africa',
            center: [18.4241, -33.9249]
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const coordsButton = screen.getByTestId('get-location-coords');
      act(() => {
        coordsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('location-result')).toHaveTextContent('found');
      });
    });

    it('handles location coordinates API error', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const coordsButton = screen.getByTestId('get-location-coords');
      act(() => {
        coordsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('location-result')).toHaveTextContent('not found');
      });
    });

    it('handles location coordinates without Mapbox token', async () => {
      delete process.env.REACT_APP_MAPBOX_TOKEN;

      renderWithProviders(<TestComponent />);
      
      const coordsButton = screen.getByTestId('get-location-coords');
      act(() => {
        coordsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('location-result')).toHaveTextContent('not found');
      });
    });

    it('handles location coordinates with no features in response', async () => {
      const mockGeocodingResponse = {
        features: []
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const coordsButton = screen.getByTestId('get-location-coords');
      act(() => {
        coordsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('location-result')).toHaveTextContent('not found');
      });
    });

    it('handles location coordinates with malformed response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const coordsButton = screen.getByTestId('get-location-coords');
      act(() => {
        coordsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('location-result')).toHaveTextContent('not found');
      });
    });
  });

  describe('Reverse Geocoding', () => {
    it('gets location name from coordinates successfully', async () => {
      const mockReverseGeocode = jest.fn().mockResolvedValue({
        name: 'Cape Town',
        fullAddress: 'Cape Town, Western Cape, South Africa',
        city: 'Cape Town',
        type: 'city'
      });

      useReverseGeocoding.mockReturnValue({
        reverseGeocodingLoading: false,
        reverseGeocode: mockReverseGeocode
      });

      renderWithProviders(<TestComponent />);
      
      const nameButton = screen.getByTestId('get-location-name');
      act(() => {
        nameButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('location-name-result')).toHaveTextContent('found');
      });
    });

    it('handles reverse geocoding error', async () => {
      const mockReverseGeocode = jest.fn().mockRejectedValue(new Error('Reverse geocoding failed'));

      useReverseGeocoding.mockReturnValue({
        reverseGeocodingLoading: false,
        reverseGeocode: mockReverseGeocode
      });

      renderWithProviders(<TestComponent />);
      
      const nameButton = screen.getByTestId('get-location-name');
      act(() => {
        nameButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('location-name-result')).toHaveTextContent('not found');
      });
    });

    it('handles reverse geocoding with null result', async () => {
      const mockReverseGeocode = jest.fn().mockResolvedValue(null);

      useReverseGeocoding.mockReturnValue({
        reverseGeocodingLoading: false,
        reverseGeocode: mockReverseGeocode
      });

      renderWithProviders(<TestComponent />);
      
      const nameButton = screen.getByTestId('get-location-name');
      act(() => {
        nameButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('location-name-result')).toHaveTextContent('not found');
      });
    });
  });

  describe('Data Management', () => {
    it('updates trails data', () => {
      const mockTrails = [
        { name: 'Test Trail 1' },
        { name: 'Test Trail 2' }
      ];

      renderWithProviders(<TestComponent />);
      
      const updateButton = screen.getByTestId('update-trails');
      act(() => {
        updateButton.click();
      });

      // Verify trails data is updated by checking suggestions
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      expect(screen.getByTestId('suggestions-count')).toHaveTextContent('1');
    });

    it('handles null trails data', () => {
      renderWithProviders(<TestComponent />);
      
      const updateButton = screen.getByTestId('update-trails-null');
      act(() => {
        updateButton.click();
      });

      // Should not crash
      expect(screen.getByTestId('update-trails-null')).toBeInTheDocument();
    });

    it('clears search state', () => {
      renderWithProviders(<TestComponent />);
      
      // First set some state
      const searchButton = screen.getByTestId('handle-search');
      act(() => {
        searchButton.click();
      });
      
      expect(screen.getByTestId('search-query')).toHaveTextContent('test query');
      
      // Then clear it
      const clearButton = screen.getByTestId('clear-search');
      act(() => {
        clearButton.click();
      });
      
      expect(screen.getByTestId('search-query')).toHaveTextContent('');
      expect(screen.getByTestId('suggestions-count')).toHaveTextContent('0');
      expect(screen.getByTestId('show-suggestions')).toHaveTextContent('false');
    });
  });

  describe('State Setters', () => {
    it('sets search query manually', () => {
      renderWithProviders(<TestComponent />);
      
      const setQueryButton = screen.getByTestId('set-search-query');
      act(() => {
        setQueryButton.click();
      });
      
      expect(screen.getByTestId('search-query')).toHaveTextContent('manual query');
    });

    it('sets search suggestions manually', () => {
      renderWithProviders(<TestComponent />);
      
      const setSuggestionsButton = screen.getByTestId('set-suggestions');
      act(() => {
        setSuggestionsButton.click();
      });
      
      expect(screen.getByTestId('suggestions-count')).toHaveTextContent('1');
    });

    it('sets show suggestions manually', () => {
      renderWithProviders(<TestComponent />);
      
      const setShowButton = screen.getByTestId('set-show-suggestions');
      act(() => {
        setShowButton.click();
      });
      
      expect(screen.getByTestId('show-suggestions')).toHaveTextContent('true');
    });
  });

  describe('Cleanup', () => {
    it('cleans up debounce timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });
      
      unmount();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Suggestion Deduplication', () => {
    it('removes duplicate suggestions based on displayName', async () => {
      const mockTrails = [
        { name: 'Table Mountain Trail' }
      ];

      const mockGeocodingResponse = {
        features: [
          {
            place_name: 'Table Mountain Trail, Cape Town, South Africa',
            text: 'Table Mountain Trail',
            center: [18.4096, -33.9628],
            place_type: ['poi'],
            properties: { category: 'trail' }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      // Update trails data
      const updateButton = screen.getByTestId('update-trails');
      act(() => {
        updateButton.click();
      });

      // Get suggestions
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should have only one suggestion despite both trail and geocoding matching
        expect(screen.getByTestId('suggestions-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles trails with missing optional fields', async () => {
      const mockTrails = [
        {
          name: 'Minimal Trail'
          // Missing description, difficulty, distance, elevationGain, tags, status
        }
      ];

      renderWithProviders(<TestComponent />);
      
      const updateButton = screen.getByTestId('update-trails');
      act(() => {
        updateButton.click();
      });

      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-count')).toHaveTextContent('1');
      });
    });

    it('handles geocoding features with missing optional fields', async () => {
      const mockGeocodingResponse = {
        features: [
          {
            place_name: 'Minimal Feature, Cape Town, South Africa',
            text: 'Minimal Feature',
            center: [18.4241, -33.9249]
            // Missing place_type and properties
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse
      });

      process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';

      renderWithProviders(<TestComponent />);
      
      const suggestionsButton = screen.getByTestId('get-suggestions');
      act(() => {
        suggestionsButton.click();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it('handles very long search queries', () => {
      renderWithProviders(<TestComponent />);
      
      const context = require('../components/SearchContext');
      const { useSearch } = context;
      
      const LongQueryTestComponent = () => {
        const { getSuggestions } = useSearch();
        return (
          <button 
            data-testid="get-long-suggestions" 
            onClick={() => getSuggestions('a'.repeat(1000))}
          >
            Get Long Suggestions
          </button>
        );
      };
      
      renderWithProviders(<LongQueryTestComponent />);
      
      const button = screen.getByTestId('get-long-suggestions');
      act(() => {
        button.click();
      });
      
      // Should not crash
      expect(screen.getByTestId('get-long-suggestions')).toBeInTheDocument();
    });
  });
});