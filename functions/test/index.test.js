const admin = require('firebase-admin');
const test = require('firebase-functions-test')({
  projectId: 'orion-sdp', // Your actual project ID
}, 'path/to/service-account-key.json'); // Optional: path to service account key

const myFunctions = require('../index');

describe('Firebase Functions Tests', () => {
  let adminInitStub;

  beforeAll(() => {
    adminInitStub = jest.spyOn(admin, 'initializeApp');
  });

  afterAll(() => {
    test.cleanup();
    adminInitStub.mockRestore();
  });

  describe('getTrails', () => {
    it('should return all trails when no query parameters are provided', async () => {
      const req = {
        method: 'GET',
        query: {}
      };
      
      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await myFunctions.getTrails(req, res);

      expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 405 for non-GET requests', async () => {
      const req = {
        method: 'POST',
        query: {}
      };
      
      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await myFunctions.getTrails(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
    });
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
