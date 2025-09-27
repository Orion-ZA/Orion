import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MyTrailsFilter from '../components/MyTrailsFilter';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: (props) => <svg data-testid="search-icon" {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
  ArrowUp: (props) => <svg data-testid="arrow-up-icon" {...props} />,
  ArrowDown: (props) => <svg data-testid="arrow-down-icon" {...props} />,
}));

describe('MyTrailsFilter', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    filters: {
      difficulty: 'all',
      minDistance: 0,
      maxDistance: 50,
      status: 'all'
    },
    onFilterChange: jest.fn(),
    onClearFilters: jest.fn(),
    sorting: {
      sortBy: 'name',
      sortOrder: 'asc'
    },
    onSortChange: jest.fn(),
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
      expect(screen.getByText('Distance: 0 - 50 km')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
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

  describe('Sorting Functionality', () => {
    it('renders sort by dropdown with correct options', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const sortBySelect = screen.getByDisplayValue('Sort by Name');
      expect(sortBySelect).toBeInTheDocument();
      
      const options = Array.from(sortBySelect.options).map(option => option.value);
      expect(options).toEqual(['name', 'distance', 'difficulty']);
    });

    it('renders date option for submitted tab', () => {
      render(<MyTrailsFilter {...defaultProps} activeTab="submitted" />);
      
      const sortBySelect = screen.getByDisplayValue('Sort by Name');
      const options = Array.from(sortBySelect.options).map(option => option.value);
      expect(options).toEqual(['name', 'distance', 'difficulty', 'date']);
    });

    it('calls onSortChange when sort by is changed', () => {
      const onSortChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} onSortChange={onSortChange} />);
      
      const sortBySelect = screen.getByDisplayValue('Sort by Name');
      fireEvent.change(sortBySelect, { target: { value: 'distance' } });
      
      expect(onSortChange).toHaveBeenCalledWith('distance', 'asc');
    });

    it('renders sort order toggle button', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const sortOrderButton = screen.getByRole('button', { name: /Sort (Ascending|Descending)/ });
      expect(sortOrderButton).toBeInTheDocument();
      expect(sortOrderButton).toHaveClass('mytrails-sort-order-button');
    });

    it('shows up arrow for ascending sort', () => {
      render(<MyTrailsFilter {...defaultProps} sorting={{ sortBy: 'name', sortOrder: 'asc' }} />);
      
      expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('arrow-down-icon')).not.toBeInTheDocument();
    });

    it('shows down arrow for descending sort', () => {
      render(<MyTrailsFilter {...defaultProps} sorting={{ sortBy: 'name', sortOrder: 'desc' }} />);
      
      expect(screen.getByTestId('arrow-down-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('arrow-up-icon')).not.toBeInTheDocument();
    });

    it('calls onSortChange when sort order button is clicked', () => {
      const onSortChange = jest.fn();
      render(<MyTrailsFilter {...defaultProps} onSortChange={onSortChange} />);
      
      const sortOrderButton = screen.getByRole('button', { name: /Sort (Ascending|Descending)/ });
      fireEvent.click(sortOrderButton);
      
      expect(onSortChange).toHaveBeenCalledWith('name', 'desc');
    });

    it('toggles sort order correctly', () => {
      const onSortChange = jest.fn();
      const { rerender } = render(<MyTrailsFilter {...defaultProps} onSortChange={onSortChange} />);
      
      // Start with ascending
      const sortOrderButton = screen.getByRole('button', { name: /Sort (Ascending|Descending)/ });
      fireEvent.click(sortOrderButton);
      expect(onSortChange).toHaveBeenCalledWith('name', 'desc');
      
      // Change to descending
      rerender(<MyTrailsFilter {...defaultProps} sorting={{ sortBy: 'name', sortOrder: 'desc' }} onSortChange={onSortChange} />);
      fireEvent.click(sortOrderButton);
      expect(onSortChange).toHaveBeenCalledWith('name', 'asc');
    });
  });

  describe('Show All Checkbox Functionality', () => {
    it('renders show all checkbox', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const showAllCheckbox = screen.getByRole('checkbox');
      expect(showAllCheckbox).toBeInTheDocument();
      expect(showAllCheckbox).toBeChecked();
    });

    it('calls clearAllFilters when show all checkbox is checked', () => {
      const onSearchChange = jest.fn();
      const onClearFilters = jest.fn();
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" onSearchChange={onSearchChange} onClearFilters={onClearFilters} />);
      
      const showAllCheckbox = screen.getByRole('checkbox');
      
      // Uncheck first, then check to trigger the clearAllFilters call
      fireEvent.click(showAllCheckbox);
      fireEvent.click(showAllCheckbox);
      
      expect(onSearchChange).toHaveBeenCalledWith('');
      expect(onClearFilters).toHaveBeenCalledTimes(1); // Called once when checking the box
    });

    it('does not call clearAllFilters when show all checkbox is unchecked', () => {
      const onSearchChange = jest.fn();
      const onClearFilters = jest.fn();
      render(<MyTrailsFilter {...defaultProps} onSearchChange={onSearchChange} onClearFilters={onClearFilters} />);
      
      const showAllCheckbox = screen.getByRole('checkbox');
      
      // Uncheck the checkbox
      fireEvent.click(showAllCheckbox);
      
      // Should not call clearAllFilters when unchecking
      expect(onClearFilters).not.toHaveBeenCalled();
    });

    it('updates checkbox state when filters change', () => {
      const { rerender } = render(<MyTrailsFilter {...defaultProps} />);
      
      let showAllCheckbox = screen.getByRole('checkbox');
      expect(showAllCheckbox).toBeChecked();
      
      // Add a filter
      rerender(<MyTrailsFilter {...defaultProps} searchQuery="test" />);
      showAllCheckbox = screen.getByRole('checkbox');
      expect(showAllCheckbox).not.toBeChecked();
      
      // Remove the filter
      rerender(<MyTrailsFilter {...defaultProps} searchQuery="" />);
      showAllCheckbox = screen.getByRole('checkbox');
      expect(showAllCheckbox).toBeChecked();
    });
  });

  describe('Clear Filters Functionality', () => {
    it('shows clear filters button when filters are active', () => {
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" />);
      
      const clearFiltersButton = screen.getByText('Clear Filters');
      expect(clearFiltersButton).toHaveClass('visible');
      expect(clearFiltersButton).not.toBeDisabled();
    });

    it('hides clear filters button when no filters are active', () => {
      render(<MyTrailsFilter {...defaultProps} />);
      
      const clearFiltersButton = screen.getByText('Clear Filters');
      expect(clearFiltersButton).toHaveClass('hidden');
      expect(clearFiltersButton).toBeDisabled();
    });

    it('calls onSearchChange and onClearFilters when clear filters is clicked', () => {
      const onSearchChange = jest.fn();
      const onClearFilters = jest.fn();
      render(<MyTrailsFilter {...defaultProps} searchQuery="test" onSearchChange={onSearchChange} onClearFilters={onClearFilters} />);
      
      const clearFiltersButton = screen.getByText('Clear Filters');
      fireEvent.click(clearFiltersButton);
      
      expect(onSearchChange).toHaveBeenCalledWith('');
      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('detects active filters correctly', () => {
      const { rerender } = render(<MyTrailsFilter {...defaultProps} />);
      expect(screen.getByText('Clear Filters')).toHaveClass('hidden');
      
      // Test search query
      rerender(<MyTrailsFilter {...defaultProps} searchQuery="test" />);
      expect(screen.getByText('Clear Filters')).toHaveClass('visible');
      
      // Test difficulty filter
      rerender(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, difficulty: 'Easy' }} />);
      expect(screen.getByText('Clear Filters')).toHaveClass('visible');
      
      // Test distance filter
      rerender(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, minDistance: 5 }} />);
      expect(screen.getByText('Clear Filters')).toHaveClass('visible');
      
      // Test max distance filter
      rerender(<MyTrailsFilter {...defaultProps} filters={{ ...defaultProps.filters, maxDistance: 30 }} />);
      expect(screen.getByText('Clear Filters')).toHaveClass('visible');
      
      // Test status filter (for submitted tab)
      rerender(<MyTrailsFilter {...defaultProps} activeTab="submitted" filters={{ ...defaultProps.filters, status: 'open' }} />);
      expect(screen.getByText('Clear Filters')).toHaveClass('visible');
    });
  });


  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      expect(() => {
        render(
          <MyTrailsFilter
            searchQuery=""
            filters={defaultProps.filters}
            sorting={defaultProps.sorting}
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
      expect(screen.getByRole('button', { name: /Sort (Ascending|Descending)/ })).toBeInTheDocument();
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
      
      // Clear filters should be enabled
      expect(screen.getByText('Clear Filters')).toHaveClass('visible');
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
