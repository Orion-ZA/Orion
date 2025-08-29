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
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </select>
        </div>
         <div>
          <label>Terrain</label>
          <select value={filters.terrain} onChange={(e) => onFilterChange('terrain', e.target.value)} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc'}}>
            <option value="all">All</option>
            <option value="forest">Forest</option>
            <option value="coastal">Coastal</option>
            <option value="mountain">Mountain</option>
          </select>
        </div>

        {/* Range Sliders */}
        <div>
          <label>Length: {filters.minLength} - {filters.maxLength} km</label>
          <input type="range" min="0" max="32" value={filters.maxLength} onChange={(e) => onFilterChange('maxLength', parseFloat(e.target.value))} style={{width: '100%'}}/>
        </div>
         <div>
          <label>Max Distance: {filters.maxDistance} km</label>
          <input type="range" min="0" max="160" step="5" value={filters.maxDistance} onChange={(e) => onFilterChange('maxDistance', parseFloat(e.target.value))} style={{width: '100%'}}/>
        </div>
      </div>
    </div>
  );
}