import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementsPage from '../pages/AchievementsPage';
import { fetchBadges, getBadgesByCategory } from '../utils/badgesApi';
import PyramidLoader from '../components/PyramidLoader';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  useNavigate: () => mockNavigate,
}));

// Mock the badgesApi
jest.mock('../utils/badgesApi', () => ({
  fetchBadges: jest.fn(),
  getBadgesByCategory: jest.fn(),
}));

// Mock PyramidLoader
jest.mock('../components/PyramidLoader', () => {
  return function MockPyramidLoader() {
    return <div data-testid="pyramid-loader">Loading...</div>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Trophy: ({ className }) => <div data-testid="trophy-icon" className={className} />,
  Award: ({ className }) => <div data-testid="award-icon" className={className} />,
  Star: ({ className }) => <div data-testid="star-icon" className={className} />,
  Target: ({ className }) => <div data-testid="target-icon" className={className} />,
  Clock: ({ className }) => <div data-testid="clock-icon" className={className} />,
  MapPin: ({ className }) => <div data-testid="mappin-icon" className={className} />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  RefreshCw: ({ className }) => <div data-testid="refresh-icon" className={className} />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}));

describe('AchievementsPage', () => {
  const mockBadgesData = {
    badges: [
      {
        name: 'First Steps',
        description: 'Complete your first trail',
        category: 'achievement',
        difficulty: 'standard'
      },
      {
        name: 'Distance Walker',
        description: 'Walk 10 miles total',
        category: 'achievement',
        difficulty: 'intermediate'
      },
      {
        name: 'Peak Collector',
        description: 'Reach 5 mountain peaks',
        category: 'achievement',
        difficulty: 'advanced'
      },
      {
        name: 'Early Bird',
        description: 'Start hiking before 6 AM',
        category: 'achievement',
        difficulty: 'expert'
      }
    ],
    totalBadges: 4,
    categories: ['achievement', 'milestone'],
    note: 'Keep hiking to unlock more achievements!'
  };

  const mockAchievementBadges = [
    {
      name: 'First Steps',
      description: 'Complete your first trail',
      category: 'achievement',
      difficulty: 'standard'
    },
    {
      name: 'Distance Walker',
      description: 'Walk 10 miles total',
      category: 'achievement',
      difficulty: 'intermediate'
    },
    {
      name: 'Peak Collector',
      description: 'Reach 5 mountain peaks',
      category: 'achievement',
      difficulty: 'advanced'
    },
    {
      name: 'Early Bird',
      description: 'Start hiking before 6 AM',
      category: 'achievement',
      difficulty: 'expert'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders loading state initially', () => {
    fetchBadges.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<AchievementsPage />);
    
    expect(screen.getByTestId('pyramid-loader')).toBeInTheDocument();
  });

  it('renders achievements page successfully', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);
    getBadgesByCategory.mockReturnValue(mockAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });
    
    // Check header elements
    expect(screen.getByText('Back to Profile')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    
    // Check stats
    expect(screen.getByText('4')).toBeInTheDocument(); // totalBadges
    expect(screen.getByText('Total Badges')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // categories.length
    expect(screen.getByText('Categories')).toBeInTheDocument();
    
    // Check note
    expect(screen.getByText('Keep hiking to unlock more achievements!')).toBeInTheDocument();
    
    // Check achievement badges
    expect(screen.getByText('Achievement Badges')).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Distance Walker')).toBeInTheDocument();
    expect(screen.getByText('Peak Collector')).toBeInTheDocument();
    expect(screen.getByText('Early Bird')).toBeInTheDocument();
  });

  it('displays correct icons for different badge types', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);
    getBadgesByCategory.mockReturnValue(mockAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('First Steps')).toBeInTheDocument();
    });
    
    // Check that correct icons are rendered
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument(); // First Steps
    expect(screen.getByTestId('mappin-icon')).toBeInTheDocument(); // Distance Walker
    expect(screen.getByTestId('star-icon')).toBeInTheDocument(); // Peak Collector
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument(); // Early Bird
  });

  it('applies correct difficulty colors', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);
    getBadgesByCategory.mockReturnValue(mockAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('standard')).toBeInTheDocument();
    });
    
    // Check difficulty badges are rendered with correct colors
    const standardBadge = screen.getByText('standard');
    const intermediateBadge = screen.getByText('intermediate');
    const advancedBadge = screen.getByText('advanced');
    const expertBadge = screen.getByText('expert');
    
    expect(standardBadge).toHaveStyle('background-color: #4CAF50');
    expect(intermediateBadge).toHaveStyle('background-color: #FF9800');
    expect(advancedBadge).toHaveStyle('background-color: #F44336');
    expect(expertBadge).toHaveStyle('background-color: #9C27B0');
  });

  it('handles API error with retry functionality', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchBadges.mockRejectedValue(new Error('API Error'));
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Unable to load achievements. Please check your connection and try again.')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getAllByText('Back to Profile')).toHaveLength(2);
    
    expect(consoleSpy).toHaveBeenCalledWith('Error loading badges:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles retry functionality', async () => {
    fetchBadges
      .mockRejectedValueOnce(new Error('First attempt fails'))
      .mockResolvedValueOnce(mockBadgesData);
    getBadgesByCategory.mockReturnValue(mockAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    // Click retry button
    fireEvent.click(screen.getByText('Try Again'));
    
    await waitFor(() => {
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });
    
    expect(fetchBadges).toHaveBeenCalledTimes(2);
  });

  it('shows retry count after multiple attempts', async () => {
    fetchBadges.mockRejectedValue(new Error('API Error'));
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    // Click retry button multiple times
    fireEvent.click(screen.getByText('Try Again'));
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Try Again'));
    
    await waitFor(() => {
      expect(screen.getByText('Attempt 3')).toBeInTheDocument();
    });
  });

  it('navigates back to profile when back button is clicked', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);
    getBadgesByCategory.mockReturnValue(mockAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Back to Profile')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Back to Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('navigates back to profile from error state', async () => {
    fetchBadges.mockRejectedValue(new Error('API Error'));
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    // There should be two "Back to Profile" buttons in error state
    const backButtons = screen.getAllByText('Back to Profile');
    expect(backButtons).toHaveLength(2);
    fireEvent.click(backButtons[1]); // Click the second one (in error actions)
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('handles no data state', async () => {
    fetchBadges.mockResolvedValue(null);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No achievements data available')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Back to Profile')).toBeInTheDocument();
  });

  it('renders without note when note is not provided', async () => {
    const dataWithoutNote = { ...mockBadgesData };
    delete dataWithoutNote.note;
    
    fetchBadges.mockResolvedValue(dataWithoutNote);
    getBadgesByCategory.mockReturnValue(mockAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Keep hiking to unlock more achievements!')).not.toBeInTheDocument();
  });

  it('uses default Award icon for unknown badge types', async () => {
    const unknownBadgeData = {
      ...mockBadgesData,
      badges: [
        {
          name: 'Unknown Badge',
          description: 'Some unknown badge',
          category: 'achievement',
          difficulty: 'standard'
        }
      ]
    };
    
    const unknownAchievementBadges = [
      {
        name: 'Unknown Badge',
        description: 'Some unknown badge',
        category: 'achievement',
        difficulty: 'standard'
      }
    ];
    
    fetchBadges.mockResolvedValue(unknownBadgeData);
    getBadgesByCategory.mockReturnValue(unknownAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Unknown Badge')).toBeInTheDocument();
    });
    
    // Should use Award icon as default
    expect(screen.getByTestId('award-icon')).toBeInTheDocument();
  });

  it('displays badge descriptions and metadata correctly', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);
    getBadgesByCategory.mockReturnValue(mockAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Complete your first trail')).toBeInTheDocument();
      expect(screen.getByText('Walk 10 miles total')).toBeInTheDocument();
      expect(screen.getByText('Reach 5 mountain peaks')).toBeInTheDocument();
      expect(screen.getByText('Start hiking before 6 AM')).toBeInTheDocument();
    });
    
    // Check category badges
    expect(screen.getAllByText('achievement')).toHaveLength(4);
  });

  it('has correct CSS classes applied', async () => {
    fetchBadges.mockResolvedValue(mockBadgesData);
    getBadgesByCategory.mockReturnValue(mockAchievementBadges);
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });
    
    // Check that main container has correct class
    const achievementsPage = screen.getByText('Achievements').closest('.achievements-page');
    expect(achievementsPage).toBeInTheDocument();
    
    // Check that achievements content has correct class
    const achievementsContent = screen.getByText('Achievement Badges').closest('.achievements-content');
    expect(achievementsContent).toBeInTheDocument();
  });

  it('shows loading state during retry', async () => {
    fetchBadges.mockRejectedValue(new Error('API Error'));
    
    render(<AchievementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    // Mock a slow retry
    fetchBadges.mockImplementation(() => new Promise(() => {}));
    
    fireEvent.click(screen.getByText('Try Again'));
    
    // Should show loading state (PyramidLoader)
    expect(screen.getByTestId('pyramid-loader')).toBeInTheDocument();
  });
});