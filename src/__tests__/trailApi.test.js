import {
  fetchTrailData,
  updateUserTrailAction,
  fetchTrailReviews,
  addTrailReview,
  uploadTrailImages,
  updateTrailImages,
  addTrailAlert,
  submitTrailReport,
  fetchWeatherData,
} from '../utils/trailApi';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {},
  storage: {},
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Mock fetch globally
global.fetch = jest.fn();

describe('trailApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks to return proper values
    serverTimestamp.mockReturnValue({ _methodName: 'serverTimestamp' });
    uuidv4.mockReturnValue('mock-uuid');
  });

  describe('fetchTrailData', () => {
    it('fetches trail data successfully', async () => {
      const mockTrailData = { name: 'Test Trail', description: 'A beautiful trail' };
      const mockDoc = {
        exists: () => true,
        data: () => mockTrailData,
        id: 'trail-123',
      };

      getDoc.mockResolvedValue(mockDoc);

      const result = await fetchTrailData('trail-123');

      expect(doc).toHaveBeenCalledWith({}, 'Trails', 'trail-123');
      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual({ id: 'trail-123', ...mockTrailData });
    });

    it('throws error when trail not found', async () => {
      const mockDoc = {
        exists: () => false,
      };

      getDoc.mockResolvedValue(mockDoc);

      await expect(fetchTrailData('nonexistent-trail')).rejects.toThrow('Trail not found');
    });
  });

  describe('updateUserTrailAction', () => {
    it('adds trail to user array when not present', async () => {
      const mockTrailRef = { id: 'trail-123' };
      const currentArray = ['trail-456'];

      doc.mockReturnValueOnce({}); // userRef
      doc.mockReturnValueOnce(mockTrailRef); // trailRef
      arrayUnion.mockReturnValue('arrayUnion-result');

      const result = await updateUserTrailAction(
        'user-123',
        'favourites',
        'trail-123',
        currentArray
      );

      expect(updateDoc).toHaveBeenCalledWith({}, { favourites: 'arrayUnion-result' });
      expect(result).toEqual({ action: 'add', trailId: 'trail-123' });
    });

    it('removes trail from user array when present', async () => {
      const mockTrailRef = { id: 'trail-123' };
      const currentArray = ['trail-123', 'trail-456'];

      doc.mockReturnValueOnce({}); // userRef
      doc.mockReturnValueOnce(mockTrailRef); // trailRef
      arrayRemove.mockReturnValue('arrayRemove-result');

      const result = await updateUserTrailAction(
        'user-123',
        'favourites',
        'trail-123',
        currentArray
      );

      expect(updateDoc).toHaveBeenCalledWith({}, { favourites: 'arrayRemove-result' });
      expect(result).toEqual({ action: 'remove', trailId: 'trail-123' });
    });
  });

  describe('fetchTrailReviews', () => {
    it('fetches reviews successfully', async () => {
      const mockReviews = [
        { id: '1', comment: 'Great trail!', rating: 5 },
        { id: '2', comment: 'Nice views', rating: 4 },
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reviews: mockReviews }),
      });

      const result = await fetchTrailReviews('trail-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://us-central1-orion-sdp.cloudfunctions.net/getTrailReviews?trailId=trail-123'
      );
      expect(result).toEqual(mockReviews);
    });

    it('throws error when fetch fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(fetchTrailReviews('trail-123')).rejects.toThrow('Failed to fetch reviews');
    });

    it('returns empty array when no reviews', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reviews: null }),
      });

      const result = await fetchTrailReviews('trail-123');

      expect(result).toEqual([]);
    });
  });

  describe('addTrailReview', () => {
    it('adds review successfully', async () => {
      const reviewData = {
        comment: 'Great trail!',
        rating: 5,
        userId: 'user-123',
        userName: 'Test User',
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await addTrailReview('trail-123', reviewData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"trailId":"trail-123"'),
        }
      );

      // Verify the body contains the expected review data
      const callArgs = global.fetch.mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);
      expect(bodyData.trailId).toBe('trail-123');
      expect(bodyData.review).toMatchObject({
        id: 'mock-uuid',
        comment: 'Great trail!',
        rating: 5,
        userId: 'user-123',
        userName: 'Test User',
        timestamp: expect.any(String),
      });
      expect(result).toEqual({ success: true });
    });

    it('throws error when server returns error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid review data' }),
      });

      await expect(addTrailReview('trail-123', {})).rejects.toThrow('Invalid review data');
    });

    it('throws error with status when no error message', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(addTrailReview('trail-123', {})).rejects.toThrow('Server returned 500');
    });
  });

  describe('uploadTrailImages', () => {
    it('uploads images successfully', async () => {
      const mockImages = [new File(['test1'], 'test1.jpg'), new File(['test2'], 'test2.jpg')];

      ref.mockReturnValue({});
      uploadBytes.mockResolvedValue({});
      getDownloadURL.mockResolvedValueOnce('url1').mockResolvedValueOnce('url2');

      const result = await uploadTrailImages('trail-123', mockImages);

      expect(ref).toHaveBeenCalledTimes(2);
      expect(uploadBytes).toHaveBeenCalledTimes(2);
      expect(getDownloadURL).toHaveBeenCalledTimes(2);
      expect(result).toEqual(['url1', 'url2']);
    });

    it('handles single image upload', async () => {
      const mockImages = [new File(['test'], 'test.jpg')];

      ref.mockReturnValue({});
      uploadBytes.mockResolvedValue({});
      getDownloadURL.mockResolvedValue('url1');

      const result = await uploadTrailImages('trail-123', mockImages);

      expect(result).toEqual(['url1']);
    });

    it('handles empty images array', async () => {
      const result = await uploadTrailImages('trail-123', []);

      expect(result).toEqual([]);
    });
  });

  describe('updateTrailImages', () => {
    it('updates trail images successfully', async () => {
      const photos = ['url1', 'url2'];

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await updateTrailImages('trail-123', photos);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://us-central1-orion-sdp.cloudfunctions.net/updateTrailImages',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trailId: 'trail-123',
            photos: photos,
          }),
        }
      );
      expect(result).toEqual({ success: true });
    });

    it('throws error when update fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(updateTrailImages('trail-123', [])).rejects.toThrow(
        'Failed to update trail images'
      );
    });
  });

  describe('addTrailAlert', () => {
    it('adds alert successfully', async () => {
      const alertData = {
        trailId: 'trail-123',
        message: 'Trail closed due to weather',
        severity: 'high',
      };

      collection.mockReturnValue({});
      addDoc.mockResolvedValue({ id: 'alert-123' });

      const result = await addTrailAlert(alertData);

      expect(collection).toHaveBeenCalledWith({}, 'Alerts');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          trailId: 'trail-123',
          message: 'Trail closed due to weather',
          severity: 'high',
          isActive: true,
          timestamp: { _methodName: 'serverTimestamp' },
        })
      );
      expect(result).toBe('alert-123');
    });

    it('adds timed alert with expiration', async () => {
      const alertData = {
        trailId: 'trail-123',
        message: 'Temporary closure',
        isTimed: true,
        duration: 60, // 60 minutes
      };

      collection.mockReturnValue({});
      addDoc.mockResolvedValue({ id: 'alert-123' });

      const result = await addTrailAlert(alertData);

      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          trailId: 'trail-123',
          message: 'Temporary closure',
          isTimed: true,
          duration: 60,
          isActive: true,
          timestamp: { _methodName: 'serverTimestamp' },
          expiresAt: expect.any(Date),
        })
      );
      expect(result).toBe('alert-123');
    });
  });

  describe('submitTrailReport', () => {
    it('submits report successfully', async () => {
      const reportData = {
        type: 'general',
        category: 'bug_report',
        description: 'Test report',
      };

      collection.mockReturnValue({});
      addDoc.mockResolvedValue({ id: 'report-123' });

      const result = await submitTrailReport(reportData);

      expect(collection).toHaveBeenCalledWith({}, 'Reports');
      expect(addDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          type: 'general',
          category: 'bug_report',
          description: 'Test report',
          status: 'pending',
          createdAt: { _methodName: 'serverTimestamp' },
        })
      );
      expect(result).toBe('report-123');
    });
  });

  describe('fetchWeatherData', () => {
    beforeEach(() => {
      // Mock environment variable
      process.env.REACT_APP_OPENWEATHER_API_KEY = 'test-api-key';
    });

    it('fetches weather data successfully', async () => {
      const mockWeatherResponse = {
        list: [
          {
            dt: 1640995200, // 2022-01-01 00:00:00
            main: { temp: 15, humidity: 60 },
            weather: [{ main: 'Clear' }],
            wind: { speed: 5 },
          },
          {
            dt: 1641081600, // 2022-01-02 00:00:00
            main: { temp: 20, humidity: 70 },
            weather: [{ main: 'Clouds' }],
            wind: { speed: 8 },
          },
        ],
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse),
      });

      const result = await fetchWeatherData(40.7128, -74.006);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/forecast?lat=40.7128&lon=-74.006&appid=test-api-key&units=metric'
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        date: expect.any(String),
        minTemp: expect.any(Number),
        maxTemp: expect.any(Number),
        condition: 'Clear',
        humidity: expect.any(Number),
        windSpeed: expect.any(Number),
      });
    });

    it('falls back to current weather when forecast fails', async () => {
      // First call fails
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Second call succeeds
      const mockCurrentWeather = {
        main: {
          temp_min: 10,
          temp_max: 20,
          humidity: 65,
        },
        weather: [{ main: 'Sunny' }],
        wind: { speed: 3 },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrentWeather),
      });

      const result = await fetchWeatherData(40.7128, -74.006);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.006&appid=test-api-key&units=metric'
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        date: expect.any(String),
        minTemp: 10,
        maxTemp: 20,
        condition: 'Sunny',
        humidity: 65,
        windSpeed: 3,
      });
    });

    it('throws error when both requests fail', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(fetchWeatherData(40.7128, -74.006)).rejects.toThrow(
        'Failed to fetch weather data'
      );
    });

    it('uses default API key when env var not set', async () => {
      delete process.env.REACT_APP_OPENWEATHER_API_KEY;

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ list: [] }),
      });

      await fetchWeatherData(40.7128, -74.006);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('appid=824bc28d7c314a9f031ecbe01823dbb8')
      );
    });
  });

  describe('processWeatherData', () => {
    it('processes weather data correctly', async () => {
      const mockWeatherResponse = {
        list: [
          {
            dt: 1640995200, // 2022-01-01 00:00:00
            main: { temp: 10, humidity: 50 },
            weather: [{ main: 'Clear' }],
            wind: { speed: 5 },
          },
          {
            dt: 1641009600, // 2022-01-01 04:00:00
            main: { temp: 20, humidity: 70 },
            weather: [{ main: 'Clouds' }],
            wind: { speed: 8 },
          },
          {
            dt: 1641081600, // 2022-01-02 00:00:00
            main: { temp: 15, humidity: 60 },
            weather: [{ main: 'Rain' }],
            wind: { speed: 10 },
          },
        ],
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse),
      });

      const result = await fetchWeatherData(40.7128, -74.006);

      expect(result).toHaveLength(2); // Two unique days
      expect(result[0]).toMatchObject({
        minTemp: 10,
        maxTemp: 20,
        condition: 'Clear',
        humidity: 60, // Average of 50 and 70
        windSpeed: 7, // Average of 5 and 8
      });
    });
  });
});
