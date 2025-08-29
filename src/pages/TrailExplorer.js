// src/pages/TrailExplorerPage.js
import React, { useState, useEffect } from 'react';
import useTrails from '../components/hooks/useTrails';
import TrailMap from '../components/map/TrailMap';
import FilterPanel from '../components/filters/FilterPanel';
import TrailList from '../components/lists/TrailList';

export default function TrailExplorerPage() {
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    filteredTrails,
    filters,
    handleFilterChange,
    userLocation,
    locationError,
    isLoadingLocation,
    getUserLocation,
    calculateDistance
  } = useTrails();

  // Auto-detect location on component mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  return (
    <div className="container fade-in-up">
      <h1>Trail Explorer</h1>
      <p>Find trails near your current location</p>
      
      {/* Location and Filter Controls */}
      <div style={{marginTop: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
        <button 
          className="button primary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <button 
          className="button secondary"
          onClick={getUserLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? 'Locating...' : '📍 Find My Location'}
        </button>
        {userLocation && (
          <span>
            Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </span>
        )}
      </div>

      {locationError && (
        <div className="card error">
          ⚠️ {locationError}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      )}

      {/* Main Content: Map and List */}
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem'}}>
        <TrailMap
          trails={filteredTrails}
          userLocation={userLocation}
          selectedTrail={selectedTrail}
          onSelectTrail={setSelectedTrail}
        />
        <TrailList
          trails={filteredTrails}
          userLocation={userLocation}
          selectedTrail={selectedTrail}
          onSelectTrail={setSelectedTrail}
          calculateDistance={calculateDistance}
          maxDistance={filters.maxDistance}
        />
      </div>
    </div>
  );
}