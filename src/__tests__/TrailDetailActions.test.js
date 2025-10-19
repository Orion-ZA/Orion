import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailDetailActions from '../components/trails/TrailDetailActions';

// Mock the UserActions component
jest.mock('../components/trails/UserActions', () => {
  return function MockUserActions({ user, trail, userSaved, onTrailAction }) {
    return (
      <div data-testid='user-actions'>
        <div data-testid='user'>{user ? user.uid : 'no-user'}</div>
        <div data-testid='trail'>{trail ? trail.id : 'no-trail'}</div>
        <div data-testid='user-saved'>{JSON.stringify(userSaved)}</div>
        <button
          data-testid='trail-action-button'
          onClick={() => onTrailAction('favourites', trail?.id)}
        >
          Test Action
        </button>
      </div>
    );
  };
});

describe('TrailDetailActions', () => {
  const defaultProps = {
    user: { uid: 'user-123', displayName: 'Test User' },
    trail: { id: 'trail-123', name: 'Test Trail' },
    userSaved: { favourites: ['trail-456'], wishlist: [], completed: [] },
    onTrailAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders UserActions component with correct props', () => {
      render(<TrailDetailActions {...defaultProps} />);

      expect(screen.getByTestId('user-actions')).toBeInTheDocument();
      expect(screen.getByTestId('user')).toHaveTextContent('user-123');
      expect(screen.getByTestId('trail')).toHaveTextContent('trail-123');
      expect(screen.getByTestId('user-saved')).toHaveTextContent(
        JSON.stringify(defaultProps.userSaved)
      );
    });

    it('handles null user', () => {
      render(<TrailDetailActions {...defaultProps} user={null} />);

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('handles null trail', () => {
      render(<TrailDetailActions {...defaultProps} trail={null} />);

      expect(screen.getByTestId('trail')).toHaveTextContent('no-trail');
    });

    it('handles empty userSaved object', () => {
      const propsWithEmptySaved = {
        ...defaultProps,
        userSaved: { favourites: [], wishlist: [], completed: [] },
      };

      render(<TrailDetailActions {...propsWithEmptySaved} />);

      expect(screen.getByTestId('user-saved')).toHaveTextContent(
        JSON.stringify(propsWithEmptySaved.userSaved)
      );
    });
  });

  describe('Props Passing', () => {
    it('passes user prop correctly', () => {
      const customUser = { uid: 'custom-user', displayName: 'Custom User' };
      render(<TrailDetailActions {...defaultProps} user={customUser} />);

      expect(screen.getByTestId('user')).toHaveTextContent('custom-user');
    });

    it('passes trail prop correctly', () => {
      const customTrail = { id: 'custom-trail', name: 'Custom Trail' };
      render(<TrailDetailActions {...defaultProps} trail={customTrail} />);

      expect(screen.getByTestId('trail')).toHaveTextContent('custom-trail');
    });

    it('passes userSaved prop correctly', () => {
      const customUserSaved = {
        favourites: ['trail-1', 'trail-2'],
        wishlist: ['trail-3'],
        completed: ['trail-4'],
      };
      render(<TrailDetailActions {...defaultProps} userSaved={customUserSaved} />);

      expect(screen.getByTestId('user-saved')).toHaveTextContent(JSON.stringify(customUserSaved));
    });

    it('passes onTrailAction callback correctly', () => {
      const mockOnTrailAction = jest.fn();
      render(<TrailDetailActions {...defaultProps} onTrailAction={mockOnTrailAction} />);

      const actionButton = screen.getByTestId('trail-action-button');
      fireEvent.click(actionButton);

      expect(mockOnTrailAction).toHaveBeenCalledWith('favourites', 'trail-123');
    });
  });

  describe('Component Integration', () => {
    it('acts as a wrapper component', () => {
      render(<TrailDetailActions {...defaultProps} />);

      // Should render the UserActions component
      expect(screen.getByTestId('user-actions')).toBeInTheDocument();

      // Should not render any additional content
      const wrapper = screen.getByTestId('user-actions').parentElement;
      expect(wrapper.children).toHaveLength(1);
    });

    it('maintains prop forwarding integrity', () => {
      const props = {
        user: { uid: 'test-user' },
        trail: { id: 'test-trail' },
        userSaved: { favourites: [] },
        onTrailAction: jest.fn(),
      };

      render(<TrailDetailActions {...props} />);

      // Verify all props are passed through correctly
      expect(screen.getByTestId('user')).toHaveTextContent('test-user');
      expect(screen.getByTestId('trail')).toHaveTextContent('test-trail');
      expect(screen.getByTestId('user-saved')).toHaveTextContent(JSON.stringify(props.userSaved));
    });
  });
});
