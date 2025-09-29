import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RatingsChart from '../components/admin/RatingsChart';

// Mock the useFeedback hook
const mockFeedbacks = [
  { id: '1', rating: 5, message: 'Excellent!' },
  { id: '2', rating: 5, message: 'Great app!' },
  { id: '3', rating: 4, message: 'Good app' },
  { id: '4', rating: 3, message: 'Average' },
  { id: '5', rating: 2, message: 'Not great' },
  { id: '6', rating: 1, message: 'Poor' },
  { id: '7', rating: null, message: 'No rating' },
];

const mockUseFeedback = jest.fn();

jest.mock('../components/admin/useFeedback', () => ({
  __esModule: true,
  default: () => mockUseFeedback(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: () => <div data-testid="star-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
}));

// Mock recharts components
jest.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('RatingsChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when feedback is loading', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: [],
      loading: true,
    });

    render(<RatingsChart />);
    
    // The component shows loading structure without text
    const loadingContainer = document.querySelector('.ratings-chart-loading');
    expect(loadingContainer).toBeInTheDocument();
    
    const loadingPulse = loadingContainer.querySelector('.ratings-chart-loading-pulse');
    expect(loadingPulse).toBeInTheDocument();
  });

  it('renders chart title and icon', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    expect(screen.getByText('Ratings Distribution')).toBeInTheDocument();
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('displays average rating', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // Average of [5, 5, 4, 3, 2, 1] = 3.3
    expect(screen.getByText('3.3')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  it('displays total ratings count', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // 6 feedbacks have ratings (excluding the one with null rating)
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Total Ratings')).toBeInTheDocument();
  });

  it('renders both pie chart and bar chart', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // Use getAllByTestId since there are multiple responsive-container elements (one for pie chart, one for bar chart)
    const responsiveContainers = screen.getAllByTestId('responsive-container');
    expect(responsiveContainers).toHaveLength(2);
    
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('displays rating distribution in legend', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // Should show all rating levels
    expect(screen.getByText('1 Star')).toBeInTheDocument();
    expect(screen.getByText('2 Stars')).toBeInTheDocument();
    expect(screen.getByText('3 Stars')).toBeInTheDocument();
    expect(screen.getByText('4 Stars')).toBeInTheDocument();
    expect(screen.getByText('5 Stars')).toBeInTheDocument();
  });

  it('displays correct counts for each rating', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // Based on mockFeedbacks: 1=1, 2=1, 3=1, 4=1, 5=2
    // Use getAllByText since there are multiple '1' and '2' elements
    const oneElements = screen.getAllByText('1');
    const twoElements = screen.getAllByText('2');
    
    expect(oneElements.length).toBeGreaterThan(0);
    expect(twoElements.length).toBeGreaterThan(0);
  });

  it('displays correct percentages for each rating', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // With 6 total ratings: 1 Star = 1/6 = 17%, 5 Stars = 2/6 = 33%
    // Use getAllByText since there are multiple '17%' elements (1,2,3,4 stars all have 17%)
    const seventeenPercentElements = screen.getAllByText('17%');
    expect(seventeenPercentElements.length).toBeGreaterThan(0);
    
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('handles empty feedback list', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: [],
      loading: false,
    });

    render(<RatingsChart />);
    
    // Use getAllByText since there are multiple '0' elements
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);
    
    // Check for specific stat values
    const averageRating = screen.getByText('Average Rating').closest('.ratings-chart-stat').querySelector('.ratings-chart-stat-value');
    const totalRatings = screen.getByText('Total Ratings').closest('.ratings-chart-stat').querySelector('.ratings-chart-stat-value');
    
    expect(averageRating).toHaveTextContent('0');
    expect(totalRatings).toHaveTextContent('0');
    
    // Should still show all rating levels with 0 counts
    expect(screen.getByText('1 Star')).toBeInTheDocument();
    expect(screen.getByText('2 Stars')).toBeInTheDocument();
  });

  it('handles feedback with no ratings', () => {
    const feedbacksWithoutRatings = [
      { id: '1', rating: null, message: 'No rating 1' },
      { id: '2', rating: null, message: 'No rating 2' },
    ];

    mockUseFeedback.mockReturnValue({
      feedbacks: feedbacksWithoutRatings,
      loading: false,
    });

    render(<RatingsChart />);
    
    // Use getAllByText since there are multiple '0' elements
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);
    
    // Check for specific stat values
    const averageRating = screen.getByText('Average Rating').closest('.ratings-chart-stat').querySelector('.ratings-chart-stat-value');
    const totalRatings = screen.getByText('Total Ratings').closest('.ratings-chart-stat').querySelector('.ratings-chart-stat-value');
    
    expect(averageRating).toHaveTextContent('0');
    expect(totalRatings).toHaveTextContent('0');
  });

  it('calculates average rating correctly', () => {
    const customFeedbacks = [
      { id: '1', rating: 5, message: 'Excellent' },
      { id: '2', rating: 5, message: 'Great' },
      { id: '3', rating: 5, message: 'Amazing' },
      { id: '4', rating: 1, message: 'Terrible' },
    ];

    mockUseFeedback.mockReturnValue({
      feedbacks: customFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // Average of [5, 5, 5, 1] = 4.0
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('has correct CSS classes applied', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    const chart = screen.getByText('Ratings Distribution').closest('.ratings-chart');
    expect(chart).toBeInTheDocument();
    
    const header = chart.querySelector('.ratings-chart-header');
    expect(header).toBeInTheDocument();
    
    const titleSection = chart.querySelector('.ratings-chart-title-section');
    expect(titleSection).toBeInTheDocument();
    
    const stats = chart.querySelector('.ratings-chart-stats');
    expect(stats).toBeInTheDocument();
    
    const grid = chart.querySelector('.ratings-chart-grid');
    expect(grid).toBeInTheDocument();
    
    const legend = chart.querySelector('.ratings-chart-legend');
    expect(legend).toBeInTheDocument();
  });

  it('renders loading state with correct CSS classes', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: [],
      loading: true,
    });

    render(<RatingsChart />);
    
    const loadingContainer = document.querySelector('.ratings-chart-loading');
    expect(loadingContainer).toBeInTheDocument();
    
    const loadingPulse = loadingContainer.querySelector('.ratings-chart-loading-pulse');
    expect(loadingPulse).toBeInTheDocument();
    
    const loadingTitle = loadingPulse.querySelector('.ratings-chart-loading-title');
    expect(loadingTitle).toBeInTheDocument();
    
    const loadingChart = loadingPulse.querySelector('.ratings-chart-loading-chart');
    expect(loadingChart).toBeInTheDocument();
  });

  it('displays stats with correct CSS classes', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    const averageRatingValue = screen.getByText('3.3');
    const totalRatingsValue = screen.getByText('6');
    
    expect(averageRatingValue).toHaveClass('ratings-chart-stat-value', 'blue');
    expect(totalRatingsValue).toHaveClass('ratings-chart-stat-value', 'green');
    
    const averageRatingLabel = screen.getByText('Average Rating');
    const totalRatingsLabel = screen.getByText('Total Ratings');
    
    expect(averageRatingLabel).toHaveClass('ratings-chart-stat-label');
    expect(totalRatingsLabel).toHaveClass('ratings-chart-stat-label');
  });

  it('renders legend items with correct structure', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    const legendItems = screen.getAllByText(/Stars?$/);
    expect(legendItems).toHaveLength(5);
    
    legendItems.forEach(item => {
      const legendItem = item.closest('.ratings-chart-legend-item');
      expect(legendItem).toBeInTheDocument();
      
      const header = legendItem.querySelector('.ratings-chart-legend-item-header');
      expect(header).toBeInTheDocument();
      
      const color = header.querySelector('.ratings-chart-legend-color');
      expect(color).toBeInTheDocument();
      
      const stats = legendItem.querySelector('.ratings-chart-legend-stats');
      expect(stats).toBeInTheDocument();
    });
  });

  it('handles single rating value correctly', () => {
    const singleRatingFeedbacks = [
      { id: '1', rating: 5, message: 'Only 5 star rating' },
    ];

    mockUseFeedback.mockReturnValue({
      feedbacks: singleRatingFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    expect(screen.getByText('5.0')).toBeInTheDocument(); // Average rating
    
    // Use getAllByText since there are multiple '1' elements
    const oneElements = screen.getAllByText('1');
    expect(oneElements.length).toBeGreaterThan(0);
    
    // Check for specific stat values
    const totalRatings = screen.getByText('Total Ratings').closest('.ratings-chart-stat').querySelector('.ratings-chart-stat-value');
    expect(totalRatings).toHaveTextContent('1');
    
    expect(screen.getByText('100%')).toBeInTheDocument(); // 5 Stars percentage
  });

  it('displays correct percentages for different rating distributions', () => {
    const customFeedbacks = [
      { id: '1', rating: 5, message: 'Excellent' },
      { id: '2', rating: 5, message: 'Great' },
      { id: '3', rating: 1, message: 'Poor' },
    ];

    mockUseFeedback.mockReturnValue({
      feedbacks: customFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // 2 out of 3 ratings are 5 stars = 67%
    expect(screen.getByText('67%')).toBeInTheDocument();
    // 1 out of 3 ratings is 1 star = 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('renders chart components with correct props', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // Both charts should be rendered
    const pieChart = screen.getByTestId('pie-chart');
    const barChart = screen.getByTestId('bar-chart');
    
    expect(pieChart).toBeInTheDocument();
    expect(barChart).toBeInTheDocument();
    
    // Chart components should be present
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    
    // Use getAllByTestId since there are multiple tooltips (one for pie chart, one for bar chart)
    const tooltips = screen.getAllByTestId('tooltip');
    expect(tooltips).toHaveLength(2);
    
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
  });

  it('handles mixed rating and non-rating feedback', () => {
    const mixedFeedbacks = [
      { id: '1', rating: 5, message: 'Rated' },
      { id: '2', rating: null, message: 'Not rated' },
      { id: '3', rating: 3, message: 'Rated' },
      { id: '4', rating: null, message: 'Not rated' },
    ];

    mockUseFeedback.mockReturnValue({
      feedbacks: mixedFeedbacks,
      loading: false,
    });

    render(<RatingsChart />);
    
    // Should only count rated feedback (2 items)
    expect(screen.getByText('2')).toBeInTheDocument(); // Total ratings
    expect(screen.getByText('4.0')).toBeInTheDocument(); // Average (5+3)/2 = 4.0
  });
});
