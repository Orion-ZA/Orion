import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BadgesSection from '../components/BadgesSection';
import { fetchBadges } from '../utils/badgesApi';

// Mock the badgesApi
jest.mock('../utils/badgesApi', () => ({
  fetchBadges: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Trophy: ({ className }) => <div data-testid='trophy-icon' className={className} />,
  Award: ({ className }) => <div data-testid='award-icon' className={className} />,
  Star: ({ className }) => <div data-testid='star-icon' className={className} />,
  Target: ({ className }) => <div data-testid='target-icon' className={className} />,
  Clock: ({ className }) => <div data-testid='clock-icon' className={className} />,
  MapPin: ({ className }) => <div data-testid='mappin-icon' className={className} />,
}));

describe('BadgesSection', () => {
  const mockOnViewAllClick = jest.fn();

  const mockBadgesData = {
    badges: [
      {
        name: 'First Steps',
        description: 'Complete your first trail',
        category: 'achievement',
        difficulty: 'standard',
      },
      {
        name: 'Distance Walker',
        description: 'Walk 10 miles total',
        category: 'achievement',
        difficulty: 'intermediate',
      },
      {
        name: 'Peak Collector',
        description: 'Reach 5 mountain peaks',
        category: 'achievement',
        difficulty: 'advanced',
      },
      {
        name: 'Early Bird',
        description: 'Start hiking before 6 AM',
        category: 'achievement',
        difficulty: 'standard',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    fetchBadges.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    expect(screen.getByText('Loading badges...')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
  });

  it('renders badges successfully', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(screen.getByText('First Steps')).toBeInTheDocument();
      expect(screen.getByText('Distance Walker')).toBeInTheDocument();
      expect(screen.getByText('Peak Collector')).toBeInTheDocument();
    });

    // Should only show first 3 badges
    expect(screen.queryByText('Early Bird')).not.toBeInTheDocument();

    // Check that View All button is present
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('displays correct icons for different badge types', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(screen.getByText('First Steps')).toBeInTheDocument();
    });

    // Check that correct icons are rendered (use getAllByTestId to handle multiple trophy icons)
    const trophyIcons = screen.getAllByTestId('trophy-icon');
    expect(trophyIcons).toHaveLength(2); // One in header, one for First Steps badge
    expect(screen.getByTestId('mappin-icon')).toBeInTheDocument(); // Distance Walker
    expect(screen.getByTestId('star-icon')).toBeInTheDocument(); // Peak Collector
  });

  it('handles API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchBadges.mockRejectedValue(new Error('API Error'));

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(
        screen.getByText('No achievements yet. Start hiking to earn badges!')
      ).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error loading badges:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('shows empty state when no badges are returned', async () => {
    fetchBadges.mockResolvedValue({ badges: [] });

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(
        screen.getByText('No achievements yet. Start hiking to earn badges!')
      ).toBeInTheDocument();
    });
  });

  it('calls onViewAllClick when View All button is clicked', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(screen.getByText('View All')).toBeInTheDocument();
    });

    screen.getByText('View All').click();
    expect(mockOnViewAllClick).toHaveBeenCalledTimes(1);
  });

  it('uses default Award icon for unknown badge types', async () => {
    const unknownBadgeData = {
      badges: [
        {
          name: 'Unknown Badge',
          description: 'Some unknown badge',
          category: 'achievement',
          difficulty: 'standard',
        },
      ],
    };

    fetchBadges.mockResolvedValue(unknownBadgeData);

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(screen.getByText('Unknown Badge')).toBeInTheDocument();
    });

    // Should use Award icon as default
    expect(screen.getByTestId('award-icon')).toBeInTheDocument();
  });

  it('renders badge descriptions correctly', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(screen.getByText('Complete your first trail')).toBeInTheDocument();
      expect(screen.getByText('Walk 10 miles total')).toBeInTheDocument();
      expect(screen.getByText('Reach 5 mountain peaks')).toBeInTheDocument();
    });
  });

  it('has correct CSS classes applied', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(screen.getByText('First Steps')).toBeInTheDocument();
    });

    // Check that main container has correct class
    const badgesSection = screen.getByText('Achievements').closest('.badges-section');
    expect(badgesSection).toBeInTheDocument();

    // Check that badges grid has correct class
    const badgesGrid = screen.getByText('First Steps').closest('.badges-grid');
    expect(badgesGrid).toBeInTheDocument();
  });

  it('limits display to first 3 badges', async () => {
    const manyBadgesData = {
      badges: [
        {
          name: 'Badge 1',
          description: 'First badge',
          category: 'achievement',
          difficulty: 'standard',
        },
        {
          name: 'Badge 2',
          description: 'Second badge',
          category: 'achievement',
          difficulty: 'standard',
        },
        {
          name: 'Badge 3',
          description: 'Third badge',
          category: 'achievement',
          difficulty: 'standard',
        },
        {
          name: 'Badge 4',
          description: 'Fourth badge',
          category: 'achievement',
          difficulty: 'standard',
        },
        {
          name: 'Badge 5',
          description: 'Fifth badge',
          category: 'achievement',
          difficulty: 'standard',
        },
      ],
    };

    fetchBadges.mockResolvedValue(manyBadgesData);

    render(<BadgesSection onViewAllClick={mockOnViewAllClick} />);

    await waitFor(() => {
      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
    });

    // Should not show badges beyond the first 3
    expect(screen.queryByText('Badge 4')).not.toBeInTheDocument();
    expect(screen.queryByText('Badge 5')).not.toBeInTheDocument();
  });
});
