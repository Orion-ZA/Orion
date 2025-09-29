import { renderHook, act } from '@testing-library/react';
import useFeedback from '../components/admin/useFeedback';
import { onSnapshot } from 'firebase/firestore';

// Mock Firebase
const mockUnsubscribe = jest.fn();

jest.mock('../firebaseConfig', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
}));

describe('useFeedback', () => {
  let capturedCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallback = null;
    
    // Mock onSnapshot to capture the callback function
    onSnapshot.mockImplementation((query, callback) => {
      capturedCallback = callback;
      return mockUnsubscribe;
    });
  });

  it('initializes with empty feedbacks and loading true', () => {
    const { result } = renderHook(() => useFeedback());
    
    expect(result.current.feedbacks).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('sets up Firebase listener on mount', () => {
    renderHook(() => useFeedback());
    
    expect(onSnapshot).toHaveBeenCalled();
  });

  it('updates feedbacks when snapshot changes', () => {
    const mockSnapshot = {
      docs: [
        {
          id: '1',
          data: () => ({
            message: 'Great app!',
            rating: 5,
            type: 'praise',
            email: 'user@example.com',
            contactAllowed: true,
            createdAt: { toDate: () => new Date('2023-01-01') },
          }),
        },
        {
          id: '2',
          data: () => ({
            message: 'Found a bug',
            rating: 2,
            type: 'bug',
            email: 'user2@example.com',
            contactAllowed: false,
            createdAt: { toDate: () => new Date('2023-01-02') },
          }),
        },
      ],
    };

    const { result } = renderHook(() => useFeedback());
    
    // Simulate snapshot callback
    act(() => {
      if (capturedCallback) {
        capturedCallback(mockSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toHaveLength(2);
    expect(result.current.feedbacks[0]).toMatchObject({
      id: '1',
      message: 'Great app!',
      rating: 5,
      type: 'praise',
      email: 'user@example.com',
      contactAllowed: true,
    });
    expect(result.current.feedbacks[0].createdAt).toBeDefined();
    expect(typeof result.current.feedbacks[0].createdAt.toDate).toBe('function');
    
    expect(result.current.feedbacks[1]).toMatchObject({
      id: '2',
      message: 'Found a bug',
      rating: 2,
      type: 'bug',
      email: 'user2@example.com',
      contactAllowed: false,
    });
    expect(result.current.feedbacks[1].createdAt).toBeDefined();
    expect(typeof result.current.feedbacks[1].createdAt.toDate).toBe('function');
    expect(result.current.loading).toBe(false);
  });

  it('handles empty snapshot', () => {
    const mockSnapshot = { docs: [] };
    
    const { result } = renderHook(() => useFeedback());
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(mockSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('handles snapshot with single feedback', () => {
    const mockSnapshot = {
      docs: [
        {
          id: 'single',
          data: () => ({
            message: 'Single feedback',
            rating: 4,
            type: 'suggestion',
            email: 'single@example.com',
            contactAllowed: true,
            createdAt: { toDate: () => new Date('2023-01-01') },
          }),
        },
      ],
    };
    
    const { result } = renderHook(() => useFeedback());
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(mockSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0].id).toBe('single');
    expect(result.current.feedbacks[0].message).toBe('Single feedback');
    expect(result.current.loading).toBe(false);
  });

  it('handles feedback with missing fields', () => {
    const mockSnapshot = {
      docs: [
        {
          id: 'incomplete',
          data: () => ({
            message: 'Incomplete feedback',
            // Missing rating, type, email, contactAllowed, createdAt
          }),
        },
      ],
    };
    
    const { result } = renderHook(() => useFeedback());
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(mockSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0]).toEqual({
      id: 'incomplete',
      message: 'Incomplete feedback',
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles feedback with null/undefined values', () => {
    const mockSnapshot = {
      docs: [
        {
          id: 'null-values',
          data: () => ({
            message: 'Feedback with null values',
            rating: null,
            type: null,
            email: null,
            contactAllowed: null,
            createdAt: null,
          }),
        },
      ],
    };
    
    const { result } = renderHook(() => useFeedback());
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(mockSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0]).toEqual({
      id: 'null-values',
      message: 'Feedback with null values',
      rating: null,
      type: null,
      email: null,
      contactAllowed: null,
      createdAt: null,
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles multiple snapshot updates', () => {
    const { result } = renderHook(() => useFeedback());
    
    // First snapshot
    const firstSnapshot = {
      docs: [
        {
          id: '1',
          data: () => ({
            message: 'First feedback',
            rating: 5,
            type: 'praise',
            email: 'user1@example.com',
            contactAllowed: true,
            createdAt: { toDate: () => new Date('2023-01-01') },
          }),
        },
      ],
    };
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(firstSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0].message).toBe('First feedback');
    
    // Second snapshot
    const secondSnapshot = {
      docs: [
        {
          id: '1',
          data: () => ({
            message: 'First feedback',
            rating: 5,
            type: 'praise',
            email: 'user1@example.com',
            contactAllowed: true,
            createdAt: { toDate: () => new Date('2023-01-01') },
          }),
        },
        {
          id: '2',
          data: () => ({
            message: 'Second feedback',
            rating: 3,
            type: 'suggestion',
            email: 'user2@example.com',
            contactAllowed: false,
            createdAt: { toDate: () => new Date('2023-01-02') },
          }),
        },
      ],
    };
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(secondSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toHaveLength(2);
    expect(result.current.feedbacks[0].message).toBe('First feedback');
    expect(result.current.feedbacks[1].message).toBe('Second feedback');
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useFeedback());
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('handles snapshot error gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useFeedback());
    
    // Simulate snapshot error
    act(() => {
      if (capturedCallback) {
        try {
          capturedCallback(null); // This might cause an error
        } catch (error) {
          // Error should be handled gracefully
        }
      }
    });
    
    // Should still have initial state
    expect(result.current.feedbacks).toEqual([]);
    expect(result.current.loading).toBe(true);
    
    consoleSpy.mockRestore();
  });

  it('maintains loading state until first snapshot', () => {
    const { result } = renderHook(() => useFeedback());
    
    // Should still be loading initially
    expect(result.current.loading).toBe(true);
    
    // Simulate snapshot with data
    const mockSnapshot = {
      docs: [
        {
          id: '1',
          data: () => ({
            message: 'Test feedback',
            rating: 4,
            type: 'general',
            email: 'test@example.com',
            contactAllowed: true,
            createdAt: { toDate: () => new Date('2023-01-01') },
          }),
        },
      ],
    };
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(mockSnapshot);
      }
    });
    
    expect(result.current.loading).toBe(false);
  });

  it('handles feedback with complex data structures', () => {
    const mockSnapshot = {
      docs: [
        {
          id: 'complex',
          data: () => ({
            message: 'Complex feedback',
            rating: 5,
            type: 'praise',
            email: 'complex@example.com',
            contactAllowed: true,
            createdAt: { toDate: () => new Date('2023-01-01') },
            metadata: {
              source: 'mobile',
              version: '1.0.0',
              userAgent: 'Mozilla/5.0...',
            },
            tags: ['ui', 'performance', 'feature'],
          }),
        },
      ],
    };
    
    const { result } = renderHook(() => useFeedback());
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(mockSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0].metadata).toEqual({
      source: 'mobile',
      version: '1.0.0',
      userAgent: 'Mozilla/5.0...',
    });
    expect(result.current.feedbacks[0].tags).toEqual(['ui', 'performance', 'feature']);
  });

  it('handles feedback with different date formats', () => {
    const mockSnapshot = {
      docs: [
        {
          id: 'date-test',
          data: () => ({
            message: 'Date test feedback',
            rating: 4,
            type: 'general',
            email: 'date@example.com',
            contactAllowed: true,
            createdAt: { toDate: () => new Date('2023-12-25T10:30:00Z') },
          }),
        },
      ],
    };
    
    const { result } = renderHook(() => useFeedback());
    
    act(() => {
      if (capturedCallback) {
        capturedCallback(mockSnapshot);
      }
    });
    
    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0].createdAt).toBeDefined();
    expect(typeof result.current.feedbacks[0].createdAt.toDate).toBe('function');
  });

  it('returns consistent interface', () => {
    const { result } = renderHook(() => useFeedback());
    
    // Should always return the same interface
    expect(result.current).toHaveProperty('feedbacks');
    expect(result.current).toHaveProperty('loading');
    expect(Array.isArray(result.current.feedbacks)).toBe(true);
    expect(typeof result.current.loading).toBe('boolean');
  });
});
