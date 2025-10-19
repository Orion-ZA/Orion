import { renderHook, act } from '@testing-library/react';
import { useTrailData } from '../hooks/useTrailData';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {},
}));

// Mock trail API
jest.mock('../utils/trailApi', () => ({
  fetchTrailData: jest.fn(),
}));

import { useParams, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { fetchTrailData } from '../utils/trailApi';

describe('useTrailData', () => {
  const mockTrail = {
    id: 'test-trail-id',
    name: 'Test Trail',
    description: 'A beautiful trail',
    createdBy: 'user-123',
  };

  const mockUserDoc = {
    exists: () => true,
    data: () => ({
      profileInfo: { displayName: 'John Doe' },
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ trailId: 'test-trail-id' });
    useLocation.mockReturnValue({ state: null });
    fetchTrailData.mockResolvedValue(mockTrail);
    getDoc.mockResolvedValue(mockUserDoc);
  });

  describe('Initial State', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useTrailData());

      expect(result.current.trail).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.authorName).toBe('Unknown');
    });
  });

  describe('Trail Loading from State', () => {
    it('uses trail from navigation state when available', async () => {
      const trailFromState = { ...mockTrail, name: 'Trail from State' };
      useLocation.mockReturnValue({ state: { trail: trailFromState } });

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.trail).toEqual(trailFromState);
      expect(result.current.loading).toBe(false);
      expect(fetchTrailData).not.toHaveBeenCalled();
    });
  });

  describe('Trail Loading from API', () => {
    it('fetches trail data when no state available', async () => {
      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchTrailData).toHaveBeenCalledWith('test-trail-id');
      expect(result.current.trail).toEqual(mockTrail);
      expect(result.current.loading).toBe(false);
    });

    it('handles fetch trail data errors', async () => {
      fetchTrailData.mockRejectedValue(new Error('Trail not found'));

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('Failed to load trail');
      expect(result.current.loading).toBe(false);
    });

    it('sets error when no trail ID provided', async () => {
      useParams.mockReturnValue({ trailId: null });

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('Invalid trail ID');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Author Name Resolution', () => {
    it('fetches author name from Firestore', async () => {
      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(getDoc).toHaveBeenCalledWith(doc({}, 'Users', 'user-123'));
      expect(result.current.authorName).toBe('John Doe');
    });

    it('handles missing createdBy field', async () => {
      const trailWithoutAuthor = { ...mockTrail, createdBy: null };
      fetchTrailData.mockResolvedValue(trailWithoutAuthor);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authorName).toBe('Unknown');
    });

    it('handles string createdBy field', async () => {
      const trailWithStringAuthor = { ...mockTrail, createdBy: 'user-456' };
      fetchTrailData.mockResolvedValue(trailWithStringAuthor);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(getDoc).toHaveBeenCalledWith(doc({}, 'Users', 'user-456'));
    });

    it('handles createdBy with path segments', async () => {
      const trailWithPathAuthor = {
        ...mockTrail,
        createdBy: {
          _key: {
            path: {
              segments: ['Users', 'user-789'],
            },
          },
        },
      };
      fetchTrailData.mockResolvedValue(trailWithPathAuthor);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(getDoc).toHaveBeenCalledWith(doc({}, 'Users', 'user-789'));
    });

    it('handles createdBy with _path segments', async () => {
      const trailWithPathAuthor = {
        ...mockTrail,
        createdBy: {
          _path: {
            segments: ['Users', 'user-path'],
          },
        },
      };
      fetchTrailData.mockResolvedValue(trailWithPathAuthor);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(getDoc).toHaveBeenCalledWith(doc({}, 'Users', 'user-path'));
    });

    it('handles createdBy with id field', async () => {
      const trailWithIdAuthor = {
        ...mockTrail,
        createdBy: { id: 'user-id-field' },
      };
      fetchTrailData.mockResolvedValue(trailWithIdAuthor);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(getDoc).toHaveBeenCalledWith(doc({}, 'Users', 'user-id-field'));
    });

    it('handles sample user', async () => {
      const trailWithSampleUser = { ...mockTrail, createdBy: 'sample' };
      fetchTrailData.mockResolvedValue(trailWithSampleUser);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authorName).toBe('Sample User');
    });

    it('handles user document not found', async () => {
      getDoc.mockResolvedValue({ exists: () => false });

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authorName).toBe('Unknown');
    });

    it('handles author name from different user data fields', async () => {
      const userDocWithDisplayName = {
        exists: () => true,
        data: () => ({
          displayName: 'Display Name User',
        }),
      };
      getDoc.mockResolvedValue(userDocWithDisplayName);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authorName).toBe('Display Name User');
    });

    it('handles author name from name field', async () => {
      const userDocWithName = {
        exists: () => true,
        data: () => ({
          name: 'Name Field User',
        }),
      };
      getDoc.mockResolvedValue(userDocWithName);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authorName).toBe('Name Field User');
    });

    it('handles author fetch errors', async () => {
      getDoc.mockRejectedValue(new Error('Firestore error'));

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authorName).toBe('Unknown');
    });
  });

  describe('Effect Dependencies', () => {
    it('refetches when trailId changes', async () => {
      const { result, rerender } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchTrailData).toHaveBeenCalledWith('test-trail-id');

      useParams.mockReturnValue({ trailId: 'new-trail-id' });
      rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchTrailData).toHaveBeenCalledWith('new-trail-id');
    });

    it('refetches when location state changes', async () => {
      const { result, rerender } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetchTrailData).toHaveBeenCalledWith('test-trail-id');

      useLocation.mockReturnValue({ state: { trail: mockTrail } });
      rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.trail).toEqual(mockTrail);
      expect(fetchTrailData).toHaveBeenCalledTimes(1); // Should not call again
    });
  });

  describe('Manual Trail Updates', () => {
    it('allows manual trail updates', () => {
      const { result } = renderHook(() => useTrailData());

      act(() => {
        result.current.setTrail(mockTrail);
      });

      expect(result.current.trail).toEqual(mockTrail);
    });
  });

  describe('Edge Cases', () => {
    it('handles createdBy with unknown object format', async () => {
      const trailWithUnknownFormat = {
        ...mockTrail,
        createdBy: { unknown: 'format' },
      };
      fetchTrailData.mockResolvedValue(trailWithUnknownFormat);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authorName).toBe('Unknown');
    });

    it('handles createdBy with invalid uid', async () => {
      const trailWithInvalidUid = {
        ...mockTrail,
        createdBy: { id: 123 }, // Not a string
      };
      fetchTrailData.mockResolvedValue(trailWithInvalidUid);

      const { result } = renderHook(() => useTrailData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authorName).toBe('Unknown');
    });
  });
});
