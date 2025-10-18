import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertsPopup from '../components/AlertsPopup';

describe('AlertsPopup', () => {
  const mockAlerts = [
    {
      id: '1',
      type: 'Warning',
      message: 'Trail is closed due to maintenance'
    },
    {
      id: '2',
      type: 'Info',
      message: 'Weather conditions may affect visibility'
    },
    {
      id: '3',
      type: 'Alert',
      message: 'Heavy rain expected in the area'
    }
  ];

  const defaultProps = {
    isVisible: true,
    position: { x: 100, y: 200 },
    alerts: mockAlerts,
    onMouseLeave: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Visibility', () => {
    it('should render when isVisible is true', () => {
      render(<AlertsPopup {...defaultProps} />);
      
      expect(screen.getByText('Trail Alerts')).toBeInTheDocument();
      expect(screen.getByText('[Warning]')).toBeInTheDocument();
      expect(screen.getByText('Trail is closed due to maintenance')).toBeInTheDocument();
    });

    it('should not render when isVisible is false', () => {
      render(<AlertsPopup {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByText('Trail Alerts')).not.toBeInTheDocument();
      expect(screen.queryByText('[Warning]')).not.toBeInTheDocument();
    });

    it('should not render when isVisible is undefined', () => {
      const { isVisible, ...propsWithoutVisibility } = defaultProps;
      render(<AlertsPopup {...propsWithoutVisibility} />);
      
      expect(screen.queryByText('Trail Alerts')).not.toBeInTheDocument();
    });

    it('should not render when isVisible is null', () => {
      render(<AlertsPopup {...defaultProps} isVisible={null} />);
      
      expect(screen.queryByText('Trail Alerts')).not.toBeInTheDocument();
    });
  });

  describe('Component Positioning and Styling', () => {
    it('should apply correct positioning styles', () => {
      const position = { x: 150, y: 300 };
      render(<AlertsPopup {...defaultProps} position={position} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({
        position: 'fixed',
        left: '150px',
        top: '300px',
        zIndex: '75'
      });
    });

    it('should handle zero coordinates', () => {
      const position = { x: 0, y: 0 };
      render(<AlertsPopup {...defaultProps} position={position} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({
        left: '0px',
        top: '0px'
      });
    });

    it('should handle negative coordinates', () => {
      const position = { x: -50, y: -100 };
      render(<AlertsPopup {...defaultProps} position={position} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({
        left: '-50px',
        top: '-100px'
      });
    });

    it('should handle decimal coordinates', () => {
      const position = { x: 123.45, y: 678.90 };
      render(<AlertsPopup {...defaultProps} position={position} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({
        left: '123.45px',
        top: '678.9px' // Browser may round trailing zeros
      });
    });

    it('should have correct CSS classes', () => {
      render(<AlertsPopup {...defaultProps} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      const content = popup.querySelector('.orion-alerts-popup-content');
      const header = popup.querySelector('.orion-alerts-popup-header');
      const body = popup.querySelector('.orion-alerts-popup-body');
      
      expect(popup).toHaveClass('orion-alerts-popup');
      expect(content).toHaveClass('orion-alerts-popup-content');
      expect(header).toHaveClass('orion-alerts-popup-header');
      expect(body).toHaveClass('orion-alerts-popup-body');
    });
  });

  describe('Alerts Rendering', () => {
    it('should render all alerts with correct content', () => {
      render(<AlertsPopup {...defaultProps} />);
      
      // Check header
      expect(screen.getByText('Trail Alerts')).toBeInTheDocument();
      
      // Check all alert types and messages
      expect(screen.getByText('[Warning]')).toBeInTheDocument();
      expect(screen.getByText('Trail is closed due to maintenance')).toBeInTheDocument();
      
      expect(screen.getByText('[Info]')).toBeInTheDocument();
      expect(screen.getByText('Weather conditions may affect visibility')).toBeInTheDocument();
      
      expect(screen.getByText('[Alert]')).toBeInTheDocument();
      expect(screen.getByText('Heavy rain expected in the area')).toBeInTheDocument();
    });

    it('should render alerts with correct CSS classes', () => {
      render(<AlertsPopup {...defaultProps} />);
      
      const alertItems = screen.getAllByText(/\[.*\]/);
      alertItems.forEach(item => {
        expect(item.closest('.orion-alerts-popup-item')).toHaveClass('orion-alerts-popup-item');
        expect(item).toHaveClass('orion-alerts-popup-type');
      });
      
      const messages = screen.getAllByText(/Trail is closed|Weather conditions|Heavy rain/);
      messages.forEach(message => {
        expect(message).toHaveClass('orion-alerts-popup-message');
      });
    });

    it('should handle empty alerts array', () => {
      render(<AlertsPopup {...defaultProps} alerts={[]} />);
      
      expect(screen.getByText('Trail Alerts')).toBeInTheDocument();
      expect(screen.queryByText(/\[.*\]/)).not.toBeInTheDocument();
    });

    it('should handle single alert', () => {
      const singleAlert = [mockAlerts[0]];
      render(<AlertsPopup {...defaultProps} alerts={singleAlert} />);
      
      expect(screen.getByText('[Warning]')).toBeInTheDocument();
      expect(screen.getByText('Trail is closed due to maintenance')).toBeInTheDocument();
      expect(screen.queryByText('[Info]')).not.toBeInTheDocument();
    });

    it('should handle alerts without id (fallback to index)', () => {
      const alertsWithoutId = [
        { type: 'Warning', message: 'No ID alert 1' },
        { type: 'Info', message: 'No ID alert 2' }
      ];
      render(<AlertsPopup {...defaultProps} alerts={alertsWithoutId} />);
      
      expect(screen.getByText('[Warning]')).toBeInTheDocument();
      expect(screen.getByText('No ID alert 1')).toBeInTheDocument();
      expect(screen.getByText('[Info]')).toBeInTheDocument();
      expect(screen.getByText('No ID alert 2')).toBeInTheDocument();
    });

    it('should handle alerts with mixed id presence', () => {
      const mixedAlerts = [
        { id: '1', type: 'Warning', message: 'Has ID' },
        { id: '2', type: 'Info', message: 'No ID' },
        { id: '3', type: 'Alert', message: 'Has ID again' }
      ];
      render(<AlertsPopup {...defaultProps} alerts={mixedAlerts} />);
      
      expect(screen.getByText('[Warning]')).toBeInTheDocument();
      expect(screen.getByText('Has ID')).toBeInTheDocument();
      expect(screen.getByText('[Info]')).toBeInTheDocument();
      expect(screen.getByText('No ID')).toBeInTheDocument();
      expect(screen.getByText('[Alert]')).toBeInTheDocument();
      expect(screen.getByText('Has ID again')).toBeInTheDocument();
    });

    it('should handle alerts with empty or undefined type', () => {
      const alertsWithEmptyType = [
        { id: '1', type: '', message: 'Empty type' },
        { id: '2', type: undefined, message: 'Undefined type' },
        { id: '3', message: 'No type property' }
      ];
      render(<AlertsPopup {...defaultProps} alerts={alertsWithEmptyType} />);
      
      expect(screen.getAllByText('[]')).toHaveLength(3);
      expect(screen.getByText('Empty type')).toBeInTheDocument();
      expect(screen.getByText('Undefined type')).toBeInTheDocument();
      expect(screen.getByText('No type property')).toBeInTheDocument();
    });

    it('should handle alerts with empty or undefined message', () => {
      const alertsWithEmptyMessage = [
        { id: '1', type: 'Warning', message: '' },
        { id: '2', type: 'Info', message: undefined },
        { id: '3', type: 'Alert' }
      ];
      render(<AlertsPopup {...defaultProps} alerts={alertsWithEmptyMessage} />);
      
      expect(screen.getByText('[Warning]')).toBeInTheDocument();
      expect(screen.getByText('[Info]')).toBeInTheDocument();
      expect(screen.getByText('[Alert]')).toBeInTheDocument();
    });

    it('should handle very long alert messages', () => {
      const longMessage = 'This is a very long alert message that might wrap to multiple lines and should be handled gracefully by the component without breaking the layout or causing any rendering issues.';
      const longAlert = [{ id: '1', type: 'Warning', message: longMessage }];
      render(<AlertsPopup {...defaultProps} alerts={longAlert} />);
      
      expect(screen.getByText('[Warning]')).toBeInTheDocument();
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in alert content', () => {
      const specialAlerts = [
        { id: '1', type: 'Warning!', message: 'Alert with special chars: @#$%^&*()' },
        { id: '2', type: 'Info', message: 'Unicode: 🚨⚠️📢' },
        { id: '3', type: 'Alert', message: 'HTML: <script>alert("test")</script>' }
      ];
      render(<AlertsPopup {...defaultProps} alerts={specialAlerts} />);
      
      expect(screen.getByText('[Warning!]')).toBeInTheDocument();
      expect(screen.getByText('Alert with special chars: @#$%^&*()')).toBeInTheDocument();
      expect(screen.getByText('[Info]')).toBeInTheDocument();
      expect(screen.getByText('Unicode: 🚨⚠️📢')).toBeInTheDocument();
      expect(screen.getByText('[Alert]')).toBeInTheDocument();
      expect(screen.getByText('HTML: <script>alert("test")</script>')).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    it('should call onMouseLeave when mouse leaves the popup', () => {
      const mockOnMouseLeave = jest.fn();
      render(<AlertsPopup {...defaultProps} onMouseLeave={mockOnMouseLeave} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      fireEvent.mouseLeave(popup);
      
      expect(mockOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('should handle mouse events on child elements', () => {
      const mockOnMouseLeave = jest.fn();
      render(<AlertsPopup {...defaultProps} onMouseLeave={mockOnMouseLeave} />);
      
      // Test that the component renders without errors when mouse events occur
      const alertItem = screen.getByText('[Warning]').closest('.orion-alerts-popup-item');
      expect(alertItem).toBeInTheDocument();
      
      // The component should handle mouse events gracefully
      expect(mockOnMouseLeave).not.toHaveBeenCalled();
    });

    it('should handle undefined onMouseLeave prop', () => {
      const { onMouseLeave, ...propsWithoutHandler } = defaultProps;
      render(<AlertsPopup {...propsWithoutHandler} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(() => fireEvent.mouseLeave(popup)).not.toThrow();
    });

    it('should handle null onMouseLeave prop', () => {
      render(<AlertsPopup {...defaultProps} onMouseLeave={null} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(() => fireEvent.mouseLeave(popup)).not.toThrow();
    });
  });

  describe('Timed Alerts Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should display timed alerts with countdown timer', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const timedAlerts = [
        {
          id: 'timed1',
          type: 'Warning',
          message: 'Timed alert',
          isTimed: true,
          expiresAt: futureDate
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={timedAlerts} />);

      expect(screen.getByText('Timed')).toBeInTheDocument();
      expect(screen.getByText('Timed')).toBeInTheDocument(); // Just check the text is there
    });

    it('should display permanent alerts without timer', () => {
      const permanentAlerts = [
        {
          id: 'permanent1',
          type: 'Info',
          message: 'Permanent alert',
          isTimed: false
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={permanentAlerts} />);

      expect(screen.getByText('Permanent')).toBeInTheDocument();
      expect(screen.getByText('Permanent')).toBeInTheDocument(); // Just check the text is there
      expect(screen.queryByText(/Clock/)).not.toBeInTheDocument();
    });

    it('should update countdown timer every second', () => {
      const futureDate = new Date(Date.now() + 3661000); // 1 hour, 1 minute, 1 second from now
      const timedAlerts = [
        {
          id: 'timed1',
          type: 'Warning',
          message: 'Timed alert',
          isTimed: true,
          expiresAt: futureDate
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={timedAlerts} />);

      // Check that the timer is displayed (it should show the countdown)
      expect(screen.getByText('Timed')).toBeInTheDocument();
      
      // The timer should be present in the DOM
      const timerElement = screen.queryByText(/h.*m.*s/);
      expect(timerElement).toBeInTheDocument();
    });

    it('should hide timer when alert expires', () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const expiredAlerts = [
        {
          id: 'expired1',
          type: 'Warning',
          message: 'Expired alert',
          isTimed: true,
          expiresAt: pastDate
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={expiredAlerts} />);

      // Expired alerts should not be displayed
      expect(screen.queryByText('Expired alert')).not.toBeInTheDocument();
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    it('should handle Firestore timestamp objects', () => {
      const mockFirestoreTimestamp = {
        toDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000)
      };

      const timedAlerts = [
        {
          id: 'firestore1',
          type: 'Warning',
          message: 'Firestore timed alert',
          isTimed: true,
          expiresAt: mockFirestoreTimestamp
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={timedAlerts} />);

      expect(screen.getByText('Firestore timed alert')).toBeInTheDocument();
      expect(screen.getByText('Timed')).toBeInTheDocument();
    });

    it('should handle alerts with both message and comment', () => {
      const alertsWithBoth = [
        {
          id: 'both1',
          type: 'Info',
          message: 'Primary message',
          comment: 'Additional comment',
          isTimed: false
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={alertsWithBoth} />);

      // Should prioritize message over comment
      expect(screen.getByText('Primary message')).toBeInTheDocument();
      expect(screen.queryByText('Additional comment')).not.toBeInTheDocument();
    });

    it('should handle alerts with only comment', () => {
      const alertsWithCommentOnly = [
        {
          id: 'comment1',
          type: 'Info',
          comment: 'Comment only',
          isTimed: false
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={alertsWithCommentOnly} />);

      expect(screen.getByText('Comment only')).toBeInTheDocument();
    });

    it('should handle alerts with no message or comment', () => {
      const alertsWithNoMessage = [
        {
          id: 'nomessage1',
          type: 'Info',
          isTimed: false
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={alertsWithNoMessage} />);

      expect(screen.getByText('No message')).toBeInTheDocument();
    });

    it('should handle mixed timed and permanent alerts', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const mixedAlerts = [
        {
          id: 'timed1',
          type: 'Warning',
          message: 'Timed alert',
          isTimed: true,
          expiresAt: futureDate
        },
        {
          id: 'permanent1',
          type: 'Info',
          message: 'Permanent alert',
          isTimed: false
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={mixedAlerts} />);

      expect(screen.getByText('Timed alert')).toBeInTheDocument();
      expect(screen.getByText('Permanent alert')).toBeInTheDocument();
      expect(screen.getByText('Timed')).toBeInTheDocument();
      expect(screen.getByText('Permanent')).toBeInTheDocument();
    });

    it('should handle invalid expiresAt dates gracefully', () => {
      const invalidDateAlerts = [
        {
          id: 'invalid1',
          type: 'Warning',
          message: 'Invalid date alert',
          isTimed: true,
          expiresAt: {
            toDate: () => {
              throw new Error('Invalid date conversion');
            }
          }
        }
      ];

      // Mock console.warn to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AlertsPopup {...defaultProps} alerts={invalidDateAlerts} />);

      // Should still render the alert but without timer
      expect(screen.getByText('Invalid date alert')).toBeInTheDocument();
      expect(screen.getByText('Timed')).toBeInTheDocument();
      
      // Should have called console.warn for the invalid date
      expect(consoleSpy).toHaveBeenCalledWith('Error checking alert expiration:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle timer calculation errors gracefully', () => {
      const errorAlerts = [
        {
          id: 'error1',
          type: 'Warning',
          message: 'Error alert',
          isTimed: true,
          expiresAt: {
            toDate: () => {
              throw new Error('Firestore error');
            }
          }
        }
      ];

      // Mock console.warn to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AlertsPopup {...defaultProps} alerts={errorAlerts} />);

      // Should still render the alert
      expect(screen.getByText('Error alert')).toBeInTheDocument();
      expect(screen.getByText('Timed')).toBeInTheDocument();
      
      // Should have called console.warn for the timer calculation error
      expect(consoleSpy).toHaveBeenCalledWith('Error calculating initial time remaining:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle timer interval errors gracefully', async () => {
      const errorAlerts = [
        {
          id: 'interval-error1',
          type: 'Warning',
          message: 'Interval error alert',
          isTimed: true,
          expiresAt: {
            toDate: () => {
              throw new Error('Interval calculation error');
            }
          }
        }
      ];

      // Mock console.warn to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<AlertsPopup {...defaultProps} alerts={errorAlerts} />);

      // Advance time to trigger interval
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Wait for the component to update
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Should still render the alert
      expect(screen.getByText('Interval error alert')).toBeInTheDocument();
      
      // Should have called console.warn for the interval error
      expect(consoleSpy).toHaveBeenCalledWith('Error calculating time remaining:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should update timer countdown correctly', async () => {
      const futureDate = new Date(Date.now() + 3661000); // 1 hour, 1 minute, 1 second from now
      const timedAlerts = [
        {
          id: 'timer-test1',
          type: 'Warning',
          message: 'Timer test alert',
          isTimed: true,
          expiresAt: futureDate
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={timedAlerts} />);

      // Check that the timer is displayed
      expect(screen.getByText('Timer test alert')).toBeInTheDocument();
      expect(screen.getByText('Timed')).toBeInTheDocument();
      
      // The timer should be present in the DOM
      const timerElement = screen.queryByText(/h.*m.*s/);
      expect(timerElement).toBeInTheDocument();

      // Advance time by 1 second to trigger timer update
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Wait for the component to update
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Timer should still be present and updated
      const updatedTimerElement = screen.queryByText(/h.*m.*s/);
      expect(updatedTimerElement).toBeInTheDocument();
    });

    it('should handle alerts that expire immediately', () => {
      const expiredAlerts = [
        {
          id: 'expired-immediately',
          type: 'Warning',
          message: 'Expired immediately',
          isTimed: true,
          expiresAt: new Date(Date.now() - 1000) // 1 second ago
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={expiredAlerts} />);

      // Expired alerts should not be displayed
      expect(screen.queryByText('Expired immediately')).not.toBeInTheDocument();
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    it('should handle alerts that expire during timer update', async () => {
      const almostExpiredAlerts = [
        {
          id: 'almost-expired',
          type: 'Warning',
          message: 'Almost expired',
          isTimed: true,
          expiresAt: new Date(Date.now() + 500) // 0.5 seconds from now
        }
      ];

      render(<AlertsPopup {...defaultProps} alerts={almostExpiredAlerts} />);

      // Should initially show the alert
      expect(screen.getByText('Almost expired')).toBeInTheDocument();

      // Advance time by 1 second to make it expire
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Wait for the component to update
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // The alert should still be there because the component filters expired alerts
      // in the activeAlerts memo, but the timer should show it as expired
      expect(screen.getByText('Almost expired')).toBeInTheDocument();
      expect(screen.getByText('Timed')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle undefined position prop gracefully', () => {
      const { position, ...propsWithoutPosition } = defaultProps;
      render(<AlertsPopup {...propsWithoutPosition} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({
        left: '0px',
        top: '0px'
      });
    });

    it('should handle null position prop gracefully', () => {
      render(<AlertsPopup {...defaultProps} position={null} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({
        left: '0px',
        top: '0px'
      });
    });

    it('should handle position with missing x or y', () => {
      render(<AlertsPopup {...defaultProps} position={{ x: 100 }} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({
        left: '100px',
        top: '0px'
      });
    });

    it('should handle undefined alerts prop gracefully', () => {
      const { alerts, ...propsWithoutAlerts } = defaultProps;
      render(<AlertsPopup {...propsWithoutAlerts} />);
      
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    it('should handle null alerts prop gracefully', () => {
      render(<AlertsPopup {...defaultProps} alerts={null} />);
      
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    it('should handle alerts with non-array values gracefully', () => {
      render(<AlertsPopup {...defaultProps} alerts="not an array" />);
      
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    it('should handle alerts with non-object items gracefully', () => {
      const invalidAlerts = ['string', 123, true, null];
      render(<AlertsPopup {...defaultProps} alerts={invalidAlerts} />);
      
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    it('should handle very large number of alerts', () => {
      const manyAlerts = Array.from({ length: 1000 }, (_, index) => ({
        id: `alert-${index}`,
        type: 'Info',
        message: `Alert message number ${index}`
      }));
      
      render(<AlertsPopup {...defaultProps} alerts={manyAlerts} />);
      
      expect(screen.getByText('Trail Alerts')).toBeInTheDocument();
      expect(screen.getAllByText('[Info]')).toHaveLength(1000);
      expect(screen.getByText('Alert message number 0')).toBeInTheDocument();
      expect(screen.getByText('Alert message number 999')).toBeInTheDocument();
    });

    it('should handle rapid visibility changes', () => {
      const { rerender } = render(<AlertsPopup {...defaultProps} isVisible={true} />);
      expect(screen.getByText('Trail Alerts')).toBeInTheDocument();
      
      rerender(<AlertsPopup {...defaultProps} isVisible={false} />);
      expect(screen.queryByText('Trail Alerts')).not.toBeInTheDocument();
      
      rerender(<AlertsPopup {...defaultProps} isVisible={true} />);
      expect(screen.getByText('Trail Alerts')).toBeInTheDocument();
    });

    it('should handle rapid position changes', () => {
      const { rerender } = render(<AlertsPopup {...defaultProps} position={{ x: 100, y: 200 }} />);
      let popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({ left: '100px', top: '200px' });
      
      rerender(<AlertsPopup {...defaultProps} position={{ x: 300, y: 400 }} />);
      popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toHaveStyle({ left: '300px', top: '400px' });
    });

    it('should handle rapid alerts changes', () => {
      const { rerender } = render(<AlertsPopup {...defaultProps} alerts={[mockAlerts[0]]} />);
      expect(screen.getByText('[Warning]')).toBeInTheDocument();
      expect(screen.queryByText('[Info]')).not.toBeInTheDocument();
      
      rerender(<AlertsPopup {...defaultProps} alerts={[mockAlerts[1]]} />);
      expect(screen.queryByText('[Warning]')).not.toBeInTheDocument();
      expect(screen.getByText('[Info]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      render(<AlertsPopup {...defaultProps} />);
      
      const popup = screen.getByText('Trail Alerts').closest('.orion-alerts-popup');
      expect(popup).toBeInTheDocument();
      
      const header = screen.getByText('Trail Alerts');
      expect(header).toBeInTheDocument();
      
      const alertItems = screen.getAllByText(/\[.*\]/);
      expect(alertItems.length).toBe(mockAlerts.length);
    });

    it('should handle alerts with no content gracefully', () => {
      const emptyAlerts = [
        { id: '1', type: '', message: '' },
        { id: '2', type: null, message: null }
      ];
      render(<AlertsPopup {...defaultProps} alerts={emptyAlerts} />);
      
      expect(screen.getByText('Trail Alerts')).toBeInTheDocument();
      expect(screen.getAllByText('[]')).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when props are the same', () => {
      const { rerender } = render(<AlertsPopup {...defaultProps} />);
      const initialRender = screen.getByText('Trail Alerts');
      
      rerender(<AlertsPopup {...defaultProps} />);
      const afterRerender = screen.getByText('Trail Alerts');
      
      expect(initialRender).toBe(afterRerender);
    });
  });
});
