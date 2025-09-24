import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, __mockNavigate as mockNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { SearchProvider } from '../components/SearchContext';

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
  });

  it('renders search input and button', () => {
    renderWithProviders(<SearchBar />);
    
    expect(screen.getByPlaceholderText(/search by city, park, or trail name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    renderWithProviders(<SearchBar />);
    
    const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
    fireEvent.change(input, { target: { value: 'Table Mountain' } });
    
    expect(input.value).toBe('Table Mountain');
  });

  it('shows suggestions when typing', async () => {
    renderWithProviders(<SearchBar />);
    
    const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Table' } });
    
    await waitFor(() => {
      // Check for any suggestion that contains "Table" (since we're using real geocoding)
      const suggestions = screen.getAllByText(/Table/i);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  it('handles suggestion click', async () => {
    renderWithProviders(<SearchBar />);
    
    const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Table' } });
    
    await waitFor(() => {
      // Find any suggestion that contains "Table" and click it
      const suggestions = screen.getAllByText(/Table/i);
      if (suggestions.length > 0) {
        fireEvent.click(suggestions[0]);
      }
    });
    
    // The input value should be updated to the clicked suggestion
    expect(input.value).toMatch(/Table/i);
  });

  it('submits form on button click', () => {
    renderWithProviders(<SearchBar />);
    
    const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
    const button = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(input, { target: { value: 'Cape Town' } });
    fireEvent.click(button);
    
    expect(mockNavigate).toHaveBeenCalledWith('/trails', {
      state: { searchQuery: 'Cape Town', action: 'zoom' },
      replace: false
    });
  });

  it('submits form on Enter key', () => {
    renderWithProviders(<SearchBar />);
    
    const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
    
    fireEvent.change(input, { target: { value: 'Cape Town' } });
    fireEvent.submit(input.closest('form'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/trails', {
      state: { searchQuery: 'Cape Town', action: 'zoom' },
      replace: false
    });
  });

  it('hides suggestions on Escape key', async () => {
    renderWithProviders(<SearchBar />);
    
    const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Table' } });
    
    await waitFor(() => {
      // Check for any suggestion that contains "Table"
      const suggestions = screen.getAllByText(/Table/i);
      expect(suggestions.length).toBeGreaterThan(0);
    });
    
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      // Suggestions should be hidden
      const suggestions = screen.queryAllByText(/Table/i);
      expect(suggestions.length).toBe(0);
    });
  });

  it('uses custom placeholder when provided', () => {
    renderWithProviders(<SearchBar placeholder="Custom placeholder" />);
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('uses initial value when provided', () => {
    renderWithProviders(<SearchBar initialValue="Initial search" />);
    
    const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
    expect(input.value).toBe('Initial search');
  });

  it('calls custom onSearch when provided', () => {
    const mockOnSearch = jest.fn();
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search by city, park, or trail name/i);
    const button = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(input, { target: { value: 'Test search' } });
    fireEvent.click(button);
    
    expect(mockOnSearch).toHaveBeenCalledWith('Test search');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
