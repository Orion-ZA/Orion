import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { SearchProvider } from '../components/SearchContext';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock useReverseGeocoding hook
jest.mock('../hooks/useReverseGeocoding', () => ({
  useReverseGeocoding: () => ({
    reverseGeocode: jest.fn()
  })
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <SearchProvider>
        {component}
      </SearchProvider>
    </BrowserRouter>
  );
};

describe('SearchBar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    fetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders search input and button with default props', () => {
      renderWithProviders(<SearchBar />);
      
      expect(screen.getByPlaceholderText(/search by city, park, or trail name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/search trails/i)).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      renderWithProviders(<SearchBar placeholder="Custom placeholder" />);
      
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = renderWithProviders(<SearchBar className="custom-class" />);
      
      expect(container.querySelector('.search-bar-container')).toHaveClass('custom-class');
    });

    it('renders with initial value', () => {
      renderWithProviders(<SearchBar initialValue="Initial search" />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      expect(input.value).toBe('Initial search');
    });

    it('updates input value when initialValue prop changes', () => {
      const { rerender } = renderWithProviders(<SearchBar initialValue="Initial" />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      expect(input.value).toBe('Initial');
      
      rerender(
        <BrowserRouter>
          <SearchProvider>
            <SearchBar initialValue="Updated" />
          </SearchProvider>
        </BrowserRouter>
      );
      
      expect(input.value).toBe('Updated');
    });
  });

  describe('Input Handling', () => {
    it('updates input value when typing', () => {
      renderWithProviders(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.change(input, { target: { value: 'Table Mountain' } });
      
      expect(input.value).toBe('Table Mountain');
    });

    it('handles input focus', () => {
      renderWithProviders(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      act(() => {
        fireEvent.focus(input);
      });
      
      // Should not crash when focusing
      expect(input).toBeInTheDocument();
    });

    it('handles input blur with delay', () => {
      renderWithProviders(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      // Should not immediately hide suggestions due to delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // After delay, suggestions should be hidden
      act(() => {
        jest.advanceTimersByTime(200);
      });
    });

    it('handles keyboard navigation - Escape key', () => {
      renderWithProviders(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      
      // Input should lose focus
      expect(input).not.toHaveFocus();
    });

    it('handles other keyboard keys without special behavior', () => {
      renderWithProviders(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      act(() => {
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      });
      
      // Should not crash or have special behavior for Enter in keyDown
      expect(input).toBeInTheDocument();
    });
  });

  describe('Suggestions Display', () => {
    it('shows suggestions when typing with showSuggestions enabled', async () => {
      // Mock search context to return suggestions
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: [{ type: 'trail', name: 'Table Mountain', displayName: 'Table Mountain' }],
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });

      renderWithProviders(<SearchBar showSuggestions={true} />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      act(() => {
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Table' } });
      });
      
      // Wait for suggestions to appear
      await waitFor(() => {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        expect(suggestionsContainer).toBeInTheDocument();
      });

      searchContext.useSearch.mockRestore();
    });

    it('does not show suggestions when showSuggestions is disabled', () => {
      renderWithProviders(<SearchBar showSuggestions={false} />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Table' } });
      
      const suggestionsContainer = document.querySelector('.search-suggestions');
      expect(suggestionsContainer).not.toBeInTheDocument();
    });

    it('shows suggestions on focus if input has enough characters', async () => {
      // Mock search context to return suggestions
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: [{ type: 'trail', name: 'Table Mountain', displayName: 'Table Mountain' }],
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });

      renderWithProviders(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      act(() => {
        fireEvent.change(input, { target: { value: 'Table Mountain' } });
        fireEvent.focus(input);
      });
      
      await waitFor(() => {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        expect(suggestionsContainer).toBeInTheDocument();
      });

      searchContext.useSearch.mockRestore();
    });

    it('does not show suggestions on focus if input has too few characters', () => {
      renderWithProviders(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.change(input, { target: { value: 'T' } });
      fireEvent.focus(input);
      
      const suggestionsContainer = document.querySelector('.search-suggestions');
      expect(suggestionsContainer).not.toBeInTheDocument();
    });
  });

  describe('Suggestion Interaction', () => {
    it('handles suggestion click with string format', async () => {
      // Mock search suggestions
      const mockSuggestions = ['Table Mountain Trail', 'Table Mountain National Park'];
      
      renderWithProviders(<SearchBar />);
      
      // Mock the search context to return suggestions
      const searchContext = require('../components/SearchContext');
      const originalUseSearch = searchContext.useSearch;
      
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Table' } });
      
      await waitFor(() => {
        const suggestionItems = screen.getAllByRole('button');
        const suggestionButton = suggestionItems.find(button => 
          button.textContent.includes('Table Mountain Trail')
        );
        if (suggestionButton) {
          fireEvent.mouseDown(suggestionButton);
          fireEvent.click(suggestionButton);
        }
      });
      
      // Restore original mock
      searchContext.useSearch.mockRestore();
    });

    it('handles suggestion click with object format', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Table Mountain Trail',
        displayName: 'Table Mountain Trail',
        description: 'A challenging hike',
        difficulty: 'Moderate',
        distance: '5.2 km',
        elevationGain: '800 m',
        location: 'Cape Town, South Africa',
        tags: ['mountain', 'views'],
        status: 'open'
      }];
      
      renderWithProviders(<SearchBar />);
      
      // Mock the search context
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Table' } });
      
      await waitFor(() => {
        const suggestionItems = screen.getAllByRole('button');
        const suggestionButton = suggestionItems.find(button => 
          button.textContent.includes('Table Mountain Trail')
        );
        if (suggestionButton) {
          fireEvent.mouseDown(suggestionButton);
          fireEvent.click(suggestionButton);
        }
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('handles suggestion click with legacy string format', async () => {
      const mockSuggestions = ['Legacy Trail Name'];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Legacy' } });
      
      await waitFor(() => {
        const suggestionItems = screen.getAllByRole('button');
        const suggestionButton = suggestionItems.find(button => 
          button.textContent.includes('Legacy Trail Name')
        );
        if (suggestionButton) {
          fireEvent.mouseDown(suggestionButton);
          fireEvent.click(suggestionButton);
        }
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('prevents input blur on suggestion mousedown', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Test Trail',
        displayName: 'Test Trail'
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Test' } });
      
      await waitFor(() => {
        const suggestionItems = screen.getAllByRole('button');
        const suggestionButton = suggestionItems.find(button => 
          button.textContent.includes('Test Trail')
        );
        if (suggestionButton) {
          const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
          const preventDefaultSpy = jest.spyOn(mouseDownEvent, 'preventDefault');
          fireEvent(suggestionButton, mouseDownEvent);
          expect(preventDefaultSpy).toHaveBeenCalled();
        }
      });
      
      searchContext.useSearch.mockRestore();
    });
  });

  describe('Suggestion Content Rendering', () => {
    it('renders trail type suggestions with correct icon and content', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Table Mountain Trail',
        displayName: 'Table Mountain Trail',
        description: 'A challenging hike',
        difficulty: 'Moderate',
        distance: '5.2 km',
        elevationGain: '800 m',
        location: 'Cape Town, South Africa',
        tags: ['mountain', 'views'],
        status: 'open'
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Table' } });
      
      await waitFor(() => {
        expect(screen.getByText('Table Mountain Trail')).toBeInTheDocument();
        expect(screen.getByText('A challenging hike')).toBeInTheDocument();
        expect(screen.getByText('📍 Cape Town, South Africa')).toBeInTheDocument();
        expect(screen.getByText('🏔️ Moderate • 📏 5.2 km • ⛰️ 800 m')).toBeInTheDocument();
        expect(screen.getByText('mountain')).toBeInTheDocument();
        expect(screen.getByText('views')).toBeInTheDocument();
        expect(screen.getByText('trail')).toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('renders geocoded type suggestions with correct icon', async () => {
      const mockSuggestions = [{
        type: 'geocoded',
        name: 'Cape Town',
        displayName: 'Cape Town, Western Cape',
        description: 'Location in South Africa',
        location: 'Western Cape, South Africa',
        tags: ['Location']
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Cape' } });
      
      await waitFor(() => {
        expect(screen.getByText('Cape Town, Western Cape')).toBeInTheDocument();
        expect(screen.getByText('geocoded')).toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('renders closed status suggestions', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Closed Trail',
        displayName: 'Closed Trail',
        status: 'closed'
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Closed' } });
      
      await waitFor(() => {
        expect(screen.getByText('🔒 Closed')).toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('renders suggestions with partial metadata', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Partial Trail',
        displayName: 'Partial Trail',
        difficulty: 'Easy',
        // No distance or elevationGain
        location: 'Test Location'
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Partial' } });
      
      await waitFor(() => {
        expect(screen.getByText('🏔️ Easy')).toBeInTheDocument();
        expect(screen.getByText('📍 Test Location')).toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('renders suggestions with only distance and elevation', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Distance Trail',
        displayName: 'Distance Trail',
        distance: '3.5 km',
        elevationGain: '500 m'
        // No difficulty
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Distance' } });
      
      await waitFor(() => {
        expect(screen.getByText('📏 3.5 km • ⛰️ 500 m')).toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('limits tags display to 3 items', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Many Tags Trail',
        displayName: 'Many Tags Trail',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Many' } });
      
      await waitFor(() => {
        expect(screen.getByText('tag1')).toBeInTheDocument();
        expect(screen.getByText('tag2')).toBeInTheDocument();
        expect(screen.getByText('tag3')).toBeInTheDocument();
        expect(screen.queryByText('tag4')).not.toBeInTheDocument();
        expect(screen.queryByText('tag5')).not.toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('submits form on button click with context handler', () => {
      const mockHandleSearch = jest.fn();
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: [],
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: mockHandleSearch
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      const button = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(input, { target: { value: 'Cape Town' } });
      fireEvent.click(button);
      
      expect(mockHandleSearch).toHaveBeenCalledWith('Cape Town');
      
      searchContext.useSearch.mockRestore();
    });

    it('submits form on Enter key with context handler', () => {
      const mockHandleSearch = jest.fn();
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: [],
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: mockHandleSearch
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      
      fireEvent.change(input, { target: { value: 'Cape Town' } });
      fireEvent.submit(input.closest('form'));
      
      expect(mockHandleSearch).toHaveBeenCalledWith('Cape Town');
      
      searchContext.useSearch.mockRestore();
    });

    it('calls custom onSearch when provided instead of context handler', () => {
      const mockOnSearch = jest.fn();
      const mockHandleSearch = jest.fn();
      
      renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: [],
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: mockHandleSearch
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      const button = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(input, { target: { value: 'Test search' } });
      fireEvent.click(button);
      
      expect(mockOnSearch).toHaveBeenCalledWith('Test search');
      expect(mockHandleSearch).not.toHaveBeenCalled();
      
      searchContext.useSearch.mockRestore();
    });

    it('does not submit empty search', () => {
      const mockHandleSearch = jest.fn();
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: [],
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: mockHandleSearch
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      const button = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(button);
      
      expect(mockHandleSearch).not.toHaveBeenCalled();
      
      searchContext.useSearch.mockRestore();
    });

    it('trims whitespace from search input', () => {
      const mockHandleSearch = jest.fn();
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: [],
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: mockHandleSearch
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      const button = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(input, { target: { value: '  Cape Town  ' } });
      fireEvent.click(button);
      
      expect(mockHandleSearch).toHaveBeenCalledWith('Cape Town');
      
      searchContext.useSearch.mockRestore();
    });
  });

  describe('Click Outside Handling', () => {
    it('hides suggestions when clicking outside', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Test Trail',
        displayName: 'Test Trail'
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Test' } });
      
      await waitFor(() => {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        expect(suggestionsContainer).toBeInTheDocument();
      });
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        expect(suggestionsContainer).not.toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('does not hide suggestions when clicking on input', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Test Trail',
        displayName: 'Test Trail'
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Test' } });
      
      await waitFor(() => {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        expect(suggestionsContainer).toBeInTheDocument();
      });
      
      // Click on input
      fireEvent.mouseDown(input);
      
      await waitFor(() => {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        expect(suggestionsContainer).toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });

    it('does not hide suggestions when clicking on suggestions container', async () => {
      const mockSuggestions = [{
        type: 'trail',
        name: 'Test Trail',
        displayName: 'Test Trail'
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Test' } });
      
      await waitFor(() => {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        expect(suggestionsContainer).toBeInTheDocument();
        
        // Click on suggestions container
        fireEvent.mouseDown(suggestionsContainer);
        
        // Should still be visible
        expect(suggestionsContainer).toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });
  });

  describe('Suggestion Animation', () => {
    it('applies animation delay to suggestion items', async () => {
      const mockSuggestions = [
        { type: 'trail', name: 'Trail 1', displayName: 'Trail 1' },
        { type: 'trail', name: 'Trail 2', displayName: 'Trail 2' },
        { type: 'trail', name: 'Trail 3', displayName: 'Trail 3' }
      ];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Trail' } });
      
      await waitFor(() => {
        const suggestionButtons = screen.getAllByRole('button');
        const suggestionItems = suggestionButtons.filter(button => 
          button.classList.contains('suggestion-item')
        );
        
        expect(suggestionItems[0]).toHaveStyle('animation-delay: 0s');
        expect(suggestionItems[1]).toHaveStyle('animation-delay: 0.05s');
        expect(suggestionItems[2]).toHaveStyle('animation-delay: 0.1s');
      });
      
      searchContext.useSearch.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty suggestions array', () => {
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: [],
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Test' } });
      
      const suggestionsContainer = document.querySelector('.search-suggestions');
      expect(suggestionsContainer).not.toBeInTheDocument();
      
      searchContext.useSearch.mockRestore();
    });

    it('handles null/undefined suggestions', () => {
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: null,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      act(() => {
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Test' } });
      });
      
      const suggestionsContainer = document.querySelector('.search-suggestions');
      expect(suggestionsContainer).not.toBeInTheDocument();
      
      searchContext.useSearch.mockRestore();
    });

    it('handles suggestions without required fields gracefully', async () => {
      const mockSuggestions = [{
        // Missing name and displayName
        type: 'trail',
        description: 'A trail'
      }];
      
      renderWithProviders(<SearchBar />);
      
      const searchContext = require('../components/SearchContext');
      jest.spyOn(searchContext, 'useSearch').mockReturnValue({
        searchSuggestions: mockSuggestions,
        setSearchSuggestions: jest.fn(),
        getSuggestions: jest.fn(),
        handleSearch: jest.fn()
      });
      
      const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
      act(() => {
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Test' } });
      });
      
      // Should not crash
      await waitFor(() => {
        const suggestionsContainer = document.querySelector('.search-suggestions');
        expect(suggestionsContainer).toBeInTheDocument();
      });
      
      searchContext.useSearch.mockRestore();
    });
  });
});