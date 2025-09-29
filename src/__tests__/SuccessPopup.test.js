import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuccessPopup from '../components/SuccessPopup';

// Mock CSS import
jest.mock('../components/SuccessPopup.css', () => ({}));

// Mock timers
jest.useFakeTimers();

describe('SuccessPopup Component', () => {
  const defaultProps = {
    isVisible: true,
    message: 'Your action was completed successfully!',
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Component Rendering', () => {
    test('renders when visible', () => {
      render(<SuccessPopup {...defaultProps} />);
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Your action was completed successfully!')).toBeInTheDocument();
    });

    test('does not render when not visible', () => {
      render(<SuccessPopup {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });

    test('displays custom message', () => {
      const customMessage = 'Custom success message';
      render(<SuccessPopup {...defaultProps} message={customMessage} />);
      
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    test('shows success icon', () => {
      render(<SuccessPopup {...defaultProps} />);
      
      // Check that the CheckCircle icon is present
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    test('shows progress bar', () => {
      render(<SuccessPopup {...defaultProps} />);
      
      const progressBar = document.querySelector('.success-progress-bar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Animation Behavior', () => {
    test('applies show animation class when visible', () => {
      render(<SuccessPopup {...defaultProps} />);
      
      const popup = document.querySelector('.success-popup');
      expect(popup).toHaveClass('show');
    });

    test('removes show animation class after timeout', async () => {
      render(<SuccessPopup {...defaultProps} />);
      
      const popup = document.querySelector('.success-popup');
      expect(popup).toHaveClass('show');
      
      // Fast-forward time to trigger animation end
      jest.advanceTimersByTime(2800);
      
      await waitFor(() => {
        expect(popup).not.toHaveClass('show');
      });
    });
  });

  describe('Auto-close Behavior', () => {
    test('calls onClose after timeout', () => {
      render(<SuccessPopup {...defaultProps} />);
      
      // Fast-forward time to trigger auto-close
      jest.advanceTimersByTime(3100); // 2800ms + 300ms for animation
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('does not call onClose before timeout', () => {
      render(<SuccessPopup {...defaultProps} />);
      
      // Fast-forward time but not enough to trigger close
      jest.advanceTimersByTime(2000);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    test('clears timeout when component unmounts', () => {
      const { unmount } = render(<SuccessPopup {...defaultProps} />);
      
      unmount();
      
      // Fast-forward time after unmount
      jest.advanceTimersByTime(3100);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    test('resets timeout when visibility changes', () => {
      const { rerender } = render(<SuccessPopup {...defaultProps} />);
      
      // Fast-forward time partially
      jest.advanceTimersByTime(1000);
      
      // Change visibility
      rerender(<SuccessPopup {...defaultProps} isVisible={false} />);
      
      // Fast-forward more time
      jest.advanceTimersByTime(2000);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty message', () => {
      render(<SuccessPopup {...defaultProps} message="" />);
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
      const messageElement = document.querySelector('.success-message');
      expect(messageElement).toHaveTextContent('');
    });

    test('handles very long message', () => {
      const longMessage = 'This is a very long success message that contains a lot of text and should be displayed properly in the popup without breaking the layout or causing any issues with the component rendering.';
      render(<SuccessPopup {...defaultProps} message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    test('handles special characters in message', () => {
      const specialMessage = 'Success! 🎉 Your action was completed! ✅';
      render(<SuccessPopup {...defaultProps} message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    test('handles null message', () => {
      render(<SuccessPopup {...defaultProps} message={null} />);
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    test('handles undefined message', () => {
      render(<SuccessPopup {...defaultProps} message={undefined} />);
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<SuccessPopup {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Success!');
    });

    test('has proper semantic structure', () => {
      render(<SuccessPopup {...defaultProps} />);
      
      expect(document.querySelector('.success-popup-overlay')).toBeInTheDocument();
      expect(document.querySelector('.success-popup')).toBeInTheDocument();
      expect(document.querySelector('.success-icon')).toBeInTheDocument();
      expect(document.querySelector('.success-title')).toBeInTheDocument();
      expect(document.querySelector('.success-message')).toBeInTheDocument();
      expect(document.querySelector('.success-progress')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    test('handles multiple visibility changes', () => {
      const { rerender } = render(<SuccessPopup {...defaultProps} />);
      
      // Hide and show multiple times
      rerender(<SuccessPopup {...defaultProps} isVisible={false} />);
      rerender(<SuccessPopup {...defaultProps} isVisible={true} />);
      rerender(<SuccessPopup {...defaultProps} isVisible={false} />);
      rerender(<SuccessPopup {...defaultProps} isVisible={true} />);
      
      // Fast-forward time
      jest.advanceTimersByTime(3100);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('handles onClose function changes', () => {
      const newOnClose = jest.fn();
      const { rerender } = render(<SuccessPopup {...defaultProps} />);
      
      rerender(<SuccessPopup {...defaultProps} onClose={newOnClose} />);
      
      // Fast-forward time
      jest.advanceTimersByTime(3100);
      
      expect(newOnClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });
});
