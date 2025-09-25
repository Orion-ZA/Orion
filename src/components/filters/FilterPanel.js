import React, { useState } from 'react';

export default function FilterPanel({ filters, onFilterChange }) {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim().toLowerCase())) {
      onFilterChange('tags', [...filters.tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onFilterChange('tags', filters.tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="card" style={{padding: '1.5rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #dee2e6'}}>
      <strong>Filters</strong>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem'}}>
        
        {/* Search by Name */}
        <div>
          <label>Search Trails</label>
          <input 
            type="text" 
            className="search-input"
            placeholder="Search by trail name"
            value={filters.searchQuery || ''} 
            onChange={(e) => onFilterChange('searchQuery', e.target.value)} 
            style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc'}}
          />
        </div>

        {/* Standard Filters */}
        <div>
          <label>Difficulty</label>
          <select value={filters.difficulty} onChange={(e) => onFilterChange('difficulty', e.target.value)} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc'}}>
            <option value="all">All</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div>
          <label>Tags</label>
          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem'}}>
            <input 
              type="text" 
              placeholder="Search tags (e.g., waterfall, forest)"
              value={tagInput} 
              onChange={(e) => setTagInput(e.target.value)}
              style={{width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc'}}
            />
            <button
              className="button primary"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              style={{padding: '0.5rem 1rem', borderRadius: '4px'}}
            >
              Add
            </button>
          </div>
          {filters.tags.length > 0 && (
            <div style={{marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
              {filters.tags.map(tag => (
                <div
                  key={tag}
                  style={{
                    backgroundColor: '#007bff', // Matches primary button color
                    color: '#fff', // White text for contrast
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Range Sliders */}
        <div>
          <label>Distance: {filters.minDistance} - {filters.maxDistance} km</label>
          <input type="range" min="0" max="32" value={filters.maxDistance} onChange={(e) => onFilterChange('maxDistance', parseFloat(e.target.value))} style={{width: '100%'}}/>
        </div>
        <div>
          <label>Max Location Distance: {filters.maxLocationDistance} km</label>
          <input type="range" min="0" max="160" step="5" value={filters.maxLocationDistance} onChange={(e) => onFilterChange('maxLocationDistance', parseFloat(e.target.value))} style={{width: '100%'}}/>
        </div>
      </div>
    </div>
  );
}