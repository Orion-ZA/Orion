import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminHeader from '../components/admin/AdminHeader';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BarChart2: () => <div data-testid="bar-chart-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Users: () => <div data-testid="users-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Flag: () => <div data-testid="flag-icon" />,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock fetch API
global.fetch = jest.fn();

describe('AdminHeader', () => {
  const mockSetActiveTab = jest.fn();

  beforeEach(() => {
    mockSetActiveTab.mockClear();
    mockNavigate.mockClear();
    fetch.mockClear();
    
    // Mock AbortSignal.timeout
    global.AbortSignal = {
      timeout: jest.fn(() => new AbortController().signal)
    };
    
    // Reset console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default mock for fetch - resolves with successful response
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'OK', timestamp: '2024-01-01T00:00:00.000Z', uptime: 123 })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders admin dashboard title', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders all tab buttons with correct labels', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
    expect(screen.getByText('Trails')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders tab icons', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    expect(screen.getAllByTestId('bar-chart-icon')).toHaveLength(1);
    expect(screen.getAllByTestId('file-text-icon')).toHaveLength(1);
    expect(screen.getAllByTestId('map-pin-icon')).toHaveLength(1);
    expect(screen.getAllByTestId('users-icon')).toHaveLength(1);
    expect(screen.getAllByTestId('flag-icon')).toHaveLength(1);
  });

  it('applies active class to the correct tab', () => {
    render(<AdminHeader activeTab="feedback" setActiveTab={mockSetActiveTab} />);
    
    const dashboardTab = screen.getByText('Dashboard').closest('button');
    const feedbackTab = screen.getByText('Feedback').closest('button');
    
    expect(dashboardTab).not.toHaveClass('active');
    expect(feedbackTab).toHaveClass('active');
  });

  it('calls setActiveTab when tab is clicked', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    const feedbackTab = screen.getByText('Feedback');
    fireEvent.click(feedbackTab);
    
    expect(mockSetActiveTab).toHaveBeenCalledWith('feedback');
  });

  it('calls setActiveTab with correct tab id for dashboard', () => { 
    render(<AdminHeader activeTab="feedback" setActiveTab={mockSetActiveTab} />);

    const dashboardTab = screen.getByText('Dashboard');
    fireEvent.click(dashboardTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith('dashboard');
  });

  it('calls setActiveTab with correct tab id for reports', () => { 
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith('reports');
  });

  it('renders back button', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
  });

  it('calls navigate(-1) when back button is clicked and history length > 1', () => {
    // Mock window.history.length to be greater than 1
    Object.defineProperty(window, 'history', {
      value: { length: 2 },
      writable: true
    });

    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('calls navigate("/dashboard") when back button is clicked and history length <= 1', () => {
    // Mock window.history.length to be 1 or less
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true
    });

    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('renders API status indicator', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'OK', timestamp: '2024-01-01T00:00:00.000Z', uptime: 123 })
    });

    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    // Initially shows checking status
    expect(screen.getByText('API Checking...')).toBeInTheDocument();
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByText('API Online')).toBeInTheDocument();
    });
    
    const statusIndicator = screen.getByText('API Online').closest('div').querySelector('.admin-header-status-indicator');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('online');
  });

  it('has correct CSS classes applied', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('admin-header');
    
    const content = header.querySelector('.admin-header-content');
    expect(content).toBeInTheDocument();
    
    const tabs = header.querySelector('.admin-header-tabs');
    expect(tabs).toBeInTheDocument();
    
    const status = header.querySelector('.admin-header-status');
    expect(status).toBeInTheDocument();
  });

  it('renders tab buttons with correct structure', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    const dashboardTab = screen.getByText('Dashboard').closest('button');
    const feedbackTab = screen.getByText('Feedback').closest('button');
    const trailsTab = screen.getByText('Trails').closest('button');
    const usersTab = screen.getByText('Users').closest('button');
    const reportsTab = screen.getByText('Reports').closest('button');
    
    expect(dashboardTab).toHaveClass('admin-header-tab');
    expect(feedbackTab).toHaveClass('admin-header-tab');
    expect(trailsTab).toHaveClass('admin-header-tab');
    expect(usersTab).toHaveClass('admin-header-tab');
    expect(reportsTab).toHaveClass('admin-header-tab');
    
    // Check for icon elements (they have the class but are rendered as components)
    expect(dashboardTab.querySelector('[data-testid="bar-chart-icon"]')).toBeInTheDocument();
    expect(feedbackTab.querySelector('[data-testid="file-text-icon"]')).toBeInTheDocument();
    expect(trailsTab.querySelector('[data-testid="map-pin-icon"]')).toBeInTheDocument();
    expect(usersTab.querySelector('[data-testid="users-icon"]')).toBeInTheDocument();
    expect(reportsTab.querySelector('[data-testid="flag-icon"]')).toBeInTheDocument();
  });

  it('handles multiple tab clicks correctly', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    const dashboardTab = screen.getByText('Dashboard');
    const feedbackTab = screen.getByText('Feedback');
    
    fireEvent.click(feedbackTab);
    fireEvent.click(dashboardTab);
    fireEvent.click(feedbackTab);
    
    expect(mockSetActiveTab).toHaveBeenCalledTimes(3);
    expect(mockSetActiveTab).toHaveBeenNthCalledWith(1, 'feedback');
    expect(mockSetActiveTab).toHaveBeenNthCalledWith(2, 'dashboard');
    expect(mockSetActiveTab).toHaveBeenNthCalledWith(3, 'feedback');
  });

  it('maintains accessibility attributes', () => {
    render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    const dashboardTab = screen.getByText('Dashboard').closest('button');
    const feedbackTab = screen.getByText('Feedback').closest('button');
    const trailsTab = screen.getByText('Trails').closest('button');
    const usersTab = screen.getByText('Users').closest('button');
    
    // Buttons are accessible by default, check they are clickable
    expect(dashboardTab).toBeInTheDocument();
    expect(feedbackTab).toBeInTheDocument();
    expect(trailsTab).toBeInTheDocument();
    expect(usersTab).toBeInTheDocument();
    
    // Check that buttons are properly structured
    expect(dashboardTab.tagName).toBe('BUTTON');
    expect(feedbackTab.tagName).toBe('BUTTON');
    expect(trailsTab.tagName).toBe('BUTTON');
    expect(usersTab.tagName).toBe('BUTTON');
  });

  it('renders with different activeTab values', () => {
    const { rerender } = render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
    
    let dashboardTab = screen.getByText('Dashboard').closest('button');
    let feedbackTab = screen.getByText('Feedback').closest('button');
    let trailsTab = screen.getByText('Trails').closest('button');
    let usersTab = screen.getByText('Users').closest('button');
    let reportsTab = screen.getByText('Reports').closest('button');
    
    expect(dashboardTab).toHaveClass('active');
    expect(feedbackTab).not.toHaveClass('active');
    expect(trailsTab).not.toHaveClass('active');
    expect(usersTab).not.toHaveClass('active');
    expect(reportsTab).not.toHaveClass('active');
    
    rerender(<AdminHeader activeTab="feedback" setActiveTab={mockSetActiveTab} />);
    
    dashboardTab = screen.getByText('Dashboard').closest('button');
    feedbackTab = screen.getByText('Feedback').closest('button');
    trailsTab = screen.getByText('Trails').closest('button');
    usersTab = screen.getByText('Users').closest('button');
    reportsTab = screen.getByText('Reports').closest('button');
    
    expect(dashboardTab).not.toHaveClass('active');
    expect(feedbackTab).toHaveClass('active');
    expect(trailsTab).not.toHaveClass('active');
    expect(usersTab).not.toHaveClass('active');
    expect(reportsTab).not.toHaveClass('active');
    
    rerender(<AdminHeader activeTab="reports" setActiveTab={mockSetActiveTab} />);
    
    dashboardTab = screen.getByText('Dashboard').closest('button');
    feedbackTab = screen.getByText('Feedback').closest('button');
    trailsTab = screen.getByText('Trails').closest('button');
    usersTab = screen.getByText('Users').closest('button');
    reportsTab = screen.getByText('Reports').closest('button');
    
    expect(dashboardTab).not.toHaveClass('active');
    expect(feedbackTab).not.toHaveClass('active');
    expect(trailsTab).not.toHaveClass('active');
    expect(usersTab).not.toHaveClass('active');
    expect(reportsTab).toHaveClass('active');
  });

  // API Health Check Tests
  describe('API Health Check', () => {
    it('calls health API on component mount', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', timestamp: '2024-01-01T00:00:00.000Z', uptime: 123 })
      });

      render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://orion-api-qeyv.onrender.com/health',
          expect.objectContaining({
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: expect.any(Object)
          })
        );
      });
    });

    it('shows offline status when API call fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

      await waitFor(() => {
        expect(screen.getByText('API Offline')).toBeInTheDocument();
      });

      const statusIndicator = screen.getByText('API Offline').closest('div').querySelector('.admin-header-status-indicator');
      expect(statusIndicator).toHaveClass('offline');
    });

    it('shows offline status when API returns non-ok response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

      await waitFor(() => {
        expect(screen.getByText('API Offline')).toBeInTheDocument();
      });

      const statusIndicator = screen.getByText('API Offline').closest('div').querySelector('.admin-header-status-indicator');
      expect(statusIndicator).toHaveClass('offline');
    });

    it('shows checking status initially', () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', timestamp: '2024-01-01T00:00:00.000Z', uptime: 123 })
      });

      render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

      expect(screen.getByText('API Checking...')).toBeInTheDocument();
      const statusIndicator = screen.getByText('API Checking...').closest('div').querySelector('.admin-header-status-indicator');
      expect(statusIndicator).toHaveClass('checking');
    });

    it('handles API timeout gracefully', async () => {
      // Mock AbortSignal.timeout to throw an error
      global.AbortSignal.timeout = jest.fn(() => {
        throw new Error('Timeout');
      });

      render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

      await waitFor(() => {
        expect(screen.getByText('API Offline')).toBeInTheDocument();
      });
    });

    it('sets up periodic health checks', async () => {
      jest.useFakeTimers();
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'OK', timestamp: '2024-01-01T00:00:00.000Z', uptime: 123 })
      });

      render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);

      // Wait for initial call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should have made another call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    it('cleans up interval on component unmount', () => {
      jest.useFakeTimers();
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'OK', timestamp: '2024-01-01T00:00:00.000Z', uptime: 123 })
      });

      const { unmount } = render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
      
      unmount();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should not make additional calls after unmount
      expect(fetch).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('displays correct status text for all states', async () => {
      // Test checking state - mock a promise that never resolves
      fetch.mockImplementationOnce(() => new Promise(() => {}));
      
      const { rerender } = render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
      expect(screen.getByText('API Checking...')).toBeInTheDocument();

      // Test online state - create a new component instance
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', timestamp: '2024-01-01T00:00:00.000Z', uptime: 123 })
      });

      const { unmount } = render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
      
      await waitFor(() => {
        expect(screen.getByText('API Online')).toBeInTheDocument();
      });

      unmount();

      // Test offline state - create another new component instance
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<AdminHeader activeTab="dashboard" setActiveTab={mockSetActiveTab} />);
      
      await waitFor(() => {
        expect(screen.getByText('API Offline')).toBeInTheDocument();
      });
    });
  });
});
