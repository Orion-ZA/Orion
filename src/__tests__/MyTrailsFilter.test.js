import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MyTrailsFilter from '../components/MyTrailsFilter';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: (props) => <svg data-testid="search-icon" {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
}));

describe('MyTrailsFilter', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    filters: {
      difficulty: 'all',
      minDistance: 0,
      maxDistance: 20,
      status: 'all'
    },
    onFilterChange: jest.fn(),
    onClearFilters: jest.fn(),
    activeTab: 'favorites'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all basic elements', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search favorites...')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Difficulties')).toBeInTheDocument();
      expect(screen.getByText('Distance: 0 - 20 km')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('renders with correct CSS classes', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      expect(document.querySelector('.mytrails-filter-container')).toBeInTheDocument();
      expect(document.querySelector('.mytrails-filters-row')).toBeInTheDocument();
      expect(document.querySelector('.mytrails-search-input-wrapper')).toBeInTheDocument();
      expect(document.querySelector('.mytrails-inline-filters')).toBeInTheDocument();
    });

    it('updates placeholder text based on activeTab', () => {
      const { rerender } = render(<MyTrailsFilter {...defaultProps} activeTab="favorites" />);
      expect(screen.getByPlaceholderText('Search favorites...')).toBeInTheDocument();
      
      rerender(<MyTrailsFilter {...defaultProps} activeTab="submitted" />);
      expect(screen.getByPlaceholderText('Search submitted...')).toBeInTheDocument();
      
      rerender(<MyTrailsFilter {...defaultProps} activeTab="completed" />);
      expect(screen.getByPlaceholderText('Search completed...')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('displays search query in input', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="test search" />);
      
      expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
    });

    it('calls onSearchChange when typing in search input', () => {
      const onSearchChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} onSearchChange={onSearchChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search favorites...');
      fireEvent.change(searchInput, { target: { value: 'new search' } });
      
      expect(onSearchChange).toHaveBeenCalledWith('new search');
    });

    it('shows clear search button when search query exists', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" />);
      
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });

    it('hides clear search button when search query is empty', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="" />);
      
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    });

    it('calls onSearchChange with empty string when clear search is clicked', () => {
      const onSearchChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" onSearchChange={onSearchChange} />);
      
      const clearButton = screen.getByRole('button', { name: 'Clear search' });
      fireEvent.click(clearButton);
      
      expect(onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Difficulty Filter', () => {
    it('displays current difficulty selection', () => {
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, difficulty: 'Moderate' }} />);
      
      expect(screen.getByDisplayValue('Moderate')).toBeInTheDocument();
    });

    it('calls onFilterChange when difficulty is changed', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} onFilterChange={onFilterChange} />);
      
      const difficultySelect = screen.getByDisplayValue('All Difficulties');
      fireEvent.change(difficultySelect, { target: { value: 'Hard' } });
      
      expect(onFilterChange).toHaveBeenCalledWith('difficulty', 'Hard');
    });

    it('renders all difficulty options', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const difficultySelect = screen.getByDisplayValue('All Difficulties');
      expect(difficultySelect).toBeInTheDocument();
      
      const options = Array.from(difficultySelect.options).map(option => option.value);
      expect(options).toEqual(['all', 'Easy', 'Moderate', 'Hard']);
    });
  });

  describe('Distance Range Slider', () => {
    it('displays current distance range', () => {
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, minDistance: 5, maxDistance: 15 }} />);
      
      expect(screen.getByText('Distance: 5 - 15 km')).toBeInTheDocument();
    });

    it('renders both min and max distance sliders', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2);
      
      expect(sliders[0]).toHaveAttribute('class', 'distance-slider distance-slider-min');
      expect(sliders[1]).toHaveAttribute('class', 'distance-slider distance-slider-max');
    });

    it('calls onFilterChange when min distance slider is changed', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} onFilterChange={onFilterChange} />);
      
      const minSlider = screen.getAllByRole('slider')[0];
      fireEvent.change(minSlider, { target: { value: '5' } });
      
      expect(onFilterChange).toHaveBeenCalledWith('minDistance', 5);
    });

    it('calls onFilterChange when max distance slider is changed', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} onFilterChange={onFilterChange} />);
      
      const maxSlider = screen.getAllByRole('slider')[1];
      fireEvent.change(maxSlider, { target: { value: '25' } });
      
      expect(onFilterChange).toHaveBeenCalledWith('maxDistance', 25);
    });

    it('prevents min distance from exceeding max distance', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, maxDistance: 10 }} onFilterChange={onFilterChange} />);
      
      const minSlider = screen.getAllByRole('slider')[0];
      fireEvent.change(minSlider, { target: { value: '15' } }); // 15 > 10 (max)
      
      expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('prevents max distance from going below min distance', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, minDistance: 10 }} onFilterChange={onFilterChange} />);
      
      const maxSlider = screen.getAllByRole('slider')[1];
      fireEvent.change(maxSlider, { target: { value: '5' } }); // 5 < 10 (min)
      
      expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('has correct slider attributes', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const sliders = screen.getAllByRole('slider');
      sliders.forEach(slider => {
        expect(slider).toHaveAttribute('min', '0');
        expect(slider).toHaveAttribute('max', '50');
        expect(slider).toHaveAttribute('step', '0.5');
      });
    });
  });

  describe('Status Filter', () => {
    it('shows status filter only for submitted tab', () => {
      const { rerender } = render(<MyTrailsFilter {...defaultProps} activeTab="favorites" />);
      expect(screen.queryByDisplayValue('All Status')).not.toBeInTheDocument();
      
      rerender(<MyTrailsFilter {...defaultProps} activeTab="submitted" />);
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
    });

    it('displays current status selection', () => {
      render(<MyTrailsFilter {...defaultProps} activeTab="submitted" filters={{ ...defaultProps.filters, status: 'open' }} />);
      
      expect(screen.getByDisplayValue('Open')).toBeInTheDocument();
    });

    it('calls onFilterChange when status is changed', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} activeTab="submitted" onFilterChange={onFilterChange} />);
      
      const statusSelect = screen.getByDisplayValue('All Status');
      fireEvent.change(statusSelect, { target: { value: 'closed' } });
      
      expect(onFilterChange).toHaveBeenCalledWith('status', 'closed');
    });

    it('renders all status options for submitted tab', () => {
      render(<MyTrailsFilter {...defaultProps} activeTab="submitted" />);
      
      const statusSelect = screen.getByDisplayValue('All Status');
      const options = Array.from(statusSelect.options).map(option => option.value);
      expect(options).toEqual(['all', 'open', 'closed']);
    });
  });

  describe('Clear All Functionality', () => {
    it('shows clear all button when filters are active', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" />);
      
      const clearAllButton = screen.getByText('Clear All');
      expect(clearAllButton).toHaveClass('visible');
      expect(clearAllButton).not.toBeDisabled();
    });

    it('hides clear all button when no filters are active', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const clearAllButton = screen.getByText('Clear All');
      expect(clearAllButton).toHaveClass('hidden');
      expect(clearAllButton).toBeDisabled();
    });

    it('calls onSearchChange and onClearFilters when clear all is clicked', () => {
      const onSearchChange = jest.fn();
      const onClearFilters = jest.fn();
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" onSearchChange={onSearchChange} onClearFilters={onClearFilters} />);
      
      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);
      
      expect(onSearchChange).toHaveBeenCalledWith('');
      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('detects active filters correctly', () => {
      const { rerender } = render(<MyTrailsFilter {...defaultProps} />);
      expect(screen.getByText('Clear All')).toHaveClass('hidden');
      
      // Test search query
      rerender(<MyTrailsFilter {...defaultProps} searchQuery="test" />);
      expect(screen.getByText('Clear All')).toHaveClass('visible');
      
      // Test difficulty filter
      rerender(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, difficulty: 'Easy' }} />);
      expect(screen.getByText('Clear All')).toHaveClass('visible');
      
      // Test distance filter
      rerender(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, minDistance: 5 }} />);
      expect(screen.getByText('Clear All')).toHaveClass('visible');
      
      // Test max distance filter
      rerender(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, maxDistance: 30 }} />);
      expect(screen.getByText('Clear All')).toHaveClass('visible');
      
      // Test status filter (for submitted tab)
      rerender(<MyTrailsFilter {...defaultProps} activeTab="submitted" filters={{ ...defaultProps.filters, status: 'open' }} />);
      expect(screen.getByText('Clear All')).toHaveClass('visible');
    });
  });

  describe('Active Filters Display', () => {
    it('shows active filters section when filters are active', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" />);
      
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(document.querySelector('.mytrails-active-filters')).toBeInTheDocument();
    });

    it('hides active filters section when no filters are active', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
      expect(document.querySelector('.mytrails-active-filters')).not.toBeInTheDocument();
    });

    it('displays search filter tag', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="hiking trail" />);
      
      expect(screen.getByText('Search: "hiking trail"')).toBeInTheDocument();
    });

    it('displays difficulty filter tag', () => {
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, difficulty: 'Hard' }} />);
      
      expect(screen.getByText('Difficulty: Hard')).toBeInTheDocument();
    });

    it('displays distance filter tag', () => {
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, minDistance: 5, maxDistance: 15 }} />);
      
      expect(screen.getByText('Distance: 5-15km')).toBeInTheDocument();
    });

    it('displays status filter tag for submitted tab', () => {
      render(<MyTrailsFilter {...defaultProps} activeTab="submitted" filters={{ ...defaultProps.filters, status: 'closed' }} />);
      
      expect(screen.getByText('Status: closed')).toBeInTheDocument();
    });

    it('calls onSearchChange when search filter tag is removed', () => {
      const onSearchChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" onSearchChange={onSearchChange} />);
      
      const searchTag = screen.getByText('Search: "test"');
      const removeButton = searchTag.querySelector('button');
      fireEvent.click(removeButton);
      
      expect(onSearchChange).toHaveBeenCalledWith('');
    });

    it('calls onFilterChange when difficulty filter tag is removed', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, difficulty: 'Easy' }} onFilterChange={onFilterChange} />);
      
      const difficultyTag = screen.getByText('Difficulty: Easy');
      const removeButton = difficultyTag.querySelector('button');
      fireEvent.click(removeButton);
      
      expect(onFilterChange).toHaveBeenCalledWith('difficulty', 'all');
    });

    it('calls onFilterChange when distance filter tag is removed', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, minDistance: 5, maxDistance: 15 }} onFilterChange={onFilterChange} />);
      
      const distanceTag = screen.getByText('Distance: 5-15km');
      const removeButton = distanceTag.querySelector('button');
      fireEvent.click(removeButton);
      
      expect(onFilterChange).toHaveBeenCalledWith('minDistance', 0);
      expect(onFilterChange).toHaveBeenCalledWith('maxDistance', 20);
    });

    it('calls onFilterChange when status filter tag is removed', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} activeTab="submitted" filters={{ ...defaultProps.filters, status: 'open' }} onFilterChange={onFilterChange} />);
      
      const statusTag = screen.getByText('Status: open');
      const removeButton = statusTag.querySelector('button');
      fireEvent.click(removeButton);
      
      expect(onFilterChange).toHaveBeenCalledWith('status', 'all');
    });

    it('displays multiple active filter tags', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" filters={{ ...defaultProps.filters, difficulty: 'Moderate', minDistance: 5 }} />);
      
      expect(screen.getByText('Search: "test"')).toBeInTheDocument();
      expect(screen.getByText('Difficulty: Moderate')).toBeInTheDocument();
      expect(screen.getByText('Distance: 5-20km')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      expect(() => {
        render(
          <MyTrailsFilter
            searchQuery=""
            filters={defaultProps.filters}
            activeTab="favorites"
          />
        );
      }).not.toThrow();
    });

    it('handles undefined search query', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery={undefined} />);
      
      expect(screen.getByPlaceholderText('Search favorites...')).toHaveValue('');
    });

    it('handles null search query', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery={null} />);
      
      // React will convert null to empty string for input value
      expect(screen.getByPlaceholderText('Search favorites...')).toHaveValue('');
    });

    it('handles missing filter properties', () => {
      const incompleteFilters = { difficulty: 'all' };
      render(<MyTrailsFilter {...defaultProps} filters={incompleteFilters} />);
      
      // Should not throw and should render with default values
      expect(screen.getByDisplayValue('All Difficulties')).toBeInTheDocument();
    });

    it('handles extreme distance values', () => {
      render(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, minDistance: 0, maxDistance: 50 }} />);
      
      expect(screen.getByText('Distance: 0 - 50 km')).toBeInTheDocument();
    });

    it('handles invalid activeTab values', () => {
      render(<MyTrailsFilter {...defaultProps} activeTab="invalid" />);
      
      expect(screen.getByPlaceholderText('Search invalid...')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('All Status')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and inputs', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search favorites...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Difficulties')).toBeInTheDocument();
    });

    it('has proper button elements with aria labels', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" />);
      
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument();
    });

    it('has proper slider elements with correct attributes', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2);
      sliders.forEach(slider => {
        expect(slider).toHaveAttribute('min');
        expect(slider).toHaveAttribute('max');
        expect(slider).toHaveAttribute('step');
      });
    });

    it('has proper select elements', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  describe('Component Integration', () => {
    it('works with all filter types active simultaneously', () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();
      
      render(
        <MyTrailsFilter
          {...defaultProps}
          searchQuery="mountain"
          filters={{
            difficulty: 'Hard',
            minDistance: 10,
            maxDistance: 30,
            status: 'open'
          }}
          activeTab="submitted"
          onSearchChange={onSearchChange}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />
      );
      
      // All elements should be visible
      expect(screen.getByDisplayValue('mountain')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hard')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Open')).toBeInTheDocument();
      expect(screen.getByText('Distance: 10 - 30 km')).toBeInTheDocument();
      
      // Active filters should be displayed
      expect(screen.getByText('Search: "mountain"')).toBeInTheDocument();
      expect(screen.getByText('Difficulty: Hard')).toBeInTheDocument();
      expect(screen.getByText('Distance: 10-30km')).toBeInTheDocument();
      expect(screen.getByText('Status: open')).toBeInTheDocument();
      
      // Clear all should be enabled
      expect(screen.getByText('Clear All')).toHaveClass('visible');
    });

    it('handles rapid filter changes', () => {
      const onFilterChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} onFilterChange={onFilterChange} />);
      
      const difficultySelect = screen.getByDisplayValue('All Difficulties');
      
      // Rapid changes
      fireEvent.change(difficultySelect, { target: { value: 'Easy' } });
      fireEvent.change(difficultySelect, { target: { value: 'Moderate' } });
      fireEvent.change(difficultySelect, { target: { value: 'Hard' } });
      
      expect(onFilterChange).toHaveBeenCalledTimes(3);
      expect(onFilterChange).toHaveBeenNthCalledWith(1, 'difficulty', 'Easy');
      expect(onFilterChange).toHaveBeenNthCalledWith(2, 'difficulty', 'Moderate');
      expect(onFilterChange).toHaveBeenNthCalledWith(3, 'difficulty', 'Hard');
    });
  });
});
