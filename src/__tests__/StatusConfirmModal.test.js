import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatusConfirmModal from '../components/modals/StatusConfirmModal';

describe('StatusConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    trailName: 'Test Trail',
    currentStatus: 'open'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body styles before each test
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  });

  afterEach(() => {
    // Clean up body styles after each test
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  });

  describe('Rendering', () => {
    it('renders modal without open class when isOpen is false', () => {
      render(<StatusConfirmModal {...defaultProps} isOpen={false} />);
      
      const overlay = document.querySelector('.status-confirm-overlay');
      expect(overlay).not.toHaveClass('open');
    });

    it('renders modal when isOpen is true', () => {
      render(<StatusConfirmModal {...defaultProps} />);
      
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to close the trail "Test Trail"/)).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Close Trail')).toBeInTheDocument();
    });

    it('renders with correct CSS classes when open', () => {
      render(<StatusConfirmModal {...defaultProps} />);
      
      const overlay = document.querySelector('.status-confirm-overlay');
      expect(overlay).toHaveClass('open');
      expect(document.querySelector('.status-confirm-content')).toBeInTheDocument();
      expect(document.querySelector('.status-confirm-actions')).toBeInTheDocument();
    });

    it('renders without open class when closed', () => {
      render(<StatusConfirmModal {...defaultProps} isOpen={false} />);
      
      const overlay = document.querySelector('.status-confirm-overlay');
      expect(overlay).not.toHaveClass('open');
    });
  });

  describe('Status Change Logic', () => {
    it('shows close action when current status is open', () => {
      render(<StatusConfirmModal {...defaultProps} currentStatus="open" />);
      
      expect(screen.getByText(/Are you sure you want to close the trail/)).toBeInTheDocument();
      expect(screen.getByText(/This will make it unavailable to other users/)).toBeInTheDocument();
      expect(screen.getByText('Close Trail')).toBeInTheDocument();
    });

    it('shows reopen action when current status is closed', () => {
      render(<StatusConfirmModal {...defaultProps} currentStatus="closed" />);
      
      expect(screen.getByText(/Are you sure you want to reopen the trail/)).toBeInTheDocument();
      expect(screen.getByText(/This will make it available to other users again/)).toBeInTheDocument();
      expect(screen.getByText('Reopen Trail')).toBeInTheDocument();
    });

    it('displays correct trail name in confirmation message', () => {
      render(<StatusConfirmModal {...defaultProps} trailName="Amazing Hiking Trail" />);
      
      expect(screen.getByText(/trail "Amazing Hiking Trail"/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = jest.fn();
      render(<StatusConfirmModal {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmBtn = screen.getByText('Close Trail');
      fireEvent.click(confirmBtn);
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<StatusConfirmModal {...defaultProps} onClose={onClose} />);
      
      const cancelBtn = screen.getByText('Cancel');
      fireEvent.click(cancelBtn);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', () => {
      const onClose = jest.fn();
      render(<StatusConfirmModal {...defaultProps} onClose={onClose} />);
      
      const overlay = document.querySelector('.status-confirm-overlay');
      fireEvent.click(overlay);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', () => {
      const onClose = jest.fn();
      render(<StatusConfirmModal {...defaultProps} onClose={onClose} />);
      
      const content = document.querySelector('.status-confirm-content');
      fireEvent.click(content);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Management', () => {
    it('prevents body scroll when modal opens', () => {
      render(<StatusConfirmModal {...defaultProps} isOpen={true} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.width).toBe('100%');
    });

    it('restores body scroll when modal closes', () => {
      const { rerender } = render(<StatusConfirmModal {...defaultProps} isOpen={true} />);
      
      // Verify scroll is prevented
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close modal
      rerender(<StatusConfirmModal {...defaultProps} isOpen={false} />);
      
      expect(document.body.style.overflow).toBe('unset');
      expect(document.body.style.position).toBe('static');
    });

    it('restores body scroll on component unmount', () => {
      const { unmount } = render(<StatusConfirmModal {...defaultProps} isOpen={true} />);
      
      // Verify scroll is prevented
      expect(document.body.style.overflow).toBe('hidden');
      
      // Unmount component
      unmount();
      
      expect(document.body.style.overflow).toBe('unset');
      expect(document.body.style.position).toBe('static');
    });

    it('handles multiple open/close cycles correctly', () => {
      const { rerender } = render(<StatusConfirmModal {...defaultProps} isOpen={true} />);
      
      // First open
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close
      rerender(<StatusConfirmModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
      
      // Open again
      rerender(<StatusConfirmModal {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Button Styling', () => {
    it('applies correct CSS classes to buttons', () => {
      render(<StatusConfirmModal {...defaultProps} />);
      
      const cancelBtn = screen.getByText('Cancel');
      const confirmBtn = screen.getByText('Close Trail');
      
      expect(cancelBtn).toHaveClass('status-confirm-btn', 'cancel');
      expect(confirmBtn).toHaveClass('status-confirm-btn', 'confirm');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined trail name gracefully', () => {
      render(<StatusConfirmModal {...defaultProps} trailName={undefined} />);
      
      expect(screen.getByText(/trail ""/)).toBeInTheDocument();
    });

    it('handles empty trail name gracefully', () => {
      render(<StatusConfirmModal {...defaultProps} trailName="" />);
      
      expect(screen.getByText(/trail ""/)).toBeInTheDocument();
    });

    it('handles null trail name gracefully', () => {
      render(<StatusConfirmModal {...defaultProps} trailName={null} />);
      
      expect(screen.getByText(/trail ""/)).toBeInTheDocument();
    });

    it('handles invalid status values', () => {
      render(<StatusConfirmModal {...defaultProps} currentStatus="invalid" />);
      
      // Should default to treating as "open" status (invalid !== 'open', so newStatus = 'open')
      expect(screen.getByText(/Are you sure you want to reopen the trail/)).toBeInTheDocument();
    });

    it('handles missing callback functions gracefully', () => {
      // Should not throw errors when callbacks are undefined
      expect(() => {
        render(
          <StatusConfirmModal
            isOpen={true}
            trailName="Test Trail"
            currentStatus="open"
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper button elements for screen readers', () => {
      render(<StatusConfirmModal {...defaultProps} />);
      
      const cancelBtn = screen.getByText('Cancel');
      const confirmBtn = screen.getByText('Close Trail');
      
      expect(cancelBtn.tagName).toBe('BUTTON');
      expect(confirmBtn.tagName).toBe('BUTTON');
    });

    it('has descriptive text content', () => {
      render(<StatusConfirmModal {...defaultProps} />);
      
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('provides clear action buttons', () => {
      render(<StatusConfirmModal {...defaultProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Close Trail')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('cleans up body styles on unmount even if modal was closed', () => {
      const { unmount } = render(<StatusConfirmModal {...defaultProps} isOpen={false} />);
      
      // Unmount should not throw and should clean up
      expect(() => unmount()).not.toThrow();
      expect(document.body.style.overflow).toBe('unset');
    });

    it('handles rapid open/close state changes', async () => {
      const { rerender } = render(<StatusConfirmModal {...defaultProps} isOpen={true} />);
      
      // Rapid state changes
      rerender(<StatusConfirmModal {...defaultProps} isOpen={false} />);
      rerender(<StatusConfirmModal {...defaultProps} isOpen={true} />);
      rerender(<StatusConfirmModal {...defaultProps} isOpen={false} />);
      
      // Should end in closed state
      expect(document.body.style.overflow).toBe('unset');
    });
  });
});
