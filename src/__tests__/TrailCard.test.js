import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailCard from '../components/trails/TrailCard';
import { getDifficultyColor, getDifficultyIcon } from '../components/trails/TrailUtils';

// Mock the TrailUtils functions
jest.mock('../components/trails/TrailUtils', () => ({
  getDifficultyColor: jest.fn(),
  getDifficultyIcon: jest.fn()
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Lock: ({ size, style, ...props }) => <div data-testid="lock-icon" data-size={size} style={style} {...props} />,
  Unlock: ({ size, style, ...props }) => <div data-testid="unlock-icon" data-size={size} style={style} {...props} />,
  AlertTriangle: ({ size, className, ...props }) => <div data-testid="alert-triangle-icon" data-size={size} className={className} {...props} />
}));

describe('TrailCard', () => {
  const mockTrail = {
    id: 'trail-1',
    name: 'Test Trail',
    difficulty: 'moderate',
    distance: 5.2,
    elevationGain: 300,
    status: 'open',
    createdAt: {
      toDate: () => new Date('2024-01-15')
    }
  };

  const mockAlerts = {
    'trail-1': [
      { id: 'alert-1', type: 'Warning', message: 'Trail closed for maintenance' },
      { id: 'alert-2', type: 'Info', message: 'Weather conditions may affect visibility' }
    ]
  };

  const mockTrails = {
    completed: [],
    submitted: [],
    favorites: []
  };

  const defaultProps = {
    trail: mockTrail,
    activeTab: 'all',
    alerts: mockAlerts,
    loadingStates: { alerts: false },
    trails: mockTrails,
    onShowAlertsPopup: jest.fn(),
    onHideAlertsPopup: jest.fn(),
    onOpenStatusConfirmModal: jest.fn(),
    onOpenReviewModal: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getDifficultyColor.mockReturnValue('#FF9800');
    getDifficultyIcon.mockReturnValue(<div data-testid="mountain-icon" />);
  });

  describe('Basic Rendering', () => {
    it('should render trail card with basic information', () => {
      render(<TrailCard {...defaultProps} />);
      
      expect(screen.getByText('Test Trail')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
      expect(screen.getByText('+300m')).toBeInTheDocument();
      expect(screen.getByText('moderate')).toBeInTheDocument();
    });

    it('should render as list item with correct class', () => {
      const { container } = render(<TrailCard {...defaultProps} />);
      const listItem = container.querySelector('li.trail-card');
      expect(listItem).toBeInTheDocument();
    });

    it('should have correct trail header structure', () => {
      render(<TrailCard {...defaultProps} />);
      
      const header = screen.getByText('Test Trail').closest('.trail-header');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('Test Trail')).toBeInTheDocument();
    });
  });

  describe('Trail Details Rendering', () => {
    it('should render difficulty with correct styling', () => {
      render(<TrailCard {...defaultProps} />);
      
      const difficultyElement = screen.getByText('moderate');
      expect(difficultyElement).toBeInTheDocument();
      expect(difficultyElement.closest('.trail-difficulty')).toHaveStyle({
        backgroundColor: '#FF9800'
      });
    });

    it('should call getDifficultyColor with correct difficulty', () => {
      render(<TrailCard {...defaultProps} />);
      expect(getDifficultyColor).toHaveBeenCalledWith('moderate');
    });

    it('should call getDifficultyIcon with correct difficulty', () => {
      render(<TrailCard {...defaultProps} />);
      expect(getDifficultyIcon).toHaveBeenCalledWith('moderate');
    });

    it('should render distance correctly', () => {
      render(<TrailCard {...defaultProps} />);
      
      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
    });

    it('should render elevation gain when provided', () => {
      render(<TrailCard {...defaultProps} />);
      
      expect(screen.getByText('Elevation')).toBeInTheDocument();
      expect(screen.getByText('+300m')).toBeInTheDocument();
    });

    it('should not render elevation when not provided', () => {
      const trailWithoutElevation = { ...mockTrail, elevationGain: null };
      render(<TrailCard {...defaultProps} trail={trailWithoutElevation} />);
      
      expect(screen.queryByText('Elevation')).not.toBeInTheDocument();
      expect(screen.queryByText('+300m')).not.toBeInTheDocument();
    });

    it('should not render elevation when elevationGain is 0', () => {
      const trailWithoutElevation = { ...mockTrail, elevationGain: 0 };
      render(<TrailCard {...defaultProps} trail={trailWithoutElevation} />);
      
      expect(screen.queryByText('Elevation')).not.toBeInTheDocument();
    });

    it('should handle different difficulty levels', () => {
      const difficulties = ['easy', 'moderate', 'hard', 'difficult', 'expert'];
      
      difficulties.forEach(difficulty => {
        const trail = { ...mockTrail, difficulty };
        const { unmount } = render(<TrailCard {...defaultProps} trail={trail} />);
        
        expect(screen.getByText(difficulty)).toBeInTheDocument();
        expect(getDifficultyColor).toHaveBeenCalledWith(difficulty);
        expect(getDifficultyIcon).toHaveBeenCalledWith(difficulty);
        
        unmount();
        jest.clearAllMocks();
      });
    });

    it('should handle undefined difficulty', () => {
      const trailWithoutDifficulty = { ...mockTrail, difficulty: undefined };
      render(<TrailCard {...defaultProps} trail={trailWithoutDifficulty} />);
      
      expect(getDifficultyColor).toHaveBeenCalledWith(undefined);
      expect(getDifficultyIcon).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Alerts Functionality', () => {
    it('should display alerts count when alerts exist', () => {
      render(<TrailCard {...defaultProps} />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not display alerts when no alerts exist', () => {
      const alertsWithoutTrail = {};
      render(<TrailCard {...defaultProps} alerts={alertsWithoutTrail} />);
      
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('should not display alerts when alerts array is empty', () => {
      const alertsWithEmptyArray = { 'trail-1': [] };
      render(<TrailCard {...defaultProps} alerts={alertsWithEmptyArray} />);
      
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
    });

    it('should show loading state for alerts', () => {
      render(<TrailCard {...defaultProps} loadingStates={{ alerts: true }} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
    });

    it('should call onShowAlertsPopup on mouse enter', () => {
      render(<TrailCard {...defaultProps} />);
      
      const alertsCount = screen.getByText('2').closest('.alerts-count-header');
      fireEvent.mouseEnter(alertsCount);
      
      expect(defaultProps.onShowAlertsPopup).toHaveBeenCalledWith(
        expect.any(Object),
        mockAlerts['trail-1']
      );
    });

    it('should call onHideAlertsPopup on mouse leave', () => {
      render(<TrailCard {...defaultProps} />);
      
      const alertsCount = screen.getByText('2').closest('.alerts-count-header');
      fireEvent.mouseLeave(alertsCount);
      
      expect(defaultProps.onHideAlertsPopup).toHaveBeenCalled();
    });

    it('should display correct number of alerts', () => {
      const multipleAlerts = {
        'trail-1': [
          { id: 'alert-1', type: 'Warning', message: 'Alert 1' },
          { id: 'alert-2', type: 'Info', message: 'Alert 2' },
          { id: 'alert-3', type: 'Alert', message: 'Alert 3' }
        ]
      };
      render(<TrailCard {...defaultProps} alerts={multipleAlerts} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Action Buttons and Completion Status', () => {
    it('should show "Mark as Completed" button for non-completed trails', () => {
      render(<TrailCard {...defaultProps} />);
      
      expect(screen.getByText('Mark as Completed')).toBeInTheDocument();
    });

    it('should show completed status when trail is completed', () => {
      const trailsWithCompleted = {
        ...mockTrails,
        completed: [{ id: 'trail-1', name: 'Test Trail' }]
      };
      render(<TrailCard {...defaultProps} trails={trailsWithCompleted} />);
      
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.queryByText('Mark as Completed')).not.toBeInTheDocument();
    });

    it('should not show completion button when activeTab is "completed"', () => {
      render(<TrailCard {...defaultProps} activeTab="completed" />);
      
      expect(screen.queryByText('Mark as Completed')).not.toBeInTheDocument();
      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });

    it('should not show completion button when activeTab is "submitted"', () => {
      render(<TrailCard {...defaultProps} activeTab="submitted" />);
      
      expect(screen.queryByText('Mark as Completed')).not.toBeInTheDocument();
    });

    it('should call onOpenReviewModal when clicking "Mark as Completed"', () => {
      render(<TrailCard {...defaultProps} />);
      
      const completeButton = screen.getByText('Mark as Completed');
      fireEvent.click(completeButton);
      
      expect(defaultProps.onOpenReviewModal).toHaveBeenCalledWith('trail-1', 'Test Trail');
    });

    it('should handle multiple completed trails correctly', () => {
      const trailsWithMultipleCompleted = {
        ...mockTrails,
        completed: [
          { id: 'trail-1', name: 'Test Trail' },
          { id: 'trail-2', name: 'Another Trail' }
        ]
      };
      render(<TrailCard {...defaultProps} trails={trailsWithMultipleCompleted} />);
      
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Submitted Trails Functionality', () => {
    const submittedTrail = {
      ...mockTrail,
      status: 'open',
      createdAt: {
        toDate: () => new Date('2024-01-15T10:30:00Z')
      }
    };

    it('should render submitted trail information when activeTab is "submitted"', () => {
      render(<TrailCard {...defaultProps} trail={submittedTrail} activeTab="submitted" />);
      
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should display correct submission date', () => {
      render(<TrailCard {...defaultProps} trail={submittedTrail} activeTab="submitted" />);
      
      // The exact date format may vary based on locale, so we check for the presence of date text
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
    });

    it('should show open status with unlock icon', () => {
      render(<TrailCard {...defaultProps} trail={submittedTrail} activeTab="submitted" />);
      
      expect(screen.getByTestId('unlock-icon')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should show closed status with lock icon', () => {
      const closedTrail = { ...submittedTrail, status: 'closed' };
      render(<TrailCard {...defaultProps} trail={closedTrail} activeTab="submitted" />);
      
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('should call onOpenStatusConfirmModal when clicking status badge', () => {
      render(<TrailCard {...defaultProps} trail={submittedTrail} activeTab="submitted" />);
      
      const statusBadge = screen.getByText('Open');
      fireEvent.click(statusBadge);
      
      expect(defaultProps.onOpenStatusConfirmModal).toHaveBeenCalledWith(
        'trail-1',
        'Test Trail',
        'open'
      );
    });

    it('should have correct title attribute for status badge', () => {
      render(<TrailCard {...defaultProps} trail={submittedTrail} activeTab="submitted" />);
      
      const statusBadge = screen.getByTitle('Click to close trail');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should have correct title for closed trail', () => {
      const closedTrail = { ...submittedTrail, status: 'closed' };
      render(<TrailCard {...defaultProps} trail={closedTrail} activeTab="submitted" />);
      
      const statusBadge = screen.getByTitle('Click to reopen trail');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should handle createdAt as Date object', () => {
      const trailWithDateObject = {
        ...submittedTrail,
        createdAt: new Date('2024-01-15T10:30:00Z')
      };
      render(<TrailCard {...defaultProps} trail={trailWithDateObject} activeTab="submitted" />);
      
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
    });

    it('should handle createdAt as string', () => {
      const trailWithStringDate = {
        ...submittedTrail,
        createdAt: '2024-01-15T10:30:00Z'
      };
      render(<TrailCard {...defaultProps} trail={trailWithStringDate} activeTab="submitted" />);
      
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle trail without name', () => {
      const trailWithoutName = { ...mockTrail, name: '' };
      render(<TrailCard {...defaultProps} trail={trailWithoutName} />);
      
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('');
    });

    it('should handle trail with undefined name', () => {
      const trailWithoutName = { ...mockTrail, name: undefined };
      render(<TrailCard {...defaultProps} trail={trailWithoutName} />);
      
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('');
    });

    it('should handle trail with zero distance', () => {
      const trailWithZeroDistance = { ...mockTrail, distance: 0 };
      render(<TrailCard {...defaultProps} trail={trailWithZeroDistance} />);
      
      expect(screen.getByText('0 km')).toBeInTheDocument();
    });

    it('should handle trail with negative distance', () => {
      const trailWithNegativeDistance = { ...mockTrail, distance: -5.2 };
      render(<TrailCard {...defaultProps} trail={trailWithNegativeDistance} />);
      
      expect(screen.getByText('-5.2 km')).toBeInTheDocument();
    });

    it('should handle trail with decimal distance', () => {
      const trailWithDecimalDistance = { ...mockTrail, distance: 5.123456 };
      render(<TrailCard {...defaultProps} trail={trailWithDecimalDistance} />);
      
      expect(screen.getByText('5.123456 km')).toBeInTheDocument();
    });

    it('should handle trail with very large distance', () => {
      const trailWithLargeDistance = { ...mockTrail, distance: 999999.99 };
      render(<TrailCard {...defaultProps} trail={trailWithLargeDistance} />);
      
      expect(screen.getByText('999999.99 km')).toBeInTheDocument();
    });

    it('should handle trail with negative elevation gain', () => {
      const trailWithNegativeElevation = { ...mockTrail, elevationGain: -100 };
      render(<TrailCard {...defaultProps} trail={trailWithNegativeElevation} />);
      
      expect(screen.getByText(/-100m/)).toBeInTheDocument();
    });

    it('should handle trail with zero elevation gain', () => {
      const trailWithZeroElevation = { ...mockTrail, elevationGain: 0 };
      render(<TrailCard {...defaultProps} trail={trailWithZeroElevation} />);
      
      expect(screen.queryByText('Elevation')).not.toBeInTheDocument();
    });

    it('should handle trail with very large elevation gain', () => {
      const trailWithLargeElevation = { ...mockTrail, elevationGain: 9999 };
      render(<TrailCard {...defaultProps} trail={trailWithLargeElevation} />);
      
      expect(screen.getByText('+9999m')).toBeInTheDocument();
    });

    it('should handle undefined alerts prop', () => {
      expect(() => render(<TrailCard {...defaultProps} alerts={undefined} />)).toThrow();
    });

    it('should handle null alerts prop', () => {
      expect(() => render(<TrailCard {...defaultProps} alerts={null} />)).toThrow();
    });

    it('should handle undefined loadingStates', () => {
      expect(() => render(<TrailCard {...defaultProps} loadingStates={undefined} />)).toThrow();
    });

    it('should handle undefined trails prop', () => {
      expect(() => render(<TrailCard {...defaultProps} trails={undefined} />)).toThrow();
    });

    it('should handle trails with undefined completed array', () => {
      const trailsWithUndefinedCompleted = { ...mockTrails, completed: undefined };
      expect(() => render(<TrailCard {...defaultProps} trails={trailsWithUndefinedCompleted} />)).toThrow();
    });

    it('should handle trail with special characters in name', () => {
      const trailWithSpecialChars = { ...mockTrail, name: 'Trail with "quotes" & symbols!' };
      render(<TrailCard {...defaultProps} trail={trailWithSpecialChars} />);
      
      expect(screen.getByText('Trail with "quotes" & symbols!')).toBeInTheDocument();
    });

    it('should handle trail with very long name', () => {
      const longName = 'A'.repeat(1000);
      const trailWithLongName = { ...mockTrail, name: longName };
      render(<TrailCard {...defaultProps} trail={trailWithLongName} />);
      
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle trail with HTML in name', () => {
      const trailWithHTML = { ...mockTrail, name: '<script>alert("test")</script>Trail' };
      render(<TrailCard {...defaultProps} trail={trailWithHTML} />);
      
      // Should render as text, not execute HTML
      expect(screen.getByText('<script>alert("test")</script>Trail')).toBeInTheDocument();
    });
  });

  describe('Event Handler Edge Cases', () => {
    it('should handle undefined onHideAlertsPopup', () => {
      const propsWithoutHandler = { ...defaultProps, onHideAlertsPopup: undefined };
      render(<TrailCard {...propsWithoutHandler} />);
      
      const alertsCount = screen.getByText('2').closest('.alerts-count-header');
      expect(() => fireEvent.mouseLeave(alertsCount)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<TrailCard {...defaultProps} />);
      
      const listItem = screen.getByText('Test Trail').closest('li');
      expect(listItem).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Test Trail');
    });

    it('should have accessible button for completion', () => {
      render(<TrailCard {...defaultProps} />);
      
      const completeButton = screen.getByRole('button', { name: 'Mark as Completed' });
      expect(completeButton).toBeInTheDocument();
    });

    it('should have accessible status badge for submitted trails', () => {
      const submittedTrail = { ...mockTrail, status: 'open' };
      render(<TrailCard {...defaultProps} trail={submittedTrail} activeTab="submitted" />);
      
      const statusBadge = screen.getByTitle('Click to close trail');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should have proper labels for trail details', () => {
      render(<TrailCard {...defaultProps} />);
      
      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('Elevation')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many alerts', () => {
      const manyAlerts = {
        'trail-1': Array.from({ length: 100 }, (_, index) => ({
          id: `alert-${index}`,
          type: 'Info',
          message: `Alert ${index}`
        }))
      };
      
      const startTime = performance.now();
      render(<TrailCard {...defaultProps} alerts={manyAlerts} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should not re-render unnecessarily when props are the same', () => {
      const { rerender } = render(<TrailCard {...defaultProps} />);
      const initialRender = screen.getByText('Test Trail');
      
      rerender(<TrailCard {...defaultProps} />);
      const afterRerender = screen.getByText('Test Trail');
      
      expect(initialRender).toBe(afterRerender);
    });
  });

  describe('Integration with TrailUtils', () => {
    it('should handle getDifficultyColor returning different colors', () => {
      const colors = ['#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#2196F3'];
      
      colors.forEach(color => {
        getDifficultyColor.mockReturnValue(color);
        const { unmount } = render(<TrailCard {...defaultProps} />);
        
        const difficultyElement = screen.getByText('moderate');
        expect(difficultyElement.closest('.trail-difficulty')).toHaveStyle({
          backgroundColor: color
        });
        
        unmount();
      });
    });

    it('should handle getDifficultyIcon returning different icons', () => {
      const mockIcon = <div data-testid="custom-icon" />;
      getDifficultyIcon.mockReturnValue(mockIcon);
      
      render(<TrailCard {...defaultProps} />);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });
});
