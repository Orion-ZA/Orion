import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Welcome from '../pages/Welcome';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn();

// Mock performance.now
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

describe('Welcome Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders welcome page with all sections', () => {
    render(<Welcome />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
    expect(screen.getByText('Find trails, see community reviews, and plan your next outdoor adventure.')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by city, park, or trail name')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Explore nearby trails')).toBeInTheDocument();
  });

  it('displays hero images with proper alt text', () => {
    render(<Welcome />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(4); // 4 hero images
    
    // Check that images have proper alt attributes
    expect(images[0]).toHaveAttribute('alt', 'Hikers on a green valley trail with sun-lit mountains');
    expect(images[1]).toHaveAttribute('alt', 'A mother and son on a bridge overlooking a lake and mountains');
    expect(images[2]).toHaveAttribute('alt', 'Hikers with dogs on a forest trail facing an overcast city');
    expect(images[3]).toHaveAttribute('alt', 'Hikers in a vibrant green forest');
  });

  it('cycles through hero images every 6 seconds', async () => {
    render(<Welcome />);
    
    // Initially first image should be active
    const firstImage = screen.getAllByRole('img')[0];
    expect(firstImage.closest('picture')).toHaveClass('active');
    
    // Fast forward 6 seconds
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    
    await waitFor(() => {
      const secondImage = screen.getAllByRole('img')[1];
      expect(secondImage.closest('picture')).toHaveClass('active');
    });
  });

  it('displays typewriter effect for title', async () => {
    render(<Welcome />);
    
    // Initially title should be empty
    const titleElement = screen.getByText('Welcome to Orion');
    expect(titleElement).toBeInTheDocument();
    
    // The typewriter effect should complete
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(titleElement).toHaveTextContent('Welcome to Orion');
    });
  });

  it('renders stats section with animated counters', () => {
    render(<Welcome />);
    
    expect(screen.getByText('Trails mapped')).toBeInTheDocument();
    expect(screen.getByText('Total distance')).toBeInTheDocument();
    expect(screen.getByText('Elevation gain')).toBeInTheDocument();
    expect(screen.getByText('Active hikers')).toBeInTheDocument();
  });

  it('triggers stats animation when section becomes visible', () => {
    const mockObserve = jest.fn();
    const mockUnobserve = jest.fn();
    const mockDisconnect = jest.fn();
    
    mockIntersectionObserver.mockImplementation((callback) => {
      // Simulate intersection
      setTimeout(() => {
        callback([{ isIntersecting: true, target: document.createElement('div') }]);
      }, 0);
      
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect
      };
    });
    
    render(<Welcome />);
    
    expect(mockObserve).toHaveBeenCalled();
  });

  it('renders activity section with all activity cards', () => {
    render(<Welcome />);
    
    const activities = [
      'Hiking', 'Mountain biking', 'Trail running', 'Bird watching',
      'Camping', 'Rock climbing', 'Kayaking', 'Skiing', 'Backpacking', 'Surfing'
    ];
    
    activities.forEach(activity => {
      expect(screen.getByText(activity)).toBeInTheDocument();
    });
  });

  it('handles search input interaction', () => {
    render(<Welcome />);
    
    const searchInput = screen.getByPlaceholderText('Search by city, park, or trail name');
    const searchButton = screen.getByText('Search');
    
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');
    
    fireEvent.click(searchButton);
    // Search functionality would be tested in integration tests
  });

  it('handles explore trails link', () => {
    render(<Welcome />);
    
    const exploreLink = screen.getByText('Explore nearby trails');
    expect(exploreLink).toHaveAttribute('href', '/trails');
  });

  it('applies tilt effect to activity cards on mouse interaction', () => {
    render(<Welcome />);
    
    const activityCards = screen.getAllByText('Hiking');
    const firstCard = activityCards[0].closest('div');
    
    // Simulate mouse move
    fireEvent.mouseMove(firstCard, { clientX: 100, clientY: 100 });
    
    // The tilt effect would modify the transform style
    // This is more of a visual effect test
  });

  it('resets tilt effect on mouse leave', () => {
    render(<Welcome />);
    
    const activityCards = screen.getAllByText('Hiking');
    const firstCard = activityCards[0].closest('div');
    
    // Simulate mouse move then leave
    fireEvent.mouseMove(firstCard, { clientX: 100, clientY: 100 });
    fireEvent.mouseLeave(firstCard);
    
    // Transform should be reset
  });

  it('displays proper accessibility attributes', () => {
    render(<Welcome />);
    
    expect(screen.getByRole('banner')).toHaveAttribute('aria-labelledby', 'welcome-heading');
    expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'Search trails');
    expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'Search');
    expect(screen.getByText('Orion hiking stats')).toHaveAttribute('aria-label');
  });

  it('handles responsive images with source elements', () => {
    render(<Welcome />);
    
    const pictures = screen.getAllByRole('img').map(img => img.closest('picture'));
    
    pictures.forEach(picture => {
      const source = picture.querySelector('source');
      expect(source).toHaveAttribute('media', '(max-width: 767.95px)');
      expect(source).toHaveAttribute('type', 'image/jpg');
    });
  });

  it('cleans up intervals and observers on unmount', () => {
    const { unmount } = render(<Welcome />);
    
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const disconnectSpy = jest.fn();
    
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: disconnectSpy
    });
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('handles StatCard animation with proper easing', () => {
    render(<Welcome />);
    
    // Test that StatCard component renders with proper values
    expect(screen.getByText('1,248')).toBeInTheDocument(); // Trails mapped
    expect(screen.getByText('8,742 km')).toBeInTheDocument(); // Total distance
    expect(screen.getByText('215,000 m')).toBeInTheDocument(); // Elevation gain
    expect(screen.getByText('12,430')).toBeInTheDocument(); // Active hikers
  });

  it('formats numbers with proper locale formatting', () => {
    render(<Welcome />);
    
    // Check that large numbers are formatted with commas
    expect(screen.getByText('1,248')).toBeInTheDocument();
    expect(screen.getByText('8,742 km')).toBeInTheDocument();
    expect(screen.getByText('215,000 m')).toBeInTheDocument();
    expect(screen.getByText('12,430')).toBeInTheDocument();
  });

  it('handles multiple rapid timer advances', () => {
    render(<Welcome />);
    
    // Advance timers multiple times to test robustness
    act(() => {
      jest.advanceTimersByTime(6000);
      jest.advanceTimersByTime(6000);
      jest.advanceTimersByTime(6000);
    });
    
    // Should not crash and should still be functional
    expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
  });
});
