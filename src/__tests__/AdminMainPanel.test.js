import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminMainPanel from '../components/admin/AdminMainPanel';

// Mock the child components
jest.mock('../components/admin/FeedbackPanel', () => {
  return function MockFeedbackPanel() {
    return <div data-testid="feedback-panel">Feedback Panel</div>;
  };
});

jest.mock('../components/admin/RatingsChart', () => {
  return function MockRatingsChart() {
    return <div data-testid="ratings-chart">Ratings Chart</div>;
  };
});

jest.mock('../components/admin/FeedbackTypeChart', () => {
  return function MockFeedbackTypeChart() {
    return <div data-testid="feedback-type-chart">Feedback Type Chart</div>;
  };
});

describe('AdminMainPanel', () => {
  it('renders dashboard content when activeTab is dashboard', () => {
    render(<AdminMainPanel activeTab="dashboard" />);
    
    expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
    expect(screen.getByText('Recent Feedback')).toBeInTheDocument();
    expect(screen.getByTestId('ratings-chart')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-type-chart')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
  });

  it('renders feedback standalone content when activeTab is feedback', () => {
    render(<AdminMainPanel activeTab="feedback" />);
    
    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
    expect(screen.queryByText('Analytics Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent Feedback')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ratings-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-type-chart')).not.toBeInTheDocument();
  });

  it('does not render dashboard content when activeTab is feedback', () => {
    render(<AdminMainPanel activeTab="feedback" />);
    
    expect(screen.queryByText('Analytics Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent Feedback')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ratings-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-type-chart')).not.toBeInTheDocument();
  });

  it('does not render feedback standalone when activeTab is dashboard', () => {
    render(<AdminMainPanel activeTab="dashboard" />);
    
    // Feedback panel should be in the dashboard section, not standalone
    const feedbackPanels = screen.getAllByTestId('feedback-panel');
    expect(feedbackPanels).toHaveLength(1);
  });

  it('applies correct CSS classes', () => {
    render(<AdminMainPanel activeTab="dashboard" />);
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('admin-main-panel');
    
    const dashboardContainer = main.querySelector('.admin-dashboard-container');
    expect(dashboardContainer).toBeInTheDocument();
    
    const sections = main.querySelectorAll('.admin-section');
    expect(sections).toHaveLength(2);
    
    const analyticsSection = main.querySelector('.admin-analytics-section');
    expect(analyticsSection).toBeInTheDocument();
    
    const feedbackSection = main.querySelector('.admin-feedback-section');
    expect(feedbackSection).toBeInTheDocument();
  });

  it('applies correct CSS classes for feedback standalone', () => {
    render(<AdminMainPanel activeTab="feedback" />);
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('admin-main-panel');
    
    const feedbackStandalone = main.querySelector('.admin-feedback-standalone');
    expect(feedbackStandalone).toBeInTheDocument();
    
    const dashboardContainer = main.querySelector('.admin-dashboard-container');
    expect(dashboardContainer).not.toBeInTheDocument();
  });

  it('renders section titles with correct classes', () => {
    render(<AdminMainPanel activeTab="dashboard" />);
    
    const analyticsTitle = screen.getByText('Analytics Overview');
    const feedbackTitle = screen.getByText('Recent Feedback');
    
    expect(analyticsTitle).toHaveClass('admin-section-title');
    expect(feedbackTitle).toHaveClass('admin-section-title');
  });

  it('handles unknown activeTab gracefully', () => {
    render(<AdminMainPanel activeTab="unknown" />);
    
    // Should not render any content
    expect(screen.queryByText('Analytics Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent Feedback')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ratings-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-type-chart')).not.toBeInTheDocument();
  });

  it('renders with different activeTab values', () => {
    const { rerender } = render(<AdminMainPanel activeTab="dashboard" />);
    
    expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
    expect(screen.getByTestId('ratings-chart')).toBeInTheDocument();
    
    rerender(<AdminMainPanel activeTab="feedback" />);
    
    expect(screen.queryByText('Analytics Overview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ratings-chart')).not.toBeInTheDocument();
    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
  });

  it('maintains proper component structure', () => {
    render(<AdminMainPanel activeTab="dashboard" />);
    
    const main = screen.getByRole('main');
    const dashboardContainer = main.querySelector('.admin-dashboard-container');
    
    // Check that sections are properly nested
    const sections = dashboardContainer.querySelectorAll('.admin-section');
    expect(sections).toHaveLength(2);
    
    // Check analytics section structure
    const analyticsSection = sections[0];
    expect(analyticsSection.querySelector('.admin-section-title')).toBeInTheDocument();
    expect(analyticsSection.querySelector('.admin-analytics-section')).toBeInTheDocument();
    
    // Check feedback section structure
    const feedbackSection = sections[1];
    expect(feedbackSection.querySelector('.admin-section-title')).toBeInTheDocument();
    expect(feedbackSection.querySelector('.admin-feedback-section')).toBeInTheDocument();
  });

  it('renders child components in correct order for dashboard', () => {
    render(<AdminMainPanel activeTab="dashboard" />);
    
    const analyticsSection = screen.getByText('Analytics Overview').closest('.admin-section');
    const feedbackSection = screen.getByText('Recent Feedback').closest('.admin-section');
    
    // Analytics section should come first
    expect(analyticsSection.compareDocumentPosition(feedbackSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    
    // Check that charts are in analytics section
    const analyticsCharts = analyticsSection.querySelectorAll('[data-testid*="chart"]');
    expect(analyticsCharts).toHaveLength(2);
    
    // Check that feedback panel is in feedback section
    const feedbackPanel = feedbackSection.querySelector('[data-testid="feedback-panel"]');
    expect(feedbackPanel).toBeInTheDocument();
  });
});
