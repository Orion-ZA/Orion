import { renderHook, act } from '@testing-library/react';
import { useTrailContent } from '../hooks/useTrailContent';

// Mock the trail API functions
jest.mock('../utils/trailApi', () => ({
  fetchTrailReviews: jest.fn(),
  fetchWeatherData: jest.fn(),
}));

// Mock the trail alerts hook
jest.mock('../hooks/useTrailAlerts', () => ({
  useTrailAlerts: jest.fn(),
}));

import { fetchTrailReviews, fetchWeatherData } from '../utils/trailApi';
import { useTrailAlerts } from '../hooks/useTrailAlerts';

describe('useTrailContent', () => {
  const mockTrail = {
    id: 'test-trail-id',
    name: 'Test Trail',
    location: {
      latitude: 40.7128,
      longitude: -74.006,
    },
  };

  const mockReviews = [
    { id: '1', comment: 'Great trail!', rating: 5, timestamp: '2023-01-01' },
    { id: '2', comment: 'Nice views', rating: 4, timestamp: '2023-01-02' },
  ];

  const mockWeatherData = [{ date: '2023-01-01', minTemp: 10, maxTemp: 20, condition: 'Clear' }];

  beforeEach(() => {
    jest.clearAllMocks();
    fetchTrailReviews.mockResolvedValue(mockReviews);
    fetchWeatherData.mockResolvedValue(mockWeatherData);
    useTrailAlerts.mockReturnValue({
      trailAlerts: {},
      loadingStates: {},
      fetchTrailAlerts: jest.fn(),
    });
  });

  describe('Initial State', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      expect(result.current.reviews).toEqual([]);
      expect(result.current.reviewSortBy).toBe('newest');
      expect(result.current.weatherData).toBe(null);
      expect(result.current.alerts).toEqual([]);
      expect(result.current.loadingAlerts).toBe(false);
      // Note: loadingReviews and loadingWeather may be true initially due to useEffect
    });
  });

  describe('Reviews Functionality', () => {
    it('fetches reviews when trail changes', async () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchTrailReviews).toHaveBeenCalledWith('test-trail-id');
      expect(result.current.reviews).toEqual(mockReviews);
    });

    it('handles review fetch errors', async () => {
      fetchTrailReviews.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useTrailContent(mockTrail));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.reviews).toEqual([]);
    });

    it('sorts reviews by newest by default', () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      act(() => {
        result.current.setReviews(mockReviews);
      });

      const sortedReviews = result.current.getSortedReviews();
      expect(sortedReviews[0].id).toBe('2'); // Newer review first
      expect(sortedReviews[1].id).toBe('1');
    });

    it('sorts reviews by oldest', () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      act(() => {
        result.current.setReviews(mockReviews);
        result.current.setReviewSortBy('oldest');
      });

      const sortedReviews = result.current.getSortedReviews();
      expect(sortedReviews[0].id).toBe('1'); // Older review first
      expect(sortedReviews[1].id).toBe('2');
    });

    it('sorts reviews by highest rating', () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      act(() => {
        result.current.setReviews(mockReviews);
        result.current.setReviewSortBy('highest');
      });

      const sortedReviews = result.current.getSortedReviews();
      expect(sortedReviews[0].rating).toBe(5); // Higher rating first
      expect(sortedReviews[1].rating).toBe(4);
    });

    it('sorts reviews by lowest rating', () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      act(() => {
        result.current.setReviews(mockReviews);
        result.current.setReviewSortBy('lowest');
      });

      const sortedReviews = result.current.getSortedReviews();
      expect(sortedReviews[0].rating).toBe(4); // Lower rating first
      expect(sortedReviews[1].rating).toBe(5);
    });

    it('returns empty array when no reviews', () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      const sortedReviews = result.current.getSortedReviews();
      expect(sortedReviews).toEqual([]);
    });

    it('handles reviews without ratings', () => {
      const reviewsWithoutRatings = [
        { id: '1', comment: 'No rating', timestamp: '2023-01-01' },
        { id: '2', comment: 'With rating', rating: 3, timestamp: '2023-01-02' },
      ];

      const { result } = renderHook(() => useTrailContent(mockTrail));

      act(() => {
        result.current.setReviews(reviewsWithoutRatings);
        result.current.setReviewSortBy('highest');
      });

      const sortedReviews = result.current.getSortedReviews();
      expect(sortedReviews[0].rating).toBe(3);
      expect(sortedReviews[1].rating).toBeUndefined();
    });
  });

  describe('Weather Functionality', () => {
    it('fetches weather data when trail location changes', async () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchWeatherData).toHaveBeenCalledWith(40.7128, -74.006);
      expect(result.current.weatherData).toEqual(mockWeatherData);
    });

    it('handles weather fetch errors', async () => {
      fetchWeatherData.mockRejectedValue(new Error('Weather fetch failed'));

      const { result } = renderHook(() => useTrailContent(mockTrail));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.weatherData).toBe(null);
    });

    it('handles trail with _latitude and _longitude', async () => {
      const trailWithUnderscoreCoords = {
        ...mockTrail,
        location: {
          _latitude: 40.7128,
          _longitude: -74.006,
        },
      };

      const { result } = renderHook(() => useTrailContent(trailWithUnderscoreCoords));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchWeatherData).toHaveBeenCalledWith(40.7128, -74.006);
    });

    it('handles trail without location', async () => {
      const trailWithoutLocation = { ...mockTrail, location: null };

      const { result } = renderHook(() => useTrailContent(trailWithoutLocation));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchWeatherData).not.toHaveBeenCalled();
    });

    it('handles invalid location data', async () => {
      const trailWithInvalidLocation = {
        ...mockTrail,
        location: { invalid: 'data' },
      };

      const { result } = renderHook(() => useTrailContent(trailWithInvalidLocation));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchWeatherData).not.toHaveBeenCalled();
    });
  });

  describe('Alerts Integration', () => {
    it('uses trail alerts hook', () => {
      const mockFetchTrailAlerts = jest.fn();
      useTrailAlerts.mockReturnValue({
        trailAlerts: { 'test-trail-id': [{ id: 'alert-1', message: 'Test alert' }] },
        loadingStates: { 'test-trail-id': false },
        fetchTrailAlerts: mockFetchTrailAlerts,
      });

      const { result } = renderHook(() => useTrailContent(mockTrail));

      expect(result.current.alerts).toEqual([{ id: 'alert-1', message: 'Test alert' }]);
      expect(result.current.loadingAlerts).toBe(false);
    });

    it('handles alerts for different trail IDs', () => {
      useTrailAlerts.mockReturnValue({
        trailAlerts: { 'other-trail-id': [{ id: 'alert-2', message: 'Other alert' }] },
        loadingStates: { 'other-trail-id': true },
        fetchTrailAlerts: jest.fn(),
      });

      const { result } = renderHook(() => useTrailContent(mockTrail));

      expect(result.current.alerts).toEqual([]);
      expect(result.current.loadingAlerts).toBe(false);
    });
  });

  describe('Effect Dependencies', () => {
    it('refetches data when trail ID changes', async () => {
      const { result, rerender } = renderHook(({ trail }) => useTrailContent(trail), {
        initialProps: { trail: mockTrail },
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchTrailReviews).toHaveBeenCalledWith('test-trail-id');

      const newTrail = { ...mockTrail, id: 'new-trail-id' };
      rerender({ trail: newTrail });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchTrailReviews).toHaveBeenCalledWith('new-trail-id');
    });

    it('refetches weather when trail location changes', async () => {
      const { result, rerender } = renderHook(({ trail }) => useTrailContent(trail), {
        initialProps: { trail: mockTrail },
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchWeatherData).toHaveBeenCalledWith(40.7128, -74.006);

      const newTrail = {
        ...mockTrail,
        location: { latitude: 50.0, longitude: -100.0 },
      };
      rerender({ trail: newTrail });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchWeatherData).toHaveBeenCalledWith(50.0, -100.0);
    });
  });

  describe('Manual Functions', () => {
    it('provides fetchReviews function', async () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      await act(async () => {
        await result.current.fetchReviews();
      });

      expect(fetchTrailReviews).toHaveBeenCalledWith('test-trail-id');
      expect(result.current.reviews).toEqual(mockReviews);
    });

    it('handles fetchReviews when no trail ID', async () => {
      const { result } = renderHook(() => useTrailContent(null));

      await act(async () => {
        await result.current.fetchReviews();
      });

      expect(fetchTrailReviews).not.toHaveBeenCalled();
    });
  });

  describe('State Updates', () => {
    it('allows manual review updates', () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      act(() => {
        result.current.setReviews(mockReviews);
      });

      expect(result.current.reviews).toEqual(mockReviews);
    });

    it('allows review sort changes', () => {
      const { result } = renderHook(() => useTrailContent(mockTrail));

      act(() => {
        result.current.setReviewSortBy('oldest');
      });

      expect(result.current.reviewSortBy).toBe('oldest');
    });
  });
});
