import React from 'react';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../pages/admin/AdminDashboard';

// Mock the child components
jest.mock('../components/admin/AdminHeader', () => {
  return function MockAdminHeader({ activeTab, setActiveTab }) {
    return (
      <div data-testid="admin-header">
        <div>Admin Header</div>
        <div>Active Tab: {activeTab}</div>
        <button onClick={() => setActiveTab('feedback')}>Switch to Feedback</button>
        <button onClick={() => setActiveTab('dashboard')}>Switch to Dashboard</button>
      </div>
    );
  };
});

jest.mock('../components/admin/AdminMainPanel', () => {
  return function MockAdminMainPanel({ activeTab }) {
    return (
      <div data-testid="admin-main-panel">
        <div>Admin Main Panel</div>
        <div>Active Tab: {activeTab}</div>
      </div>
    );
  };
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    // Clean up any existing body classes
    document.body.className = '';
  });

  afterEach(() => {
    cleanup();
    // Clean up body classes after each test
    document.body.className = '';
  });

  it('renders admin header and main panel', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    expect(screen.getByTestId('admin-main-panel')).toBeInTheDocument();
  });

  it('initializes with dashboard tab active', () => {
    render(<AdminDashboard />);
    
    // Should have 2 elements showing dashboard (header and main panel)
    const dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
  });

  it('adds admin-dashboard-active class to body on mount', () => {
    render(<AdminDashboard />);
    
    expect(document.body.classList.contains('admin-dashboard-active')).toBe(true);
  });

  it('removes admin-dashboard-active class from body on unmount', () => {
    const { unmount } = render(<AdminDashboard />);
    
    expect(document.body.classList.contains('admin-dashboard-active')).toBe(true);
    
    unmount();
    
    expect(document.body.classList.contains('admin-dashboard-active')).toBe(false);
  });

  it('handles tab switching correctly', () => {
    render(<AdminDashboard />);
    
    // Initially dashboard should be active
    const dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
    
    // Click switch to feedback button
    const switchToFeedbackButton = screen.getByText('Switch to Feedback');
    act(() => {
      fireEvent.click(switchToFeedbackButton);
    });
    
    // Should now show feedback as active
    const feedbackElements = screen.getAllByText('Active Tab: feedback');
    expect(feedbackElements).toHaveLength(2);
  });

  it('handles switching back to dashboard tab', () => {
    render(<AdminDashboard />);
    
    // Switch to feedback first
    const switchToFeedbackButton = screen.getByText('Switch to Feedback');
    act(() => {
      fireEvent.click(switchToFeedbackButton);
    });
    
    const feedbackElements = screen.getAllByText('Active Tab: feedback');
    expect(feedbackElements).toHaveLength(2);
    
    // Switch back to dashboard
    const switchToDashboardButton = screen.getByText('Switch to Dashboard');
    act(() => {
      fireEvent.click(switchToDashboardButton);
    });
    
    const dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
  });

  it('passes activeTab prop to both header and main panel', () => {
    render(<AdminDashboard />);
    
    // Both components should receive the same activeTab value
    const activeTabElements = screen.getAllByText('Active Tab: dashboard');
    expect(activeTabElements).toHaveLength(2);
  });

  it('updates both components when tab changes', () => {
    render(<AdminDashboard />);
    
    // Switch to feedback
    const switchToFeedbackButton = screen.getByText('Switch to Feedback');
    act(() => {
      fireEvent.click(switchToFeedbackButton);
    });
    
    // Both components should show the new active tab
    const activeTabElements = screen.getAllByText('Active Tab: feedback');
    expect(activeTabElements).toHaveLength(2);
  });

  it('has correct CSS classes applied', () => {
    render(<AdminDashboard />);
    
    const dashboard = screen.getByTestId('admin-header').closest('.admin-dashboard');
    expect(dashboard).toBeInTheDocument();
  });

  it('maintains state consistency between components', () => {
    render(<AdminDashboard />);
    
    // Switch to feedback
    const switchToFeedbackButton = screen.getByText('Switch to Feedback');
    act(() => {
      fireEvent.click(switchToFeedbackButton);
    });
    
    // Both components should have the same state
    const headerActiveTab = screen.getByTestId('admin-header').textContent;
    const mainPanelActiveTab = screen.getByTestId('admin-main-panel').textContent;
    
    expect(headerActiveTab).toContain('Active Tab: feedback');
    expect(mainPanelActiveTab).toContain('Active Tab: feedback');
  });

  it('handles multiple tab switches correctly', () => {
    render(<AdminDashboard />);
    
    // Start with dashboard
    let dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
    
    // Switch to feedback
    const switchToFeedbackButton = screen.getByText('Switch to Feedback');
    act(() => {
      fireEvent.click(switchToFeedbackButton);
    });
    let feedbackElements = screen.getAllByText('Active Tab: feedback');
    expect(feedbackElements).toHaveLength(2);
    
    // Switch back to dashboard
    const switchToDashboardButton = screen.getByText('Switch to Dashboard');
    act(() => {
      fireEvent.click(switchToDashboardButton);
    });
    dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
    
    // Switch to feedback again
    act(() => {
      fireEvent.click(switchToFeedbackButton);
    });
    feedbackElements = screen.getAllByText('Active Tab: feedback');
    expect(feedbackElements).toHaveLength(2);
  });

  it('preserves existing body classes when adding admin class', () => {
    // Add some existing classes to body
    document.body.classList.add('existing-class-1', 'existing-class-2');
    
    render(<AdminDashboard />);
    
    expect(document.body.classList.contains('existing-class-1')).toBe(true);
    expect(document.body.classList.contains('existing-class-2')).toBe(true);
    expect(document.body.classList.contains('admin-dashboard-active')).toBe(true);
  });

  it('restores existing body classes when removing admin class', () => {
    // Add some existing classes to body
    document.body.classList.add('existing-class-1', 'existing-class-2');
    
    const { unmount } = render(<AdminDashboard />);
    
    expect(document.body.classList.contains('admin-dashboard-active')).toBe(true);
    
    unmount();
    
    expect(document.body.classList.contains('existing-class-1')).toBe(true);
    expect(document.body.classList.contains('existing-class-2')).toBe(true);
    expect(document.body.classList.contains('admin-dashboard-active')).toBe(false);
  });

  it('handles component re-renders correctly', () => {
    const { rerender } = render(<AdminDashboard />);
    
    let dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
    
    // Re-render the component
    rerender(<AdminDashboard />);
    
    // Should still show dashboard as active
    dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
  });

  it('maintains proper component structure', () => {
    render(<AdminDashboard />);
    
    const dashboard = screen.getByTestId('admin-header').closest('.admin-dashboard');
    expect(dashboard).toBeInTheDocument();
    
    const header = dashboard.querySelector('[data-testid="admin-header"]');
    const mainPanel = dashboard.querySelector('[data-testid="admin-main-panel"]');
    
    expect(header).toBeInTheDocument();
    expect(mainPanel).toBeInTheDocument();
    
    // Header should come before main panel
    expect(header.compareDocumentPosition(mainPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('handles rapid tab switching', () => {
    render(<AdminDashboard />);
    
    const switchToFeedbackButton = screen.getByText('Switch to Feedback');
    const switchToDashboardButton = screen.getByText('Switch to Dashboard');
    
    // Rapidly switch between tabs
    act(() => {
      fireEvent.click(switchToFeedbackButton);
      fireEvent.click(switchToDashboardButton);
      fireEvent.click(switchToFeedbackButton);
      fireEvent.click(switchToDashboardButton);
    });
    
    // Should end up on dashboard
    const dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
  });

  it('initializes with correct default state', () => {
    render(<AdminDashboard />);
    
    // Should start with dashboard tab
    const dashboardElements = screen.getAllByText('Active Tab: dashboard');
    expect(dashboardElements).toHaveLength(2);
    
    // Body should have admin class
    expect(document.body.classList.contains('admin-dashboard-active')).toBe(true);
  });

  it('handles unmounting without errors', () => {
    const { unmount } = render(<AdminDashboard />);
    
    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
    
    // Body class should be removed
    expect(document.body.classList.contains('admin-dashboard-active')).toBe(false);
  });
});
