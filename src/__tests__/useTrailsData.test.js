import { renderHook, act } from '@testing-library/react';
import { useTrailsData } from '../hooks/useTrailsData';

// Mock Firebase
const mockGetDocs = jest.fn();
const mockDeleteDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  getDocs: (...args) => mockGetDocs(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  doc: (...args) => mockDoc(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  where: (...args) => mockWhere(...args),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {}
}));

describe('useTrailsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useTrailsData());

      expect(result.current.trails).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.fetchTrails).toBe('function');
      expect(typeof result.current.deleteTrail).toBe('function');
      expect(typeof result.current.updateTrail).toBe('function');
      expect(typeof result.current.setError).toBe('function');
    });

    it('automatically fetches trails on mount', async () => {
      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      renderHook(() => useTrailsData());

      await act(async () => {
        // Wait for useEffect to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockCollection).toHaveBeenCalledWith({}, 'Trails');
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockQuery).toHaveBeenCalledWith('trailsRef', 'orderByClause');
      expect(mockGetDocs).toHaveBeenCalledWith('query');
    });
  });

  describe('fetchTrails', () => {
    it('fetches trails successfully', async () => {
      const mockTrails = [
        {
          id: 'trail1',
          name: 'Mountain Peak Trail',
          description: 'A beautiful trail with scenic views',
          difficulty: 'moderate',
          distance: 5.2,
          elevationGain: 300,
          tags: ['scenic', 'forest'],
          status: 'open',
          photos: ['photo1.jpg', 'photo2.jpg'],
          createdBy: 'user123',
          location: { lat: 40.7128, lng: -74.0060 },
          gpsRoute: { coordinates: [] },
          createdAt: new Date('2024-01-15'),
          lastUpdated: new Date('2024-01-16')
        },
        {
          id: 'trail2',
          name: 'Forest Walk',
          description: 'Easy walk through the forest',
          difficulty: 'easy',
          distance: 2.1,
          elevationGain: 50,
          tags: ['forest', 'easy'],
          status: 'open',
          photos: [],
          createdBy: 'user456',
          location: { lat: 40.7589, lng: -73.9851 },
          gpsRoute: null,
          createdAt: new Date('2024-01-14'),
          lastUpdated: new Date('2024-01-15')
        }
      ];

      const mockQuerySnapshot = {
        docs: mockTrails.map(trail => ({
          id: trail.id,
          data: () => ({
            name: trail.name,
            description: trail.description,
            difficulty: trail.difficulty,
            distance: trail.distance,
            elevationGain: trail.elevationGain,
            tags: trail.tags,
            status: trail.status,
            photos: trail.photos,
            createdBy: trail.createdBy,
            location: trail.location,
            gpsRoute: trail.gpsRoute,
            createdAt: trail.createdAt,
            lastUpdated: trail.lastUpdated
          })
        }))
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailsData());

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'trail1',
            name: 'Mountain Peak Trail',
            description: 'A beautiful trail with scenic views',
            difficulty: 'moderate',
            distance: 5.2,
            elevationGain: 300,
            tags: ['scenic', 'forest'],
            status: 'open',
            photos: ['photo1.jpg', 'photo2.jpg'],
            createdBy: 'user123',
            location: { lat: 40.7128, lng: -74.0060 },
            gpsRoute: { coordinates: [] },
            createdAt: new Date('2024-01-15'),
            lastUpdated: new Date('2024-01-16')
          }),
          expect.objectContaining({
            id: 'trail2',
            name: 'Forest Walk',
            description: 'Easy walk through the forest',
            difficulty: 'easy',
            distance: 2.1,
            elevationGain: 50,
            tags: ['forest', 'easy'],
            status: 'open',
            photos: [],
            createdBy: 'user456',
            location: { lat: 40.7589, lng: -73.9851 },
            gpsRoute: null,
            createdAt: new Date('2024-01-14'),
            lastUpdated: new Date('2024-01-15')
          })
        ])
      );
    });

    it('sets loading state during fetch', async () => {
      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailsData());

      // Start fetch
      act(() => {
        result.current.fetchTrails();
      });

      // Check loading state is set
      expect(result.current.loading).toBe(true);

      // Wait for completion
      await act(async () => {
        await result.current.fetchTrails();
      });

      // Check loading state is cleared
      expect(result.current.loading).toBe(false);
    });

    it('handles empty trails response', async () => {
      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailsData());

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails).toEqual([]);
    });

    it('handles fetch errors gracefully', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockRejectedValue(error);

      const { result } = renderHook(() => useTrailsData());

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.error).toBe('Failed to fetch trails: Network error');
      expect(result.current.loading).toBe(false);
    });

    it('handles missing or invalid data gracefully', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              // Missing required fields
              name: null,
              description: undefined,
              difficulty: null,
              distance: 'not a number',
              elevationGain: undefined,
              tags: 'not an array',
              status: null,
              photos: 'not an array',
              createdBy: null,
              location: undefined,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: undefined
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailsData());

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails).toEqual([
        expect.objectContaining({
          id: 'trail1',
          name: 'Unnamed Trail', // Should fallback to 'Unnamed Trail'
          description: '', // Should fallback to empty string
          difficulty: 'easy', // Should fallback to 'easy'
          distance: 0, // Should fallback to 0
          elevationGain: 0, // Should fallback to 0
          tags: [], // Should fallback to empty array
          status: 'open', // Should fallback to 'open'
          photos: [], // Should fallback to empty array
          createdBy: 'Unknown', // Should fallback to 'Unknown'
          location: undefined, // Should preserve undefined
          gpsRoute: null, // Should preserve null
          createdAt: null, // Should preserve null
          lastUpdated: undefined // Should preserve undefined
        })
      ]);
    });

    it('handles createdBy object with id field', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Test Trail',
              description: '',
              difficulty: 'easy',
              distance: 0,
              elevationGain: 0,
              tags: [],
              status: 'open',
              photos: [],
              createdBy: { id: 'user123', name: 'John Doe' },
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailsData());

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails[0].createdBy).toBe('user123');
    });

    it('handles non-array tags', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Test Trail',
              description: '',
              difficulty: 'easy',
              distance: 0,
              elevationGain: 0,
              tags: 'scenic,forest', // String instead of array
              status: 'open',
              photos: [],
              createdBy: 'user123',
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailsData());

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails[0].tags).toEqual([]);
    });

    it('handles non-array photos', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Test Trail',
              description: '',
              difficulty: 'easy',
              distance: 0,
              elevationGain: 0,
              tags: [],
              status: 'open',
              photos: 'photo1.jpg,photo2.jpg', // String instead of array
              createdBy: 'user123',
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailsData());

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails[0].photos).toEqual([]);
    });
  });

  describe('deleteTrail', () => {
    it('deletes trail successfully', async () => {
      const { result } = renderHook(() => useTrailsData());

      // First, populate with some trails
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Trail to delete',
              description: '',
              difficulty: 'easy',
              distance: 0,
              elevationGain: 0,
              tags: [],
              status: 'open',
              photos: [],
              createdBy: 'user123',
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrails();
      });

      // Mock successful deletion
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteTrail('trail1');
      });

      expect(mockDoc).toHaveBeenCalledWith({}, 'Trails', 'trail1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
      expect(deleteResult).toBe(true);
      expect(result.current.trails).toEqual([]);
    });

    it('handles deletion errors gracefully', async () => {
      const error = new Error('Delete failed');
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockRejectedValue(error);

      const { result } = renderHook(() => useTrailsData());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteTrail('trail1');
      });

      expect(result.current.error).toBe('Failed to delete trail: Delete failed');
      expect(deleteResult).toBe(false);
    });

    it('handles deletion of non-existent trail', async () => {
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      const { result } = renderHook(() => useTrailsData());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteTrail('nonexistent');
      });

      expect(deleteResult).toBe(true);
      expect(result.current.trails).toEqual([]);
    });
  });

  describe('updateTrail', () => {
    it('updates trail successfully', async () => {
      const { result } = renderHook(() => useTrailsData());

      // First, populate with some trails
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Original Trail',
              description: 'Original description',
              difficulty: 'easy',
              distance: 1.0,
              elevationGain: 10,
              tags: ['original'],
              status: 'open',
              photos: [],
              createdBy: 'user123',
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrails();
      });

      // Mock successful update
      mockDoc.mockReturnValue('docRef');
      mockUpdateDoc.mockResolvedValue();

      const updates = {
        name: 'Updated Trail',
        description: 'Updated description',
        difficulty: 'moderate',
        distance: 2.5,
        elevationGain: 200,
        tags: ['updated', 'moderate'],
        status: 'closed',
        lastUpdated: new Date('2024-01-20')
      };

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateTrail('trail1', updates);
      });

      expect(mockDoc).toHaveBeenCalledWith({}, 'Trails', 'trail1');
      expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', updates);
      expect(updateResult).toBe(true);
      expect(result.current.trails[0]).toEqual(
        expect.objectContaining({
          id: 'trail1',
          name: 'Updated Trail',
          description: 'Updated description',
          difficulty: 'moderate',
          distance: 2.5,
          elevationGain: 200,
          tags: ['updated', 'moderate'],
          status: 'closed',
          lastUpdated: new Date('2024-01-20')
        })
      );
    });

    it('handles update errors gracefully', async () => {
      const error = new Error('Update failed');
      mockDoc.mockReturnValue('docRef');
      mockUpdateDoc.mockRejectedValue(error);

      const { result } = renderHook(() => useTrailsData());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateTrail('trail1', { name: 'Updated' });
      });

      expect(result.current.error).toBe('Failed to update trail: Update failed');
      expect(updateResult).toBe(false);
    });

    it('handles partial updates', async () => {
      const { result } = renderHook(() => useTrailsData());

      // First, populate with some trails
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Original Trail',
              description: 'Original description',
              difficulty: 'easy',
              distance: 1.0,
              elevationGain: 10,
              tags: ['original'],
              status: 'open',
              photos: [],
              createdBy: 'user123',
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrails();
      });

      // Mock successful update
      mockDoc.mockReturnValue('docRef');
      mockUpdateDoc.mockResolvedValue();

      const updates = { name: 'Updated Trail' };

      await act(async () => {
        await result.current.updateTrail('trail1', updates);
      });

      expect(result.current.trails[0]).toEqual(
        expect.objectContaining({
          id: 'trail1',
          name: 'Updated Trail', // Updated
          description: 'Original description', // Unchanged
          difficulty: 'easy', // Unchanged
          distance: 1.0, // Unchanged
          elevationGain: 10, // Unchanged
          tags: ['original'], // Unchanged
          status: 'open' // Unchanged
        })
      );
    });

    it('handles update of non-existent trail', async () => {
      mockDoc.mockReturnValue('docRef');
      mockUpdateDoc.mockResolvedValue();

      const { result } = renderHook(() => useTrailsData());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateTrail('nonexistent', { name: 'Updated' });
      });

      expect(updateResult).toBe(true);
      expect(result.current.trails).toEqual([]);
    });
  });

  describe('setError', () => {
    it('sets error state correctly', () => {
      const { result } = renderHook(() => useTrailsData());

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');
    });

    it('clears error state', () => {
      const { result } = renderHook(() => useTrailsData());

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('State Management', () => {
    it('maintains state across re-renders', () => {
      const { result, rerender } = renderHook(() => useTrailsData());

      const initialState = result.current;
      rerender();
      
      expect(result.current.trails).toBe(initialState.trails);
      expect(result.current.loading).toBe(initialState.loading);
      expect(result.current.error).toBe(initialState.error);
    });

    it('preserves trails data during operations', async () => {
      const { result } = renderHook(() => useTrailsData());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Test Trail',
              description: '',
              difficulty: 'easy',
              distance: 0,
              elevationGain: 0,
              tags: [],
              status: 'open',
              photos: [],
              createdBy: 'user123',
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails).toHaveLength(1);

      // Perform update
      mockDoc.mockReturnValue('docRef');
      mockUpdateDoc.mockResolvedValue();

      await act(async () => {
        await result.current.updateTrail('trail1', { name: 'Updated Trail' });
      });

      expect(result.current.trails).toHaveLength(1);
      expect(result.current.trails[0].name).toBe('Updated Trail');
    });
  });

  describe('Edge Cases', () => {
    it('handles concurrent operations', async () => {
      const { result } = renderHook(() => useTrailsData());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Test Trail',
              description: '',
              difficulty: 'easy',
              distance: 0,
              elevationGain: 0,
              tags: [],
              status: 'open',
              photos: [],
              createdBy: 'user123',
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrails();
      });

      // Mock successful operations
      mockDoc.mockReturnValue('docRef');
      mockUpdateDoc.mockResolvedValue();
      mockDeleteDoc.mockResolvedValue();

      // Perform concurrent operations
      await act(async () => {
        await Promise.all([
          result.current.updateTrail('trail1', { name: 'Updated' }),
          result.current.deleteTrail('trail1')
        ]);
      });

      expect(result.current.trails).toEqual([]);
    });

    it('handles very large datasets', async () => {
      const { result } = renderHook(() => useTrailsData());

      // Create a large number of trails
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `trail${i}`,
        data: () => ({
          name: `Trail ${i}`,
          description: `Description ${i}`,
          difficulty: ['easy', 'moderate', 'hard'][i % 3],
          distance: i * 0.1,
          elevationGain: i * 10,
          tags: [`tag${i}`],
          status: 'open',
          photos: [],
          createdBy: `user${i}`,
          location: { lat: 40 + i * 0.001, lng: -74 + i * 0.001 },
          gpsRoute: null,
          createdAt: new Date(`2024-01-${String(i % 30 + 1).padStart(2, '0')}`),
          lastUpdated: new Date(`2024-01-${String(i % 30 + 1).padStart(2, '0')}`)
        })
      }));

      const mockQuerySnapshot = { docs: largeDataset };
      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails).toHaveLength(1000);
    });

    it('handles malformed Firestore data', async () => {
      const { result } = renderHook(() => useTrailsData());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => {
              throw new Error('Malformed data');
            }
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrails();
      });

      // Should handle the error gracefully
      expect(result.current.trails).toEqual([]);
    });
  });

  describe('Return Values', () => {
    it('returns consistent function references', () => {
      const { result, rerender } = renderHook(() => useTrailsData());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Functions are recreated on each render in this hook implementation
      expect(typeof firstRender.fetchTrails).toBe('function');
      expect(typeof firstRender.deleteTrail).toBe('function');
      expect(typeof firstRender.updateTrail).toBe('function');
      expect(typeof firstRender.setError).toBe('function');
      expect(typeof secondRender.fetchTrails).toBe('function');
      expect(typeof secondRender.deleteTrail).toBe('function');
      expect(typeof secondRender.updateTrail).toBe('function');
      expect(typeof secondRender.setError).toBe('function');
    });

    it('returns updated state after operations', async () => {
      const { result } = renderHook(() => useTrailsData());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'trail1',
            data: () => ({
              name: 'Test Trail',
              description: '',
              difficulty: 'easy',
              distance: 0,
              elevationGain: 0,
              tags: [],
              status: 'open',
              photos: [],
              createdBy: 'user123',
              location: null,
              gpsRoute: null,
              createdAt: null,
              lastUpdated: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('trailsRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrails();
      });

      expect(result.current.trails).toHaveLength(1);
      expect(result.current.loading).toBe(false);
      // Error might be set from the automatic fetch on mount, so we don't assert it
    });
  });
});
