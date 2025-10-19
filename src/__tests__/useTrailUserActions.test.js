import { renderHook, act } from '@testing-library/react';
import { useTrailUserActions } from '../hooks/useTrailUserActions';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {},
}));

// Mock Toast context
jest.mock('../components/ToastContext', () => ({
  useToast: jest.fn(() => ({
    show: jest.fn(),
  })),
}));

// Mock trail API
jest.mock('../utils/trailApi', () => ({
  updateUserTrailAction: jest.fn(),
}));

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '../components/ToastContext';
import { updateUserTrailAction } from '../utils/trailApi';

describe('useTrailUserActions', () => {
  const mockUser = {
    uid: 'user-123',
    displayName: 'Test User',
    email: 'test@example.com',
  };

  const mockUserDoc = {
    exists: () => true,
    data: () => ({
      favourites: ['trail-1', 'trail-2'],
      wishlist: ['trail-3'],
      completed: ['trail-4'],
    }),
  };

  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useToast.mockReturnValue({ show: mockShowToast });

    // Default mock implementation that simulates authenticated user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Simulate authenticated user
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });

    getDoc.mockResolvedValue(mockUserDoc);
    updateUserTrailAction.mockResolvedValue({ action: 'add', trailId: 'trail-5' });
  });

  describe('Initial State', () => {
    it('initializes with default values', async () => {
      // Mock auth state to not immediately call callback
      onAuthStateChanged.mockImplementation((auth, callback) => {
        // Don't call callback immediately to test initial state
        return jest.fn(); // unsubscribe function
      });

      const { result } = renderHook(() => useTrailUserActions());

      expect(result.current.user).toBe(null);
      expect(result.current.userSaved).toEqual({
        favourites: [],
        wishlist: [],
        completed: [],
      });
    });
  });

  describe('User Authentication', () => {
    it('sets user when authenticated', async () => {
      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('sets user to null when not authenticated', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toBe(null);
      expect(result.current.userSaved).toEqual({
        favourites: [],
        wishlist: [],
        completed: [],
      });
    });
  });

  describe('User Data Processing', () => {
    it('processes user saved trails correctly', async () => {
      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved).toEqual({
        favourites: ['trail-1', 'trail-2'],
        wishlist: ['trail-3'],
        completed: ['trail-4'],
      });
    });

    it('handles string array items', async () => {
      const userDocWithStrings = {
        exists: () => true,
        data: () => ({
          favourites: ['trail-1', 'trail-2'],
          wishlist: [],
          completed: [],
        }),
      };
      getDoc.mockResolvedValue(userDocWithStrings);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved.favourites).toEqual(['trail-1', 'trail-2']);
    });

    it('handles object array items with id', async () => {
      const userDocWithObjects = {
        exists: () => true,
        data: () => ({
          favourites: [{ id: 'trail-1' }, { id: 'trail-2' }],
          wishlist: [],
          completed: [],
        }),
      };
      getDoc.mockResolvedValue(userDocWithObjects);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved.favourites).toEqual(['trail-1', 'trail-2']);
    });

    it('handles object array items with _key path', async () => {
      const userDocWithKeyPath = {
        exists: () => true,
        data: () => ({
          favourites: [
            {
              _key: {
                path: {
                  segments: ['Trails', 'trail-key-path'],
                },
              },
            },
          ],
          wishlist: [],
          completed: [],
        }),
      };
      getDoc.mockResolvedValue(userDocWithKeyPath);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved.favourites).toEqual(['trail-key-path']);
    });

    it('handles object array items with path string', async () => {
      const userDocWithPathString = {
        exists: () => true,
        data: () => ({
          favourites: [{ path: 'Trails/trail-path-string' }],
          wishlist: [],
          completed: [],
        }),
      };
      getDoc.mockResolvedValue(userDocWithPathString);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved.favourites).toEqual(['trail-path-string']);
    });

    it('handles unknown item formats', async () => {
      const userDocWithUnknownFormat = {
        exists: () => true,
        data: () => ({
          favourites: [{ unknown: 'format' }],
          wishlist: [],
          completed: [],
        }),
      };
      getDoc.mockResolvedValue(userDocWithUnknownFormat);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved.favourites).toEqual([]);
    });

    it('handles non-array data', async () => {
      const userDocWithNonArray = {
        exists: () => true,
        data: () => ({
          favourites: 'not-an-array',
          wishlist: null,
          completed: undefined,
        }),
      };
      getDoc.mockResolvedValue(userDocWithNonArray);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved).toEqual({
        favourites: [],
        wishlist: [],
        completed: [],
      });
    });

    it('handles user document not found', async () => {
      getDoc.mockResolvedValue({ exists: () => false });

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved).toEqual({
        favourites: [],
        wishlist: [],
        completed: [],
      });
    });

    it('handles user data fetch errors', async () => {
      getDoc.mockRejectedValue(new Error('Firestore error'));

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved).toEqual({
        favourites: [],
        wishlist: [],
        completed: [],
      });
    });
  });

  describe('Trail Actions', () => {
    it('handles trail action when user is not logged in', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.handleTrailAction('favourites', 'trail-5');
      });

      expect(mockShowToast).toHaveBeenCalledWith('Please log in to save trails', 'error');
      expect(updateUserTrailAction).not.toHaveBeenCalled();
    });

    it('adds trail to favourites', async () => {
      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.handleTrailAction('favourites', 'trail-5');
      });

      expect(updateUserTrailAction).toHaveBeenCalledWith('user-123', 'favourites', 'trail-5', [
        'trail-1',
        'trail-2',
      ]);
      expect(result.current.userSaved.favourites).toContain('trail-5');
      expect(mockShowToast).toHaveBeenCalledWith('Added to favourites', 'success');
    });

    it('removes trail from favourites', async () => {
      updateUserTrailAction.mockResolvedValue({ action: 'remove', trailId: 'trail-1' });

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.handleTrailAction('favourites', 'trail-1');
      });

      expect(result.current.userSaved.favourites).not.toContain('trail-1');
      expect(mockShowToast).toHaveBeenCalledWith('Removed from favourites', 'success');
    });

    it('handles wishlist actions', async () => {
      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.handleTrailAction('wishlist', 'trail-6');
      });

      expect(updateUserTrailAction).toHaveBeenCalledWith('user-123', 'wishlist', 'trail-6', [
        'trail-3',
      ]);
      expect(result.current.userSaved.wishlist).toContain('trail-6');
      expect(mockShowToast).toHaveBeenCalledWith('Added to wishlist', 'success');
    });

    it('handles completed actions', async () => {
      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.handleTrailAction('completed', 'trail-7');
      });

      expect(updateUserTrailAction).toHaveBeenCalledWith('user-123', 'completed', 'trail-7', [
        'trail-4',
      ]);
      expect(result.current.userSaved.completed).toContain('trail-7');
      expect(mockShowToast).toHaveBeenCalledWith('Added to completed', 'success');
    });

    it('handles trail action errors', async () => {
      updateUserTrailAction.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.handleTrailAction('favourites', 'trail-5');
      });

      expect(mockShowToast).toHaveBeenCalledWith('Failed to update favourites', 'error');
    });

    it('handles empty current array', async () => {
      const userDocWithEmptyArrays = {
        exists: () => true,
        data: () => ({
          favourites: [],
          wishlist: [],
          completed: [],
        }),
      };
      getDoc.mockResolvedValue(userDocWithEmptyArrays);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.handleTrailAction('favourites', 'trail-8');
      });

      expect(updateUserTrailAction).toHaveBeenCalledWith('user-123', 'favourites', 'trail-8', []);
    });
  });

  describe('Cleanup', () => {
    it('unsubscribes from auth state changes on unmount', () => {
      const unsubscribe = jest.fn();
      onAuthStateChanged.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useTrailUserActions());

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user data fields', async () => {
      const userDocWithMissingFields = {
        exists: () => true,
        data: () => ({}),
      };
      getDoc.mockResolvedValue(userDocWithMissingFields);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved).toEqual({
        favourites: [],
        wishlist: [],
        completed: [],
      });
    });

    it('handles empty user data object', async () => {
      const userDocWithEmptyData = {
        exists: () => true,
        data: () => ({}),
      };
      getDoc.mockResolvedValue(userDocWithEmptyData);

      const { result } = renderHook(() => useTrailUserActions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userSaved).toEqual({
        favourites: [],
        wishlist: [],
        completed: [],
      });
    });
  });
});
