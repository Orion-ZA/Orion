import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomNav from '../components/BottomNav';

describe('BottomNav', () => {
  const mockSetActiveTab = jest.fn();

  beforeEach(() => {
    mockSetActiveTab.mockClear();
  });

  it('renders all navigation tabs', () => {
    render(<BottomNav activeTab="home" setActiveTab={mockSetActiveTab} />);
    
    // Check if all tabs are rendered
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Stats')).toBeInTheDocument();
    expect(screen.getByLabelText('Challenges')).toBeInTheDocument();
    expect(screen.getByLabelText('Account')).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    render(<BottomNav activeTab="home" setActiveTab={mockSetActiveTab} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('bottom-nav');
    
    const navGrid = nav.querySelector('.nav-grid');
    expect(navGrid).toBeInTheDocument();
  });

  it('shows active tab with correct styling', () => {
    render(<BottomNav activeTab="stats" setActiveTab={mockSetActiveTab} />);
    
    const homeTab = screen.getByLabelText('Home');
    const statsTab = screen.getByLabelText('Stats');
    const challengesTab = screen.getByLabelText('Challenges');
    const accountTab = screen.getByLabelText('Account');
    
    // Stats tab should be active
    expect(statsTab).toHaveClass('active');
    expect(homeTab).not.toHaveClass('active');
    expect(challengesTab).not.toHaveClass('active');
    expect(accountTab).not.toHaveClass('active');
  });

  it('calls setActiveTab when tab is clicked', () => {
    render(<BottomNav activeTab="home" setActiveTab={mockSetActiveTab} />);
    
    const statsTab = screen.getByLabelText('Stats');
    fireEvent.click(statsTab);
    
    expect(mockSetActiveTab).toHaveBeenCalledWith('stats');
  });

  it('calls setActiveTab for each tab when clicked', () => {
    render(<BottomNav activeTab="home" setActiveTab={mockSetActiveTab} />);
    
    const homeTab = screen.getByLabelText('Home');
    const challengesTab = screen.getByLabelText('Challenges');
    const accountTab = screen.getByLabelText('Account');
    
    fireEvent.click(homeTab);
    expect(mockSetActiveTab).toHaveBeenCalledWith('home');
    
    fireEvent.click(challengesTab);
    expect(mockSetActiveTab).toHaveBeenCalledWith('challenges');
    
    fireEvent.click(accountTab);
    expect(mockSetActiveTab).toHaveBeenCalledWith('account');
  });

  it('renders tab labels correctly', () => {
    render(<BottomNav activeTab="home" setActiveTab={mockSetActiveTab} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Challenges')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders icons for each tab', () => {
    render(<BottomNav activeTab="home" setActiveTab={mockSetActiveTab} />);
    
    // Each tab should have an icon (SVG element)
    const tabs = screen.getAllByRole('button');
    tabs.forEach(tab => {
      const svg = tab.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('shows filled icons for active tab', () => {
    render(<BottomNav activeTab="challenges" setActiveTab={mockSetActiveTab} />);
    
    const challengesTab = screen.getByLabelText('Challenges');
    const svg = challengesTab.querySelector('svg');
    
    // Active tab should have filled icon
    expect(svg).toHaveAttribute('fill', '#4CAF50');
  });

  it('shows unfilled icons for inactive tabs', () => {
    render(<BottomNav activeTab="challenges" setActiveTab={mockSetActiveTab} />);
    
    const homeTab = screen.getByLabelText('Home');
    const svg = homeTab.querySelector('svg');
    
    // Inactive tab should not have fill attribute or have fill="none"
    expect(svg).not.toHaveAttribute('fill', '#4CAF50');
  });

  it('handles no active tab gracefully', () => {
    render(<BottomNav activeTab="" setActiveTab={mockSetActiveTab} />);
    
    const tabs = screen.getAllByRole('button');
    tabs.forEach(tab => {
      expect(tab).not.toHaveClass('active');
    });
  });

  it('handles undefined activeTab gracefully', () => {
    render(<BottomNav activeTab={undefined} setActiveTab={mockSetActiveTab} />);
    
    const tabs = screen.getAllByRole('button');
    tabs.forEach(tab => {
      expect(tab).not.toHaveClass('active');
    });
  });
});
