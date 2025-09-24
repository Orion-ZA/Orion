import { renderHook, act } from '@testing-library/react';
import { useReverseGeocoding } from '../hooks/useReverseGeocoding';

// Mock fetch
global.fetch = jest.fn();

describe('useReverseGeocoding', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Set up environment variable
    process.env.REACT_APP_MAPBOX_TOKEN = 'test-token';
  });

  afterEach(() => {
    delete process.env.REACT_APP_MAPBOX_TOKEN;
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useReverseGeocoding());
    
    expect(result.current.reverseGeocodingLoading).toBe(false);
    expect(typeof result.current.reverseGeocode).toBe('function');
  });

  it('sets loading state during reverse geocoding', async () => {
    const mockResponse = {
      features: [
        {
          place_name: '123 Main St, Cape Town, Western Cape, South Africa',
          center: [18.4241, -33.9249],
          context: [
            { id: 'address.123', text: '123' },
            { id: 'neighborhood.456', text: 'City Bowl' },
            { id: 'locality.789', text: 'Cape Town' },
            { id: 'region.101', text: 'Western Cape' },
            { id: 'country.102', text: 'South Africa' }
          ],
          place_type: ['address'],
          properties: { name: 'Main St' },
          text: 'Main St'
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useReverseGeocoding());
    
    let promise;
    act(() => {
      promise = result.current.reverseGeocode([18.4241, -33.9249]);
    });

    // Check loading state is set
    expect(result.current.reverseGeocodingLoading).toBe(true);

    await act(async () => {
      await promise;
    });

    // Check loading state is cleared
    expect(result.current.reverseGeocodingLoading).toBe(false);
  });

  it('successfully reverse geocodes coordinates', async () => {
    const mockResponse = {
      features: [
        {
          place_name: '123 Main St, Cape Town, Western Cape, South Africa',
          center: [18.4241, -33.9249],
          context: [
            { id: 'address.123', text: '123' },
            { id: 'neighborhood.456', text: 'City Bowl' },
            { id: 'locality.789', text: 'Cape Town' },
            { id: 'region.101', text: 'Western Cape' },
            { id: 'country.102', text: 'South Africa' }
          ],
          place_type: ['address'],
          properties: { name: 'Main St' },
          text: 'Main St'
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult).toEqual({
      address: '123 Main St',
      houseNumber: '123',
      city: 'Cape Town',
      state: 'Western Cape',
      postcode: '',
      country: 'South Africa',
      neighborhood: 'City Bowl',
      fullAddress: '123 Main St, City Bowl, Cape Town, Western Cape, South Africa',
      displayName: '123 Main St, Cape Town, Western Cape, South Africa',
      name: 'Main St',
      type: 'address',
      coordinates: [18.4241, -33.9249]
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.mapbox.com/geocoding/v5/mapbox.places/18.4241,-33.9249.json?access_token=test-token&types=address,poi,locality,neighborhood,place,region,country&limit=1'
    );
  });

  it('handles missing Mapbox token', async () => {
    delete process.env.REACT_APP_MAPBOX_TOKEN;
    
    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles API error response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult).toBeNull();
  });

  it('handles network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult).toBeNull();
  });

  it('handles empty features response', async () => {
    const mockResponse = {
      features: []
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult).toBeNull();
  });

  it('handles missing context in response', async () => {
    const mockResponse = {
      features: [
        {
          place_name: 'Cape Town, South Africa',
          center: [18.4241, -33.9249],
          context: [],
          place_type: ['place'],
          properties: { name: 'Cape Town' },
          text: 'Cape Town'
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult).toEqual({
      address: 'Cape Town',
      houseNumber: '',
      city: 'Cape Town',
      state: '',
      postcode: '',
      country: '',
      neighborhood: '',
      fullAddress: 'Cape Town',
      displayName: 'Cape Town, South Africa',
      name: 'Cape Town',
      type: 'place',
      coordinates: [18.4241, -33.9249]
    });
  });

  it('handles complex address parsing', async () => {
    const mockResponse = {
      features: [
        {
          place_name: '456 Oak Avenue, Gardens, Cape Town, Western Cape, 8001, South Africa',
          center: [18.4241, -33.9249],
          context: [
            { id: 'address.456', text: '456' },
            { id: 'neighborhood.789', text: 'Gardens' },
            { id: 'locality.101', text: 'Cape Town' },
            { id: 'region.102', text: 'Western Cape' },
            { id: 'postcode.103', text: '8001' },
            { id: 'country.104', text: 'South Africa' }
          ],
          place_type: ['address'],
          properties: { name: 'Oak Avenue' },
          text: 'Oak Avenue'
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult.fullAddress).toBe('456 Oak Avenue, Gardens, Cape Town, Western Cape, 8001, South Africa');
    expect(geocodeResult.houseNumber).toBe('456');
    expect(geocodeResult.address).toBe('456 Oak Avenue');
    expect(geocodeResult.city).toBe('Cape Town');
    expect(geocodeResult.state).toBe('Western Cape');
    expect(geocodeResult.postcode).toBe('8001');
    expect(geocodeResult.country).toBe('South Africa');
  });

  it('handles POI (Point of Interest) locations', async () => {
    const mockResponse = {
      features: [
        {
          place_name: 'Table Mountain, Cape Town, Western Cape, South Africa',
          center: [18.4241, -33.9249],
          context: [
            { id: 'locality.101', text: 'Cape Town' },
            { id: 'region.102', text: 'Western Cape' },
            { id: 'country.103', text: 'South Africa' }
          ],
          place_type: ['poi'],
          properties: { name: 'Table Mountain' },
          text: 'Table Mountain'
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult.type).toBe('poi');
    expect(geocodeResult.name).toBe('Table Mountain');
    expect(geocodeResult.city).toBe('Cape Town');
  });

  it('handles missing place_name gracefully', async () => {
    const mockResponse = {
      features: [
        {
          center: [18.4241, -33.9249],
          context: [
            { id: 'locality.101', text: 'Cape Town' }
          ],
          place_type: ['place'],
          properties: { name: 'Unknown Location' },
          text: 'Unknown'
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useReverseGeocoding());
    
    let geocodeResult;
    await act(async () => {
      geocodeResult = await result.current.reverseGeocode([18.4241, -33.9249]);
    });

    expect(geocodeResult.address).toBe('');
    expect(geocodeResult.name).toBe('Unknown Location');
  });
});
