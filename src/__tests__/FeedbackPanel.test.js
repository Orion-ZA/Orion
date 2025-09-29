import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeedbackPanel from '../components/admin/FeedbackPanel';

// Mock the useFeedback hook
const mockFeedbacks = [
  {
    id: '1',
    message: 'Great app!',
    rating: 5,
    email: 'user1@example.com',
    contactAllowed: true,
    type: 'praise',
    createdAt: { toDate: () => new Date('2023-01-01') },
  },
  {
    id: '2',
    message: 'Found a bug in the map',
    rating: 2,
    email: 'user2@example.com',
    contactAllowed: false,
    type: 'bug',
    createdAt: { toDate: () => new Date('2023-01-02') },
  },
  {
    id: '3',
    message: 'Add more trail filters',
    rating: 4,
    email: 'user3@example.com',
    contactAllowed: true,
    type: 'suggestion',
    createdAt: { toDate: () => new Date('2023-01-03') },
  },
  {
    id: '4',
    message: 'General feedback',
    rating: null,
    email: 'user4@example.com',
    contactAllowed: true,
    type: 'general',
    createdAt: { toDate: () => new Date('2023-01-04') },
  },
];

const mockUseFeedback = jest.fn();

jest.mock('../components/admin/useFeedback', () => ({
  __esModule: true,
  default: () => mockUseFeedback(),
}));

describe('FeedbackPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when feedback is loading', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: [],
      loading: true,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('Loading feedback...')).toBeInTheDocument();
  });

  it('renders feedback title', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('User Feedback')).toBeInTheDocument();
  });

  it('renders all filter buttons', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Praise')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('Suggestion')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('renders feedback table with correct headers', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders all feedback items when filter is "all"', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('Great app!')).toBeInTheDocument();
    expect(screen.getByText('Found a bug in the map')).toBeInTheDocument();
    expect(screen.getByText('Add more trail filters')).toBeInTheDocument();
    expect(screen.getByText('General feedback')).toBeInTheDocument();
  });

  it('filters feedback by type when filter button is clicked', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    // Click on "Bug" filter
    fireEvent.click(screen.getByText('Bug'));
    
    // Should only show bug feedback
    expect(screen.getByText('Found a bug in the map')).toBeInTheDocument();
    expect(screen.queryByText('Great app!')).not.toBeInTheDocument();
    expect(screen.queryByText('Add more trail filters')).not.toBeInTheDocument();
    expect(screen.queryByText('General feedback')).not.toBeInTheDocument();
  });

  it('filters feedback by praise type', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    fireEvent.click(screen.getByText('Praise'));
    
    expect(screen.getByText('Great app!')).toBeInTheDocument();
    expect(screen.queryByText('Found a bug in the map')).not.toBeInTheDocument();
    expect(screen.queryByText('Add more trail filters')).not.toBeInTheDocument();
    expect(screen.queryByText('General feedback')).not.toBeInTheDocument();
  });

  it('filters feedback by suggestion type', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    fireEvent.click(screen.getByText('Suggestion'));
    
    expect(screen.getByText('Add more trail filters')).toBeInTheDocument();
    expect(screen.queryByText('Great app!')).not.toBeInTheDocument();
    expect(screen.queryByText('Found a bug in the map')).not.toBeInTheDocument();
    expect(screen.queryByText('General feedback')).not.toBeInTheDocument();
  });

  it('filters feedback by general type', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    fireEvent.click(screen.getByText('General'));
    
    expect(screen.getByText('General feedback')).toBeInTheDocument();
    expect(screen.queryByText('Great app!')).not.toBeInTheDocument();
    expect(screen.queryByText('Found a bug in the map')).not.toBeInTheDocument();
    expect(screen.queryByText('Add more trail filters')).not.toBeInTheDocument();
  });

  it('shows correct rating values', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument(); // For null rating
  });

  it('shows email when contact is allowed', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user3@example.com')).toBeInTheDocument();
    expect(screen.getByText('user4@example.com')).toBeInTheDocument();
  });

  it('shows "hidden" when contact is not allowed', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('hidden')).toBeInTheDocument();
  });

  it('handles feedback data correctly without date display', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    // Verify that feedback messages are still displayed correctly
    expect(screen.getByText('Great app!')).toBeInTheDocument();
    expect(screen.getByText('Found a bug in the map')).toBeInTheDocument();
    expect(screen.getByText('Add more trail filters')).toBeInTheDocument();
    expect(screen.getByText('General feedback')).toBeInTheDocument();
  });

  it('applies active class to selected filter button', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    const allButton = screen.getByText('All');
    const bugButton = screen.getByText('Bug');
    
    // Initially "All" should be active
    expect(allButton).toHaveClass('active');
    expect(bugButton).not.toHaveClass('active');
    
    // Click on "Bug" filter
    fireEvent.click(bugButton);
    
    expect(bugButton).toHaveClass('active');
    expect(allButton).not.toHaveClass('active');
  });

  it('has correct CSS classes applied', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    const panel = screen.getByText('User Feedback').closest('.feedback-panel');
    expect(panel).toBeInTheDocument();
    
    const title = screen.getByText('User Feedback');
    expect(title).toHaveClass('feedback-panel-title');
    
    const filterButtons = panel.querySelector('.feedback-filter-buttons');
    expect(filterButtons).toBeInTheDocument();
    
    const tableContainer = panel.querySelector('.feedback-table-container');
    expect(tableContainer).toBeInTheDocument();
    
    const table = panel.querySelector('.feedback-table');
    expect(table).toBeInTheDocument();
  });

  it('handles empty feedback list', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: [],
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('User Feedback')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    
    // Table should still be rendered but with no data rows
    const tableBody = screen.getByRole('table').querySelector('tbody');
    expect(tableBody).toBeInTheDocument();
    expect(tableBody.children).toHaveLength(0);
  });

  it('handles feedback with missing createdAt', () => {
    const feedbackWithMissingDate = {
      id: '5',
      message: 'Feedback without date',
      rating: 3,
      email: 'user5@example.com',
      contactAllowed: true,
      type: 'general',
      createdAt: null,
    };

    mockUseFeedback.mockReturnValue({
      feedbacks: [feedbackWithMissingDate],
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('Feedback without date')).toBeInTheDocument();
    // Should handle missing date gracefully
  });

  it('handles feedback with missing rating', () => {
    const feedbackWithoutRating = {
      id: '6',
      message: 'Feedback without rating',
      email: 'user6@example.com',
      contactAllowed: true,
      type: 'general',
      createdAt: { toDate: () => new Date('2023-01-05') },
    };

    mockUseFeedback.mockReturnValue({
      feedbacks: [feedbackWithoutRating],
      loading: false,
    });

    render(<FeedbackPanel />);
    
    expect(screen.getByText('Feedback without rating')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument(); // Should show dash for missing rating
  });

  it('switches between filters correctly', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    // Start with all feedback visible
    expect(screen.getByText('Great app!')).toBeInTheDocument();
    expect(screen.getByText('Found a bug in the map')).toBeInTheDocument();
    
    // Switch to bug filter
    fireEvent.click(screen.getByText('Bug'));
    expect(screen.getByText('Found a bug in the map')).toBeInTheDocument();
    expect(screen.queryByText('Great app!')).not.toBeInTheDocument();
    
    // Switch back to all
    fireEvent.click(screen.getByText('All'));
    expect(screen.getByText('Great app!')).toBeInTheDocument();
    expect(screen.getByText('Found a bug in the map')).toBeInTheDocument();
  });

  it('renders table rows with correct CSS classes', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: mockFeedbacks,
      loading: false,
    });

    render(<FeedbackPanel />);
    
    const tableRows = screen.getAllByRole('row');
    // Should have header row + 4 data rows
    expect(tableRows).toHaveLength(5);
    
    // Check that data rows have correct class
    const dataRows = tableRows.slice(1); // Skip header row
    dataRows.forEach(row => {
      expect(row).toHaveClass('feedback-table-row');
    });
  });

  it('renders table cells with correct CSS classes', () => {
    mockUseFeedback.mockReturnValue({
      feedbacks: [mockFeedbacks[0]], // Just one feedback for easier testing
      loading: false,
    });

    render(<FeedbackPanel />);
    
    const cells = screen.getAllByRole('cell');
    // Should have 3 cells per row (Message, Rating, Email) - no Date column
    expect(cells).toHaveLength(3);
    cells.forEach(cell => {
      expect(cell).toHaveClass('feedback-table-cell');
    });
  });
});
