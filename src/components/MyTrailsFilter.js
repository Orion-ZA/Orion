import React from 'react';
import { Search, X } from 'lucide-react';
import './MyTrailsFilter.css';

const MyTrailsFilter = ({ 
  searchQuery, 
  onSearchChange, 
  filters, 
  onFilterChange, 
  onClearFilters,
  activeTab 
}) => {
  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onClearFilters();
  };

  const hasActiveFilters = searchQuery || 
    filters.difficulty !== 'all' || 
    filters.minDistance > 0 || 
    filters.maxDistance !== 20 ||
    filters.status !== 'all';

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

          {/* Clear All Button */}
          <button
            onClick={clearAllFilters}
            className={`mytrails-clear-all-inline ${hasActiveFilters ? 'visible' : 'hidden'}`}
            aria-label="Clear all filters"
            disabled={!hasActiveFilters}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mytrails-active-filters">
          <span className="active-filters-label">Active filters:</span>
          <div className="active-filters-list">
            {searchQuery && (
              <span className="active-filter-tag">
                Search: "{searchQuery}"
                <button onClick={() => onSearchChange('')}>×</button>
              </span>
            )}
            {filters.difficulty !== 'all' && (
              <span className="active-filter-tag">
                Difficulty: {filters.difficulty}
                <button onClick={() => handleFilterChange('difficulty', 'all')}>×</button>
              </span>
            )}
            {(filters.minDistance > 0 || filters.maxDistance !== 20) && (
              <span className="active-filter-tag">
                Distance: {filters.minDistance}-{filters.maxDistance}km
                <button onClick={() => {
                  handleFilterChange('minDistance', 0);
                  handleFilterChange('maxDistance', 20);
                }}>×</button>
              </span>
            )}
            {activeTab === 'submitted' && filters.status !== 'all' && (
              <span className="active-filter-tag">
                Status: {filters.status}
                <button onClick={() => handleFilterChange('status', 'all')}>×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTrailsFilter;
