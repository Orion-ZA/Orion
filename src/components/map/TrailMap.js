// src/components/map/TrailMap.js
import React, { useState, useMemo, useRef, useEffect } from 'react';
// Use explicit subpath export (root path is not exported in react-map-gl v8)
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function TrailMap({ trails, userLocation, selectedTrail, onSelectTrail }) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: userLocation?.longitude || 28.0473,
    latitude: userLocation?.latitude || -26.2041,
    zoom: userLocation ? 11 : 9
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  // Effect to recenter map on selected trail
  useEffect(() => {
    if (selectedTrail && mapRef.current) {
      try {
        mapRef.current.flyTo?.({
          center: [selectedTrail.location.longitude, selectedTrail.location.latitude],
          zoom: 14,
          speed: 1.5
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('TrailMap flyTo failed', e);
      }
    }
  }, [selectedTrail]);

  const trailPaths = useMemo(() => ({
    type: 'FeatureCollection',
    features: trails.map(trail => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: trail.gpsRoute.map(point => [point.longitude, point.latitude])
      },
      properties: {
        id: trail.id,
        name: trail.name,
        difficulty: trail.difficulty
      }
    }))
  }), [trails]);

  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      try {
        mapRef.current.flyTo?.({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 13,
          speed: 1.5
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Recenter flyTo failed', e);
      }
    }
  };

  return (
    <div style={{borderRadius: '8px', overflow: 'hidden', height: '600px', border: '1px solid #ccc', position: 'relative'}}>
      {MAPBOX_TOKEN ? (
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => evt?.viewState && setViewState(evt.viewState)}
          style={{width: '100%', height: '100%'}}
          mapStyle="mapbox://styles/mapbox/standard"
          mapboxAccessToken={MAPBOX_TOKEN}
          onLoad={() => setMapLoaded(true)}
          onError={(e) => { /* eslint-disable-next-line no-console */ console.error('TrailMap error', e?.error); }}
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
                'line-color': ['match', ['get', 'difficulty'], 'Easy', '#4CAF50', 'Moderate', '#FF9800', 'Hard', '#F44336', '#9C27B0'],
                'line-width': 3,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {trails.map(trail => (
          <Marker
            key={trail.id}
            longitude={trail.location.longitude}
            latitude={trail.location.latitude}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              onSelectTrail(trail);
            }}
          >
            <div style={{ cursor: 'pointer' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill={trail.difficulty === 'Easy' ? '#4CAF50' : trail.difficulty === 'Moderate' ? '#FF9800' : '#F44336'}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </Marker>
        ))}

        {selectedTrail && (
          <Popup
            longitude={selectedTrail.location.longitude}
            latitude={selectedTrail.location.latitude}
            onClose={() => onSelectTrail(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="top"
          >
            <div style={{ color: '#333' }}>
              <h3>{selectedTrail.name}</h3>
              <p><strong>Difficulty:</strong> {selectedTrail.difficulty}</p>
              <p><strong>Distance:</strong> {selectedTrail.distance} km</p>
              <p><strong>Elevation Gain:</strong> {selectedTrail.elevationGain} m</p>
              {selectedTrail.tags && selectedTrail.tags.length > 0 && (
                <p><strong>Tags:</strong> {selectedTrail.tags.join(', ')}</p>
              )}
            </div>
          </Popup>
        )}
        </Map>
      ) : (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',padding:'2rem',textAlign:'center'}}>
          <p style={{margin:0}}>Map disabled (missing Mapbox token)</p>
        </div>
      )}
      {userLocation && (
        <button
          onClick={handleRecenter}
          style={{
            position: 'absolute',
            top: '10px',
            right: '50px',
            zIndex: 1,
            color: '#333',
            padding: '8px 12px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
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