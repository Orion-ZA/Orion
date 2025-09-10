import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useTrails from '../components/hooks/useTrails';
import TrailMap from '../components/map/TrailMap';
import FilterPanel from '../components/filters/FilterPanel';
import TrailList from '../components/lists/TrailList';

export default function TrailExplorerPage() {
  const location = useLocation();
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Extract lat, lng, and trailId from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const lat = parseFloat(searchParams.get('lat'));
  const lng = parseFloat(searchParams.get('lng'));
  const trailId = searchParams.get('trailId');
  const searchLocation = lat && lng ? { latitude: lat, longitude: lng } : null;

  const {
    filteredTrails,
    filters,
    handleFilterChange,
    userLocation,
    locationError,
    isLoadingLocation,
    isLoadingTrails,
    getUserLocation,
    calculateDistance
  } = useTrails(searchLocation);

  // Auto-detect location on component mount if no search location provided
  useEffect(() => {
    if (!searchLocation) {
      getUserLocation();
    }
  }, [getUserLocation, searchLocation]);

  // Set selected trail if trailId is provided
  useEffect(() => {
    if (trailId && filteredTrails.length > 0) {
      const trail = filteredTrails.find(t => t.id === trailId);
      if (trail) {
        setSelectedTrail(trail);
      }
    }
  }, [trailId, filteredTrails]);

  return (
    <div className="container fade-in-up">
      <h1>Trail Explorer</h1>
      <p>Find trails near {searchLocation ? 'your selected location' : 'your current location'}</p>
      
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
          disabled={isLoadingLocation || !!searchLocation}
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

      {isLoadingTrails && (
        <div className="card">
          Loading trails...
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
          maxDistance={filters.maxLocationDistance}
        />
      </div>
    </div>
  );
}