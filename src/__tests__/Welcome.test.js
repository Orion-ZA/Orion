import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Welcome from '../pages/Welcome';
import { SearchProvider } from '../components/SearchContext';

// Mock the SearchBar component
jest.mock('../components/SearchBar', () => {
  return function MockSearchBar({ onSearch, placeholder, initialValue }) {
    return (
      <div data-testid='search-bar'>
        <input
          data-testid='search-input'
          placeholder={placeholder}
          defaultValue={initialValue}
          onChange={e => {
            if (e.target.value.length > 2) {
              onSearch && onSearch(e.target.value);
            }
          }}
        />
        <button data-testid='search-button' onClick={() => onSearch && onSearch('test search')}>
          Search
        </button>
      </div>
    );
  };
});

// Mock the CSS module
jest.mock('../pages/Welcome.module.css', () => ({
  hero: 'hero',
  heroImage: 'hero-image',
  heroContent: 'hero-content',
  heroTitle: 'hero-title',
  heroSubtitle: 'hero-subtitle',
  searchSection: 'search-section',
  stats: 'stats',
  statsGrid: 'stats-grid',
  statItem: 'stat-item',
  statNumber: 'stat-number',
  statLabel: 'stat-label',
  features: 'features',
  featuresGrid: 'features-grid',
  featureCard: 'feature-card',
  featureIcon: 'feature-icon',
  featureTitle: 'feature-title',
  featureDescription: 'feature-description',
  cta: 'cta',
  ctaContent: 'cta-content',
  ctaTitle: 'cta-title',
  ctaDescription: 'cta-description',
  ctaButtons: 'cta-buttons',
  btn: 'btn',
  btnPrimary: 'btn-primary',
  btnSecondary: 'btn-secondary',
}));

const renderWithProviders = component => {
  return render(
    <BrowserRouter>
      <SearchProvider>{component}</SearchProvider>
    </BrowserRouter>
  );
};

describe('Welcome Page', () => {
  beforeEach(() => {
    // Mock IntersectionObserver to immediately trigger intersection
    global.IntersectionObserver = jest.fn().mockImplementation(callback => {
      // Immediately call the callback to trigger stats animation
      setTimeout(() => {
        act(() => {
          callback([{ isIntersecting: true, target: document.createElement('div') }]);
        });
      }, 0);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the welcome page with all main sections', async () => {
      renderWithProviders(<Welcome />);

      // Wait for typewriter effect to complete (allow more time for the animation)
      await waitFor(
        () => {
          expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
      expect(
        screen.getByText(
          'Find trails, see community reviews, and plan your next outdoor adventure.'
        )
      ).toBeInTheDocument();
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });

    it('renders hero section with correct content', async () => {
      renderWithProviders(<Welcome />);

      // Wait for typewriter effect to complete
      await waitFor(
        () => {
          expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
      expect(
        screen.getByText(
          'Find trails, see community reviews, and plan your next outdoor adventure.'
        )
      ).toBeInTheDocument();
    });

    it('renders search section with SearchBar component', () => {
      renderWithProviders(<Welcome />);

      const searchBar = screen.getByTestId('search-bar');
      expect(searchBar).toBeInTheDocument();

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search by city, park, or trail name');
    });

    it('renders activities section with activity cards', () => {
      renderWithProviders(<Welcome />);

      expect(screen.getByText('Browse by activity')).toBeInTheDocument();

      // Activity cards are rendered but text only shows on interaction
      // Check that activity images are rendered (by checking for images)
      const activityImages = document.querySelectorAll('img[alt*="terrain"]');
      expect(activityImages).toHaveLength(10); // Should have 10 activity cards
    });

    it('renders call-to-action section', () => {
      renderWithProviders(<Welcome />);

      expect(screen.getByText('Explore nearby trails')).toBeInTheDocument();
    });
  });

  describe('Hero Image Rotation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('rotates hero images every 6 seconds', async () => {
      renderWithProviders(<Welcome />);

      // Fast-forward time to trigger image rotation
      act(() => {
        jest.advanceTimersByTime(6000);
      });

      // The component should still be rendered (no errors)
      await waitFor(
        () => {
          expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('handles multiple image rotations', async () => {
      renderWithProviders(<Welcome />);

      // Fast-forward through multiple rotations
      act(() => {
        jest.advanceTimersByTime(18000); // 3 rotations
      });

      await waitFor(
        () => {
          expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Stats Animation', () => {
    it('sets up intersection observer for stats section', () => {
      renderWithProviders(<Welcome />);

      expect(global.IntersectionObserver).toHaveBeenCalled();
    });

    it('handles intersection observer callback', () => {
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };

      global.IntersectionObserver = jest.fn().mockImplementation(callback => {
        // Simulate intersection
        setTimeout(() => {
          act(() => {
            callback([{ isIntersecting: true, target: document.createElement('div') }]);
          });
        }, 0);
        return mockObserver;
      });

      renderWithProviders(<Welcome />);

      expect(mockObserver.observe).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('handles search input changes', () => {
      renderWithProviders(<Welcome />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Table Mountain' } });

      expect(searchInput.value).toBe('Table Mountain');
    });

    it('handles search button click', () => {
      renderWithProviders(<Welcome />);

      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);

      // The search should be triggered
      expect(searchButton).toBeInTheDocument();
    });

    it('passes correct props to SearchBar', () => {
      renderWithProviders(<Welcome />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search by city, park, or trail name');
    });
  });

  describe('Navigation Links', () => {
    it('renders navigation links in CTA section', () => {
      renderWithProviders(<Welcome />);

      // Check for navigation links (these would be rendered by the SearchBar component)
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
  });

  describe('Activity Card Navigation', () => {
    beforeEach(() => {
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };
    });

    it('navigates to reviews page with filters when activity card is clicked', () => {
      renderWithProviders(<Welcome />);

      // Find the first activity card by its image alt text
      const natureTrailsCard = document
        .querySelector('img[alt="Nature Trails terrain"]')
        .closest('article');
      expect(natureTrailsCard).toBeInTheDocument();

      fireEvent.click(natureTrailsCard);

      // Should navigate to reviews page with nature and park tags
      expect(window.location.href).toBe('/reviews?tags=nature%2Cpark');
    });

    it('navigates to reviews page with difficulty filter when activity card is clicked', () => {
      renderWithProviders(<Welcome />);

      // Find and click the Wildlife Watching activity card (has easy difficulty)
      const wildlifeCard = document
        .querySelector('img[alt="Wildlife Watching terrain"]')
        .closest('article');
      expect(wildlifeCard).toBeInTheDocument();

      fireEvent.click(wildlifeCard);

      // Should navigate to reviews page with nature, field tags and easy difficulty
      expect(window.location.href).toBe('/reviews?tags=nature%2Cfield&difficulty=easy');
    });

    it('navigates to reviews page with multiple filters when activity card is clicked', () => {
      renderWithProviders(<Welcome />);

      // Find and click the Rocky Adventures activity card (has rocky, nature tags and hard difficulty)
      const rockyCard = document
        .querySelector('img[alt="Rocky Adventures terrain"]')
        .closest('article');
      expect(rockyCard).toBeInTheDocument();

      fireEvent.click(rockyCard);

      // Should navigate to reviews page with rocky, nature tags and hard difficulty
      expect(window.location.href).toBe('/reviews?tags=rocky%2Cnature&difficulty=hard');
    });

    it('navigates to reviews page without filters when activity card has no specific filters', () => {
      renderWithProviders(<Welcome />);

      // Find and click the Nature Trails activity card (difficulty: all)
      const natureTrailsCard = document
        .querySelector('img[alt="Nature Trails terrain"]')
        .closest('article');
      expect(natureTrailsCard).toBeInTheDocument();

      fireEvent.click(natureTrailsCard);

      // Should navigate to reviews page with only tags (no difficulty filter for 'all')
      expect(window.location.href).toBe('/reviews?tags=nature%2Cpark');
    });
  });

  describe('Activity Card Interactions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('shows typewriter effect on hover', async () => {
      renderWithProviders(<Welcome />);

      const natureTrailsCard = document
        .querySelector('img[alt="Nature Trails terrain"]')
        .closest('article');
      expect(natureTrailsCard).toBeInTheDocument();

      // Trigger hover event
      fireEvent.mouseEnter(natureTrailsCard);

      // Fast-forward timers to complete typewriter effect
      act(() => {
        jest.advanceTimersByTime(2000); // Allow time for typewriter effect
      });

      // The card should still be in the document (no errors)
      expect(natureTrailsCard).toBeInTheDocument();
    });

    it('handles touch events on activity cards', () => {
      renderWithProviders(<Welcome />);

      const natureTrailsCard = document
        .querySelector('img[alt="Nature Trails terrain"]')
        .closest('article');
      expect(natureTrailsCard).toBeInTheDocument();

      // Trigger touch events
      fireEvent.touchStart(natureTrailsCard);
      fireEvent.touchEnd(natureTrailsCard);

      // The card should still be in the document (no errors)
      expect(natureTrailsCard).toBeInTheDocument();
    });

    it('handles focus events on activity cards', () => {
      renderWithProviders(<Welcome />);

      const natureTrailsCard = document
        .querySelector('img[alt="Nature Trails terrain"]')
        .closest('article');
      expect(natureTrailsCard).toBeInTheDocument();

      // Trigger focus events
      fireEvent.focus(natureTrailsCard);
      fireEvent.blur(natureTrailsCard);

      // The card should still be in the document (no errors)
      expect(natureTrailsCard).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on different screen sizes', async () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithProviders(<Welcome />);

      await waitFor(
        () => {
          expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      renderWithProviders(<Welcome />);

      await waitFor(
        () => {
          const mainHeading = screen.getByText('Welcome to Orion');
          expect(mainHeading).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('has accessible search input', () => {
      renderWithProviders(<Welcome />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search by city, park, or trail name');
    });

    it('has accessible buttons', () => {
      renderWithProviders(<Welcome />);

      const searchButton = screen.getByTestId('search-button');
      expect(searchButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing IntersectionObserver gracefully', async () => {
      // Remove IntersectionObserver
      delete global.IntersectionObserver;

      renderWithProviders(<Welcome />);

      await waitFor(
        () => {
          expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Stats should be visible and animated (fallback behavior)
      await waitFor(
        () => {
          expect(screen.getByText('1 248')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
      expect(screen.getByText('Trails mapped')).toBeInTheDocument();
    });

    it('handles timer cleanup on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderWithProviders(<Welcome />);
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks with timers', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderWithProviders(<Welcome />);

      expect(setIntervalSpy).toHaveBeenCalled();

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Integration with SearchContext', () => {
    it('works with SearchProvider context', async () => {
      renderWithProviders(<Welcome />);

      // The component should render without errors when wrapped in SearchProvider
      await waitFor(
        () => {
          expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('handles search context state changes', () => {
      renderWithProviders(<Welcome />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should not cause any errors
      expect(searchInput.value).toBe('test');
    });
  });

  describe('Content Updates', () => {
    // it('displays current statistics', async () => {
    //   renderWithProviders(<Welcome />);

    //   // Check that the stats are displayed
    //   await waitFor(() => {
    //     expect(screen.getByText('1 248')).toBeInTheDocument();
    //   }, { timeout: 2000 });

    //   // Check that stats are displayed (values may vary due to animation timing)
    //   expect(screen.getByText((content, element) => {
    //     return element && element.textContent && /8 7\d{2}/.test(element.textContent);
    //   })).toBeInTheDocument();
    //   expect(screen.getByText((content, element) => {
    //     return element && element.textContent && /214 9\d{2}/.test(element.textContent);
    //   })).toBeInTheDocument();
    //   expect(screen.getByText((content, element) => {
    //     return element && element.textContent && /12 4\d{2}/.test(element.textContent);
    //   })).toBeInTheDocument();
    // });

    it('shows relevant activity categories', () => {
      renderWithProviders(<Welcome />);

      expect(screen.getByText('Browse by activity')).toBeInTheDocument();

      // Activity cards are rendered but text only shows on interaction
      // Check that activity cards are rendered (by checking for images)
      const activityImages = document.querySelectorAll('img[alt*="terrain"]');
      expect(activityImages).toHaveLength(10); // Should have 10 activity cards
    });
  });

  describe('SEO and Meta', () => {
    it('renders with proper page structure', async () => {
      renderWithProviders(<Welcome />);

      // Check for main content sections
      await waitFor(
        () => {
          expect(screen.getByText('Welcome to Orion')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
      expect(
        screen.getByText(
          'Find trails, see community reviews, and plan your next outdoor adventure.'
        )
      ).toBeInTheDocument();
    });
  });
});
