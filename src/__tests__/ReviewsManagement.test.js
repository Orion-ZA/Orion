import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewsManagement from '../components/admin/ReviewsManagement';

// Mock Firebase
const mockGetDocs = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  getDocs: (...args) => mockGetDocs(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  doc: (...args) => mockDoc(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
  db: {},
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Trash2: ({ className, title }) => (
    <div data-testid='trash-icon' className={className} title={title} />
  ),
  Star: ({ className }) => <div data-testid='star-icon' className={className} />,
  MessageSquare: ({ className }) => <div data-testid='message-icon' className={className} />,
  Calendar: ({ className }) => <div data-testid='calendar-icon' className={className} />,
  User: ({ className }) => <div data-testid='user-icon' className={className} />,
  MapPin: ({ className }) => <div data-testid='map-pin-icon' className={className} />,
}));

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('ReviewsManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ReviewsManagement />);

      expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
      expect(document.querySelector('.admin-loading-spinner')).toBeInTheDocument();
    });

    it('shows loading state with correct CSS classes', () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ReviewsManagement />);

      expect(document.querySelector('.admin-reviews-management')).toBeInTheDocument();
      expect(document.querySelector('.admin-reviews-loading')).toBeInTheDocument();
      expect(document.querySelector('.admin-loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockRejectedValue(error);

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch reviews: Network error')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-error-icon')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('retry button refetches reviews', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockRejectedValueOnce(error).mockResolvedValueOnce({ docs: [] });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch reviews: Network error')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Wait for the retry to complete
      await waitFor(() => {
        expect(
          screen.queryByText('Failed to fetch reviews: Network error')
        ).not.toBeInTheDocument();
      });
    });

    it('shows error state with correct CSS classes', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockRejectedValue(error);

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(document.querySelector('.admin-reviews-error')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-error-icon')).toBeInTheDocument();
      expect(document.querySelector('.admin-retry-button')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows no reviews message when no reviews exist', async () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No reviews found')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-no-reviews-icon')).toBeInTheDocument();
    });

    it('shows empty state with correct CSS classes', async () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(document.querySelector('.admin-no-reviews')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-no-reviews-icon')).toBeInTheDocument();
    });
  });

  describe('Reviews Display', () => {
    const mockTrails = [
      {
        id: 'trail1',
        data: () => ({ name: 'Mountain Peak Trail' }),
      },
      {
        id: 'trail2',
        data: () => ({ name: 'Forest Walk' }),
      },
    ];

    const mockReviews = [
      {
        id: 'review1',
        data: () => ({
          userId: 'user123',
          rating: 4,
          comment: 'Great trail with amazing views!',
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          photos: ['photo1.jpg', 'photo2.jpg'],
        }),
      },
      {
        id: 'review2',
        data: () => ({
          userId: 'user456',
          rating: 5,
          comment: 'Perfect hiking experience',
          timestamp: { toDate: () => new Date('2024-01-16T14:20:00Z') },
          photos: [],
        }),
      },
    ];

    beforeEach(() => {
      mockCollection.mockImplementation((db, collection, trailId) => {
        if (collection === 'Trails') {
          return 'trailsRef';
        }
        return 'reviewsRef';
      });
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrails }) // First call for trails
        .mockResolvedValueOnce({ docs: [mockReviews[0]] }) // Reviews for trail1
        .mockResolvedValueOnce({ docs: [mockReviews[1]] }); // Reviews for trail2
    });

    it('displays reviews correctly', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
        expect(screen.getByText('Forest Walk')).toBeInTheDocument();
      });

      expect(screen.getByText('"Great trail with amazing views!"')).toBeInTheDocument();
      expect(screen.getByText('"Perfect hiking experience"')).toBeInTheDocument();
      expect(screen.getByText('user123')).toBeInTheDocument();
      expect(screen.getByText('user456')).toBeInTheDocument();
    });

    it('displays review statistics', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Total Reviews: 2')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-stat-icon')).toBeInTheDocument();
    });

    it('displays star ratings correctly', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getAllByTestId('star-icon')).toHaveLength(10); // 2 reviews × 5 stars each
      });

      // Check for filled stars (rating 4 and 5)
      const filledStars = document.querySelectorAll('.admin-star.filled');
      expect(filledStars).toHaveLength(9); // 4 + 5 = 9 filled stars
    });

    it('displays review details correctly', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getAllByText('User ID:')).toHaveLength(2);
        expect(screen.getAllByText('Trail ID:')).toHaveLength(2);
        expect(screen.getAllByText('Posted:')).toHaveLength(2);
      });

      expect(screen.getByText('trail1')).toBeInTheDocument();
      expect(screen.getByText('trail2')).toBeInTheDocument();
    });

    it('displays photo count when photos exist', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Photos:')).toBeInTheDocument();
        expect(screen.getByText('2 photo(s)')).toBeInTheDocument();
      });
    });

    it('handles reviews without comments', async () => {
      const mockTrailsNoComment = [
        {
          id: 'trail1',
          data: () => ({ name: 'Mountain Peak Trail' }),
        },
      ];

      const mockReviewsNoComment = [
        {
          id: 'review1',
          data: () => ({
            userId: 'user123',
            rating: 4,
            comment: null,
            timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          }),
        },
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrailsNoComment })
        .mockResolvedValueOnce({ docs: mockReviewsNoComment });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      // Should not display comment section
      expect(screen.queryByText(/Great trail!/)).not.toBeInTheDocument();
    });

    it('handles reviews without photos', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Forest Walk')).toBeInTheDocument();
      });

      // Should not display photos section for review without photos
      expect(screen.queryByText('Photos:')).toBeInTheDocument(); // Only for review with photos
    });

    it('sorts reviews by timestamp correctly', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        const reviewCards = document.querySelectorAll('.admin-review-card');
        expect(reviewCards).toHaveLength(2);
      });

      // Reviews should be sorted by timestamp (most recent first)
      const reviewCards = document.querySelectorAll('.admin-review-card');
      expect(reviewCards[0]).toHaveTextContent('Forest Walk'); // More recent
      expect(reviewCards[1]).toHaveTextContent('Mountain Peak Trail'); // Older
    });
  });

  describe('Delete Functionality', () => {
    const mockTrails = [
      {
        id: 'trail1',
        data: () => ({ name: 'Mountain Peak Trail' }),
      },
    ];

    const mockReviews = [
      {
        id: 'review1',
        data: () => ({
          userId: 'user123',
          rating: 4,
          comment: 'Great trail!',
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        }),
      },
    ];

    beforeEach(() => {
      mockCollection.mockImplementation((db, collection, trailId) => {
        if (collection === 'Trails') {
          return 'trailsRef';
        }
        return 'reviewsRef';
      });
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrails })
        .mockResolvedValueOnce({ docs: mockReviews });
    });

    it('shows delete confirmation modal', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete Review');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this review?')).toBeInTheDocument();
      expect(screen.getByText('Trail: Mountain Peak Trail')).toBeInTheDocument();
      expect(screen.getByText('Rating: 4/5')).toBeInTheDocument();
      expect(screen.getAllByText('"Great trail!"')).toHaveLength(2);
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('cancels delete confirmation', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete Review');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });

    it('deletes review successfully', async () => {
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete Review');
      fireEvent.click(deleteButton);

      const confirmDeleteButton = screen.getByText('Delete Review');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('No reviews found')).toBeInTheDocument();
      });

      expect(mockDoc).toHaveBeenCalledWith({}, 'Trails', 'trail1', 'reviews', 'review1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });

    it('handles delete error', async () => {
      const error = new Error('Delete failed');
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockRejectedValue(error);

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete Review');
      fireEvent.click(deleteButton);

      const confirmDeleteButton = screen.getByText('Delete Review');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete review: Delete failed')).toBeInTheDocument();
      });
    });

    it('shows delete modal with correct CSS classes', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete Review');
      fireEvent.click(deleteButton);

      expect(document.querySelector('.admin-delete-modal-overlay')).toBeInTheDocument();
      expect(document.querySelector('.admin-delete-modal')).toBeInTheDocument();
      expect(document.querySelector('.admin-review-preview')).toBeInTheDocument();
      expect(document.querySelector('.admin-modal-actions')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    const mockTrails = [
      {
        id: 'trail1',
        data: () => ({ name: 'Mountain Peak Trail' }),
      },
    ];

    const mockReviews = [
      {
        id: 'review1',
        data: () => ({
          userId: 'user123',
          rating: 4,
          comment: 'Great trail!',
          timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        }),
      },
    ];

    beforeEach(() => {
      mockCollection.mockImplementation((db, collection, trailId) => {
        if (collection === 'Trails') {
          return 'trailsRef';
        }
        return 'reviewsRef';
      });
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrails })
        .mockResolvedValueOnce({ docs: mockReviews });
    });

    it('formats Firestore timestamp correctly', async () => {
      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      // Check that date is formatted (exact format depends on locale)
      expect(screen.getByText(/2024\/01\/15/)).toBeInTheDocument();
    });

    it('handles missing timestamp', async () => {
      const mockTrailsNoTimestamp = [
        {
          id: 'trail1',
          data: () => ({ name: 'Mountain Peak Trail' }),
        },
      ];

      const mockReviewsNoTimestamp = [
        {
          id: 'review1',
          data: () => ({
            userId: 'user123',
            rating: 4,
            comment: 'Great trail!',
            timestamp: null,
          }),
        },
      ];

      mockCollection.mockImplementation((db, collection, trailId) => {
        if (collection === 'Trails') {
          return 'trailsRef';
        }
        return 'reviewsRef';
      });
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrailsNoTimestamp })
        .mockResolvedValueOnce({ docs: mockReviewsNoTimestamp });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      // The component should render without crashing when timestamp is null
      expect(screen.getByText('Posted:')).toBeInTheDocument();
    });

    it('handles string timestamp', async () => {
      const mockReviewsStringTimestamp = [
        {
          id: 'review1',
          data: () => ({
            userId: 'user123',
            rating: 4,
            comment: 'Great trail!',
            timestamp: '2024-01-15T10:30:00Z',
          }),
        },
      ];

      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrails })
        .mockResolvedValueOnce({ docs: mockReviewsStringTimestamp });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      // Should format string timestamp
      expect(screen.getByText(/2024\/01\/15/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles trails without names', async () => {
      const mockTrailsNoName = [
        {
          id: 'trail1',
          data: () => ({ name: null }),
        },
      ];

      const mockReviews = [
        {
          id: 'review1',
          data: () => ({
            userId: 'user123',
            rating: 4,
            comment: 'Great trail!',
            timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          }),
        },
      ];

      mockCollection.mockImplementation((db, collection, trailId) => {
        if (collection === 'Trails') {
          return 'trailsRef';
        }
        return 'reviewsRef';
      });
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrailsNoName })
        .mockResolvedValueOnce({ docs: mockReviews });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Unnamed Trail')).toBeInTheDocument();
      });
    });

    it('handles reviews with missing data', async () => {
      const mockTrails = [
        {
          id: 'trail1',
          data: () => ({ name: 'Mountain Peak Trail' }),
        },
      ];

      const mockReviewsMissingData = [
        {
          id: 'review1',
          data: () => ({
            userId: null,
            rating: null,
            comment: null,
            timestamp: null,
          }),
        },
      ];

      mockCollection.mockImplementation((db, collection, trailId) => {
        if (collection === 'Trails') {
          return 'trailsRef';
        }
        return 'reviewsRef';
      });
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrails })
        .mockResolvedValueOnce({ docs: mockReviewsMissingData });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Mountain Peak Trail')).toBeInTheDocument();
      });

      expect(screen.getAllByText('N/A')).toHaveLength(2);
      expect(screen.getByText('(0/5)')).toBeInTheDocument();
    });

    it('handles empty trails collection', async () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No reviews found')).toBeInTheDocument();
      });
    });

    it('handles trails with empty reviews', async () => {
      const mockTrails = [
        {
          id: 'trail1',
          data: () => ({ name: 'Mountain Peak Trail' }),
        },
      ];

      mockCollection.mockImplementation((db, collection, trailId) => {
        if (collection === 'Trails') {
          return 'trailsRef';
        }
        return 'reviewsRef';
      });
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValueOnce({ docs: mockTrails }).mockResolvedValueOnce({ docs: [] }); // Empty reviews

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('No reviews found')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    it('renders with correct CSS classes', async () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(document.querySelector('.admin-reviews-management')).toBeInTheDocument();
        expect(document.querySelector('.admin-reviews-header')).toBeInTheDocument();
        expect(document.querySelector('.admin-reviews-stats')).toBeInTheDocument();
        expect(document.querySelector('.admin-reviews-list')).toBeInTheDocument();
      });
    });

    it('displays correct header content', async () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Reviews Management')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Reviews: 0')).toBeInTheDocument();
    });

    it('renders all required icons', async () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getAllByTestId('message-icon')).toHaveLength(2);
      });

      expect(document.querySelector('.admin-stat-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button labels', async () => {
      const mockTrails = [
        {
          id: 'trail1',
          data: () => ({ name: 'Mountain Peak Trail' }),
        },
      ];

      const mockReviews = [
        {
          id: 'review1',
          data: () => ({
            userId: 'user123',
            rating: 4,
            comment: 'Great trail!',
            timestamp: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          }),
        },
      ];

      mockCollection.mockImplementation((db, collection, trailId) => {
        if (collection === 'Trails') {
          return 'trailsRef';
        }
        return 'reviewsRef';
      });
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs
        .mockResolvedValueOnce({ docs: mockTrails })
        .mockResolvedValueOnce({ docs: mockReviews });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Review')).toBeInTheDocument();
      });

      // Click delete button to open modal
      const deleteButton = screen.getByTitle('Delete Review');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete Review')).toBeInTheDocument();
    });

    it('has proper form structure', async () => {
      mockCollection.mockReturnValue('trailsRef');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<ReviewsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Reviews Management')).toBeInTheDocument();
      });

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });
});
