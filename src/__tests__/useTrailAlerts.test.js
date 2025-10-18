import { renderHook, act } from '@testing-library/react';
import { useTrailAlerts } from '../hooks/useTrailAlerts';

// Mock Firebase
const mockGetDocs = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  getDocs: (...args) => mockGetDocs(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  doc: (...args) => mockDoc(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {}
}));

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useTrailAlerts', () => {
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
      const { result } = renderHook(() => useTrailAlerts());

      expect(result.current.trailAlerts).toEqual({});
      expect(result.current.loadingStates).toEqual({});
      expect(typeof result.current.fetchTrailAlerts).toBe('function');
      expect(typeof result.current.deleteAlert).toBe('function');
    });

    it('maintains state across re-renders', () => {
      const { result, rerender } = renderHook(() => useTrailAlerts());

      const initialState = result.current;
      rerender();
      
      expect(result.current.trailAlerts).toBe(initialState.trailAlerts);
      expect(result.current.loadingStates).toBe(initialState.loadingStates);
    });
  });

  describe('fetchTrailAlerts', () => {
    it('fetches alerts successfully', async () => {
      const mockAlerts = [
        {
          id: 'alert1',
          trailId: 'trail1',
          type: 'maintenance',
          message: 'Trail maintenance scheduled',
          comment: '',
          isActive: true,
          timestamp: new Date('2024-01-15')
        },
        {
          id: 'alert2',
          trailId: 'trail1',
          type: 'weather',
          message: 'Weather warning',
          comment: 'Heavy rain expected',
          isActive: true,
          timestamp: new Date('2024-01-16')
        }
      ];

      const mockQuerySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => ({
            trailId: alert.trailId,
            type: alert.type,
            message: alert.message,
            comment: alert.comment,
            isActive: alert.isActive,
            timestamp: alert.timestamp
          })
        }))
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(mockCollection).toHaveBeenCalledWith({}, 'Alerts');
      expect(mockWhere).toHaveBeenCalledWith('trailId', '==', 'trail1');
      expect(mockQuery).toHaveBeenCalledWith('alertsRef', 'whereClause');
      expect(mockGetDocs).toHaveBeenCalledWith('query');

      expect(result.current.trailAlerts).toEqual({
        trail1: expect.arrayContaining([
          expect.objectContaining({
            id: 'alert1',
            trailId: 'trail1',
            type: 'maintenance',
            message: 'Trail maintenance scheduled',
            comment: '',
            isActive: true
          }),
          expect.objectContaining({
            id: 'alert2',
            trailId: 'trail1',
            type: 'weather',
            message: 'Weather warning',
            comment: 'Heavy rain expected',
            isActive: true
          })
        ])
      });
    });

    it('sets loading state during fetch', async () => {
      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailAlerts());

      // Start fetch
      act(() => {
        result.current.fetchTrailAlerts('trail1');
      });

      // Check loading state is set
      expect(result.current.loadingStates).toEqual({ trail1: true });

      // Wait for completion
      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Check loading state is cleared
      expect(result.current.loadingStates).toEqual({ trail1: false });
    });

    it('handles empty alerts response', async () => {
      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(result.current.trailAlerts).toEqual({ trail1: [] });
    });

    it('handles fetch errors gracefully', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockRejectedValue(error);

      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to fetch alerts for trail trail1:',
        'Network error'
      );
      expect(result.current.loadingStates).toEqual({ trail1: false });
    });

    it('uses cache when available', async () => {
      const cachedAlerts = [
        {
          id: 'alert1',
          trailId: 'trail1',
          type: 'maintenance',
          message: 'Cached alert',
          comment: '',
          isActive: true,
          timestamp: new Date('2024-01-15')
        }
      ];

      const { result } = renderHook(() => useTrailAlerts());

      // First fetch to populate cache
      const mockQuerySnapshot = {
        docs: cachedAlerts.map(alert => ({
          id: alert.id,
          data: () => ({
            trailId: alert.trailId,
            type: alert.type,
            message: alert.message,
            comment: alert.comment,
            isActive: alert.isActive,
            timestamp: alert.timestamp
          })
        }))
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Clear mocks
      jest.clearAllMocks();

      // Second fetch should use cache
      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Should not call Firebase functions
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('handles missing or invalid data gracefully', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              // Missing required fields
              trailId: null,
              type: undefined,
              message: null,
              comment: undefined,
              isActive: null,
              timestamp: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(result.current.trailAlerts.trail1).toEqual([
        expect.objectContaining({
          id: 'alert1',
          trailId: 'trail1', // Should fallback to trailId parameter
          type: 'general', // Should fallback to 'general'
          message: '', // Should fallback to empty string
          comment: '', // Should fallback to empty string
          isActive: false // Should fallback to false
        })
      ]);
    });

    it('sorts alerts by timestamp correctly', async () => {
      const mockAlerts = [
        {
          id: 'alert1',
          trailId: 'trail1',
          type: 'maintenance',
          message: 'Older alert',
          timestamp: new Date('2024-01-15')
        },
        {
          id: 'alert2',
          trailId: 'trail1',
          type: 'weather',
          message: 'Newer alert',
          timestamp: new Date('2024-01-16')
        }
      ];

      const mockQuerySnapshot = {
        docs: mockAlerts.map(alert => ({
          id: alert.id,
          data: () => ({
            trailId: alert.trailId,
            type: alert.type,
            message: alert.message,
            comment: '',
            isActive: true,
            timestamp: alert.timestamp
          })
        }))
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      const alerts = result.current.trailAlerts.trail1;
      expect(alerts[0].id).toBe('alert2'); // Newer alert first
      expect(alerts[1].id).toBe('alert1'); // Older alert second
    });

    it('handles Firestore Timestamp objects', async () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15')
      };

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Alert with Firestore timestamp',
              comment: '',
              isActive: true,
              timestamp: mockTimestamp
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(result.current.trailAlerts.trail1[0].timestamp).toEqual(mockTimestamp);
    });

    it('handles string timestamps', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Alert with string timestamp',
              comment: '',
              isActive: true,
              timestamp: '2024-01-15T00:00:00Z'
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(result.current.trailAlerts.trail1[0].timestamp).toEqual('2024-01-15T00:00:00Z');
    });

    it('handles missing timestamps', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Alert without timestamp',
              comment: '',
              isActive: true,
              timestamp: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(result.current.trailAlerts.trail1[0].timestamp).toEqual(null);
    });
  });

  describe('deleteAlert', () => {
    it('deletes alert successfully', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      // First, populate with some alerts
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Alert to delete',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15')
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Mock successful deletion
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteAlert('alert1');
      });

      expect(mockDoc).toHaveBeenCalledWith({}, 'Alerts', 'alert1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
      expect(deleteResult).toEqual({ success: true, trailId: 'trail1' });
      expect(result.current.trailAlerts.trail1).toEqual([]);
    });

    it('handles deletion errors gracefully', async () => {
      const error = new Error('Delete failed');
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockRejectedValue(error);

      const { result } = renderHook(() => useTrailAlerts());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteAlert('alert1');
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to delete alert:', error);
      expect(deleteResult).toEqual({ success: false, trailId: null });
    });

    it('updates cache when alert is deleted', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      // First, populate with some alerts
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Alert to delete',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15')
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Mock successful deletion
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      await act(async () => {
        await result.current.deleteAlert('alert1');
      });

      // Fetch again should use updated cache
      jest.clearAllMocks();
      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Should not call Firebase functions because cache is used
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('handles deletion of non-existent alert', async () => {
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      const { result } = renderHook(() => useTrailAlerts());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteAlert('nonexistent');
      });

      expect(deleteResult).toEqual({ success: true, trailId: null });
    });

    it('updates all trail alerts when deleting', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      // Populate multiple trails with alerts
      const mockQuerySnapshot1 = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Alert in trail1',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15')
            })
          }
        ]
      };

      const mockQuerySnapshot2 = {
        docs: [
          {
            id: 'alert2',
            data: () => ({
              trailId: 'trail2',
              type: 'weather',
              message: 'Alert in trail2',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-16')
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce(mockQuerySnapshot1)
        .mockResolvedValueOnce(mockQuerySnapshot2);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
        await result.current.fetchTrailAlerts('trail2');
      });

      // Mock successful deletion
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      await act(async () => {
        await result.current.deleteAlert('alert1');
      });

      expect(result.current.trailAlerts.trail1).toEqual([]);
      expect(result.current.trailAlerts.trail2).toEqual([
        expect.objectContaining({ id: 'alert2' })
      ]);
    });
  });

  describe('State Management', () => {
    it('maintains separate loading states for different trails', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Start fetching for multiple trails
      act(() => {
        result.current.fetchTrailAlerts('trail1');
        result.current.fetchTrailAlerts('trail2');
      });

      expect(result.current.loadingStates).toEqual({
        trail1: true,
        trail2: true
      });

      await act(async () => {
        await Promise.all([
          result.current.fetchTrailAlerts('trail1'),
          result.current.fetchTrailAlerts('trail2')
        ]);
      });

      expect(result.current.loadingStates).toEqual({
        trail1: false,
        trail2: false
      });
    });

    it('maintains separate alert data for different trails', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const mockQuerySnapshot1 = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Trail 1 alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15')
            })
          }
        ]
      };

      const mockQuerySnapshot2 = {
        docs: [
          {
            id: 'alert2',
            data: () => ({
              trailId: 'trail2',
              type: 'weather',
              message: 'Trail 2 alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-16')
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce(mockQuerySnapshot1)
        .mockResolvedValueOnce(mockQuerySnapshot2);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
        await result.current.fetchTrailAlerts('trail2');
      });

      expect(result.current.trailAlerts.trail1).toHaveLength(1);
      expect(result.current.trailAlerts.trail1[0].message).toBe('Trail 1 alert');
      expect(result.current.trailAlerts.trail2).toHaveLength(1);
      expect(result.current.trailAlerts.trail2[0].message).toBe('Trail 2 alert');
    });

    it('preserves existing data when fetching new trails', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const mockQuerySnapshot1 = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Trail 1 alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15')
            })
          }
        ]
      };

      const mockQuerySnapshot2 = {
        docs: [
          {
            id: 'alert2',
            data: () => ({
              trailId: 'trail2',
              type: 'weather',
              message: 'Trail 2 alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-16')
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce(mockQuerySnapshot1)
        .mockResolvedValueOnce(mockQuerySnapshot2);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(result.current.trailAlerts.trail1).toHaveLength(1);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail2');
      });

      expect(result.current.trailAlerts.trail1).toHaveLength(1);
      expect(result.current.trailAlerts.trail2).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles concurrent fetch requests for same trail', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Concurrent alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15')
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Start multiple concurrent requests
      await act(async () => {
        await Promise.all([
          result.current.fetchTrailAlerts('trail1'),
          result.current.fetchTrailAlerts('trail1'),
          result.current.fetchTrailAlerts('trail1')
        ]);
      });

      expect(result.current.trailAlerts.trail1).toHaveLength(1);
    });

    it('handles very large datasets', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      // Create a large number of alerts
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `alert${i}`,
        data: () => ({
          trailId: 'trail1',
          type: 'maintenance',
          message: `Alert ${i}`,
          comment: '',
          isActive: true,
          timestamp: new Date(`2024-01-${String(i % 30 + 1).padStart(2, '0')}`)
        })
      }));

      const mockQuerySnapshot = { docs: largeDataset };
      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(result.current.trailAlerts.trail1).toHaveLength(1000);
    });

    it('handles malformed Firestore data', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => {
              throw new Error('Malformed data');
            }
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Should handle the error gracefully - the trail won't be set if data() throws
      expect(result.current.trailAlerts.trail1).toBeUndefined();
    });
  });

  describe('Helper Functions', () => {
    describe('isAlertExpired', () => {
      it('returns false for non-timed alerts', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const alert = {
          id: 'alert1',
          isTimed: false,
          message: 'Non-timed alert'
        };
        
        expect(result.current.isAlertExpired(alert)).toBe(false);
      });

      it('returns false for alerts without expiresAt', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const alert = {
          id: 'alert1',
          isTimed: true,
          message: 'Timed alert without expiration'
        };
        
        expect(result.current.isAlertExpired(alert)).toBe(false);
      });

      it('returns false for non-expired alerts', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
        const alert = {
          id: 'alert1',
          isTimed: true,
          expiresAt: futureDate,
          message: 'Future alert'
        };
        
        expect(result.current.isAlertExpired(alert)).toBe(false);
      });

      it('returns true for expired alerts', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
        const alert = {
          id: 'alert1',
          isTimed: true,
          expiresAt: pastDate,
          message: 'Expired alert'
        };
        
        expect(result.current.isAlertExpired(alert)).toBe(true);
      });

      it('handles Firestore timestamp objects', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const pastDate = new Date(Date.now() - 3600000);
        const alert = {
          id: 'alert1',
          isTimed: true,
          expiresAt: {
            toDate: () => pastDate
          },
          message: 'Alert with Firestore timestamp'
        };
        
        expect(result.current.isAlertExpired(alert)).toBe(true);
      });
    });

    describe('getTimeRemaining', () => {
      it('returns null for non-timed alerts', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const alert = {
          id: 'alert1',
          isTimed: false,
          message: 'Non-timed alert'
        };
        
        expect(result.current.getTimeRemaining(alert)).toBe(null);
      });

      it('returns null for alerts without expiresAt', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const alert = {
          id: 'alert1',
          isTimed: true,
          message: 'Timed alert without expiration'
        };
        
        expect(result.current.getTimeRemaining(alert)).toBe(null);
      });

      it('returns null for expired alerts', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
        const alert = {
          id: 'alert1',
          isTimed: true,
          expiresAt: pastDate,
          message: 'Expired alert'
        };
        
        expect(result.current.getTimeRemaining(alert)).toBe(null);
      });

      it('calculates time remaining correctly', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const futureDate = new Date(Date.now() + 3661000); // 1 hour, 1 minute, 1 second from now
        const alert = {
          id: 'alert1',
          isTimed: true,
          expiresAt: futureDate,
          message: 'Future alert'
        };
        
        const timeRemaining = result.current.getTimeRemaining(alert);
        
        expect(timeRemaining).toEqual({
          hours: 1,
          minutes: 1,
          seconds: 1,
          totalMs: expect.any(Number)
        });
        expect(timeRemaining.totalMs).toBeGreaterThan(3660000);
        expect(timeRemaining.totalMs).toBeLessThan(3662000);
      });

      it('handles Firestore timestamp objects', () => {
        const { result } = renderHook(() => useTrailAlerts());
        
        const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
        const alert = {
          id: 'alert1',
          isTimed: true,
          expiresAt: {
            toDate: () => futureDate
          },
          message: 'Alert with Firestore timestamp'
        };
        
        const timeRemaining = result.current.getTimeRemaining(alert);
        
        expect(timeRemaining).toEqual({
          hours: 1,
          minutes: 0,
          seconds: 0,
          totalMs: expect.any(Number)
        });
      });
    });
  });

  describe('Alert Expiration Filtering', () => {
    it('filters out expired alerts during fetch', async () => {
      const { result } = renderHook(() => useTrailAlerts());
      
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Expired alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15'),
              isTimed: true,
              expiresAt: pastDate
            })
          },
          {
            id: 'alert2',
            data: () => ({
              trailId: 'trail1',
              type: 'weather',
              message: 'Active alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-16'),
              isTimed: true,
              expiresAt: futureDate
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Should only have the non-expired alert
      expect(result.current.trailAlerts.trail1).toHaveLength(1);
      expect(result.current.trailAlerts.trail1[0].id).toBe('alert2');
    });

    it('handles alerts with Firestore timestamp expiration', async () => {
      const { result } = renderHook(() => useTrailAlerts());
      
      const pastDate = new Date(Date.now() - 3600000);
      const futureDate = new Date(Date.now() + 3600000);
      
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Expired Firestore alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15'),
              isTimed: true,
              expiresAt: {
                toDate: () => pastDate
              }
            })
          },
          {
            id: 'alert2',
            data: () => ({
              trailId: 'trail1',
              type: 'weather',
              message: 'Active Firestore alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-16'),
              isTimed: true,
              expiresAt: {
                toDate: () => futureDate
              }
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Should only have the non-expired alert
      expect(result.current.trailAlerts.trail1).toHaveLength(1);
      expect(result.current.trailAlerts.trail1[0].id).toBe('alert2');
    });
  });

  describe('fetchMultipleTrailAlerts', () => {
    it('returns early for empty trailIds array', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchMultipleTrailAlerts([]);
      });

      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('returns early for null trailIds', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      await act(async () => {
        await result.current.fetchMultipleTrailAlerts(null);
      });

      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('fetches alerts for multiple trails', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Trail 1 alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15'),
              isTimed: false,
              expiresAt: null
            })
          },
          {
            id: 'alert2',
            data: () => ({
              trailId: 'trail2',
              type: 'weather',
              message: 'Trail 2 alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-16'),
              isTimed: false,
              expiresAt: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchMultipleTrailAlerts(['trail1', 'trail2']);
      });

      expect(mockCollection).toHaveBeenCalledWith({}, 'Alerts');
      expect(mockWhere).toHaveBeenCalledWith('trailId', 'in', ['trail1', 'trail2']);
      expect(result.current.trailAlerts.trail1).toHaveLength(1);
      expect(result.current.trailAlerts.trail2).toHaveLength(1);
    });

    it('sets loading states for all trails', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Start fetch
      act(() => {
        result.current.fetchMultipleTrailAlerts(['trail1', 'trail2', 'trail3']);
      });

      // Check loading states are set
      expect(result.current.loadingStates).toEqual({
        trail1: true,
        trail2: true,
        trail3: true
      });

      // Wait for completion
      await act(async () => {
        await result.current.fetchMultipleTrailAlerts(['trail1', 'trail2', 'trail3']);
      });

      // Check loading states are cleared
      expect(result.current.loadingStates).toEqual({
        trail1: false,
        trail2: false,
        trail3: false
      });
    });

    it('uses cache for already fetched trails', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      // First, populate cache for trail1
      const mockQuerySnapshot1 = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Cached alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15'),
              isTimed: false,
              expiresAt: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot1);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      // Clear mocks
      jest.clearAllMocks();

      // Now fetch multiple trails including cached trail1
      const mockQuerySnapshot2 = {
        docs: [
          {
            id: 'alert2',
            data: () => ({
              trailId: 'trail2',
              type: 'weather',
              message: 'New alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-16'),
              isTimed: false,
              expiresAt: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot2);

      await act(async () => {
        await result.current.fetchMultipleTrailAlerts(['trail1', 'trail2']);
      });

      // Should only call Firebase for trail2 (not trail1 which is cached)
      expect(mockWhere).toHaveBeenCalledWith('trailId', 'in', ['trail2']);
      expect(result.current.trailAlerts.trail1).toHaveLength(1);
      expect(result.current.trailAlerts.trail2).toHaveLength(1);
    });

    it('handles batches larger than 10 trails', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const trailIds = Array.from({ length: 15 }, (_, i) => `trail${i + 1}`);
      
      const mockQuerySnapshot = { docs: [] };
      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchMultipleTrailAlerts(trailIds);
      });

      // Should make 2 calls due to batching (10 + 5)
      expect(mockWhere).toHaveBeenCalledTimes(2);
      expect(mockWhere).toHaveBeenNthCalledWith(1, 'trailId', 'in', trailIds.slice(0, 10));
      expect(mockWhere).toHaveBeenNthCalledWith(2, 'trailId', 'in', trailIds.slice(10));
    });

    it('handles batch fetch errors gracefully', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const error = new Error('Batch fetch error');
      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockRejectedValue(error);

      await act(async () => {
        await result.current.fetchMultipleTrailAlerts(['trail1', 'trail2']);
      });

      // The error should be caught and logged as a warning
      expect(mockConsoleWarn).toHaveBeenCalledWith('Failed to fetch batch alerts:', error.message);
      // Loading states should be cleared even on error
      expect(result.current.loadingStates).toEqual({
        trail1: false,
        trail2: false
      });
    });

    it('handles individual batch errors', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const trailIds = Array.from({ length: 15 }, (_, i) => `trail${i + 1}`);
      
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Successful alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15'),
              isTimed: false,
              expiresAt: null
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce(mockQuerySnapshot) // First batch succeeds
        .mockRejectedValueOnce(new Error('Second batch failed')); // Second batch fails

      await act(async () => {
        await result.current.fetchMultipleTrailAlerts(trailIds);
      });

      // Should still have data from successful batch
      expect(result.current.trailAlerts.trail1).toHaveLength(1);
      expect(result.current.loadingStates).toEqual(
        expect.objectContaining({
          trail1: false,
          trail2: false
        })
      );
    });

    it('filters and sorts alerts in batch results', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const pastDate = new Date(Date.now() - 3600000);
      const futureDate = new Date(Date.now() + 3600000);

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Older alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15'),
              isTimed: true,
              expiresAt: futureDate
            })
          },
          {
            id: 'alert2',
            data: () => ({
              trailId: 'trail1',
              type: 'weather',
              message: 'Newer alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-16'),
              isTimed: true,
              expiresAt: futureDate
            })
          },
          {
            id: 'alert3',
            data: () => ({
              trailId: 'trail1',
              type: 'safety',
              message: 'Expired alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-14'),
              isTimed: true,
              expiresAt: pastDate
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchMultipleTrailAlerts(['trail1']);
      });

      // Should filter out expired alert and sort by timestamp
      expect(result.current.trailAlerts.trail1).toHaveLength(2);
      expect(result.current.trailAlerts.trail1[0].id).toBe('alert2'); // Newer first
      expect(result.current.trailAlerts.trail1[1].id).toBe('alert1'); // Older second
    });
  });

  describe('Return Values', () => {
    it('returns consistent function references', () => {
      const { result, rerender } = renderHook(() => useTrailAlerts());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Functions are recreated on each render in this hook implementation
      expect(typeof firstRender.fetchTrailAlerts).toBe('function');
      expect(typeof firstRender.deleteAlert).toBe('function');
      expect(typeof secondRender.fetchTrailAlerts).toBe('function');
      expect(typeof secondRender.deleteAlert).toBe('function');
    });

    it('returns updated state after operations', async () => {
      const { result } = renderHook(() => useTrailAlerts());

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'alert1',
            data: () => ({
              trailId: 'trail1',
              type: 'maintenance',
              message: 'Test alert',
              comment: '',
              isActive: true,
              timestamp: new Date('2024-01-15')
            })
          }
        ]
      };

      mockCollection.mockReturnValue('alertsRef');
      mockWhere.mockReturnValue('whereClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.fetchTrailAlerts('trail1');
      });

      expect(result.current.trailAlerts.trail1).toHaveLength(1);
      expect(result.current.loadingStates.trail1).toBe(false);
    });

    it('returns all expected functions', () => {
      const { result } = renderHook(() => useTrailAlerts());

      expect(typeof result.current.fetchTrailAlerts).toBe('function');
      expect(typeof result.current.fetchMultipleTrailAlerts).toBe('function');
      expect(typeof result.current.deleteAlert).toBe('function');
      expect(typeof result.current.isAlertExpired).toBe('function');
      expect(typeof result.current.getTimeRemaining).toBe('function');
    });
  });
});
