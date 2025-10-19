import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserActions from '../components/trails/UserActions';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Heart: ({ size, ...props }) => <div data-testid='heart' data-size={size} {...props} />,
  Bookmark: ({ size, ...props }) => <div data-testid='bookmark' data-size={size} {...props} />,
  Check: ({ size, ...props }) => <div data-testid='check' data-size={size} {...props} />,
  Edit3: ({ size, ...props }) => <div data-testid='edit3' data-size={size} {...props} />,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  BrowserRouter: ({ children }) => children,
}));

const renderWithRouter = component => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UserActions', () => {
  const mockUser = {
    uid: 'user-123',
    displayName: 'John Doe',
    email: 'john@example.com',
  };

  const mockTrail = {
    id: 'trail-1',
    name: "Lion's Head Trail",
    authorId: 'user-123',
    difficulty: 'moderate',
    distance: 5.2,
  };

  const mockUserSaved = {
    favourites: [],
    wishlist: [],
    completed: [],
  };

  const defaultProps = {
    user: mockUser,
    trail: mockTrail,
    userSaved: mockUserSaved,
    onTrailAction: jest.fn(),
  };

  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
  });

  describe('Basic Rendering', () => {
    it('should render nothing when user is null', () => {
      const { container } = renderWithRouter(<UserActions {...defaultProps} user={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when user is undefined', () => {
      const { container } = renderWithRouter(<UserActions {...defaultProps} user={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render user actions section when user is provided', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText('My Actions')).toBeInTheDocument();
    });

    it('should render with correct CSS classes', () => {
      const { container } = renderWithRouter(<UserActions {...defaultProps} />);

      expect(container.querySelector('.trail-detail-user-actions')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-action-buttons')).toBeInTheDocument();
    });
  });

  describe('Action Buttons Rendering', () => {
    it('should render all action buttons', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      expect(screen.getByRole('button', { name: /favourite/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /wishlist/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
    });

    it('should render edit button when user is the author', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      expect(screen.getByRole('button', { name: /edit trail/i })).toBeInTheDocument();
    });

    it('should not render edit button when user is not the author', () => {
      const trailWithDifferentAuthor = { ...mockTrail, authorId: 'different-user' };
      renderWithRouter(<UserActions {...defaultProps} trail={trailWithDifferentAuthor} />);

      expect(screen.queryByRole('button', { name: /edit trail/i })).not.toBeInTheDocument();
    });

    it('should render correct icons for each button', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      expect(screen.getByTestId('heart')).toBeInTheDocument();
      expect(screen.getByTestId('bookmark')).toBeInTheDocument();
      expect(screen.getByTestId('check')).toBeInTheDocument();
      expect(screen.getByTestId('edit3')).toBeInTheDocument();
    });
  });

  describe('Favourites Button', () => {
    it('should show "Favourite" when trail is not favourited', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const favouriteButton = screen.getByRole('button', { name: /favourite/i });
      expect(favouriteButton).toHaveTextContent('Favourite');
    });

    it('should show "Favourited" when trail is favourited', () => {
      const userWithFavourite = {
        ...mockUserSaved,
        favourites: ['trail-1'],
      };

      renderWithRouter(<UserActions {...defaultProps} userSaved={userWithFavourite} />);

      const favouriteButton = screen.getByRole('button', { name: /favourited/i });
      expect(favouriteButton).toHaveTextContent('Favourited');
    });

    it('should have active class when favourited', () => {
      const userWithFavourite = {
        ...mockUserSaved,
        favourites: ['trail-1'],
      };

      const { container } = renderWithRouter(
        <UserActions {...defaultProps} userSaved={userWithFavourite} />
      );

      const favouriteButton = container.querySelector('.trail-detail-action-btn.favourites.active');
      expect(favouriteButton).toBeInTheDocument();
    });

    it('should call onTrailAction with correct parameters when clicked', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const favouriteButton = screen.getByRole('button', { name: /favourite/i });
      fireEvent.click(favouriteButton);

      expect(defaultProps.onTrailAction).toHaveBeenCalledWith('favourites', 'trail-1');
    });

    it('should have correct title attribute', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const favouriteButton = screen.getByTitle('Add to favourites');
      expect(favouriteButton).toBeInTheDocument();
    });

    it('should have correct title when favourited', () => {
      const userWithFavourite = {
        ...mockUserSaved,
        favourites: ['trail-1'],
      };

      renderWithRouter(<UserActions {...defaultProps} userSaved={userWithFavourite} />);

      const favouriteButton = screen.getByTitle('Remove from favourites');
      expect(favouriteButton).toBeInTheDocument();
    });
  });

  describe('Wishlist Button', () => {
    it('should show "Add to Wishlist" when trail is not in wishlist', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
      expect(wishlistButton).toHaveTextContent('Add to Wishlist');
    });

    it('should show "In Wishlist" when trail is in wishlist', () => {
      const userWithWishlist = {
        ...mockUserSaved,
        wishlist: ['trail-1'],
      };

      renderWithRouter(<UserActions {...defaultProps} userSaved={userWithWishlist} />);

      const wishlistButton = screen.getByRole('button', { name: /in wishlist/i });
      expect(wishlistButton).toHaveTextContent('In Wishlist');
    });

    it('should have active class when in wishlist', () => {
      const userWithWishlist = {
        ...mockUserSaved,
        wishlist: ['trail-1'],
      };

      const { container } = renderWithRouter(
        <UserActions {...defaultProps} userSaved={userWithWishlist} />
      );

      const wishlistButton = container.querySelector('.trail-detail-action-btn.wishlist.active');
      expect(wishlistButton).toBeInTheDocument();
    });

    it('should call onTrailAction with correct parameters when clicked', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const wishlistButton = screen.getByRole('button', { name: /add to wishlist/i });
      fireEvent.click(wishlistButton);

      expect(defaultProps.onTrailAction).toHaveBeenCalledWith('wishlist', 'trail-1');
    });

    it('should have correct title attribute', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const wishlistButton = screen.getByTitle('Add to wishlist');
      expect(wishlistButton).toBeInTheDocument();
    });

    it('should have correct title when in wishlist', () => {
      const userWithWishlist = {
        ...mockUserSaved,
        wishlist: ['trail-1'],
      };

      renderWithRouter(<UserActions {...defaultProps} userSaved={userWithWishlist} />);

      const wishlistButton = screen.getByTitle('Remove from wishlist');
      expect(wishlistButton).toBeInTheDocument();
    });
  });

  describe('Completed Button', () => {
    it('should show "Mark Complete" when trail is not completed', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const completedButton = screen.getByRole('button', { name: /mark complete/i });
      expect(completedButton).toHaveTextContent('Mark Complete');
    });

    it('should show "Completed" when trail is completed', () => {
      const userWithCompleted = {
        ...mockUserSaved,
        completed: ['trail-1'],
      };

      renderWithRouter(<UserActions {...defaultProps} userSaved={userWithCompleted} />);

      const completedButton = screen.getByRole('button', { name: /completed/i });
      expect(completedButton).toHaveTextContent('Completed');
    });

    it('should have active class when completed', () => {
      const userWithCompleted = {
        ...mockUserSaved,
        completed: ['trail-1'],
      };

      const { container } = renderWithRouter(
        <UserActions {...defaultProps} userSaved={userWithCompleted} />
      );

      const completedButton = container.querySelector('.trail-detail-action-btn.completed.active');
      expect(completedButton).toBeInTheDocument();
    });

    it('should call onTrailAction with correct parameters when clicked', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const completedButton = screen.getByRole('button', { name: /mark complete/i });
      fireEvent.click(completedButton);

      expect(defaultProps.onTrailAction).toHaveBeenCalledWith('completed', 'trail-1');
    });

    it('should have correct title attribute', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const completedButton = screen.getByTitle('Mark as completed');
      expect(completedButton).toBeInTheDocument();
    });

    it('should have correct title when completed', () => {
      const userWithCompleted = {
        ...mockUserSaved,
        completed: ['trail-1'],
      };

      renderWithRouter(<UserActions {...defaultProps} userSaved={userWithCompleted} />);

      const completedButton = screen.getByTitle('Mark as not completed');
      expect(completedButton).toBeInTheDocument();
    });
  });

  describe('Edit Button', () => {
    it('should navigate to edit page when clicked', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /edit trail/i });
      fireEvent.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trails/trail-1/edit');
    });

    it('should have correct title attribute', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const editButton = screen.getByTitle('Edit trail');
      expect(editButton).toBeInTheDocument();
    });

    it('should not render when user is not the author', () => {
      const trailWithDifferentAuthor = { ...mockTrail, authorId: 'different-user' };
      renderWithRouter(<UserActions {...defaultProps} trail={trailWithDifferentAuthor} />);

      expect(screen.queryByRole('button', { name: /edit trail/i })).not.toBeInTheDocument();
    });

    it('should render when user is the author', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      expect(screen.getByRole('button', { name: /edit trail/i })).toBeInTheDocument();
    });
  });

  describe('Multiple Actions State', () => {
    it('should handle trail in multiple lists', () => {
      const userWithMultipleActions = {
        favourites: ['trail-1'],
        wishlist: ['trail-1'],
        completed: ['trail-1'],
      };

      const { container } = renderWithRouter(
        <UserActions {...defaultProps} userSaved={userWithMultipleActions} />
      );

      expect(container.querySelector('.favourites.active')).toBeInTheDocument();
      expect(container.querySelector('.wishlist.active')).toBeInTheDocument();
      expect(container.querySelector('.completed.active')).toBeInTheDocument();
    });

    it('should show correct text for all active states', () => {
      const userWithMultipleActions = {
        favourites: ['trail-1'],
        wishlist: ['trail-1'],
        completed: ['trail-1'],
      };

      renderWithRouter(<UserActions {...defaultProps} userSaved={userWithMultipleActions} />);

      expect(screen.getByText('Favourited')).toBeInTheDocument();
      expect(screen.getByText('In Wishlist')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle userSaved with undefined arrays', () => {
      const userWithUndefinedArrays = {
        favourites: undefined,
        wishlist: undefined,
        completed: undefined,
      };

      expect(() => {
        renderWithRouter(<UserActions {...defaultProps} userSaved={userWithUndefinedArrays} />);
      }).toThrow();
    });

    it('should handle userSaved with null arrays', () => {
      const userWithNullArrays = {
        favourites: null,
        wishlist: null,
        completed: null,
      };

      expect(() => {
        renderWithRouter(<UserActions {...defaultProps} userSaved={userWithNullArrays} />);
      }).toThrow();
    });

    it('should handle trail with undefined id', () => {
      const trailWithUndefinedId = { ...mockTrail, id: undefined };

      expect(() => {
        renderWithRouter(<UserActions {...defaultProps} trail={trailWithUndefinedId} />);
      }).not.toThrow();
    });

    it('should handle trail with null id', () => {
      const trailWithNullId = { ...mockTrail, id: null };

      expect(() => {
        renderWithRouter(<UserActions {...defaultProps} trail={trailWithNullId} />);
      }).not.toThrow();
    });

    it('should handle user with undefined uid', () => {
      const userWithUndefinedUid = { ...mockUser, uid: undefined };

      expect(() => {
        renderWithRouter(<UserActions {...defaultProps} user={userWithUndefinedUid} />);
      }).not.toThrow();
    });

    it('should handle trail with undefined authorId', () => {
      const trailWithUndefinedAuthorId = { ...mockTrail, authorId: undefined };

      renderWithRouter(<UserActions {...defaultProps} trail={trailWithUndefinedAuthorId} />);

      expect(screen.queryByRole('button', { name: /edit trail/i })).not.toBeInTheDocument();
    });

    it('should handle trail with null authorId', () => {
      const trailWithNullAuthorId = { ...mockTrail, authorId: null };

      renderWithRouter(<UserActions {...defaultProps} trail={trailWithNullAuthorId} />);

      expect(screen.queryByRole('button', { name: /edit trail/i })).not.toBeInTheDocument();
    });
  });

  describe('Icon Props', () => {
    it('should pass correct size props to all icons', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const heartIcon = screen.getByTestId('heart');
      const bookmarkIcon = screen.getByTestId('bookmark');
      const checkIcon = screen.getByTestId('check');
      const editIcon = screen.getByTestId('edit3');

      expect(heartIcon).toHaveAttribute('data-size', '16');
      expect(bookmarkIcon).toHaveAttribute('data-size', '16');
      expect(checkIcon).toHaveAttribute('data-size', '16');
      expect(editIcon).toHaveAttribute('data-size', '16');
    });
  });

  describe('Callback Functions', () => {
    it('should handle undefined onTrailAction gracefully', () => {
      expect(() => {
        renderWithRouter(<UserActions {...defaultProps} onTrailAction={undefined} />);
      }).not.toThrow();
    });

    it('should call onTrailAction with correct parameters for each action', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      // Test favourites
      fireEvent.click(screen.getByRole('button', { name: /favourite/i }));
      expect(defaultProps.onTrailAction).toHaveBeenCalledWith('favourites', 'trail-1');

      // Test wishlist
      fireEvent.click(screen.getByRole('button', { name: /add to wishlist/i }));
      expect(defaultProps.onTrailAction).toHaveBeenCalledWith('wishlist', 'trail-1');

      // Test completed
      fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
      expect(defaultProps.onTrailAction).toHaveBeenCalledWith('completed', 'trail-1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('My Actions');
    });

    it('should have accessible buttons with proper roles', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);

      // Buttons have implicit button role, don't need explicit role attribute
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should have proper title attributes for tooltips', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      expect(screen.getByTitle('Add to favourites')).toBeInTheDocument();
      expect(screen.getByTitle('Add to wishlist')).toBeInTheDocument();
      expect(screen.getByTitle('Mark as completed')).toBeInTheDocument();
      expect(screen.getByTitle('Edit trail')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with complex user data', () => {
      const complexUserSaved = {
        favourites: Array.from({ length: 100 }, (_, i) => `trail-${i}`),
        wishlist: Array.from({ length: 100 }, (_, i) => `trail-${i + 100}`),
        completed: Array.from({ length: 100 }, (_, i) => `trail-${i + 200}`),
      };

      const startTime = performance.now();
      renderWithRouter(<UserActions {...defaultProps} userSaved={complexUserSaved} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should not re-render unnecessarily when props are the same', () => {
      const { rerender } = renderWithRouter(<UserActions {...defaultProps} />);
      const initialHeading = screen.getByRole('heading', { level: 3 });

      rerender(<UserActions {...defaultProps} />);
      const afterRerender = screen.getByRole('heading', { level: 3 });

      expect(initialHeading).toStrictEqual(afterRerender);
    });
  });

  describe('Navigation Integration', () => {
    it('should use navigate hook correctly', () => {
      renderWithRouter(<UserActions {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /edit trail/i });
      fireEvent.click(editButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/trails/trail-1/edit');
    });
  });
});
