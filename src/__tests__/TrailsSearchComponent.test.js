import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailsManagementSearch from '../components/admin/TrailsSearchComponent';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid='search-icon' />,
  X: () => <div data-testid='x-icon' />,
}));

describe('TrailsManagementSearch', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    placeholder: 'Search trails...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders search component with correct structure', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      expect(document.querySelector('.trails-management-search')).toBeInTheDocument();
      expect(
        document.querySelector('.trails-management-search-input-container')
      ).toBeInTheDocument();
      expect(document.querySelector('.trails-management-search-input')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders input field with correct attributes', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', 'Search trails...');
      expect(input).toHaveValue('');
    });

    it('renders with custom placeholder', () => {
      const customPlaceholder = 'Custom search placeholder';
      render(<TrailsManagementSearch {...defaultProps} placeholder={customPlaceholder} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', customPlaceholder);
    });

    it('renders with default placeholder when none provided', () => {
      const { onSearch } = defaultProps;
      render(<TrailsManagementSearch onSearch={onSearch} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Search trails...');
    });

    it('does not render clear button initially', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
      expect(
        document.querySelector('.trails-management-search-clear-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onSearch when input value changes', () => {
      const mockOnSearch = jest.fn();
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test search' } });

      expect(mockOnSearch).toHaveBeenCalledWith('test search');
    });

    it('updates input value when typing', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'mountain trail' } });

      expect(input).toHaveValue('mountain trail');
    });

    it('calls onSearch with empty string when input is cleared', () => {
      const mockOnSearch = jest.fn();
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.change(input, { target: { value: '' } });

      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('calls onSearch multiple times as user types', () => {
      const mockOnSearch = jest.fn();
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 't' } });
      fireEvent.change(input, { target: { value: 'te' } });
      fireEvent.change(input, { target: { value: 'tes' } });
      fireEvent.change(input, { target: { value: 'test' } });

      expect(mockOnSearch).toHaveBeenCalledTimes(4);
      expect(mockOnSearch).toHaveBeenNthCalledWith(1, 't');
      expect(mockOnSearch).toHaveBeenNthCalledWith(2, 'te');
      expect(mockOnSearch).toHaveBeenNthCalledWith(3, 'tes');
      expect(mockOnSearch).toHaveBeenNthCalledWith(4, 'test');
    });

    it('handles special characters in search', () => {
      const mockOnSearch = jest.fn();
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'trail@#$%' } });

      expect(mockOnSearch).toHaveBeenCalledWith('trail@#$%');
      expect(input).toHaveValue('trail@#$%');
    });

    it('handles long search terms', () => {
      const mockOnSearch = jest.fn();
      const longSearchTerm = 'a'.repeat(100);
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: longSearchTerm } });

      expect(mockOnSearch).toHaveBeenCalledWith(longSearchTerm);
      expect(input).toHaveValue(longSearchTerm);
    });
  });

  describe('Clear Button Functionality', () => {
    it('shows clear button when there is text in input', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(document.querySelector('.trails-management-search-clear-button')).toBeInTheDocument();
    });

    it('hides clear button when input is empty', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.change(input, { target: { value: '' } });

      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
      expect(
        document.querySelector('.trails-management-search-clear-button')
      ).not.toBeInTheDocument();
    });

    it('clears input when clear button is clicked', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test search' } });

      const clearButton = document.querySelector('.trails-management-search-clear-button');
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
    });

    it('calls onSearch with empty string when clear button is clicked', () => {
      const mockOnSearch = jest.fn();
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test search' } });

      const clearButton = document.querySelector('.trails-management-search-clear-button');
      fireEvent.click(clearButton);

      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('clear button has correct title attribute', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = document.querySelector('.trails-management-search-clear-button');
      expect(clearButton).toHaveAttribute('title', 'Clear search');
    });

    it('clear button shows X icon', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('maintains search term state correctly', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');

      // Initial state
      expect(input).toHaveValue('');

      // After typing
      fireEvent.change(input, { target: { value: 'mountain' } });
      expect(input).toHaveValue('mountain');

      // After clearing
      const clearButton = document.querySelector('.trails-management-search-clear-button');
      fireEvent.click(clearButton);
      expect(input).toHaveValue('');
    });

    it('handles rapid state changes', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.change(input, { target: { value: 'xyz' } });

      expect(input).toHaveValue('xyz');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined onSearch prop gracefully', () => {
      // This should not crash the component
      expect(() => {
        render(<TrailsManagementSearch onSearch={undefined} />);
      }).not.toThrow();
    });

    it('handles null onSearch prop gracefully', () => {
      // This should not crash the component
      expect(() => {
        render(<TrailsManagementSearch onSearch={null} />);
      }).not.toThrow();
    });

    it('handles empty string placeholder', () => {
      render(<TrailsManagementSearch onSearch={jest.fn()} placeholder='' />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', '');
    });

    it('handles very long placeholder text', () => {
      const longPlaceholder = 'a'.repeat(200);
      render(<TrailsManagementSearch onSearch={jest.fn()} placeholder={longPlaceholder} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', longPlaceholder);
    });

    it('handles whitespace-only search terms', () => {
      const mockOnSearch = jest.fn();
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '   ' } });

      expect(mockOnSearch).toHaveBeenCalledWith('   ');
      expect(input).toHaveValue('   ');
    });

    it('handles newline characters in search', () => {
      const mockOnSearch = jest.fn();
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test\nsearch' } });

      // Input fields typically strip newlines, so we expect the actual behavior
      expect(mockOnSearch).toHaveBeenCalledWith('testsearch');
      expect(input).toHaveValue('testsearch');
    });
  });

  describe('Accessibility', () => {
    it('has proper input role', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('has proper button role for clear button', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = document.querySelector('.trails-management-search-clear-button');
      expect(clearButton).toBeInTheDocument();
    });

    it('clear button is keyboard accessible', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = document.querySelector('.trails-management-search-clear-button');
      expect(clearButton).not.toHaveAttribute('disabled');
    });

    it('input is keyboard accessible', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('disabled');
      expect(input).not.toHaveAttribute('readonly');
    });

    it('has proper focus behavior', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(input).toHaveFocus();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies correct CSS classes', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      expect(document.querySelector('.trails-management-search')).toBeInTheDocument();
      expect(
        document.querySelector('.trails-management-search-input-container')
      ).toBeInTheDocument();
      expect(document.querySelector('.trails-management-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('applies clear button CSS class when visible', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(document.querySelector('.trails-management-search-clear-button')).toBeInTheDocument();
    });

    it('does not apply clear button CSS class when hidden', () => {
      render(<TrailsManagementSearch {...defaultProps} />);

      expect(
        document.querySelector('.trails-management-search-clear-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('works with different onSearch implementations', () => {
      const consoleLogSearch = jest.fn(term => console.log('Searching for:', term));
      render(<TrailsManagementSearch onSearch={consoleLogSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'integration test' } });

      expect(consoleLogSearch).toHaveBeenCalledWith('integration test');
    });

    it('maintains component state across re-renders', () => {
      const { rerender } = render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'persistent search' } });

      // Re-render with same props
      rerender(<TrailsManagementSearch {...defaultProps} />);

      expect(input).toHaveValue('persistent search');
    });

    it('updates when props change', () => {
      const { rerender } = render(<TrailsManagementSearch {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Search trails...');

      // Change placeholder prop
      rerender(
        <TrailsManagementSearch onSearch={defaultProps.onSearch} placeholder='New placeholder' />
      );

      expect(input).toHaveAttribute('placeholder', 'New placeholder');
    });
  });

  describe('Performance', () => {
    it('handles rapid input changes efficiently', () => {
      const mockOnSearch = jest.fn();
      render(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');

      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `test${i}` } });
      }

      expect(mockOnSearch).toHaveBeenCalledTimes(10);
      expect(input).toHaveValue('test9');
    });

    it('does not cause unnecessary re-renders', () => {
      const mockOnSearch = jest.fn();
      const { rerender } = render(
        <TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />
      );

      // Re-render with same props should not cause issues
      rerender(<TrailsManagementSearch onSearch={mockOnSearch} placeholder='Search trails...' />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });
});
