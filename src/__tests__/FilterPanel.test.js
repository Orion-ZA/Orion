import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPanel from '../components/filters/FilterPanel';

const defaultFilters = {
  difficulty: 'all',
  tags: [],
  minDistance: 0,
  maxDistance: 20,
  maxLocationDistance: 80,
  searchQuery: '',
  showAll: false,
  myTrails: false,
};

describe('FilterPanel', () => {
  it('renders filter controls', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        onFilterChange={jest.fn()}
        currentUserId="user1"
      />
    );
    expect(screen.getByRole('heading', { name: /Filters/i })).toBeInTheDocument();
    expect(screen.getByText(/Show All Trails/i)).toBeInTheDocument();
    expect(screen.getByText(/Show Only My Trails/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Search Trails/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Difficulty/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Distance: 0 - 20 km')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Location Distance: 80 km')).toBeInTheDocument();
  });

  it('calls onFilterChange when difficulty changes', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        currentUserId="user1"
      />
    );
    fireEvent.change(screen.getByLabelText(/Difficulty/i), { target: { value: 'Easy' } });
    expect(onFilterChange).toHaveBeenCalledWith('difficulty', 'Easy');
  });

  it('calls onFilterChange when search query changes', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        currentUserId="user1"
      />
    );
    fireEvent.change(screen.getByLabelText(/Search Trails/i), { target: { value: 'mountain' } });
    expect(onFilterChange).toHaveBeenCalledWith('searchQuery', 'mountain');
  });

  it('adds a tag when Add is clicked', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        filters={{ ...defaultFilters, tags: [] }}
        onFilterChange={onFilterChange}
        currentUserId="user1"
      />
    );
    const tagInput = screen.getByPlaceholderText(/Search tags/i);
    fireEvent.change(tagInput, { target: { value: 'forest' } });
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    expect(onFilterChange).toHaveBeenCalledWith('tags', ['forest']);
  });

  it('removes a tag when × is clicked', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        filters={{ ...defaultFilters, tags: ['forest'] }}
        onFilterChange={onFilterChange}
        currentUserId="user1"
      />
    );
    const removeBtn = screen.getByText('×');
    fireEvent.click(removeBtn);
    expect(onFilterChange).toHaveBeenCalledWith('tags', []);
  });

  it('calls clearAllFilters when Clear is clicked', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        currentUserId="user1"
      />
    );
    fireEvent.click(screen.getByText('Clear'));
    expect(onFilterChange).toHaveBeenCalledWith('difficulty', 'all');
    expect(onFilterChange).toHaveBeenCalledWith('tags', []);
    expect(onFilterChange).toHaveBeenCalledWith('minDistance', 0);
    expect(onFilterChange).toHaveBeenCalledWith('maxDistance', 20);
    expect(onFilterChange).toHaveBeenCalledWith('maxLocationDistance', 80);
    expect(onFilterChange).toHaveBeenCalledWith('searchQuery', '');
    expect(onFilterChange).toHaveBeenCalledWith('showAll', false);
    expect(onFilterChange).toHaveBeenCalledWith('myTrails', false);
  });

  it('renders and calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <FilterPanel
        filters={defaultFilters}
        onFilterChange={jest.fn()}
        onClose={onClose}
        currentUserId="user1"
      />
    );
    const closeBtn = screen.getByTitle(/Close Filters/i);
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('removes a tag when × is clicked', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        filters={{ ...defaultFilters, tags: ['forest', 'waterfall'] }}
        onFilterChange={onFilterChange}
        currentUserId="user1"
      />
    );
    // Find the remove button for the 'forest' tag
    const removeBtns = screen.getAllByText('×');
    expect(removeBtns.length).toBeGreaterThan(0);
    fireEvent.click(removeBtns[0]);
    expect(onFilterChange).toHaveBeenCalledWith('tags', ['waterfall']);
  });

  it('changes Clear button style on hover', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        onFilterChange={jest.fn()}
        currentUserId="user1"
      />
    );
    const clearBtn = screen.getByTitle('Clear All Filters');
    expect(clearBtn).toBeInTheDocument();
    fireEvent.mouseEnter(clearBtn);
    expect(clearBtn).toHaveStyle('background: rgba(255, 255, 255, 0.15)');
    expect(clearBtn).toHaveStyle('color: white');
    fireEvent.mouseLeave(clearBtn);
    expect(clearBtn).toHaveStyle('background: rgba(255, 255, 255, 0.1)');
    expect(clearBtn).toHaveStyle('color: rgba(255, 255, 255, 0.8)');
  });

  it('changes Close button style on hover', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        onFilterChange={jest.fn()}
        onClose={jest.fn()}
        currentUserId="user1"
      />
    );
    const closeBtn = screen.getByTitle('Close Filters');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.mouseEnter(closeBtn);
    expect(closeBtn).toHaveStyle('background: rgba(255, 255, 255, 0.15)');
    expect(closeBtn).toHaveStyle('color: white');
    fireEvent.mouseLeave(closeBtn);
    expect(closeBtn).toHaveStyle('background: rgba(255, 255, 255, 0.1)');
    expect(closeBtn).toHaveStyle('color: rgba(255, 255, 255, 0.7)');
  });

  it('does not render Close button if onClose is not provided', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        onFilterChange={jest.fn()}
        currentUserId="user1"
      />
    );
    expect(screen.queryByTitle('Close Filters')).not.toBeInTheDocument();
  });

  it('renders tags and handles tag remove hover', () => {
    render(
      <FilterPanel
        filters={{ ...defaultFilters, tags: ['forest', 'waterfall'] }}
        onFilterChange={jest.fn()}
        currentUserId="user1"
      />
    );
    // Check that both tags are rendered
    expect(screen.getByText('forest')).toBeInTheDocument();
    expect(screen.getByText('waterfall')).toBeInTheDocument();

    // Simulate hover on the remove button
    const removeBtns = screen.getAllByText('×');
    fireEvent.mouseEnter(removeBtns[0]);
    expect(removeBtns[0]).toHaveStyle('background: rgba(5, 43, 43, 0.2)');
    fireEvent.mouseLeave(removeBtns[0]);
    expect(removeBtns[0]).toHaveStyle('background: none');
  });

  it('does not render tags container when tags array is empty', () => {
    render(
      <FilterPanel
        filters={{ ...defaultFilters, tags: [] }}
        onFilterChange={jest.fn()}
        currentUserId="user1"
      />
    );
    // The tags container should not be in the document
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('renders tags container when tags array is not empty', () => {
    render(
      <FilterPanel
        filters={{ ...defaultFilters, tags: ['forest'] }}
        onFilterChange={jest.fn()}
        currentUserId="user1"
      />
    );
    // The tags container should be in the document
    expect(screen.getByText('forest')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('calls handleRemoveTag when tag remove button is clicked', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        filters={{ ...defaultFilters, tags: ['forest'] }}
        onFilterChange={onFilterChange}
        currentUserId="user1"
      />
    );
    const removeBtn = screen.getByText('×');
    fireEvent.click(removeBtn);
    expect(onFilterChange).toHaveBeenCalledWith('tags', []);
  });
});