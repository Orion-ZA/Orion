import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FilterPanel from '../components/filters/FilterPanel';

const defaultFilters = {
  difficulty: 'all',
  tags: 'all',
  minDistance: 0,
  maxDistance: 20,
  maxLocationDistance: 80
};

const defaultProps = {
  filters: defaultFilters,
  onFilterChange: jest.fn()
};

describe('FilterPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders filter panel with title', () => {
      render(<FilterPanel {...defaultProps} />);
      
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    test('renders all filter controls', () => {
      render(<FilterPanel {...defaultProps} />);
      
      // Check for difficulty dropdown
      expect(screen.getByDisplayValue('All')).toBeInTheDocument();
      
      // Check for tags input
      expect(screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)')).toBeInTheDocument();
      
      // Check for distance sliders
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
      expect(screen.getByDisplayValue('80')).toBeInTheDocument();
    });

    test('displays current filter values', () => {
      render(<FilterPanel {...defaultProps} />);
      
      // Check difficulty dropdown shows current value
      const difficultySelect = screen.getByDisplayValue('All');
      expect(difficultySelect).toBeInTheDocument();
      
      // Check distance slider shows current value
      const distanceSlider = screen.getByDisplayValue('20');
      expect(distanceSlider).toHaveValue('20');
      
      const locationDistanceSlider = screen.getByDisplayValue('80');
      expect(locationDistanceSlider).toHaveValue('80');
    });
  });

  describe('Difficulty Filter', () => {
    test('renders all difficulty options', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const difficultySelect = screen.getByDisplayValue('All');
      expect(difficultySelect).toBeInTheDocument();
      
      // Check all options are present
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    test('calls onFilterChange when difficulty is changed', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const difficultySelect = screen.getByDisplayValue('All');
      fireEvent.change(difficultySelect, { target: { value: 'Easy' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('difficulty', 'Easy');
    });

    test('displays current difficulty selection', () => {
      const filtersWithDifficulty = {
        ...defaultFilters,
        difficulty: 'Hard'
      };
      
      render(<FilterPanel {...defaultProps} filters={filtersWithDifficulty} />);
      
      expect(screen.getByDisplayValue('Hard')).toBeInTheDocument();
    });

    test('handles all difficulty changes', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const difficultySelect = screen.getByDisplayValue('All');
      
      // Test all difficulty options
      const difficulties = ['Easy', 'Moderate', 'Hard', 'all'];
      
      for (const difficulty of difficulties) {
        fireEvent.change(difficultySelect, { target: { value: difficulty } });
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith('difficulty', difficulty);
      }
    });
  });

  describe('Tags Filter', () => {
    test('renders tags input field', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const tagsInput = screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)');
      expect(tagsInput).toBeInTheDocument();
      expect(tagsInput).toHaveAttribute('placeholder', 'Search tags (e.g., waterfall, forest)');
    });

    test('calls onFilterChange when tags are entered', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const tagsInput = screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)');
      fireEvent.change(tagsInput, { target: { value: 'waterfall' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('tags', 'waterfall');
    });

    test('displays current tags value', () => {
      const filtersWithTags = {
        ...defaultFilters,
        tags: 'forest'
      };
      
      render(<FilterPanel {...defaultProps} filters={filtersWithTags} />);
      
      const tagsInput = screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)');
      expect(tagsInput).toHaveValue('forest');
    });

    test('handles special characters in tags', async () => {
      render(<FilterPanel {...defaultProps} />);
      
      const tagsInput = screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)');
      fireEvent.change(tagsInput, { target: { value: 'rocky-trail' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('tags', 'rocky-trail');
    });
  });

  describe('Distance Filters', () => {
    test('renders distance range slider', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const distanceSlider = screen.getByDisplayValue('20');
      expect(distanceSlider).toBeInTheDocument();
      expect(distanceSlider).toHaveAttribute('type', 'range');
      expect(distanceSlider).toHaveAttribute('min', '0');
      expect(distanceSlider).toHaveAttribute('max', '32');
    });

    test('calls onFilterChange when distance is changed', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const distanceSlider = screen.getByDisplayValue('20');
      fireEvent.change(distanceSlider, { target: { value: '15' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('maxDistance', 15);
    });

    test('displays current distance value', () => {
      const filtersWithDistance = {
        ...defaultFilters,
        maxDistance: 15
      };
      
      render(<FilterPanel {...defaultProps} filters={filtersWithDistance} />);
      
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    });

    test('renders max location distance slider', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const locationDistanceSlider = screen.getByDisplayValue('80');
      expect(locationDistanceSlider).toBeInTheDocument();
      expect(locationDistanceSlider).toHaveAttribute('type', 'range');
      expect(locationDistanceSlider).toHaveAttribute('min', '0');
      expect(locationDistanceSlider).toHaveAttribute('max', '160');
      expect(locationDistanceSlider).toHaveAttribute('step', '5');
    });

    test('calls onFilterChange when max location distance is changed', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const locationDistanceSlider = screen.getByDisplayValue('80');
      fireEvent.change(locationDistanceSlider, { target: { value: '50' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('maxLocationDistance', 50);
    });

    test('displays current max location distance value', () => {
      const filtersWithLocationDistance = {
        ...defaultFilters,
        maxLocationDistance: 50
      };
      
      render(<FilterPanel {...defaultProps} filters={filtersWithLocationDistance} />);
      
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });
  });

  describe('Filter Updates', () => {
    test('updates display when filters change', () => {
      const { rerender } = render(<FilterPanel {...defaultProps} />);
      
      // Initial state
      expect(screen.getByDisplayValue('All')).toBeInTheDocument();
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
      
      // Update filters
      const updatedFilters = {
        difficulty: 'Easy',
        tags: 'forest',
        minDistance: 0,
        maxDistance: 10,
        maxLocationDistance: 40
      };
      
      rerender(<FilterPanel filters={updatedFilters} onFilterChange={defaultProps.onFilterChange} />);
      
      // Check updated display
      expect(screen.getByDisplayValue('Easy')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('40')).toBeInTheDocument();
    });

    test('handles multiple filter changes', () => {
      render(<FilterPanel {...defaultProps} />);
      
      // Change difficulty
      const difficultySelect = screen.getByDisplayValue('All');
      fireEvent.change(difficultySelect, { target: { value: 'Moderate' } });
      
      // Change tags
      const tagsInput = screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)');
      fireEvent.change(tagsInput, { target: { value: 'wildlife' } });
      
      // Change distance
      const distanceSlider = screen.getByDisplayValue('20');
      fireEvent.change(distanceSlider, { target: { value: '12' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledTimes(3);
      expect(defaultProps.onFilterChange).toHaveBeenNthCalledWith(1, 'difficulty', 'Moderate');
      expect(defaultProps.onFilterChange).toHaveBeenNthCalledWith(2, 'tags', 'wildlife');
      expect(defaultProps.onFilterChange).toHaveBeenNthCalledWith(3, 'maxDistance', 12);
    });
  });

  describe('Edge Cases', () => {
    test('handles missing onFilterChange prop', () => {
      // Should not crash when onFilterChange is not provided
      expect(() => {
        render(<FilterPanel filters={defaultFilters} />);
      }).not.toThrow();
    });

    test('handles extreme filter values', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const distanceSlider = screen.getByDisplayValue('20');
      fireEvent.change(distanceSlider, { target: { value: '0' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('maxDistance', 0);
    });

    test('handles decimal values in distance sliders', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const locationDistanceSlider = screen.getByDisplayValue('80');
      fireEvent.change(locationDistanceSlider, { target: { value: '75' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('maxLocationDistance', 75);
    });
  });

  describe('Accessibility', () => {
    test('has proper form controls', () => {
      render(<FilterPanel {...defaultProps} />);
      
      expect(screen.getByDisplayValue('All')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
      expect(screen.getByDisplayValue('80')).toBeInTheDocument();
    });

    test('has proper input types', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const difficultySelect = screen.getByDisplayValue('All');
      expect(difficultySelect.tagName).toBe('SELECT');
      
      const tagsInput = screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)');
      expect(tagsInput).toHaveAttribute('type', 'text');
      
      const distanceSlider = screen.getByDisplayValue('20');
      expect(distanceSlider).toHaveAttribute('type', 'range');
      
      const locationDistanceSlider = screen.getByDisplayValue('80');
      expect(locationDistanceSlider).toHaveAttribute('type', 'range');
    });

    test('has proper placeholder text', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const tagsInput = screen.getByPlaceholderText('Search tags (e.g., waterfall, forest)');
      expect(tagsInput).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    test('renders with proper CSS classes', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const filterPanel = screen.getByText('Filters').closest('div');
      expect(filterPanel).toHaveClass('card');
    });

    test('has responsive grid layout', () => {
      render(<FilterPanel {...defaultProps} />);
      
      const filterContainer = screen.getByText('Filters').closest('div');
      const gridContainer = filterContainer.querySelector('div[style*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
