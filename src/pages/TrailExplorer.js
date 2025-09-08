import React, { useState, useEffect } from 'react';
import useTrails from '../components/hooks/useTrails';
import TrailMap from '../components/map/TrailMap';
import FilterPanel from '../components/filters/FilterPanel';
import TrailList from '../components/lists/TrailList';
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function TrailExplorerPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [userSaved, setUserSaved] = useState({ favourites: [], wishlist: [], completed: [] });
  const [user, setUser] = useState(null);

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
  } = useTrails();

  // Listen for Firebase auth state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  const userId = user ? user.uid : null;

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Fetch user's saved trails when userId is available
  useEffect(() => {
    if (!userId) return;

    async function fetchSavedTrails() {
      try {
        const res = await fetch(`https://getsavedtrails-fqtduxc7ua-uc.a.run.app?uid=${userId}`);
        const data = await res.json();
        setUserSaved(data);
      } catch (err) {
        console.error('Failed to fetch saved trails:', err);
      }
    }

    fetchSavedTrails();
  }, [userId]);

  const handleSaveForLater = async () => {
    if (!userId) {
      alert('Please log in to save trails.');
      return;
    }

    try {
      await fetch('https://addfavourite-fqtduxc7ua-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId, trailId: selectedTrail?.id })
      });
      if (selectedTrail) {
        setUserSaved(prev => ({
          ...prev,
          favourites: [...prev.favourites, selectedTrail]
        }));
      }
    } catch (err) {
      console.error('Failed to save trail for later:', err);
    }
  };

  const handleAddToWishlist = async () => {
    if (!userId) {
      alert('Please log in to add trails to wishlist.');
      return;
    }

    try {
      await fetch('https://us-central1-orion-sdp.cloudfunctions.net/addWishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId, trailId: selectedTrail?.id })
      });
      if (selectedTrail) {
        setUserSaved(prev => ({
          ...prev,
          wishlist: [...prev.wishlist, selectedTrail]
        }));
      }
    } catch (err) {
      console.error('Failed to add trail to wishlist:', err);
    }
  };

  return (
    <div className="container fade-in-up">
      <h1>Trail Explorer</h1>
      <p>Find trails near your current location</p>
      
      {/* Location, Filters, Save, and Wishlist Buttons */}
      <div style={{marginTop: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center'}}>
        
        <button className="button primary" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <button
          className="button secondary"
          onClick={handleAddToWishlist}
          disabled={!selectedTrail || userSaved.wishlist.some(t => t.id === selectedTrail?.id)}
        >
          {selectedTrail && userSaved.wishlist.some(t => t.id === selectedTrail?.id) ? 'In Wishlist' : 'Add to wishlist'}
        </button>
        <button
          className="button primary"
          onClick={handleSaveForLater}
          disabled={!selectedTrail || userSaved.favourites.some(t => t.id === selectedTrail?.id)}
        >
          {selectedTrail && userSaved.favourites.some(t => t.id === selectedTrail?.id) ? 'Saved' : 'Save for later'}
        </button>
        <button
          className="button secondary"
          onClick={handleAddToWishlist}
          disabled={!selectedTrail || userSaved.wishlist.some(t => t.id === selectedTrail?.id)}
        >
          {selectedTrail && userSaved.wishlist.some(t => t.id === selectedTrail?.id) ? 'In Wishlist' : 'Add to wishlist'}
        </button>
        {userLocation && (
          <span>
            Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </span>
        )}
        <button className="button secondary" onClick={getUserLocation} disabled={isLoadingLocation}>
          {isLoadingLocation ? 'Locating...' : '📍 Find My Location'}
        </button>
      </div>

      {locationError && <div className="card error">⚠️ {locationError}</div>}

      {isLoadingTrails && (
        <div className="card">
          Loading trails...
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && <FilterPanel filters={filters} onFilterChange={handleFilterChange} />}

      {/* Main Content: Map and List */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
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
