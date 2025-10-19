import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsersManagement from '../components/admin/UsersManagement';

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
  Users: ({ className }) => <div data-testid='users-icon' className={className} />,
  Calendar: ({ className }) => <div data-testid='calendar-icon' className={className} />,
  MapPin: ({ className }) => <div data-testid='map-pin-icon' className={className} />,
  Heart: ({ className }) => <div data-testid='heart-icon' className={className} />,
  CheckCircle: ({ className }) => <div data-testid='check-circle-icon' className={className} />,
  Star: ({ className }) => <div data-testid='star-icon' className={className} />,
}));

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('UsersManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<UsersManagement />);

      expect(screen.getByText('Loading users...')).toBeInTheDocument();
      expect(document.querySelector('.admin-loading-spinner')).toBeInTheDocument();
    });

    it('shows loading state with correct CSS classes', () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<UsersManagement />);

      expect(document.querySelector('.admin-users-management')).toBeInTheDocument();
      expect(document.querySelector('.admin-users-loading')).toBeInTheDocument();
      expect(document.querySelector('.admin-loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockRejectedValue(error);

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch users: Network error')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-error-icon')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('retry button refetches users', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockRejectedValueOnce(error).mockResolvedValueOnce({ docs: [] });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch users: Network error')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Wait for the retry to complete
      await waitFor(() => {
        expect(screen.queryByText('Failed to fetch users: Network error')).not.toBeInTheDocument();
      });
    });

    it('shows error state with correct CSS classes', async () => {
      const error = new Error('Network error');
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockRejectedValue(error);

      render(<UsersManagement />);

      await waitFor(() => {
        expect(document.querySelector('.admin-users-error')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-error-icon')).toBeInTheDocument();
      expect(document.querySelector('.admin-retry-button')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows no users message when no users exist', async () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-no-users-icon')).toBeInTheDocument();
    });

    it('shows empty state with correct CSS classes', async () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(document.querySelector('.admin-no-users')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-no-users-icon')).toBeInTheDocument();
    });
  });

  describe('Users Display', () => {
    const mockUsers = [
      {
        id: 'user1',
        data: () => ({
          profileInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            joinedDate: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          },
          submittedTrails: ['trail1', 'trail2'],
          favourites: ['trail3', 'trail4', 'trail5'],
          completed: ['trail6'],
          wishlist: ['trail7', 'trail8'],
        }),
      },
      {
        id: 'user2',
        data: () => ({
          profileInfo: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            joinedDate: { toDate: () => new Date('2024-01-16T14:20:00Z') },
          },
          submittedTrails: ['trail9'],
          favourites: ['trail10'],
          completed: ['trail11', 'trail12'],
          wishlist: [],
        }),
      },
    ];

    beforeEach(() => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsers });
    });

    it('displays users correctly', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('displays user statistics', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Total Users: 2')).toBeInTheDocument();
      });

      expect(document.querySelector('.admin-stat-icon')).toBeInTheDocument();
    });

    it('displays user details correctly', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getAllByText('Joined:')).toHaveLength(2);
      expect(screen.getAllByText('Submitted Trails:')).toHaveLength(2);
      expect(screen.getAllByText('Favorites:')).toHaveLength(2);
      expect(screen.getAllByText('Completed:')).toHaveLength(2);
      expect(screen.getAllByText('Wishlist:')).toHaveLength(2);
    });

    it('displays user activity correctly', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('Submitted 2 trails')).toBeInTheDocument();
      expect(screen.getByText('3 favorites')).toBeInTheDocument();
      expect(screen.getByText('1 completed')).toBeInTheDocument();
      expect(screen.getByText('2 in wishlist')).toBeInTheDocument();
    });

    it('displays activity icons correctly', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(document.querySelectorAll('.admin-activity-icon')).toHaveLength(8); // 2 users × 4 icons each
      expect(screen.getAllByTestId('map-pin-icon')).toHaveLength(2);
      expect(screen.getAllByTestId('heart-icon')).toHaveLength(2);
      expect(screen.getAllByTestId('check-circle-icon')).toHaveLength(2);
      expect(screen.getAllByTestId('star-icon')).toHaveLength(2);
    });

    it('handles users without profile info', async () => {
      const mockUsersNoProfile = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: null,
            submittedTrails: [],
            favourites: [],
            completed: [],
            wishlist: [],
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockUsersNoProfile });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Anonymous User')).toBeInTheDocument();
      });

      expect(screen.getByText('No email')).toBeInTheDocument();
    });

    it('handles users with partial profile info', async () => {
      const mockUsersPartialProfile = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: {
              email: 'test@example.com',
              joinedDate: null,
            },
            submittedTrails: [],
            favourites: [],
            completed: [],
            wishlist: [],
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockUsersPartialProfile });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getAllByText('test@example.com')).toHaveLength(2);
      });

      expect(screen.getAllByText('test@example.com')).toHaveLength(2); // Name falls back to email
      expect(screen.getByText('N/A')).toBeInTheDocument(); // Joined date
    });

    it('handles users with missing arrays', async () => {
      const mockUsersNoArrays = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: {
              name: 'Test User',
              email: 'test@example.com',
              joinedDate: { toDate: () => new Date('2024-01-15T10:30:00Z') },
            },
            // Missing submittedTrails, favourites, completed, wishlist
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockUsersNoArrays });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      expect(screen.getAllByText('0')).toHaveLength(4); // All counts should be 0
    });
  });

  describe('Delete Functionality', () => {
    const mockUsers = [
      {
        id: 'user1',
        data: () => ({
          profileInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            joinedDate: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          },
          submittedTrails: ['trail1'],
          favourites: ['trail2'],
          completed: ['trail3'],
          wishlist: ['trail4'],
        }),
      },
    ];

    beforeEach(() => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsers });
    });

    it('shows delete confirmation modal', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete User');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete the user "John Doe"?')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'This action cannot be undone and will remove all user data including submitted trails and reviews.'
        )
      ).toBeInTheDocument();
    });

    it('cancels delete confirmation', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete User');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });

    it('deletes user successfully', async () => {
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockResolvedValue();

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete User');
      fireEvent.click(deleteButton);

      const confirmDeleteButton = screen.getByText('Delete User');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });

      expect(mockDoc).toHaveBeenCalledWith({}, 'Users', 'user1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });

    it('handles delete error', async () => {
      const error = new Error('Delete failed');
      mockDoc.mockReturnValue('docRef');
      mockDeleteDoc.mockRejectedValue(error);

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete User');
      fireEvent.click(deleteButton);

      const confirmDeleteButton = screen.getByText('Delete User');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete user: Delete failed')).toBeInTheDocument();
      });
    });

    it('shows delete modal with correct CSS classes', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete User');
      fireEvent.click(deleteButton);

      expect(document.querySelector('.admin-delete-modal-overlay')).toBeInTheDocument();
      expect(document.querySelector('.admin-delete-modal')).toBeInTheDocument();
      expect(document.querySelector('.admin-modal-actions')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    const mockUsers = [
      {
        id: 'user1',
        data: () => ({
          profileInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            joinedDate: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          },
          submittedTrails: [],
          favourites: [],
          completed: [],
          wishlist: [],
        }),
      },
    ];

    beforeEach(() => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsers });
    });

    it('formats Firestore timestamp correctly', async () => {
      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check that date is formatted (exact format depends on locale)
      expect(screen.getByText(/2024\/01\/15/)).toBeInTheDocument();
    });

    it('handles missing joined date', async () => {
      const mockUsersNoDate = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: {
              name: 'John Doe',
              email: 'john@example.com',
              joinedDate: null,
            },
            submittedTrails: [],
            favourites: [],
            completed: [],
            wishlist: [],
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockUsersNoDate });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('handles string joined date', async () => {
      const mockUsersStringDate = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: {
              name: 'John Doe',
              email: 'john@example.com',
              joinedDate: '2024-01-15T10:30:00Z',
            },
            submittedTrails: [],
            favourites: [],
            completed: [],
            wishlist: [],
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockUsersStringDate });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should format string date
      expect(screen.getByText(/2024\/01\/15/)).toBeInTheDocument();
    });
  });

  describe('User Name and Email Helpers', () => {
    it('uses profile name when available', async () => {
      const mockUsers = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: {
              name: 'John Doe',
              email: 'john@example.com',
              joinedDate: { toDate: () => new Date('2024-01-15T10:30:00Z') },
            },
            submittedTrails: [],
            favourites: [],
            completed: [],
            wishlist: [],
          }),
        },
      ];

      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsers });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('falls back to email when name is not available', async () => {
      const mockUsers = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: {
              email: 'jane@example.com',
              joinedDate: { toDate: () => new Date('2024-01-15T10:30:00Z') },
            },
            submittedTrails: [],
            favourites: [],
            completed: [],
            wishlist: [],
          }),
        },
      ];

      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsers });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getAllByText('jane@example.com')).toHaveLength(2);
      });

      expect(screen.getAllByText('jane@example.com')).toHaveLength(2); // Name falls back to email
    });

    it('shows Anonymous User when no profile info', async () => {
      const mockUsers = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: null,
            submittedTrails: [],
            favourites: [],
            completed: [],
            wishlist: [],
          }),
        },
      ];

      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsers });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Anonymous User')).toBeInTheDocument();
      });

      expect(screen.getByText('No email')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty users collection', async () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('handles malformed user data', async () => {
      const mockUsersMalformed = [
        {
          id: 'user1',
          data: () => {
            throw new Error('Malformed data');
          },
        },
      ];

      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsersMalformed });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch users: Malformed data')).toBeInTheDocument();
      });
    });

    it('handles users with undefined values', async () => {
      const mockUsersUndefined = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: {
              name: undefined,
              email: undefined,
              joinedDate: undefined,
            },
            submittedTrails: undefined,
            favourites: undefined,
            completed: undefined,
            wishlist: undefined,
          }),
        },
      ];

      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsersUndefined });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Anonymous User')).toBeInTheDocument();
      });

      expect(screen.getByText('No email')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct CSS classes', async () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(document.querySelector('.admin-users-management')).toBeInTheDocument();
        expect(document.querySelector('.admin-users-header')).toBeInTheDocument();
        expect(document.querySelector('.admin-users-stats')).toBeInTheDocument();
        expect(document.querySelector('.admin-users-list')).toBeInTheDocument();
      });
    });

    it('displays correct header content', async () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Users Management')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Users: 0')).toBeInTheDocument();
    });

    it('renders all required icons', async () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getAllByTestId('users-icon')).toHaveLength(2);
      });

      expect(document.querySelector('.admin-stat-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button labels', async () => {
      const mockUsers = [
        {
          id: 'user1',
          data: () => ({
            profileInfo: {
              name: 'John Doe',
              email: 'john@example.com',
              joinedDate: { toDate: () => new Date('2024-01-15T10:30:00Z') },
            },
            submittedTrails: [],
            favourites: [],
            completed: [],
            wishlist: [],
          }),
        },
      ];

      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: mockUsers });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete User')).toBeInTheDocument();
      });

      // Click delete button to open modal
      const deleteButton = screen.getByTitle('Delete User');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete User')).toBeInTheDocument();
    });

    it('has proper form structure', async () => {
      mockCollection.mockReturnValue('usersRef');
      mockOrderBy.mockReturnValue('orderByClause');
      mockQuery.mockReturnValue('query');
      mockGetDocs.mockResolvedValue({ docs: [] });

      render(<UsersManagement />);

      await waitFor(() => {
        expect(screen.getByText('Users Management')).toBeInTheDocument();
      });

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });
});
