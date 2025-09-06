const admin = require('firebase-admin');
const test = require('firebase-functions-test')({
  projectId: 'orion-sdp', // Your actual project ID
}, 'path/to/service-account-key.json'); // Optional: path to service account key

const myFunctions = require('../index');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn().mockResolvedValue({ id: 'test-trail-id' }),
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ data: () => ({ name: 'Test User' }) })
      }))
    })),
    GeoPoint: jest.fn((lat, lng) => ({ _latitude: lat, _longitude: lng })),
    Timestamp: {
      now: jest.fn(() => ({ _seconds: 1234567890, _nanoseconds: 123000000 }))
    }
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));

describe('Firebase Functions Tests', () => {
  let adminInitStub;

  beforeAll(() => {
    adminInitStub = jest.spyOn(admin, 'initializeApp');
  });

  afterAll(() => {
    test.cleanup();
    adminInitStub.mockRestore();
  });

  describe('helloWorld', () => {
    it('should return hello message', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await myFunctions.helloWorld(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Hello from Firebase!' });
    });
  });

  describe('getUserData (Callable Function)', () => {
    it('should return user data for authenticated user', async () => {
      const wrapped = test.wrap(myFunctions.getUserData);
      
      const data = {};
      const context = {
        auth: {
          uid: 'test-user-id'
        }
      };

      const result = await wrapped(data, context);

      expect(result).toHaveProperty('data');
    });

    it('should throw error for unauthenticated user', async () => {
      const wrapped = test.wrap(myFunctions.getUserData);
      
      const data = {};
      const context = {
        auth: null
      };

      await expect(wrapped(data, context)).rejects.toThrow('User not authenticated');
    });
  });
});
