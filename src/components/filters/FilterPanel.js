import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function FilterPanel({ filters, onFilterChange, onClose, currentUserId }) {
  const clearAllFilters = () => {
    onFilterChange('difficulty', 'all');
    onFilterChange('tags', []);
    onFilterChange('minDistance', 0);
    onFilterChange('maxDistance', 20);
    onFilterChange('maxLocationDistance', 80);
    onFilterChange('searchQuery', '');
    onFilterChange('showAll', false);
    onFilterChange('myTrails', false);
  };
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
    <div style={{padding: '1.5rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h3 style={{margin: '0', color: 'var(--text)', fontSize: '1.25rem', fontWeight: '600'}}>Filters</h3>
        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
          <button
            onClick={clearAllFilters}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            title="Clear All Filters"
          >
            Clear
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
              title="Close Filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Show All Trails Option */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          color: 'var(--text)',
          fontWeight: '500',
          fontSize: '1rem'
        }}>
          <input
            type="checkbox"
            checked={filters.showAll || false}
            onChange={(e) => onFilterChange('showAll', e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--primary)',
              cursor: 'pointer'
            }}
          />
          <span>Show All Trails (bypass all filters)</span>
        </label>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.4'
        }}>
          When enabled, this will display every trail in the database regardless of difficulty, distance, location, or other filters.
        </p>
      </div>

      {/* My Trails Option */}
      {currentUserId && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            color: 'var(--text)',
            fontWeight: '500',
            fontSize: '1rem'
          }}>
            <input
              type="checkbox"
              checked={filters.myTrails || false}
              onChange={(e) => onFilterChange('myTrails', e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--primary)',
                cursor: 'pointer'
              }}
            />
            <span>Show Only My Trails</span>
          </label>
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.4'
          }}>
            When enabled, this will only show trails that you have created.
          </p>
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
        
        {/* Search by Name */}
        <div>
          <label htmlFor="search-trails-input" style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500'}}>
            Search Trails
          </label>
          <input 
            id="search-trails-input"
            type="text" 
            className="search-input"
            placeholder="Search by trail name"
            value={filters.searchQuery || ''} 
            onChange={(e) => onFilterChange('searchQuery', e.target.value)} 
            style={{width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)'}}
          />
        </div>

        {/* Standard Filters */}
        <div>
          <label htmlFor="difficulty-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Difficulty
          </label>
          <select
            id="difficulty-select"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255, 255, 255, 0.05)' }}
            value={filters.difficulty}
            onChange={e => onFilterChange('difficulty', e.target.value)}
          >
            <option value="all">All</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div>
          <label htmlFor="tags-input" style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500'}}>
            Tags
          </label>
          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <input 
              id="tags-input"
              type="text" 
              placeholder="Search tags (e.g., waterfall, forest)"
              value={tagInput} 
              onChange={(e) => setTagInput(e.target.value)}
              style={{width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)'}}
            />
            <button
              className="button primary"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              style={{padding: '0.75rem 1rem', borderRadius: '8px', whiteSpace: 'nowrap'}}
            >
              Add
            </button>
          </div>
          {filters.tags.length > 0 && (
            <div style={{marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
              {filters.tags.map(tag => (
                <div
                  key={tag}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#052b2b',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#052b2b',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      padding: '0',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(5, 43, 43, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'none';
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
          <label htmlFor="distance-range" style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>
            Distance: {filters.minDistance} - {filters.maxDistance} km
          </label>
          <input
            id="distance-range"
            type="range"
            min={0}
            max={32}
            value={filters.maxDistance}
            onChange={e => onFilterChange('maxDistance', Number(e.target.value))}
            style={{width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.2)', outline: 'none', appearance: 'none'}}
          />
        </div>
        <div>
          <label htmlFor="location-distance-range" style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>
            Max Location Distance: {filters.maxLocationDistance} km
          </label>
          <input
            id="location-distance-range"
            type="range"
            min={0}
            max={1000}
            step={5}
            value={filters.maxLocationDistance}
            onChange={e => onFilterChange('maxLocationDistance', Number(e.target.value))}
            style={{width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.2)', outline: 'none', appearance: 'none'}}
          />
        </div>
      </div>
    </div>
  );
}