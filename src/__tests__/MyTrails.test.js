import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MyTrails from '../pages/MyTrails';
import { getAuth } from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn()
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

// Mock window.alert
const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true
});

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('MyTrails Component', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockSavedTrails = {
    favourites: [
      { id: 'trail-1', name: 'Favourite Trail 1' },
      { id: 'trail-2', name: 'Favourite Trail 2' }
    ],
    completed: [
      { id: 'trail-3', name: 'Completed Trail 1' }
    ],
    wishlist: [
      { id: 'trail-4', name: 'Wishlist Trail 1' },
      { id: 'trail-5', name: 'Wishlist Trail 2' }
    ]
  };

  const mockAlerts = {
    'trail-1': [
      { id: 'alert-1', type: 'warning', message: 'Trail conditions poor' }
    ],
    'trail-2': [],
    'trail-3': [
      { id: 'alert-2', type: 'closure', message: 'Trail closed for maintenance' }
    ],
    'trail-4': [],
    'trail-5': []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getAuth to return user
    getAuth.mockReturnValue({
      currentUser: mockUser
    });

    // Mock successful fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('getsavedtrails')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSavedTrails)
        });
      }
      if (url.includes('getAlerts')) {
        const trailId = url.split('trailId=')[1];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ alerts: mockAlerts[trailId] || [] })
        });
      }
      if (url.includes('removeFavourite') || url.includes('removeWishlist') || url.includes('removeCompleted')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('markCompleted')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('addTrailReview')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    mockConfirm.mockReturnValue(true);
  });

  describe('Component Rendering', () => {
    it('renders the my trails page', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      expect(screen.getByText('My Trails')).toBeInTheDocument();
    });

    it('shows loading state initially', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      expect(screen.getByText('Loading your trails...')).toBeInTheDocument();
    });

    it('renders tabs for different trail categories', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourites')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Wishlist')).toBeInTheDocument();
      });
    });

    it('shows trail counts in tabs', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Favourites count
        expect(screen.getByText('1')).toBeInTheDocument(); // Completed count
        expect(screen.getByText('2')).toBeInTheDocument(); // Wishlist count
      });
    });

    it('shows favourites tab as active by default', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        const favouritesTab = screen.getByText('Favourites').closest('button');
        expect(favouritesTab).toHaveClass('active');
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches to completed tab', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trails')).toBeInTheDocument();
      });

      const completedTab = screen.getByText('Completed');
      await userEvent.click(completedTab);

      expect(completedTab.closest('button')).toHaveClass('active');
      expect(screen.getByText('Completed Trails')).toBeInTheDocument();
    });

    it('switches to wishlist tab', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trails')).toBeInTheDocument();
      });

      const wishlistTab = screen.getByText('Wishlist');
      await userEvent.click(wishlistTab);

      expect(wishlistTab.closest('button')).toHaveClass('active');
      expect(screen.getByText('Wishlist Trails')).toBeInTheDocument();
    });

    it('switches back to favourites tab', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trails')).toBeInTheDocument();
      });

      // Switch to completed first
      const completedTab = screen.getByText('Completed');
      await userEvent.click(completedTab);

      // Switch back to favourites
      const favouritesTab = screen.getByText('Favourites');
      await userEvent.click(favouritesTab);

      expect(favouritesTab.closest('button')).toHaveClass('active');
      expect(screen.getByText('Favourite Trails')).toBeInTheDocument();
    });
  });

  describe('Trail Display', () => {
    it('displays trails in the active tab', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
        expect(screen.getByText('Favourite Trail 2')).toBeInTheDocument();
      });
    });

    it('shows empty state when no trails', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ favourites: [], completed: [], wishlist: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('No trails in your favourites yet.')).toBeInTheDocument();
        expect(screen.getByText('Start exploring to add trails to your collection!')).toBeInTheDocument();
      });
    });

    it('displays alerts for trails', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('[warning] Trail conditions poor')).toBeInTheDocument();
      });
    });

    it('shows remove button for each trail', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×');
        expect(removeButtons).toHaveLength(2); // Two favourite trails
      });
    });
  });

  describe('Trail Removal', () => {
    it('removes trail from favourites when confirmed', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const removeButton = screen.getAllByText('×')[0];
      await userEvent.click(removeButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to remove this trail?');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/removeFavourite',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: 'test-user-id', trailId: 'trail-1' })
          })
        );
      });

      await waitFor(() => {
        expect(screen.queryByText('Favourite Trail 1')).not.toBeInTheDocument();
      });
    });

    it('does not remove trail when not confirmed', async () => {
      mockConfirm.mockReturnValue(false);

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const removeButton = screen.getAllByText('×')[0];
      await userEvent.click(removeButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to remove this trail?');
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('removeFavourite'),
        expect.any(Object)
      );
    });

    it('handles removal error', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSavedTrails)
          });
        }
        if (url.includes('removeFavourite')) {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const removeButton = screen.getAllByText('×')[0];
      await userEvent.click(removeButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to remove trail. Please try again.');
      });
    });
  });

  describe('Mark as Completed', () => {
    it('opens review modal when mark as completed is clicked', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      expect(screen.getByText('Review: Favourite Trail 1')).toBeInTheDocument();
      expect(screen.getByText('Rating (1-5)')).toBeInTheDocument();
      expect(screen.getByText('Comment')).toBeInTheDocument();
    });

    it('closes modal when cancel is clicked', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      expect(screen.getByText('Review: Favourite Trail 1')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(screen.queryByText('Review: Favourite Trail 1')).not.toBeInTheDocument();
    });

    it('closes modal when overlay is clicked', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      expect(screen.getByText('Review: Favourite Trail 1')).toBeInTheDocument();

      const overlay = screen.getByText('Review: Favourite Trail 1').closest('.modal-overlay');
      await userEvent.click(overlay);

      expect(screen.queryByText('Review: Favourite Trail 1')).not.toBeInTheDocument();
    });

    it('submits review and marks trail as completed', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      // Fill out review form
      const ratingStars = screen.getAllByText('★');
      await userEvent.click(ratingStars[4]); // 5 stars

      const commentTextarea = screen.getByPlaceholderText('Share your experience...');
      await userEvent.type(commentTextarea, 'Great trail!');

      const submitButton = screen.getByText('Submit Review');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/markCompleted',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: 'test-user-id', trailId: 'trail-1' })
          })
        );
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"rating":5')
          })
        );
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Trail marked as completed and review submitted!');
      });
    });

    it('validates rating before submission', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      const submitButton = screen.getByText('Submit Review');
      await userEvent.click(submitButton);

      expect(mockAlert).toHaveBeenCalledWith('Please enter a rating between 1 and 5');
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('markCompleted'),
        expect.any(Object)
      );
    });

    it('handles submission error', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSavedTrails)
          });
        }
        if (url.includes('markCompleted')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      const ratingStars = screen.getAllByText('★');
      await userEvent.click(ratingStars[4]);

      const commentTextarea = screen.getByPlaceholderText('Share your experience...');
      await userEvent.type(commentTextarea, 'Great trail!');

      const submitButton = screen.getByText('Submit Review');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Something went wrong. Please try again.');
      });
    });
  });

  describe('Data Fetching', () => {
    it('fetches saved trails on mount', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://getsavedtrails-fqtduxc7ua-uc.a.run.app?uid=test-user-id'
        );
      });
    });

    it('fetches alerts for all trails', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=trail-1'
        );
        expect(global.fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=trail-2'
        );
        expect(global.fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=trail-3'
        );
        expect(global.fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=trail-4'
        );
        expect(global.fetch).toHaveBeenCalledWith(
          'https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=trail-5'
        );
      });
    });

    it('handles fetch error gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('No trails in your favourites yet.')).toBeInTheDocument();
      });
    });

    it('handles unauthenticated user', async () => {
      getAuth.mockReturnValue({
        currentUser: null
      });

      await act(async () => {
        render(<MyTrails />);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Modal Functionality', () => {
    it('prevents body scrolling when modal is open', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
    });

    it('restores body scrolling when modal is closed', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(document.body.style.overflow).toBe('unset');
      expect(document.body.style.position).toBe('static');
    });

    it('resets form when modal is opened', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      // Fill out form
      const ratingStars = screen.getAllByText('★');
      await userEvent.click(ratingStars[4]);

      const commentTextarea = screen.getByPlaceholderText('Share your experience...');
      await userEvent.type(commentTextarea, 'Test comment');

      // Close modal
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      // Open modal again
      await userEvent.click(completeButton);

      // Form should be reset
      expect(commentTextarea).toHaveValue('');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty trail arrays', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ favourites: [], completed: [], wishlist: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('No trails in your favourites yet.')).toBeInTheDocument();
      });
    });

    it('handles malformed trail data', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ favourites: null, completed: undefined, wishlist: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('No trails in your favourites yet.')).toBeInTheDocument();
      });
    });

    it('handles very long trail names', async () => {
      const longName = 'A'.repeat(1000);
      const trailsWithLongName = {
        favourites: [{ id: 'trail-1', name: longName }],
        completed: [],
        wishlist: []
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(trailsWithLongName)
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('handles special characters in trail names', async () => {
      const specialName = 'Trail with special chars: !@#$%^&*()';
      const trailsWithSpecialName = {
        favourites: [{ id: 'trail-1', name: specialName }],
        completed: [],
        wishlist: []
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('getsavedtrails')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(trailsWithSpecialName)
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText(specialName)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper button labels', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText('Remove Favourite Trail 1');
      expect(removeButton).toBeInTheDocument();
    });

    it('has proper heading structure', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      expect(screen.getByRole('heading', { level: 1, name: 'My Trails' })).toBeInTheDocument();
    });

    it('has proper form labels in modal', async () => {
      await act(async () => {
        render(<MyTrails />);
      });

      await waitFor(() => {
        expect(screen.getByText('Favourite Trail 1')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark as Completed');
      await userEvent.click(completeButton);

      expect(screen.getByText('Rating (1-5)')).toBeInTheDocument();
      expect(screen.getByText('Comment')).toBeInTheDocument();
    });
  });
});
