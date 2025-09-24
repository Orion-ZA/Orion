import { renderHook, act } from '@testing-library/react';

// Mock Firestore
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  getDocs: (...args) => mockGetDocs(...args),
}));

// Mock db export path used in hook
jest.mock('../components/firebaseConfig', () => ({ db: {} }), { virtual: true });
jest.mock('../firebaseConfig', () => ({ db: {} }));

import useTrails from '../components/hooks/useTrails';

// Helper to build Firestore-like docs
const makeDoc = (id, data) => ({ id, data: () => data });

describe('useTrails', () => {
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default geolocation mock
    const geoSuccess = (cb) => cb({ coords: { latitude: -33.9249, longitude: 18.4241 } });
    navigator.geolocation = {
      getCurrentPosition: jest.fn((success) => success && geoSuccess(success)),
    };
    mockCollection.mockReturnValue({});
  });

  afterEach(() => {
    navigator.geolocation = originalGeolocation;
  });

  test('fetches trails and maps coordinates, filtering out invalid ones', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        // valid: location with latitude/longitude
        makeDoc('t1', { name: 'Valid', location: { latitude: -33.92, longitude: 18.42 }, distance: 5 }),
        // invalid: out of range
        makeDoc('t2', { name: 'Bad', location: { latitude: 1000, longitude: 0 }, distance: 3 }),
        // valid: GeoPoint-like with _latitude/_longitude
        makeDoc('t3', { name: 'GeoPoint', location: { _latitude: -33.93, _longitude: 18.43 }, distance: 7 }),
      ],
    });

    const { result } = renderHook(() => useTrails());

    // Wait for internal async fetch to settle
    await act(async () => {
      // No op; microtask queue flush
      await Promise.resolve();
    });

    expect(result.current.isLoadingTrails).toBe(false);
    const names = result.current.filteredTrails.map(t => t.name);
    expect(names).toEqual(['Valid', 'GeoPoint']);
    expect(result.current.filteredTrails.every(t => typeof t.latitude === 'number' && typeof t.longitude === 'number')).toBe(true);
  });

  test('falls back to sample trails when none valid', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [makeDoc('x', { name: 'NoLoc' })] });

    const { result } = renderHook(() => useTrails());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.filteredTrails.length).toBe(2);
    const names = result.current.filteredTrails.map(t => t.name);
    expect(names).toContain("Table Mountain Trail");
    expect(names).toContain("Lion's Head Trail");
  });

  test('filters by difficulty, tags, distance range, search, and location radius', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        makeDoc('a', { name: 'Easy Loop', difficulty: 'Easy', distance: 4, tags: ['loop'], location: { latitude: -33.92, longitude: 18.42 } }),
        makeDoc('b', { name: 'Hard Peak', difficulty: 'Hard', distance: 12, tags: ['peak'], location: { latitude: -33.95, longitude: 18.5 } }),
      ],
    });

    const { result } = renderHook(() => useTrails({ latitude: -33.9249, longitude: 18.4241 }));
    await act(async () => { await Promise.resolve(); });

    // Set filters step by step
    await act(async () => { result.current.handleFilterChange('difficulty', 'Easy'); });
    expect(result.current.filteredTrails.map(t => t.name)).toEqual(['Easy Loop']);

    await act(async () => { result.current.handleFilterChange('tags', ['loop']); });
    expect(result.current.filteredTrails.map(t => t.name)).toEqual(['Easy Loop']);

    // Case-insensitive tags
    await act(async () => { result.current.handleFilterChange('tags', ['LOOP']); });
    expect(result.current.filteredTrails.map(t => t.name)).toEqual(['Easy Loop']);

    await act(async () => { result.current.handleFilterChange('minDistance', 3); result.current.handleFilterChange('maxDistance', 5); });
    expect(result.current.filteredTrails.map(t => t.name)).toEqual(['Easy Loop']);

    await act(async () => { result.current.handleFilterChange('searchQuery', 'easy'); });
    expect(result.current.filteredTrails.map(t => t.name)).toEqual(['Easy Loop']);

    // Tighten location radius to exclude both, then widen to include nearby
    await act(async () => { result.current.handleFilterChange('maxLocationDistance', 0.1); });
    expect(result.current.filteredTrails).toEqual([]);
    await act(async () => { result.current.handleFilterChange('maxLocationDistance', 80); });
    expect(result.current.filteredTrails.length).toBeGreaterThan(0);
  });

  test('myTrails filters by createdBy user id reference/path/string', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        makeDoc('m1', { name: 'Mine', createdBy: 'Users/u123', location: { latitude: -33.92, longitude: 18.42 } }),
        makeDoc('o1', { name: 'Others', createdBy: 'Users/zzz', location: { latitude: -33.93, longitude: 18.43 } }),
      ],
    });

    const { result } = renderHook(() => useTrails(null, 'u123'));
    await act(async () => { await Promise.resolve(); });

    await act(async () => { result.current.handleFilterChange('myTrails', true); });
    expect(result.current.filteredTrails.map(t => t.name)).toEqual(['Mine']);
  });

  test('myTrails enabled but no currentUserId does not filter', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        makeDoc('m1', { name: 'Mine', createdBy: 'Users/u123', location: { latitude: -33.92, longitude: 18.42 } }),
        makeDoc('o1', { name: 'Others', createdBy: 'Users/zzz', location: { latitude: -33.93, longitude: 18.43 } }),
      ],
    });

    const { result } = renderHook(() => useTrails(null, null));
    await act(async () => { await Promise.resolve(); });
    await act(async () => { result.current.handleFilterChange('myTrails', true); });
    expect(result.current.filteredTrails.map(t => t.name).sort()).toEqual(['Mine', 'Others'].sort());
  });

  test('external user location takes precedence over internal geolocation', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        makeDoc('t1', { name: 'Near External', location: { latitude: 10.001, longitude: 10.001 } }),
      ],
    });

    const external = { latitude: 10.001, longitude: 10.001 };
    const { result } = renderHook(() => useTrails(external));
    await act(async () => { await Promise.resolve(); });

    // Set a very small radius; since external equals trail, it should pass
    await act(async () => { result.current.handleFilterChange('maxLocationDistance', 1); });
    expect(result.current.filteredTrails.length).toBe(1);
  });

  test('handles Firestore fetch error gracefully', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetDocs.mockRejectedValueOnce(new Error('fs error'));

    const { result } = renderHook(() => useTrails());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.isLoadingTrails).toBe(false);
    expect(result.current.filteredTrails).toEqual([]);
    expect(result.current.locationError).toBe('Failed to load trails. Please try again.');
    spy.mockRestore();
  });

  test('getUserLocation updates userLocation and flags', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    const { result } = renderHook(() => useTrails());
    await act(async () => { await Promise.resolve(); });

    await act(async () => { result.current.getUserLocation(); });
    expect(result.current.userLocation).toEqual({ latitude: -33.9249, longitude: 18.4241 });
    expect(result.current.isLoadingLocation).toBe(false);
  });

  test('getUserLocation handles missing geolocation API', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    const original = navigator.geolocation;
    // @ts-ignore
    navigator.geolocation = undefined;
    const { result } = renderHook(() => useTrails());
    await act(async () => { await Promise.resolve(); });
    await act(async () => { result.current.getUserLocation(); });
    expect(result.current.locationError).toBe('Geolocation is not supported');
    expect(result.current.isLoadingLocation).toBe(false);
    navigator.geolocation = original;
  });

  test('maps gpsRoute to both route [lng,lat] and gpsRoute objects filtering invalid points', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        makeDoc('r1', {
          name: 'Routed',
          location: { latitude: -33.92, longitude: 18.42 },
          gpsRoute: [
            { lng: 18.42, lat: -33.92 },
            { longitude: 180.1, latitude: 0 }, // invalid lng
            { _longitude: 18.5, _latitude: -33.95 }, // GeoPoint-like
            { lng: 'x', lat: 'y' }, // invalid strings
          ],
        }),
      ],
    });

    const { result } = renderHook(() => useTrails());
    await act(async () => { await Promise.resolve(); });
    const trail = result.current.filteredTrails[0];
    expect(Array.isArray(trail.route)).toBe(true);
    expect(Array.isArray(trail.gpsRoute)).toBe(true);
    // Filtered to two valid points
    expect(trail.route.length).toBe(2);
    expect(trail.gpsRoute.length).toBe(2);
    expect(trail.route[0]).toEqual([18.42, -33.92]);
    expect(trail.route[1]).toEqual([18.5, -33.95]);
    expect(trail.gpsRoute[0]).toEqual({ lng: 18.42, lat: -33.92 });
  });

  test('showAll bypasses filtering and returns all trails', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        makeDoc('a', { name: 'Far Trail', difficulty: 'Hard', distance: 100, location: { latitude: 10, longitude: 10 } }),
        makeDoc('b', { name: 'Near Trail', difficulty: 'Easy', distance: 1, location: { latitude: 0.01, longitude: 0.01 } }),
      ],
    });
    const { result } = renderHook(() => useTrails({ latitude: 0, longitude: 0 }));
    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      result.current.handleFilterChange('difficulty', 'Easy');
      result.current.handleFilterChange('maxLocationDistance', 1);
      result.current.handleFilterChange('showAll', true);
    });
    expect(result.current.filteredTrails.map(t => t.name).sort()).toEqual(['Far Trail', 'Near Trail'].sort());
  });

  test('exposes calculateDistance function from hook', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    const { result } = renderHook(() => useTrails());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.calculateDistance(0, 0, 0, 0)).toBeCloseTo(0, 6);
  });
});


