// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        forEach: jest.fn((callback) => {
          callback({
            id: 'test-id',
            data: () => ({ name: 'Test Trail', difficulty: 'easy' })
          });
        })
      }),
      add: jest.fn().mockResolvedValue({ id: 'new-item-id' }),
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: () => ({ name: 'Test User' })
        })
      }))
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date())
    }
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore)
  };
});

// Global test setup
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};
