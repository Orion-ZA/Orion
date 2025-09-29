import React, { useState, useEffect } from 'react';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import './MyTrailsFilter.css';

const MyTrailsFilter = ({ 
  searchQuery, 
  onSearchChange, 
  filters, 
  onFilterChange, 
  onClearFilters,
  sorting,
  onSortChange,
  activeTab 
}) => {
  const [showAllChecked, setShowAllChecked] = useState(true);

  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  const handleSortOrderToggle = () => {
    const newOrder = sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(sorting.sortBy, newOrder);
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onClearFilters();
    setShowAllChecked(true);
  };

  const handleShowAllChange = (e) => {
    setShowAllChecked(e.target.checked);
    if (e.target.checked) {
      clearAllFilters();
    }
  };

  const hasActiveFilters = searchQuery || 
    filters.difficulty !== 'all' || 
    filters.minDistance > 0 || 
    filters.maxDistance < 50 || // Any range less than max is considered a filter
    filters.status !== 'all';

  // Update checkbox state when filters change
  useEffect(() => {
    setShowAllChecked(!hasActiveFilters);
  }, [hasActiveFilters]);

  return (
    <div className="mytrails-filter-container">
      {/* Search and Filters Row */}
      <div className="mytrails-filters-row">
        {/* Search Bar */}
        <div className="mytrails-search-input-wrapper">
          <Search size={18} className="mytrails-search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            className="mytrails-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="mytrails-clear-search"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Inline Filter Options */}
        <div className="mytrails-inline-filters">
          {/* Difficulty Filter */}
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="mytrails-inline-select"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Distance Range Slider */}
          <div className="mytrails-distance-slider">
            <div className="distance-slider-header">
              <span className="distance-label">Distance: {filters.minDistance} - {filters.maxDistance} km</span>
            </div>
            <div className="distance-slider-wrapper">
              <div className="distance-slider-container">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={filters.minDistance}
                  onChange={(e) => {
                    const minVal = parseFloat(e.target.value);
                    if (minVal <= filters.maxDistance) {
                      handleFilterChange('minDistance', minVal);
                    }
                  }}
                  className="distance-slider distance-slider-min"
                />
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={filters.maxDistance}
                  onChange={(e) => {
                    const maxVal = parseFloat(e.target.value);
                    if (maxVal >= filters.minDistance) {
                      handleFilterChange('maxDistance', maxVal);
                    }
                  }}
                  className="distance-slider distance-slider-max"
                />
                <div 
                  className="distance-slider-progress"
                  style={{
                    left: `${(filters.minDistance / 50) * 100}%`,
                    width: `${((filters.maxDistance - filters.minDistance) / 50) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Status Filter - Only for submitted trails */}
          {activeTab === 'submitted' && (
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="mytrails-inline-select"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          )}

          {/* Sort By Dropdown */}
          <select
            value={sorting.sortBy}
            onChange={(e) => onSortChange(e.target.value, sorting.sortOrder)}
            className="mytrails-inline-select"
          >
            <option value="name">Sort by Name</option>
            <option value="distance">Sort by Distance</option>
            <option value="difficulty">Sort by Difficulty</option>
            {activeTab === 'submitted' && <option value="date">Sort by Date</option>}
          </select>

          {/* Sort Order Toggle Button */}
          <button
            onClick={handleSortOrderToggle}
            className="mytrails-sort-order-button"
            title={`Sort ${sorting.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            aria-label={`Sort ${sorting.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sorting.sortOrder === 'asc' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
          </button>

          {/* Show All Checkbox */}
          <div className="mytrails-show-all-container">
            <label className="mytrails-show-all-label">
              <input
                type="checkbox"
                checked={showAllChecked}
                onChange={handleShowAllChange}
                className="mytrails-show-all-checkbox"
              />
              <span className="mytrails-show-all-text">Show All</span>
            </label>
          </div>

          {/* Clear All Button */}
          <button
            onClick={clearAllFilters}
            className={`mytrails-clear-all-inline ${hasActiveFilters ? 'visible' : 'hidden'}`}
            aria-label="Clear all filters"
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

    </div>
  );
};

export default MyTrailsFilter;
