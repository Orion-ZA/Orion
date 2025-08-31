// src/components/filters/FilterPanel.js
import React from 'react';

export default function FilterPanel({ filters, onFilterChange }) {
  return (
    <div className="card" style={{padding: '1.5rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #dee2e6'}}>
      <strong>Filters</strong>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem'}}>
        
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
          <input 
            type="text" 
            placeholder="Search tags (e.g., waterfall, forest)"
            value={filters.tags === 'all' ? '' : filters.tags} 
            onChange={(e) => onFilterChange('tags', e.target.value || 'all')} 
            style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc'}}
          />
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