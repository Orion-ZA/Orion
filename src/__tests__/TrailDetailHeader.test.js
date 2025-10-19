import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailDetailHeader from '../components/trails/TrailDetailHeader';

// Mock the CSS import
jest.mock('../components/trails/TrailDetailHeader.css', () => ({}));

describe('TrailDetailHeader', () => {
  const defaultProps = {
    onBack: jest.fn(),
    onShowOnMap: jest.fn(),
    onShare: jest.fn(),
    onReport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all action buttons', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Show on Map')).toBeInTheDocument();
      expect(screen.getByText('Report')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('renders with correct CSS classes', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Back');
      const showMapButton = screen.getByText('Show on Map');
      const reportButton = screen.getByText('Report');
      const shareButton = screen.getByText('Share');

      expect(backButton).toHaveClass('back-button');
      expect(showMapButton).toHaveClass('show-map-button');
      expect(reportButton).toHaveClass('report-button');
      expect(shareButton).toHaveClass('share-button');
    });

    it('renders with correct structure', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const header = screen.getByText('Back').closest('.trail-detail-header');
      const headerActions = screen.getByText('Show on Map').closest('.header-actions');

      expect(header).toBeInTheDocument();
      expect(headerActions).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls onBack when back button is clicked', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onShowOnMap when show on map button is clicked', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const showMapButton = screen.getByText('Show on Map');
      fireEvent.click(showMapButton);

      expect(defaultProps.onShowOnMap).toHaveBeenCalledTimes(1);
    });

    it('calls onReport when report button is clicked', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const reportButton = screen.getByText('Report');
      fireEvent.click(reportButton);

      expect(defaultProps.onReport).toHaveBeenCalledTimes(1);
    });

    it('calls onShare when share button is clicked', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      expect(defaultProps.onShare).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Rendering', () => {
    it('renders ArrowLeft icon for back button', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Back');
      const arrowIcon = backButton.querySelector('svg');

      expect(arrowIcon).toBeInTheDocument();
    });

    it('renders Map icon for show on map button', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const showMapButton = screen.getByText('Show on Map');
      const mapIcon = showMapButton.querySelector('svg');

      expect(mapIcon).toBeInTheDocument();
    });

    it('renders Flag icon for report button', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const reportButton = screen.getByText('Report');
      const flagIcon = reportButton.querySelector('svg');

      expect(flagIcon).toBeInTheDocument();
    });

    it('renders Share2 icon for share button', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const shareButton = screen.getByText('Share');
      const shareIcon = shareButton.querySelector('svg');

      expect(shareIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button elements', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('buttons have accessible text content', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show on map/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles missing callback props gracefully', () => {
      const propsWithoutCallbacks = {};

      expect(() => {
        render(<TrailDetailHeader {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });

    it('handles undefined callback props', () => {
      const propsWithUndefinedCallbacks = {
        onBack: undefined,
        onShowOnMap: undefined,
        onShare: undefined,
        onReport: undefined,
      };

      expect(() => {
        render(<TrailDetailHeader {...propsWithUndefinedCallbacks} />);
      }).not.toThrow();
    });

    it('handles null callback props', () => {
      const propsWithNullCallbacks = {
        onBack: null,
        onShowOnMap: null,
        onShare: null,
        onReport: null,
      };

      expect(() => {
        render(<TrailDetailHeader {...propsWithNullCallbacks} />);
      }).not.toThrow();
    });
  });

  describe('Multiple Clicks', () => {
    it('handles multiple clicks on back button', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Back');

      fireEvent.click(backButton);
      fireEvent.click(backButton);
      fireEvent.click(backButton);

      expect(defaultProps.onBack).toHaveBeenCalledTimes(3);
    });

    it('handles multiple clicks on different buttons', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const showMapButton = screen.getByText('Show on Map');
      const reportButton = screen.getByText('Report');
      const shareButton = screen.getByText('Share');

      fireEvent.click(showMapButton);
      fireEvent.click(reportButton);
      fireEvent.click(shareButton);

      expect(defaultProps.onShowOnMap).toHaveBeenCalledTimes(1);
      expect(defaultProps.onReport).toHaveBeenCalledTimes(1);
      expect(defaultProps.onShare).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Structure', () => {
    it('maintains consistent structure', () => {
      const { container } = render(<TrailDetailHeader {...defaultProps} />);

      const header = container.querySelector('.trail-detail-header');
      const headerActions = container.querySelector('.header-actions');

      expect(header).toBeInTheDocument();
      expect(headerActions).toBeInTheDocument();
      expect(header).toContainElement(headerActions);
    });

    it('has correct button order', () => {
      render(<TrailDetailHeader {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const buttonTexts = buttons.map(button => button.textContent.trim());

      expect(buttonTexts).toEqual(['Back', 'Show on Map', 'Report', 'Share']);
    });
  });
});
