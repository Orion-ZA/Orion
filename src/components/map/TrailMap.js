// src/components/map/TrailMap.js
import React, { useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
// import mapboxgl from 'mapbox-gl';

// mapboxgl.setTelemetry(false);

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function TrailMap({ trails, userLocation, selectedTrail, onSelectTrail }) {
  const [viewState, setViewState] = useState({
    longitude: userLocation?.longitude || 28.0473,
    latitude: userLocation?.latitude || -26.2041,
    zoom: userLocation ? 11 : 9
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  const trailPaths = useMemo(() => ({
    type: 'FeatureCollection',
    features: trails.map(trail => ({
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
  }), [trails]);

  const handleRecenter = () => {
    if (userLocation) {
      setViewState({
        ...viewState,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 11
      });
    }
  };

  return (
    <div style={{borderRadius: '8px', overflow: 'hidden', height: '600px', border: '1px solid #ccc', position: 'relative'}}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{width: '100%', height: '100%'}}
        mapStyle="mapbox://styles/mapbox/standard"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={() => setMapLoaded(true)}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-right" />

        {userLocation && (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#4285F4', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
          </Marker>
        )}

        {mapLoaded && (
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
        )}

        {trails.map(trail => (
          <Marker
            key={trail.id}
            longitude={trail.longitude}
            latitude={trail.latitude}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              onSelectTrail(trail);
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
            onClose={() => onSelectTrail(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="top"
          >
            <div>
              <h3>{selectedTrail.name}</h3>
              <p><strong>Difficulty:</strong> {selectedTrail.difficulty}</p>
              <p><strong>Length:</strong> {selectedTrail.length} km</p>
            </div>
          </Popup>
        )}
      </Map>
      {userLocation && (
        <button
          onClick={handleRecenter}
          style={{
            position: 'absolute',
            top: '10px',
            right: '50px',
            zIndex: 1,
            padding: '8px 12px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            color: '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Recenter
        </button>
      )}
    </div>
  );
}