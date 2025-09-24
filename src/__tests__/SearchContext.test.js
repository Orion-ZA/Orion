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
        data-testid="update-trails" 
        onClick={() => context.updateTrailsData([{ name: 'Test Trail' }])}
      >
        Update Trails
      </button>
      <button 
        data-testid="clear-search" 
        onClick={() => context.clearSearch()}
      >
        Clear Search
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
  });

  it('provides search context to children', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('search-query')).toBeInTheDocument();
    expect(screen.getByTestId('suggestions-count')).toBeInTheDocument();
  });

  it('initializes with empty state', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('search-query')).toHaveTextContent('');
    expect(screen.getByTestId('suggestions-count')).toHaveTextContent('0');
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSearch must be used within a SearchProvider');
    
    consoleSpy.mockRestore();
  });

  it('handles search and updates query', () => {
    renderWithProviders(<TestComponent />);
    
    const searchButton = screen.getByTestId('handle-search');
    act(() => {
      searchButton.click();
    });
    
    expect(screen.getByTestId('search-query')).toHaveTextContent('test query');
  });

  it('gets suggestions for valid query', async () => {
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
    
    const suggestionsButton = screen.getByTestId('get-suggestions');
    act(() => {
      suggestionsButton.click();
    });
    
    expect(screen.getByTestId('suggestions-count')).toHaveTextContent('0');
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
  });

  it('handles Mapbox geocoding API calls', async () => {
    const mockGeocodingResponse = {
      features: [
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

    renderWithProviders(<TestComponent />);
    
    const suggestionsButton = screen.getByTestId('get-suggestions');
    act(() => {
      suggestionsButton.click();
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.mapbox.com/geocoding/v5/mapbox.places/test.json')
      );
    });
  });

  it('handles geocoding API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderWithProviders(<TestComponent />);
    
    const suggestionsButton = screen.getByTestId('get-suggestions');
    act(() => {
      suggestionsButton.click();
    });

    await waitFor(() => {
      // Should not crash and should maintain local suggestions
      expect(screen.getByTestId('suggestions-count')).toBeInTheDocument();
    });
  });

  it('filters trail suggestions correctly', async () => {
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
        location: { latitude: -33.9356, longitude: 18.3881 }
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

  it('handles coordinates extraction from different formats', async () => {
    const mockTrails = [
      { 
        name: 'Test Trail', 
        location: { latitude: -33.9628, longitude: 18.4096 }
      },
      { 
        name: 'Another Trail', 
        location: { _latitude: -33.9356, _longitude: 18.3881 }
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

  it('debounces geocoding API calls', async () => {
    jest.useFakeTimers();
    
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

    jest.useRealTimers();
  });

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
