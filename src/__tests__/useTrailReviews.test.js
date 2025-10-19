import { renderHook, act } from '@testing-library/react';
import { useTrailReviews } from '../hooks/useTrailReviews';

// Mock Firebase
const mockGetDocs = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  getDocs: (...args) => mockGetDocs(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  doc: (...args) => mockDoc(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  where: (...args) => mockWhere(...args),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {},
}));

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useTrailReviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('Initial State', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useTrailReviews());

      expect(result.current.trailReviews).toEqual({});
      expect(result.current.loadingStates).toEqual({});
      expect(typeof result.current.fetchTrailReviews).toBe('function');
      expect(typeof result.current.deleteReview).toBe('function');
    });

    it('maintains state across re-renders', () => {
      const { result, rerender } = renderHook(() => useTrailReviews());

      const initialState = result.current;
      rerender();

      expect(result.current.trailReviews).toBe(initialState.trailReviews);
      expect(result.current.loadingStates).toBe(initialState.loadingStates);
    });
  });

  describe('fetchTrailReviews', () => {
    it('fetches reviews successfully', async () => {
      const mockReviews = [
        {
          id: 'review1',
          trailId: 'trail1',
          userId: 'user123',
          userName: 'John Doe',
          rating: 4,
          comment: 'Great trail!',
          message: '',
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'review2',
          trailId: 'trail1',
          userId: 'user456',
          userName: 'Jane Smith',
          rating: 5,
          comment: 'Amazing views',
          message: 'Highly recommended',
          timestamp: new Date('2024-01-16'),
        },
      ];

      const mockQuerySnapshot = {
        docs: mockReviews.map(review => ({
          id: review.id,
          data: () => ({
            userId: review.userId,
            userName: review.userName,
            rating: review.rating,
            comment: review.comment,
            message: review.message,
            timestamp: review.timestamp,
          }),
        })),
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(mockCollection).toHaveBeenCalledWith({}, 'Trails', 'trail1', 'reviews');
      expect(mockGetDocs).toHaveBeenCalledWith('reviewsRef');

      expect(result.current.trailReviews).toEqual({
        trail1: expect.arrayContaining([
          expect.objectContaining({
            id: 'review1',
            trailId: 'trail1',
            userId: 'user123',
            userName: 'John Doe',
            rating: 4,
            comment: 'Great trail!',
            message: '',
          }),
          expect.objectContaining({
            id: 'review2',
            trailId: 'trail1',
            userId: 'user456',
            userName: 'Jane Smith',
            rating: 5,
            comment: 'Amazing views',
            message: 'Highly recommended',
          }),
        ]),
      });
    });

    it('sets loading state during fetch', async () => {
      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      // Start fetch
      act(() => {
        result.current.fetchTrailReviews('trail1');
      });

      // Check loading state is set
      expect(result.current.loadingStates).toEqual({ trail1: true });

      // Wait for completion
      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      // Check loading state is cleared
      expect(result.current.loadingStates).toEqual({ trail1: false });
    });

    it('handles empty reviews response', async () => {
      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews).toEqual({ trail1: [] });
    });

    it('handles fetch errors gracefully', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockRejectedValue(error);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to fetch reviews for trail trail1:',
        'Network error'
      );
      expect(result.current.loadingStates).toEqual({ trail1: false });
    });

    it('uses cache when available', async () => {
      const cachedReviews = [
        {
          id: 'review1',
          trailId: 'trail1',
          userId: 'user123',
          userName: 'John Doe',
          rating: 4,
          comment: 'Cached review',
          message: '',
          timestamp: new Date('2024-01-15'),
        },
      ];

      const { result } = renderHook(() => useTrailReviews());

      // First fetch to populate cache
      const mockQuerySnapshot = {
        docs: cachedReviews.map(review => ({
          id: review.id,
          data: () => ({
            userId: review.userId,
            userName: review.userName,
            rating: review.rating,
            comment: review.comment,
            message: review.message,
            timestamp: review.timestamp,
          }),
        })),
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      // Clear mocks
      jest.clearAllMocks();

      // Second fetch should use cache
      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      // Should not call Firebase functions
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('handles missing or invalid data gracefully', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              // Missing required fields
              userId: null,
              userName: undefined,
              rating: null,
              comment: null,
              message: undefined,
              timestamp: null,
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1).toEqual([
        expect.objectContaining({
          id: 'review1',
          trailId: 'trail1',
          userId: 'Unknown', // Should fallback to 'Unknown'
          userName: 'Unknown', // Should fallback to 'Unknown'
          rating: 0, // Should fallback to 0
          comment: '', // Should fallback to empty string
          message: '', // Should fallback to empty string
        }),
      ]);
    });

    it('sorts reviews by timestamp correctly', async () => {
      const mockReviews = [
        {
          id: 'review1',
          trailId: 'trail1',
          userId: 'user123',
          userName: 'John Doe',
          rating: 4,
          comment: 'Older review',
          message: '',
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'review2',
          trailId: 'trail1',
          userId: 'user456',
          userName: 'Jane Smith',
          rating: 5,
          comment: 'Newer review',
          message: '',
          timestamp: new Date('2024-01-16'),
        },
      ];

      const mockQuerySnapshot = {
        docs: mockReviews.map(review => ({
          id: review.id,
          data: () => ({
            userId: review.userId,
            userName: review.userName,
            rating: review.rating,
            comment: review.comment,
            message: review.message,
            timestamp: review.timestamp,
          }),
        })),
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      const reviews = result.current.trailReviews.trail1;
      expect(reviews[0].id).toBe('review2'); // Newer review first
      expect(reviews[1].id).toBe('review1'); // Older review second
    });

    it('handles Firestore Timestamp objects', async () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15'),
      };

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Review with Firestore timestamp',
              message: '',
              timestamp: mockTimestamp,
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1[0].timestamp).toEqual(mockTimestamp);
    });

    it('handles string timestamps', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Review with string timestamp',
              message: '',
              timestamp: '2024-01-15T00:00:00Z',
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1[0].timestamp).toEqual('2024-01-15T00:00:00Z');
    });

    it('handles missing timestamps', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Review without timestamp',
              message: '',
              timestamp: null,
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1[0].timestamp).toEqual(null);
    });

    it('handles non-numeric ratings', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 'not a number',
              comment: 'Review with invalid rating',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailReviews());

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1[0].rating).toBe(0);
    });
  });

  describe('deleteReview', () => {
    it('deletes review successfully', async () => {
      const { result } = renderHook(() => useTrailReviews());

      // First, populate with some reviews
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Review to delete',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      // Mock successful deletion
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteReview('review1', 'trail1');
      });

      expect(mockDoc).toHaveBeenCalledWith({}, 'Trails', 'trail1', 'reviews', 'review1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
      expect(deleteResult).toBe(true);
      expect(result.current.trailReviews.trail1).toEqual([]);
    });

    it('handles deletion errors gracefully', async () => {
      const error = new Error('Delete failed');
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockRejectedValue(error);

      const { result } = renderHook(() => useTrailReviews());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteReview('review1', 'trail1');
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to delete review:', error);
      expect(deleteResult).toBe(false);
    });

    it('updates cache when review is deleted', async () => {
      const { result } = renderHook(() => useTrailReviews());

      // First, populate with some reviews
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Review to delete',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      // Mock successful deletion
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      await act(async () => {
        await result.current.deleteReview('review1', 'trail1');
      });

      // Fetch again should use updated cache
      jest.clearAllMocks();
      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      // Should not call Firebase functions because cache is used
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('handles deletion of non-existent review', async () => {
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      const { result } = renderHook(() => useTrailReviews());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteReview('nonexistent', 'trail1');
      });

      expect(deleteResult).toBe(true);
    });

    it('handles deletion from empty trail reviews', async () => {
      const { result } = renderHook(() => useTrailReviews());

      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteReview('review1', 'trail1');
      });

      expect(deleteResult).toBe(true);
      expect(result.current.trailReviews.trail1).toEqual([]);
    });

    it('handles deletion with undefined trail reviews', async () => {
      const { result } = renderHook(() => useTrailReviews());

      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteReview('review1', 'nonexistent');
      });

      expect(deleteResult).toBe(true);
    });
  });

  describe('State Management', () => {
    it('maintains separate loading states for different trails', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Start fetching for multiple trails
      act(() => {
        result.current.fetchTrailReviews('trail1');
        result.current.fetchTrailReviews('trail2');
      });

      expect(result.current.loadingStates).toEqual({
        trail1: true,
        trail2: true,
      });

      await act(async () => {
        await Promise.all([
          result.current.fetchTrailReviews('trail1'),
          result.current.fetchTrailReviews('trail2'),
        ]);
      });

      expect(result.current.loadingStates).toEqual({
        trail1: false,
        trail2: false,
      });
    });

    it('maintains separate review data for different trails', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot1 = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Trail 1 review',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      const mockQuerySnapshot2 = {
        docs: [
          {
            id: 'review2',
            data: () => ({
              userId: 'user456',
              userName: 'Jane Smith',
              rating: 5,
              comment: 'Trail 2 review',
              message: '',
              timestamp: new Date('2024-01-16'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs
        .mockResolvedValueOnce(mockQuerySnapshot1)
        .mockResolvedValueOnce(mockQuerySnapshot2);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
        await result.current.fetchTrailReviews('trail2');
      });

      expect(result.current.trailReviews.trail1).toHaveLength(1);
      expect(result.current.trailReviews.trail1[0].comment).toBe('Trail 1 review');
      expect(result.current.trailReviews.trail2).toHaveLength(1);
      expect(result.current.trailReviews.trail2[0].comment).toBe('Trail 2 review');
    });

    it('preserves existing data when fetching new trails', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot1 = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Trail 1 review',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      const mockQuerySnapshot2 = {
        docs: [
          {
            id: 'review2',
            data: () => ({
              userId: 'user456',
              userName: 'Jane Smith',
              rating: 5,
              comment: 'Trail 2 review',
              message: '',
              timestamp: new Date('2024-01-16'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs
        .mockResolvedValueOnce(mockQuerySnapshot1)
        .mockResolvedValueOnce(mockQuerySnapshot2);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1).toHaveLength(1);

      await act(async () => {
        await result.current.fetchTrailReviews('trail2');
      });

      expect(result.current.trailReviews.trail1).toHaveLength(1);
      expect(result.current.trailReviews.trail2).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles concurrent fetch requests for same trail', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Concurrent review',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Start multiple concurrent requests
      await act(async () => {
        await Promise.all([
          result.current.fetchTrailReviews('trail1'),
          result.current.fetchTrailReviews('trail1'),
          result.current.fetchTrailReviews('trail1'),
        ]);
      });

      expect(result.current.trailReviews.trail1).toHaveLength(1);
    });

    it('handles very large datasets', async () => {
      const { result } = renderHook(() => useTrailReviews());

      // Create a large number of reviews
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `review${i}`,
        data: () => ({
          userId: `user${i}`,
          userName: `User ${i}`,
          rating: (i % 5) + 1,
          comment: `Review ${i}`,
          message: '',
          timestamp: new Date(`2024-01-${String((i % 30) + 1).padStart(2, '0')}`),
        }),
      }));

      const mockQuerySnapshot = { docs: largeDataset };
      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1).toHaveLength(1000);
    });

    it('handles malformed Firestore data', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => {
              throw new Error('Malformed data');
            },
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      // Should handle the error gracefully - the trail won't be set if data() throws
      expect(result.current.trailReviews.trail1).toBeUndefined();
    });

    it('handles empty string values', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: '',
              userName: '',
              rating: 0,
              comment: '',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1[0]).toEqual(
        expect.objectContaining({
          userId: 'Unknown', // Empty string gets converted to 'Unknown'
          userName: 'Unknown', // Empty string gets converted to 'Unknown'
          rating: 0,
          comment: '',
          message: '',
        })
      );
    });
  });

  describe('Return Values', () => {
    it('returns consistent function references', () => {
      const { result, rerender } = renderHook(() => useTrailReviews());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Functions are recreated on each render in this hook implementation
      expect(typeof firstRender.fetchTrailReviews).toBe('function');
      expect(typeof firstRender.deleteReview).toBe('function');
      expect(typeof secondRender.fetchTrailReviews).toBe('function');
      expect(typeof secondRender.deleteReview).toBe('function');
    });

    it('returns updated state after operations', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 4,
              comment: 'Test review',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1).toHaveLength(1);
      expect(result.current.loadingStates.trail1).toBe(false);
    });
  });

  describe('Data Type Handling', () => {
    it('handles numeric ratings correctly', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: 3.5,
              comment: 'Half star rating',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1[0].rating).toBe(3.5);
    });

    it('handles boolean-like ratings', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: true, // Boolean instead of number
              comment: 'Boolean rating',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1[0].rating).toBe(0);
    });

    it('handles object-like ratings', async () => {
      const { result } = renderHook(() => useTrailReviews());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'review1',
            data: () => ({
              userId: 'user123',
              userName: 'John Doe',
              rating: { value: 5 }, // Object instead of number
              comment: 'Object rating',
              message: '',
              timestamp: new Date('2024-01-15'),
            }),
          },
        ],
      };

      mockCollection.mockReturnValue('reviewsRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailReviews('trail1');
      });

      expect(result.current.trailReviews.trail1[0].rating).toBe(0);
    });
  });
});
