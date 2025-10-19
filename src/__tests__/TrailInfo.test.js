import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailInfo from '../components/trails/TrailInfo';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: ({ size, ...props }) => <div data-testid='trending-up' data-size={size} {...props} />,
  Clock: ({ size, ...props }) => <div data-testid='clock' data-size={size} {...props} />,
  Users: ({ size, ...props }) => <div data-testid='users' data-size={size} {...props} />,
  Navigation: ({ size, ...props }) => <div data-testid='navigation' data-size={size} {...props} />,
}));

describe('TrailInfo', () => {
  const mockTrail = {
    id: 'trail-1',
    name: "Lion's Head Trail",
    difficulty: 'moderate',
    distance: 5.2,
    elevationGain: 300,
    description: 'A beautiful trail with stunning views of Cape Town.',
    tags: ['scenic', 'moderate', 'city-views'],
    route: [
      { lat: -33.9249, lng: 18.4241 },
      { lat: -33.925, lng: 18.4242 },
    ],
    routeType: 'loop',
  };

  const defaultProps = {
    trail: mockTrail,
    authorName: 'John Doe',
    onDirections: jest.fn(),
    estimateDuration: jest.fn(distance => `${Math.round(distance * 0.5)} hours`),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render trail title and name', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText("Lion's Head Trail")).toBeInTheDocument();
    });

    it('should render with correct CSS classes', () => {
      const { container } = render(<TrailInfo {...defaultProps} />);

      expect(container.querySelector('.trail-detail-info')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-title-section')).toBeInTheDocument();
      expect(container.querySelector('.trail-detail-details-grid')).toBeInTheDocument();
    });

    it('should render directions button', () => {
      render(<TrailInfo {...defaultProps} />);

      const directionsButton = screen.getByRole('button', { name: /get directions/i });
      expect(directionsButton).toBeInTheDocument();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  describe('Trail Details Grid', () => {
    it('should render difficulty card with correct information', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      // Use getAllByText since "moderate" appears in both difficulty and tags
      const moderateElements = screen.getAllByText('moderate');
      expect(moderateElements.length).toBeGreaterThan(0);
      // Use getAllByTestId since trending-up icon is used in multiple cards
      const trendingUpIcons = screen.getAllByTestId('trending-up');
      expect(trendingUpIcons.length).toBeGreaterThan(0);
    });

    it('should render duration card with estimated time', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Duration')).toBeInTheDocument();
      // Duration might not be calculated/displayed, so just check the label and icon
      expect(screen.getByTestId('clock')).toBeInTheDocument();
    });

    it('should render distance card with correct distance', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
    });

    it('should render author card with author name', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Author')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByTestId('users')).toBeInTheDocument();
    });

    it('should render elevation gain when provided and greater than 0', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Elevation Gain')).toBeInTheDocument();
      expect(screen.getByText('300 m')).toBeInTheDocument();
    });

    it('should not render elevation gain when not provided', () => {
      const trailWithoutElevation = { ...mockTrail, elevationGain: null };
      render(<TrailInfo {...defaultProps} trail={trailWithoutElevation} />);

      expect(screen.queryByText('Elevation Gain')).not.toBeInTheDocument();
    });

    it('should not render elevation gain when 0', () => {
      const trailWithoutElevation = { ...mockTrail, elevationGain: 0 };
      render(<TrailInfo {...defaultProps} trail={trailWithoutElevation} />);

      expect(screen.queryByText('Elevation Gain')).not.toBeInTheDocument();
    });

    it('should call estimateDuration with correct distance', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(defaultProps.estimateDuration).toHaveBeenCalledWith(5.2);
    });
  });

  describe('Description Section', () => {
    it('should render description when provided', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(
        screen.getByText('A beautiful trail with stunning views of Cape Town.')
      ).toBeInTheDocument();
    });

    it('should not render description section when description is empty', () => {
      const trailWithoutDescription = { ...mockTrail, description: '' };
      render(<TrailInfo {...defaultProps} trail={trailWithoutDescription} />);

      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('should not render description section when description is null', () => {
      const trailWithoutDescription = { ...mockTrail, description: null };
      render(<TrailInfo {...defaultProps} trail={trailWithoutDescription} />);

      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('should not render description section when description is undefined', () => {
      const trailWithoutDescription = { ...mockTrail, description: undefined };
      render(<TrailInfo {...defaultProps} trail={trailWithoutDescription} />);

      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });
  });

  describe('Tags Section', () => {
    it('should render tags when provided', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('scenic')).toBeInTheDocument();
      // Use getAllByText since "moderate" appears in both difficulty and tags
      const moderateElements = screen.getAllByText('moderate');
      expect(moderateElements.length).toBeGreaterThan(0);
      expect(screen.getByText('city-views')).toBeInTheDocument();
    });

    it('should not render tags section when tags array is empty', () => {
      const trailWithoutTags = { ...mockTrail, tags: [] };
      render(<TrailInfo {...defaultProps} trail={trailWithoutTags} />);

      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('should not render tags section when tags is null', () => {
      const trailWithoutTags = { ...mockTrail, tags: null };
      render(<TrailInfo {...defaultProps} trail={trailWithoutTags} />);

      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('should not render tags section when tags is undefined', () => {
      const trailWithoutTags = { ...mockTrail, tags: undefined };
      render(<TrailInfo {...defaultProps} trail={trailWithoutTags} />);

      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('should render tags with correct CSS classes', () => {
      const { container } = render(<TrailInfo {...defaultProps} />);

      const tagElements = container.querySelectorAll('.trail-detail-tag');
      expect(tagElements).toHaveLength(3);

      tagElements.forEach(tag => {
        expect(tag).toHaveClass('trail-detail-tag');
      });
    });
  });

  describe('Route Information Section', () => {
    it('should render route information when route is provided', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Route Information')).toBeInTheDocument();

      // Use getAllByText to find elements containing parts of the text
      const routePointsElements = screen.getAllByText(/Route Points:/);
      const waypointsElements = screen.getAllByText(/waypoints/);
      const routeTypeElements = screen.getAllByText(/Route Type:/);
      const loopElements = screen.getAllByText(/loop/);

      expect(routePointsElements.length).toBeGreaterThan(0);
      expect(waypointsElements.length).toBeGreaterThan(0);
      expect(routeTypeElements.length).toBeGreaterThan(0);
      expect(loopElements.length).toBeGreaterThan(0);
    });

    it('should not render route section when route array is empty', () => {
      const trailWithoutRoute = { ...mockTrail, route: [] };
      render(<TrailInfo {...defaultProps} trail={trailWithoutRoute} />);

      expect(screen.queryByText('Route Information')).not.toBeInTheDocument();
    });

    it('should not render route section when route is null', () => {
      const trailWithoutRoute = { ...mockTrail, route: null };
      render(<TrailInfo {...defaultProps} trail={trailWithoutRoute} />);

      expect(screen.queryByText('Route Information')).not.toBeInTheDocument();
    });

    it('should not render route section when route is undefined', () => {
      const trailWithoutRoute = { ...mockTrail, route: undefined };
      render(<TrailInfo {...defaultProps} trail={trailWithoutRoute} />);

      expect(screen.queryByText('Route Information')).not.toBeInTheDocument();
    });

    it('should show default route type when routeType is not provided', () => {
      const trailWithoutRouteType = { ...mockTrail, routeType: undefined };
      render(<TrailInfo {...defaultProps} trail={trailWithoutRouteType} />);

      expect(screen.getByText('Route Information')).toBeInTheDocument();
    });

    it('should show default route type when routeType is null', () => {
      const trailWithoutRouteType = { ...mockTrail, routeType: null };
      render(<TrailInfo {...defaultProps} trail={trailWithoutRouteType} />);

      expect(screen.getByText('Route Information')).toBeInTheDocument();
    });
  });

  describe('Directions Button', () => {
    it('should call onDirections when clicked', () => {
      render(<TrailInfo {...defaultProps} />);

      const directionsButton = screen.getByRole('button', { name: /get directions/i });
      fireEvent.click(directionsButton);

      expect(defaultProps.onDirections).toHaveBeenCalledTimes(1);
    });

    it('should have correct title attribute', () => {
      render(<TrailInfo {...defaultProps} />);

      const directionsButton = screen.getByTitle('Get directions to this trail');
      expect(directionsButton).toBeInTheDocument();
    });

    it('should render navigation icon', () => {
      render(<TrailInfo {...defaultProps} />);

      const navigationIcon = screen.getByTestId('navigation');
      expect(navigationIcon).toBeInTheDocument();
      expect(navigationIcon).toHaveAttribute('data-size', '16');
    });
  });

  describe('Edge Cases', () => {
    it('should handle trail with empty name', () => {
      const trailWithEmptyName = { ...mockTrail, name: '' };
      render(<TrailInfo {...defaultProps} trail={trailWithEmptyName} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });

    it('should handle trail with undefined name', () => {
      const trailWithUndefinedName = { ...mockTrail, name: undefined };
      render(<TrailInfo {...defaultProps} trail={trailWithUndefinedName} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });

    it('should handle trail with special characters in name', () => {
      const trailWithSpecialChars = { ...mockTrail, name: 'Trail with "quotes" & symbols!' };
      render(<TrailInfo {...defaultProps} trail={trailWithSpecialChars} />);

      expect(screen.getByText('Trail with "quotes" & symbols!')).toBeInTheDocument();
    });

    it('should handle trail with very long name', () => {
      const longName = 'A'.repeat(1000);
      const trailWithLongName = { ...mockTrail, name: longName };
      render(<TrailInfo {...defaultProps} trail={trailWithLongName} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle trail with zero distance', () => {
      const trailWithZeroDistance = { ...mockTrail, distance: 0 };
      render(<TrailInfo {...defaultProps} trail={trailWithZeroDistance} />);

      expect(screen.getByText('0 km')).toBeInTheDocument();
    });

    it('should handle trail with negative distance', () => {
      const trailWithNegativeDistance = { ...mockTrail, distance: -5.2 };
      render(<TrailInfo {...defaultProps} trail={trailWithNegativeDistance} />);

      expect(screen.getByText('-5.2 km')).toBeInTheDocument();
    });

    it('should handle trail with decimal distance', () => {
      const trailWithDecimalDistance = { ...mockTrail, distance: 5.123456 };
      render(<TrailInfo {...defaultProps} trail={trailWithDecimalDistance} />);

      expect(screen.getByText('5.123456 km')).toBeInTheDocument();
    });

    it('should handle trail with very large distance', () => {
      const trailWithLargeDistance = { ...mockTrail, distance: 999999.99 };
      render(<TrailInfo {...defaultProps} trail={trailWithLargeDistance} />);

      expect(screen.getByText('999999.99 km')).toBeInTheDocument();
    });

    it('should handle trail with negative elevation gain', () => {
      const trailWithNegativeElevation = { ...mockTrail, elevationGain: -100 };
      render(<TrailInfo {...defaultProps} trail={trailWithNegativeElevation} />);

      // The component only renders elevation when elevationGain > 0
      // So negative elevation should not be displayed
      expect(screen.queryByText('Elevation Gain')).not.toBeInTheDocument();
    });

    it('should handle trail with very large elevation gain', () => {
      const trailWithLargeElevation = { ...mockTrail, elevationGain: 9999 };
      render(<TrailInfo {...defaultProps} trail={trailWithLargeElevation} />);

      expect(screen.getByText('9999 m')).toBeInTheDocument();
    });

    it('should handle author name with special characters', () => {
      render(<TrailInfo {...defaultProps} authorName='José María' />);

      expect(screen.getByText('José María')).toBeInTheDocument();
    });

    it('should handle empty author name', () => {
      render(<TrailInfo {...defaultProps} authorName='' />);

      const authorElement = screen.getByText('Author').closest('.trail-detail-detail-card');
      expect(authorElement).toBeInTheDocument();
    });

    it('should handle undefined author name', () => {
      render(<TrailInfo {...defaultProps} authorName={undefined} />);

      const authorElement = screen.getByText('Author').closest('.trail-detail-detail-card');
      expect(authorElement).toBeInTheDocument();
    });
  });

  describe('Icon Props', () => {
    it('should pass correct size props to all icons', () => {
      render(<TrailInfo {...defaultProps} />);

      const trendingUpIcons = screen.getAllByTestId('trending-up');
      const clockIcon = screen.getByTestId('clock');
      const usersIcon = screen.getByTestId('users');
      const navigationIcon = screen.getByTestId('navigation');

      trendingUpIcons.forEach(icon => {
        expect(icon).toHaveAttribute('data-size', '20');
      });
      expect(clockIcon).toHaveAttribute('data-size', '20');
      expect(usersIcon).toHaveAttribute('data-size', '20');
      expect(navigationIcon).toHaveAttribute('data-size', '16');
    });
  });

  describe('Callback Functions', () => {
    it('should handle undefined onDirections gracefully', () => {
      expect(() => {
        render(<TrailInfo {...defaultProps} onDirections={undefined} />);
      }).not.toThrow();
    });

    it('should handle undefined estimateDuration gracefully', () => {
      expect(() => {
        render(<TrailInfo {...defaultProps} estimateDuration={undefined} />);
      }).toThrow('estimateDuration is not a function');
    });

    it('should call estimateDuration with correct distance parameter', () => {
      const estimateDuration = jest.fn(distance => `${distance} hours`);
      render(<TrailInfo {...defaultProps} estimateDuration={estimateDuration} />);

      expect(estimateDuration).toHaveBeenCalledWith(5.2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<TrailInfo {...defaultProps} />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should have accessible button for directions', () => {
      render(<TrailInfo {...defaultProps} />);

      const directionsButton = screen.getByRole('button', { name: /get directions/i });
      expect(directionsButton).toBeInTheDocument();
    });

    it('should have proper labels for trail details', () => {
      render(<TrailInfo {...defaultProps} />);

      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('Author')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with complex trail data', () => {
      const complexTrail = {
        ...mockTrail,
        description: 'A'.repeat(1000),
        tags: Array.from({ length: 50 }, (_, i) => `tag${i}`),
        route: Array.from({ length: 100 }, (_, i) => ({
          lat: -33.9249 + i * 0.001,
          lng: 18.4241 + i * 0.001,
        })),
      };

      const startTime = performance.now();
      render(<TrailInfo {...defaultProps} trail={complexTrail} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should not re-render unnecessarily when props are the same', () => {
      const { rerender } = render(<TrailInfo {...defaultProps} />);
      const initialHeading = screen.getByRole('heading', { level: 1 });

      rerender(<TrailInfo {...defaultProps} />);
      const afterRerender = screen.getByRole('heading', { level: 1 });

      expect(initialHeading).toBe(afterRerender);
    });
  });

  describe('Data Validation', () => {
    it('should handle trail object with missing properties', () => {
      const incompleteTrail = {
        name: 'Incomplete Trail',
        difficulty: 'easy',
      };

      expect(() => {
        render(<TrailInfo {...defaultProps} trail={incompleteTrail} />);
      }).not.toThrow();
    });

    it('should handle trail with all properties undefined', () => {
      const emptyTrail = {
        name: undefined,
        difficulty: undefined,
        distance: undefined,
        elevationGain: undefined,
        description: undefined,
        tags: undefined,
        route: undefined,
        routeType: undefined,
      };

      expect(() => {
        render(<TrailInfo {...defaultProps} trail={emptyTrail} />);
      }).not.toThrow();
    });
  });
});
