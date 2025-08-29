import React, { useState, useMemo, useEffect } from 'react';
import Map, { 
  Marker, 
  Popup, 
  NavigationControl, 
  FullscreenControl,
  ScaleControl,
  Source,
  Layer
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// Sample trail data - in a real app, this would come from an API
const sampleTrails = [
  {
    id: 1,
    name: "Redwood Creek Trail",
    difficulty: "moderate",
    length: 5.2,
    elevationGain: 1200,
    rating: 4.7,
    coordinates: [
      [-122.6087, 37.9235],
      [-122.6078, 37.9241],
      [-122.6062, 37.9253],
      [-122.6045, 37.9267],
      [-122.6028, 37.9279]
    ],
    longitude: -122.6087,
    latitude: 37.9235,
    description: "Beautiful trail through redwood forests with creek views",
    location: "Muir Woods, CA",
    terrain: "forest"
  },
  {
    id: 2,
    name: "Coastal Bluff Trail",
    difficulty: "easy",
    length: 2.8,
    elevationGain: 250,
    rating: 4.5,
    coordinates: [
      [-122.5153, 37.8721],
      [-122.5142, 37.8734],
      [-122.5128, 37.8749],
      [-122.5115, 37.8762]
    ],
    longitude: -122.5153,
    latitude: 37.8721,
    description: "Scenic coastal trail with ocean views and wildflowers",
    location: "Marin Headlands, CA",
    terrain: "coastal"
  },
  {
    id: 3,
    name: "Mountain Summit Trail",
    difficulty: "hard",
    length: 8.5,
    elevationGain: 2800,
    rating: 4.8,
    coordinates: [
      [-122.5964, 37.9012],
      [-122.5951, 37.9028],
      [-122.5937, 37.9045],
      [-122.5922, 37.9061]
    ],
    longitude: -122.5964,
    latitude: 37.9012,
    description: "Challenging climb to panoramic mountain summit views",
    location: "Mount Tamalpais, CA",
    terrain: "mountain"
  }
];

// Replace with your actual Mapbox token
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function TrailExplorer() {
  const [viewState, setViewState] = useState({
    longitude: -122.4376,
    latitude: 37.7577,
    zoom: 9
  });
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    location: 'all',
    terrain: 'all',
    minLength: 0,
    maxLength: 20,
    maxDistance: 50 // Add distance filter in miles
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get user's current location
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation({ longitude, latitude });
        setViewState(current => ({
          ...current,
          longitude,
          latitude,
          zoom: 11
        }));
        setIsLoadingLocation(false);
      },
      (error) => {
        setLocationError('Unable to retrieve your location: ' + error.message);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter trails based on selected filters and proximity
  const filteredTrails = useMemo(() => {
    return sampleTrails.filter(trail => {
      let withinDistance = true;
      
      // Calculate distance if user location is available
      if (userLocation && filters.maxDistance > 0) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          trail.latitude,
          trail.longitude
        );
        withinDistance = distance <= filters.maxDistance;
      }

      return (
        (filters.difficulty === 'all' || trail.difficulty === filters.difficulty) &&
        (filters.location === 'all' || trail.location.includes(filters.location)) &&
        (filters.terrain === 'all' || trail.terrain === filters.terrain) &&
        trail.length >= filters.minLength &&
        trail.length <= filters.maxLength &&
        withinDistance
      );
    });
  }, [filters, userLocation]);

  // Create GeoJSON for trail paths
  const trailPaths = useMemo(() => ({
    type: 'FeatureCollection',
    features: filteredTrails.map(trail => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: trail.coordinates
      },
      properties: {
        id: trail.id,
        name: trail.name,
        difficulty: trail.difficulty
      }
    }))
  }), [filteredTrails]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Auto-detect location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="container fade-in-up" style={{maxWidth: '1200px', margin: '2rem auto', fontFamily: 'sans-serif'}}>
      <h1>Trail Explorer</h1>
      <p style={{color: '#666'}}>Find trails near your current location</p>
      
      {/* Location and Filter Controls */}
      <div style={{marginTop: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
        <button 
          className="button primary"
          onClick={() => setShowFilters(!showFilters)}
          style={{padding: '10px 15px', border: 'none', borderRadius: '5px', background: '#007bff', color: 'white', cursor: 'pointer'}}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        <button 
          className="button secondary"
          onClick={getUserLocation}
          disabled={isLoadingLocation}
          style={{padding: '10px 15px', border: '1px solid #ccc', borderRadius: '5px', background: '#f0f0f0', cursor: 'pointer'}}
        >
          {isLoadingLocation ? 'Locating...' : '📍 Find My Location'}
        </button>
        
        {userLocation && (
          <span style={{fontSize: '0.9rem', color: '#555'}}>
            Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </span>
        )}
      </div>

      {locationError && (
        <div className="card error" style={{padding: '1rem', marginBottom: '1rem', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '5px'}}>
          ⚠️ {locationError}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="card" style={{padding: '1.5rem', marginBottom: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6'}}>
          <strong>Filters</strong>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem'}}>
            
            {/* Standard Filters */}
            <div>
              <label>Difficulty</label>
              <select value={filters.difficulty} onChange={(e) => handleFilterChange('difficulty', e.target.value)} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc'}}>
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
             <div>
              <label>Terrain</label>
              <select value={filters.terrain} onChange={(e) => handleFilterChange('terrain', e.target.value)} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc'}}>
                <option value="all">All</option>
                <option value="forest">Forest</option>
                <option value="coastal">Coastal</option>
                <option value="mountain">Mountain</option>
              </select>
            </div>

            {/* Range Sliders */}
            <div>
              <label>Length: {filters.minLength} - {filters.maxLength} mi</label>
              <input type="range" min="0" max="20" value={filters.maxLength} onChange={(e) => handleFilterChange('maxLength', parseFloat(e.target.value))} style={{width: '100%'}}/>
            </div>
             <div>
              <label>Max Distance: {filters.maxDistance} mi</label>
              <input type="range" min="0" max="100" step="5" value={filters.maxDistance} onChange={(e) => handleFilterChange('maxDistance', parseFloat(e.target.value))} style={{width: '100%'}}/>
            </div>

          </div>
        </div>
      )}

      {/* Main Content: Map and List */}
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem'}}>
        <div style={{borderRadius: '8px', overflow: 'hidden', height: '600px', border: '1px solid #ccc'}}>
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{width: '100%', height: '100%'}}
            mapStyle="mapbox://styles/mapbox/standard"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
            <ScaleControl position="bottom-right" />

            {/* User location marker */}
            {userLocation && (
              <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  backgroundColor: '#4285F4',
                  border: '3px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }} />
              </Marker>
            )}

            {/* Trail paths */}
            <Source id="trail-paths" type="geojson" data={trailPaths}>
              <Layer
                id="trail-line"
                type="line"
                paint={{
                  'line-color': ['match', ['get', 'difficulty'], 'easy', '#4CAF50', 'moderate', '#FF9800', 'hard', '#F44336', '#9C27B0'],
                  'line-width': 3,
                  'line-opacity': 0.8
                }}
              />
            </Source>

            {/* Trail markers */}
            {filteredTrails.map(trail => (
              <Marker
                key={trail.id}
                longitude={trail.longitude}
                latitude={trail.latitude}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedTrail(trail);
                }}
              >
                <div style={{ cursor: 'pointer' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill={trail.difficulty === 'easy' ? '#4CAF50' : trail.difficulty === 'moderate' ? '#FF9800' : '#F44336'}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              </Marker>
            ))}

             {selectedTrail && (
              <Popup
                longitude={selectedTrail.longitude}
                latitude={selectedTrail.latitude}
                onClose={() => setSelectedTrail(null)}
                closeButton={true}
                closeOnClick={false}
                anchor="top"
              >
                <div>
                  <h3>{selectedTrail.name}</h3>
                  <p><strong>Difficulty:</strong> {selectedTrail.difficulty}</p>
                   <p><strong>Length:</strong> {selectedTrail.length} miles</p>
                </div>
              </Popup>
            )}
          </Map>
        </div>

        {/* Trail List */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div style={{padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #ccc'}}>
            <strong>Trails Near You ({filteredTrails.length})</strong>
             {userLocation && (
              <span style={{fontSize: '0.8rem', marginLeft: '0.5rem', color: '#666'}}>
                within {filters.maxDistance} miles
              </span>
            )}
            <div style={{maxHeight: '520px', overflowY: 'auto', marginTop: '0.5rem'}}>
              {filteredTrails.length === 0 ? (
                <p style={{color: '#666'}}>No trails found. Try adjusting your filters or increasing the distance.</p>
              ) : (
                filteredTrails.map(trail => {
                  const distance = userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, trail.latitude, trail.longitude).toFixed(1) : 'N/A';
                  return (
                    <div 
                      key={trail.id} 
                      style={{
                        padding: '0.75rem', 
                        borderBottom: '1px solid #eee', 
                        cursor: 'pointer', 
                        backgroundColor: selectedTrail?.id === trail.id ? '#f0f8ff' : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setSelectedTrail(trail)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedTrail?.id === trail.id ? '#f0f8ff' : 'transparent'}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <strong>{trail.name}</strong>
                        <span style={{color: trail.difficulty === 'easy' ? '#4CAF50' : trail.difficulty === 'moderate' ? '#FF9800' : '#F44336', fontWeight: 'bold'}}>
                          {trail.difficulty}
                        </span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: '#555', fontSize: '0.9rem'}}>
                        <span>{trail.length} mi • {trail.elevationGain} ft gain</span>
                        <span>⭐ {trail.rating}</span>
                      </div>
                       {userLocation && (
                        <div style={{marginTop: '0.25rem', fontSize: '0.8rem', color: '#666'}}>
                          📍 {distance} miles away
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
