import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewsCarousel from '../components/ReviewsCarousel';

describe('ReviewsCarousel Component', () => {
  const mockReviews = [
    {
      id: 'review-1',
      message: 'Great trail with beautiful views!',
      rating: 5,
      userName: 'John Doe',
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      id: 'review-2',
      message: 'Challenging but rewarding hike.',
      rating: 4,
      userName: 'Jane Smith',
      timestamp: '2024-01-02T00:00:00Z',
    },
    {
      id: 'review-3',
      message: 'Perfect for families with kids.',
      rating: 3,
      userName: 'Bob Wilson',
      timestamp: '2024-01-03T00:00:00Z',
    },
    {
      id: 'review-4',
      message: 'Amazing sunset views from the top!',
      rating: 5,
      userName: 'Alice Johnson',
      timestamp: '2024-01-04T00:00:00Z',
    },
  ];

  const mockReviewsWithEmptyMessage = [
    {
      id: 'review-1',
      message: '',
      rating: 5,
      userName: 'John Doe',
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      id: 'review-2',
      message: null,
      rating: 4,
      userName: 'Jane Smith',
      timestamp: '2024-01-02T00:00:00Z',
    },
  ];

  const mockReviewsWithoutRating = [
    {
      id: 'review-1',
      message: 'Great trail!',
      userName: 'John Doe',
      timestamp: '2024-01-01T00:00:00Z',
    },
  ];

  const mockReviewsWithAnonymous = [
    {
      id: 'review-1',
      message: 'Great trail!',
      rating: 5,
      userName: null,
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      id: 'review-2',
      message: 'Beautiful views',
      rating: 4,
      userName: undefined,
      timestamp: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    test('renders with reviews', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Great trail with beautiful views!')).toBeInTheDocument();
    });

    test('renders with no reviews', () => {
      render(<ReviewsCarousel reviews={[]} trailName='Test Trail' />);

      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
      expect(screen.getByText('No reviews available')).toBeInTheDocument();
    });

    test('renders with null reviews', () => {
      render(<ReviewsCarousel reviews={null} trailName='Test Trail' />);

      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
      expect(screen.getByText('No reviews available')).toBeInTheDocument();
    });

    test('renders with undefined reviews', () => {
      render(<ReviewsCarousel reviews={undefined} trailName='Test Trail' />);

      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
      expect(screen.getByText('No reviews available')).toBeInTheDocument();
    });

    test('displays first review by default', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Great trail with beautiful views!')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  describe('Star Rating Display', () => {
    test('displays correct number of filled stars for rating', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      // First review has rating 5, so all 5 stars should be filled
      const stars = screen.getAllByTestId('star');
      expect(stars).toHaveLength(5);

      // Check that stars are rendered with correct colors
      stars.forEach((star, index) => {
        if (index < 5) {
          expect(star).toHaveAttribute('fill', 'currentColor');
          expect(star).toHaveAttribute('color', '#fbbf24');
        }
      });
    });

    test('displays correct stars for different ratings', () => {
      const singleReview = [mockReviews[1]]; // Rating 4
      render(<ReviewsCarousel reviews={singleReview} trailName='Test Trail' />);

      const stars = screen.getAllByTestId('star');
      expect(stars).toHaveLength(5);

      // First 4 stars should be filled, last one should not
      stars.forEach((star, index) => {
        if (index < 4) {
          expect(star).toHaveAttribute('fill', 'currentColor');
          expect(star).toHaveAttribute('color', '#fbbf24');
        } else {
          expect(star).toHaveAttribute('fill', 'none');
          expect(star).toHaveAttribute('color', '#6b7280');
        }
      });
    });

    test('handles reviews without rating', () => {
      render(<ReviewsCarousel reviews={mockReviewsWithoutRating} trailName='Test Trail' />);

      // Should not render stars when rating is not provided
      expect(screen.queryByTestId('star')).not.toBeInTheDocument();
    });

    test('handles reviews with rating 0', () => {
      const reviewsWithZeroRating = [
        {
          id: 'review-1',
          message: 'Great trail!',
          rating: 0,
          userName: 'John Doe',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      render(<ReviewsCarousel reviews={reviewsWithZeroRating} trailName='Test Trail' />);

      // Should not render stars when rating is 0
      expect(screen.queryByTestId('star')).not.toBeInTheDocument();
    });
  });

  describe('Anonymous User Handling', () => {
    test('displays "Anonymous" for reviews without userName', () => {
      render(<ReviewsCarousel reviews={mockReviewsWithAnonymous} trailName='Test Trail' />);

      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    test('displays "Anonymous" for reviews with null userName', () => {
      const reviewsWithNullUserName = [
        {
          id: 'review-1',
          message: 'Great trail!',
          rating: 5,
          userName: null,
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      render(<ReviewsCarousel reviews={reviewsWithNullUserName} trailName='Test Trail' />);

      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    test('displays "Anonymous" for reviews with undefined userName', () => {
      const reviewsWithUndefinedUserName = [
        {
          id: 'review-1',
          message: 'Great trail!',
          rating: 5,
          userName: undefined,
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      render(<ReviewsCarousel reviews={reviewsWithUndefinedUserName} trailName='Test Trail' />);

      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });
  });

  describe('Empty Message Handling', () => {
    test('displays "No review text available" for empty message', () => {
      render(<ReviewsCarousel reviews={mockReviewsWithEmptyMessage} trailName='Test Trail' />);

      expect(screen.getByText('No review text available')).toBeInTheDocument();
    });

    test('applies no-text class for empty messages', () => {
      render(<ReviewsCarousel reviews={mockReviewsWithEmptyMessage} trailName='Test Trail' />);

      const reviewText = screen.getByText('No review text available');
      expect(reviewText).toHaveClass('no-text');
    });

    test('handles null message', () => {
      const reviewsWithNullMessage = [
        {
          id: 'review-1',
          message: null,
          rating: 5,
          userName: 'John Doe',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      render(<ReviewsCarousel reviews={reviewsWithNullMessage} trailName='Test Trail' />);

      expect(screen.getByText('No review text available')).toBeInTheDocument();
    });

    test('handles undefined message', () => {
      const reviewsWithUndefinedMessage = [
        {
          id: 'review-1',
          message: undefined,
          rating: 5,
          userName: 'John Doe',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      render(<ReviewsCarousel reviews={reviewsWithUndefinedMessage} trailName='Test Trail' />);

      expect(screen.getByText('No review text available')).toBeInTheDocument();
    });
  });

  describe('Auto-scrolling Functionality', () => {
    test('auto-scrolls to next review after delay', async () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      // Initially shows first review
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Fast-forward time by auto-scroll delay (4000ms)
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    test('pauses auto-scroll on mouse enter', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      const carouselContainer = screen.getByText('John Doe').closest('.reviews-carousel-container');

      // Mouse enter should pause auto-scroll
      fireEvent.mouseEnter(carouselContainer);

      // Fast-forward time - should not auto-scroll
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Should still show first review
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('resumes auto-scroll on mouse leave', async () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      const carouselContainer = screen.getByText('John Doe').closest('.reviews-carousel-container');

      // Mouse enter to pause
      fireEvent.mouseEnter(carouselContainer);

      // Mouse leave to resume
      fireEvent.mouseLeave(carouselContainer);

      // Fast-forward time - should auto-scroll
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    test('does not auto-scroll with single review', () => {
      const singleReview = [mockReviews[0]];
      render(<ReviewsCarousel reviews={singleReview} trailName='Test Trail' />);

      // Fast-forward time - should not change
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Should still show the same review
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('wraps around to first review after last review', async () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      // Navigate to last review (index 3)
      act(() => {
        jest.advanceTimersByTime(4000 * 3);
      });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Next auto-scroll should wrap to first review
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Manual Navigation', () => {
    test('navigates to next review on next button click', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      const nextButton = screen.getByLabelText('Next review');
      fireEvent.click(nextButton);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    test('navigates to previous review on previous button click', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      // First go to second review
      const nextButton = screen.getByLabelText('Next review');
      fireEvent.click(nextButton);

      // Then go back to first review
      const prevButton = screen.getByLabelText('Previous review');
      fireEvent.click(prevButton);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    test('wraps around from last to first review on next button', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      // Navigate to last review
      const nextButton = screen.getByLabelText('Next review');
      fireEvent.click(nextButton); // 2nd review
      fireEvent.click(nextButton); // 3rd review
      fireEvent.click(nextButton); // 4th review

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();

      // Click next again should wrap to first review
      fireEvent.click(nextButton);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('wraps around from first to last review on previous button', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      const prevButton = screen.getByLabelText('Previous review');
      fireEvent.click(prevButton);

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    test('navigates to specific review on dot click', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      // Click on third dot (index 2)
      const thirdDot = screen.getByLabelText('Go to review 3');
      fireEvent.click(thirdDot);

      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    test('highlights active dot', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      const dots = screen.getAllByRole('button');
      const dotButtons = dots.filter(button =>
        button.getAttribute('aria-label')?.startsWith('Go to review')
      );

      // First dot should be active
      expect(dotButtons[0]).toHaveClass('active');

      // Click on second dot
      fireEvent.click(dotButtons[1]);

      // Second dot should be active, first should not
      expect(dotButtons[1]).toHaveClass('active');
      expect(dotButtons[0]).not.toHaveClass('active');
    });
  });

  describe('Review Counter', () => {
    test('displays correct review counter', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

    test('updates counter when navigating', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      expect(screen.getByText('1 of 4')).toBeInTheDocument();

      const nextButton = screen.getByLabelText('Next review');
      fireEvent.click(nextButton);

      expect(screen.getByText('2 of 4')).toBeInTheDocument();
    });

    test('does not show counter with single review', () => {
      const singleReview = [mockReviews[0]];
      render(<ReviewsCarousel reviews={singleReview} trailName='Test Trail' />);

      expect(screen.queryByText('1 of 1')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Controls Visibility', () => {
    test('shows navigation controls with multiple reviews', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      expect(screen.getByLabelText('Next review')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous review')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to review 1')).toBeInTheDocument();
      expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

    test('hides navigation controls with single review', () => {
      const singleReview = [mockReviews[0]];
      render(<ReviewsCarousel reviews={singleReview} trailName='Test Trail' />);

      expect(screen.queryByLabelText('Next review')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Previous review')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Go to review 1')).not.toBeInTheDocument();
    });

    test('hides navigation controls with no reviews', () => {
      render(<ReviewsCarousel reviews={[]} trailName='Test Trail' />);

      expect(screen.queryByLabelText('Next review')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Previous review')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Go to review 1')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles reviews array with undefined elements', () => {
      const reviewsWithUndefined = [mockReviews[0], undefined, mockReviews[1]];
      render(<ReviewsCarousel reviews={reviewsWithUndefined} trailName='Test Trail' />);

      // Should render without crashing
      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
    });

    test('handles reviews array with null elements', () => {
      const reviewsWithNull = [mockReviews[0], null, mockReviews[1]];
      render(<ReviewsCarousel reviews={reviewsWithNull} trailName='Test Trail' />);

      // Should render without crashing
      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
    });

    test('handles reviews with missing properties', () => {
      const incompleteReviews = [
        { id: 'review-1' }, // Missing message, rating, userName
        { id: 'review-2', message: 'Test message' }, // Missing rating, userName
      ];

      render(<ReviewsCarousel reviews={incompleteReviews} trailName='Test Trail' />);

      // Should render without crashing
      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    test('handles rapid navigation clicks', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      const nextButton = screen.getByLabelText('Next review');

      // Rapid clicks should not cause issues
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    test('handles component unmounting during auto-scroll', () => {
      const { unmount } = render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      // Start auto-scroll
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Unmount component
      unmount();

      // Advance time further - should not cause errors
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for navigation buttons', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      expect(screen.getByLabelText('Next review')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous review')).toBeInTheDocument();
    });

    test('has proper ARIA labels for dot navigation', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      expect(screen.getByLabelText('Go to review 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to review 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to review 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to review 4')).toBeInTheDocument();
    });

    test('navigation buttons are keyboard accessible', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      const nextButton = screen.getByLabelText('Next review');
      const prevButton = screen.getByLabelText('Previous review');

      // Buttons should be focusable
      nextButton.focus();
      expect(document.activeElement).toBe(nextButton);

      prevButton.focus();
      expect(document.activeElement).toBe(prevButton);
    });

    test('dot buttons are keyboard accessible', () => {
      render(<ReviewsCarousel reviews={mockReviews} trailName='Test Trail' />);

      const firstDot = screen.getByLabelText('Go to review 1');

      // Dot should be focusable
      firstDot.focus();
      expect(document.activeElement).toBe(firstDot);
    });
  });
});
