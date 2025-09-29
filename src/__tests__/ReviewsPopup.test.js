import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewsPopup from '../components/ReviewsPopup';

// Mock CSS import
jest.mock('../components/ReviewsPopup.css', () => ({}));

describe('ReviewsPopup Component', () => {
  const mockReviews = [
    {
      id: 'review-1',
      message: 'Great trail with beautiful views!',
      rating: 5,
      userName: 'John Doe',
      timestamp: '2024-01-15T10:30:00Z'
    },
    {
      id: 'review-2',
      message: 'Challenging but rewarding hike.',
      rating: 4,
      userName: 'Jane Smith',
      timestamp: '2024-01-10T14:20:00Z'
    },
    {
      id: 'review-3',
      message: 'Nice easy trail for beginners.',
      rating: 3,
      userName: null, // Anonymous review
      timestamp: '2024-01-05T09:15:00Z'
    }
  ];

  const defaultProps = {
    isVisible: true,
    reviews: mockReviews,
    trailName: 'Test Trail',
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders when visible', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      expect(screen.getByText('Reviews for Test Trail')).toBeInTheDocument();
    });

    test('does not render when not visible', () => {
      render(<ReviewsPopup {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByText('Reviews for Test Trail')).not.toBeInTheDocument();
    });

    test('renders all reviews', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      expect(screen.getByText('Great trail with beautiful views!')).toBeInTheDocument();
      expect(screen.getByText('Challenging but rewarding hike.')).toBeInTheDocument();
      expect(screen.getByText('Nice easy trail for beginners.')).toBeInTheDocument();
    });

    test('displays trail name in header', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      expect(screen.getByText('Reviews for Test Trail')).toBeInTheDocument();
    });
  });

  describe('Review Display', () => {
    test('shows review authors', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('shows Anonymous for reviews without userName', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    test('displays review messages', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      expect(screen.getByText('Great trail with beautiful views!')).toBeInTheDocument();
      expect(screen.getByText('Challenging but rewarding hike.')).toBeInTheDocument();
      expect(screen.getByText('Nice easy trail for beginners.')).toBeInTheDocument();
    });

    test('displays review dates', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      // Check that dates are displayed (format may vary by locale)
      // Look for any date-like pattern that includes numbers and slashes or dashes
      const dateElements = screen.getAllByText(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    test('shows star ratings correctly', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      // Check that star elements are present (using lucide-star class)
      const stars = document.querySelectorAll('.lucide-star');
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    test('shows no reviews message when reviews array is empty', () => {
      render(<ReviewsPopup {...defaultProps} reviews={[]} />);
      
      expect(screen.getByText('No reviews yet for this trail.')).toBeInTheDocument();
    });

    test('does not show reviews when reviews array is empty', () => {
      render(<ReviewsPopup {...defaultProps} reviews={[]} />);
      
      expect(screen.queryByText('Great trail with beautiful views!')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls onClose when close button is clicked', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when overlay is clicked', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      const overlay = document.querySelector('.reviews-popup-overlay');
      fireEvent.click(overlay);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('does not call onClose when popup content is clicked', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      const popupContent = document.querySelector('.reviews-popup');
      fireEvent.click(popupContent);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    test('does not call onClose when review item is clicked', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      const reviewItem = document.querySelector('.review-item');
      fireEvent.click(reviewItem);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles reviews without ratings', () => {
      const reviewsWithoutRatings = [
        {
          id: 'review-1',
          message: 'Great trail!',
          userName: 'John Doe',
          timestamp: '2024-01-15T10:30:00Z'
        }
      ];
      
      render(<ReviewsPopup {...defaultProps} reviews={reviewsWithoutRatings} />);
      
      expect(screen.getByText('Great trail!')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('handles reviews with invalid timestamps', () => {
      const reviewsWithInvalidTimestamps = [
        {
          id: 'review-1',
          message: 'Great trail!',
          userName: 'John Doe',
          timestamp: 'invalid-date'
        }
      ];
      
      render(<ReviewsPopup {...defaultProps} reviews={reviewsWithInvalidTimestamps} />);
      
      expect(screen.getByText('Great trail!')).toBeInTheDocument();
    });

    test('handles very long review messages', () => {
      const longReview = [
        {
          id: 'review-1',
          message: 'This is a very long review message that contains a lot of text and should be displayed properly in the popup without breaking the layout or causing any issues with the component rendering.',
          userName: 'John Doe',
          timestamp: '2024-01-15T10:30:00Z'
        }
      ];
      
      render(<ReviewsPopup {...defaultProps} reviews={longReview} />);
      
      expect(screen.getByText(/This is a very long review message/)).toBeInTheDocument();
    });

    test('handles special characters in review content', () => {
      const specialCharReview = [
        {
          id: 'review-1',
          message: 'Great trail! 🥾 Beautiful views! ⛰️ Highly recommend! ⭐',
          userName: 'John Doe',
          timestamp: '2024-01-15T10:30:00Z'
        }
      ];
      
      render(<ReviewsPopup {...defaultProps} reviews={specialCharReview} />);
      
      expect(screen.getByText(/Great trail! 🥾 Beautiful views! ⛰️ Highly recommend! ⭐/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper button role for close button', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    test('has proper heading structure', () => {
      render(<ReviewsPopup {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Reviews for Test Trail');
    });
  });
});
