import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteConfirmationModal from '../components/admin/DeleteConfirmationModal';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

// Mock console.log to avoid test output noise
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('DeleteConfirmationModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders nothing when isVisible is false', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={false}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });

    it('renders nothing when deleteConfirm is null', () => {
      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={null}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });

    it('renders nothing when deleteConfirm is undefined', () => {
      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={undefined}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });

    it('renders modal when both isVisible and deleteConfirm are provided', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('renders with correct CSS classes', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(document.querySelector('.delete-modal-overlay')).toBeInTheDocument();
      expect(document.querySelector('.delete-modal-content')).toBeInTheDocument();
      expect(document.querySelector('.modal-header')).toBeInTheDocument();
      expect(document.querySelector('.modal-body')).toBeInTheDocument();
      expect(document.querySelector('.modal-footer')).toBeInTheDocument();
    });
  });

  describe('Trail Deletion', () => {
    it('renders trail deletion confirmation with trail name', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Mountain Peak Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Mountain Peak Trail"?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone and will also delete all associated reviews.')).toBeInTheDocument();
    });

    it('handles trail with null name', () => {
      const deleteConfirm = {
        type: 'trail',
        name: null
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Unknown"?')).toBeInTheDocument();
    });

    it('handles trail with undefined name', () => {
      const deleteConfirm = {
        type: 'trail',
        name: undefined
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Unknown"?')).toBeInTheDocument();
    });

    it('handles trail with empty string name', () => {
      const deleteConfirm = {
        type: 'trail',
        name: ''
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Unknown"?')).toBeInTheDocument();
    });

    it('handles trail with non-string name', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 123
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "123"?')).toBeInTheDocument();
    });
  });

  describe('Review Deletion', () => {
    it('renders review deletion confirmation with complete review data', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Forest Trail',
        rating: 4,
        comment: 'Great trail with beautiful views!'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete this review?')).toBeInTheDocument();
      expect(screen.getByText('Trail: Forest Trail')).toBeInTheDocument();
      expect(screen.getByText('Rating: 4/5')).toBeInTheDocument();
      expect(screen.getByText('"Great trail with beautiful views!"')).toBeInTheDocument();
    });

    it('renders review deletion with message instead of comment', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Mountain Trail',
        rating: 3,
        message: 'Decent trail but could be better maintained'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete this review?')).toBeInTheDocument();
      expect(screen.getByText('Trail: Mountain Trail')).toBeInTheDocument();
      expect(screen.getByText('Rating: 3/5')).toBeInTheDocument();
      expect(screen.getByText('"Decent trail but could be better maintained"')).toBeInTheDocument();
    });

    it('handles review with null trail name', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: null,
        rating: 5,
        comment: 'Amazing!'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Trail: Unknown')).toBeInTheDocument();
    });

    it('handles review with undefined trail name', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: undefined,
        rating: 2,
        comment: 'Not great'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Trail: Unknown')).toBeInTheDocument();
    });

    it('handles review with non-number rating', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Test Trail',
        rating: 'five',
        comment: 'Good trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Rating: 0/5')).toBeInTheDocument();
    });

    it('handles review with null rating', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Test Trail',
        rating: null,
        comment: 'Good trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Rating: 0/5')).toBeInTheDocument();
    });

    it('handles review with undefined rating', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Test Trail',
        rating: undefined,
        comment: 'Good trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Rating: 0/5')).toBeInTheDocument();
    });

    it('handles review with non-string comment', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Test Trail',
        rating: 4,
        comment: 123
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('"123"')).toBeInTheDocument();
    });

    it('handles review with null comment', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Test Trail',
        rating: 4,
        comment: null
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/preview-comment/)).not.toBeInTheDocument();
    });

    it('handles review with undefined comment', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Test Trail',
        rating: 4,
        comment: undefined
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/preview-comment/)).not.toBeInTheDocument();
    });

    it('handles review with empty string comment', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Test Trail',
        rating: 4,
        comment: ''
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Empty string is falsy, so comment section should not be rendered
      expect(screen.queryByText(/preview-comment/)).not.toBeInTheDocument();
    });

    it('handles review with non-string message', () => {
      const deleteConfirm = {
        type: 'review',
        trailName: 'Test Trail',
        rating: 4,
        message: 456
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('"456"')).toBeInTheDocument();
    });
  });

  describe('Alert Deletion', () => {
    it('renders alert deletion confirmation with message', () => {
      const deleteConfirm = {
        type: 'alert',
        message: 'Trail closed due to weather conditions'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete this alert?')).toBeInTheDocument();
      expect(screen.getByText('"Trail closed due to weather conditions"')).toBeInTheDocument();
      expect(screen.getByText('Type: alert')).toBeInTheDocument();
    });

    it('renders alert deletion with comment instead of message', () => {
      const deleteConfirm = {
        type: 'alert',
        comment: 'Maintenance scheduled for next week'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete this alert?')).toBeInTheDocument();
      expect(screen.getByText('"Maintenance scheduled for next week"')).toBeInTheDocument();
      expect(screen.getByText('Type: alert')).toBeInTheDocument();
    });

    it('handles alert with null message and comment', () => {
      const deleteConfirm = {
        type: 'alert',
        message: null,
        comment: null
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('"null"')).toBeInTheDocument();
    });

    it('handles alert with undefined message and comment', () => {
      const deleteConfirm = {
        type: 'alert',
        message: undefined,
        comment: undefined
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('"undefined"')).toBeInTheDocument();
    });

    it('handles alert with non-string message', () => {
      const deleteConfirm = {
        type: 'alert',
        message: 789
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('"789"')).toBeInTheDocument();
    });

    it('handles alert with null type', () => {
      const deleteConfirm = {
        type: null,
        message: 'Test alert'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // When type is null, it falls back to trail deletion case
      expect(screen.getByText('Are you sure you want to delete the trail "Unknown"?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone and will also delete all associated reviews.')).toBeInTheDocument();
    });

    it('handles alert with undefined type', () => {
      const deleteConfirm = {
        type: undefined,
        message: 'Test alert'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // When type is undefined, it falls back to trail deletion case
      expect(screen.getByText('Are you sure you want to delete the trail "Unknown"?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone and will also delete all associated reviews.')).toBeInTheDocument();
    });

    it('handles alert with non-string type', () => {
      const deleteConfirm = {
        type: 123,
        message: 'Test alert'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // When type is not 'review' or 'alert', it falls back to trail deletion case
      expect(screen.getByText('Are you sure you want to delete the trail "Unknown"?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone and will also delete all associated reviews.')).toBeInTheDocument();
    });
  });

  describe('Unknown Type Handling', () => {
    it('renders trail deletion for unknown type', () => {
      const deleteConfirm = {
        type: 'unknown',
        name: 'Test Item'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Test Item"?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone and will also delete all associated reviews.')).toBeInTheDocument();
    });

    it('renders trail deletion for empty type', () => {
      const deleteConfirm = {
        type: '',
        name: 'Test Item'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Test Item"?')).toBeInTheDocument();
    });

    it('renders trail deletion for null type', () => {
      const deleteConfirm = {
        type: null,
        name: 'Test Item'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Test Item"?')).toBeInTheDocument();
    });

    it('renders trail deletion for undefined type', () => {
      const deleteConfirm = {
        type: undefined,
        name: 'Test Item'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Test Item"?')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when delete button is clicked', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('renders delete button with trash icon', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton.querySelector('[data-testid="trash-icon"]')).toBeInTheDocument();
    });

    it('renders buttons with correct CSS classes', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      const deleteButton = screen.getByText('Delete');

      expect(cancelButton).toHaveClass('cancel-button');
      expect(deleteButton).toHaveClass('confirm-delete-button');
    });
  });

  describe('Console Logging', () => {
    it('logs render information when component renders', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(console.log).toHaveBeenCalledWith(
        'DeleteConfirmationModal render - isVisible:',
        true,
        'deleteConfirm:',
        deleteConfirm
      );
    });

    it('logs render information when component does not render', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={false}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(console.log).toHaveBeenCalledWith(
        'DeleteConfirmationModal render - isVisible:',
        false,
        'deleteConfirm:',
        deleteConfirm
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty deleteConfirm object', () => {
      const deleteConfirm = {};

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete the trail "Unknown"?')).toBeInTheDocument();
    });

    it('handles deleteConfirm with only type property', () => {
      const deleteConfirm = {
        type: 'review'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Are you sure you want to delete this review?')).toBeInTheDocument();
      expect(screen.getByText('Trail: Unknown')).toBeInTheDocument();
      expect(screen.getByText('Rating: 0/5')).toBeInTheDocument();
    });

    it('handles rapid state changes', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      const { rerender } = render(
        <DeleteConfirmationModal
          isVisible={false}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();

      rerender(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();

      rerender(
        <DeleteConfirmationModal
          isVisible={false}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Confirm Deletion');
    });

    it('has clickable buttons', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      const deleteButton = screen.getByText('Delete');

      expect(cancelButton.tagName).toBe('BUTTON');
      expect(deleteButton.tagName).toBe('BUTTON');
    });

    it('has proper modal structure', () => {
      const deleteConfirm = {
        type: 'trail',
        name: 'Test Trail'
      };

      render(
        <DeleteConfirmationModal
          isVisible={true}
          deleteConfirm={deleteConfirm}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const overlay = document.querySelector('.delete-modal-overlay');
      const content = document.querySelector('.delete-modal-content');
      const header = document.querySelector('.modal-header');
      const body = document.querySelector('.modal-body');
      const footer = document.querySelector('.modal-footer');

      expect(overlay).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(body).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });
});
