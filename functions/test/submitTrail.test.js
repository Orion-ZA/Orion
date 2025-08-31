const admin = require('firebase-admin');

// Mock Firebase Admin with a simpler approach
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn().mockResolvedValue({ id: 'test-trail-id' }),
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ data: () => ({ name: 'Test User' }) })
      }))
    })),
    GeoPoint: class MockGeoPoint {
      constructor(lat, lng) {
        this._latitude = lat;
        this._longitude = lng;
      }
    },
    Timestamp: {
      now: jest.fn(() => ({ _seconds: 1234567890, _nanoseconds: 123000000 }))
    }
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));

// Mock firebase-functions
jest.mock('firebase-functions', () => ({
  https: {
    onRequest: jest.fn((handler) => handler),
    onCall: jest.fn((handler) => handler),
    HttpsError: jest.fn((code, message) => ({ code, message }))
  }
}));

// Mock cors
jest.mock('cors', () => {
  return jest.fn(() => (req, res, next) => {
    // Simulate CORS middleware by calling the next function directly
    next();
  });
});

// Import the function after mocking
const { submitTrail } = require('../index');

describe('submitTrail Function Tests', () => {
  const validTrailData = {
    name: 'Test Trail',
    location: { lat: 37.2695, lng: -112.9470 },
    distance: 3.2,
    elevationGain: 500,
    difficulty: 'Moderate',
    tags: ['scenic', 'forest'],
    description: 'A beautiful test trail',
    photos: ['https://example.com/photo1.jpg'],
    status: 'open'
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Validation Tests', () => {
    it('should return 405 for non-POST requests', async () => {
      const req = {
        method: 'GET',
        body: validTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method Not Allowed. Use POST.' });
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidTrailData = {
        name: 'Test Trail',
        // Missing location, distance, elevationGain, difficulty, status
      };
      
      const req = {
        method: 'POST',
        body: invalidTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        missingFields: expect.arrayContaining(['location', 'distance', 'elevationGain', 'difficulty', 'status'])
      });
    });

    it('should return 400 when location format is invalid', async () => {
      const invalidTrailData = {
        ...validTrailData,
        location: { lat: 37.2695 } // Missing lng
      };
      
      const req = {
        method: 'POST',
        body: invalidTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Location must include lat and lng coordinates'
      });
    });

    it('should return 400 when difficulty is invalid', async () => {
      const invalidTrailData = {
        ...validTrailData,
        difficulty: 'Very Hard' // Invalid difficulty
      };
      
      const req = {
        method: 'POST',
        body: invalidTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Difficulty must be one of: Easy, Moderate, Hard'
      });
    });

    it('should return 400 when status is invalid', async () => {
      const invalidTrailData = {
        ...validTrailData,
        status: 'maintenance' // Invalid status
      };
      
      const req = {
        method: 'POST',
        body: invalidTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Status must be either "open" or "closed"'
      });
    });

    it('should return 400 when distance is not a positive number', async () => {
      const invalidTrailData = {
        ...validTrailData,
        distance: -1 // Invalid distance
      };
      
      const req = {
        method: 'POST',
        body: invalidTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Distance must be a positive number'
      });
    });

    it('should return 400 when elevationGain is negative', async () => {
      const invalidTrailData = {
        ...validTrailData,
        elevationGain: -100 // Invalid elevation gain
      };
      
      const req = {
        method: 'POST',
        body: invalidTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Elevation gain must be a non-negative number'
      });
    });
  });

  describe('Success Cases', () => {
    it('should successfully submit a valid trail', async () => {
      const req = {
        method: 'POST',
        body: validTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Trail submitted successfully',
          trailId: expect.any(String),
          trail: expect.objectContaining({
            id: expect.any(String),
            name: 'Test Trail',
            distance: 3.2,
            elevationGain: 500,
            difficulty: 'Moderate',
            status: 'open',
            tags: ['scenic', 'forest'],
            description: 'A beautiful test trail',
            photos: ['https://example.com/photo1.jpg'],
            createdBy: null
          })
        })
      );
    });

    it('should handle optional fields with default values', async () => {
      const minimalTrailData = {
        name: 'Minimal Trail',
        location: { lat: 37.2695, lng: -112.9470 },
        distance: 2.0,
        elevationGain: 200,
        difficulty: 'Easy',
        status: 'open'
        // No optional fields provided
      };
      
      const req = {
        method: 'POST',
        body: minimalTrailData,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          trail: expect.objectContaining({
            tags: [],
            description: '',
            photos: [],
            gpsRoute: []
          })
        })
      );
    });

    it('should handle GPS route with proper GeoPoint conversion', async () => {
      const trailWithGPSRoute = {
        ...validTrailData,
        gpsRoute: [
          { lat: 37.2695, lng: -112.9470 },
          { lat: 37.2700, lng: -112.9465 }
        ]
      };
      
      const req = {
        method: 'POST',
        body: trailWithGPSRoute,
        headers: { origin: 'http://localhost:3000' }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          trail: expect.objectContaining({
            gpsRoute: expect.arrayContaining([
              expect.objectContaining({
                _latitude: 37.2695,
                _longitude: -112.9470
              }),
              expect.objectContaining({
                _latitude: 37.2700,
                _longitude: -112.9465
              })
            ])
          })
        })
      );
    });
  });

  describe('Authentication Tests', () => {
    it('should handle authentication when valid token is provided', async () => {
      // Mock successful auth verification
      const mockVerifyIdToken = admin.auth().verifyIdToken;
      mockVerifyIdToken.mockResolvedValue({ uid: 'test-user-123' });

      const req = {
        method: 'POST',
        body: validTrailData,
        headers: { 
          origin: 'http://localhost:3000',
          authorization: 'Bearer valid-token-123'
        }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token-123');
    });

    it('should handle invalid authentication token gracefully', async () => {
      // Mock failed auth verification
      const mockVerifyIdToken = admin.auth().verifyIdToken;
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const req = {
        method: 'POST',
        body: validTrailData,
        headers: { 
          origin: 'http://localhost:3000',
          authorization: 'Bearer invalid-token'
        }
      };
      
      const res = {
        setHeader: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitTrail(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          trail: expect.objectContaining({
            createdBy: null // Should remain null when auth fails
          })
        })
      );
    });
  });
});
