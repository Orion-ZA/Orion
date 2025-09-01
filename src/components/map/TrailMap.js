// src/components/map/TrailMap.js
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Map, {Popup, NavigationControl, FullscreenControl, ScaleControl, Source, Layer } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useTrails from '../hooks/useTrails';


const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function TrailMap({ trails, userLocation, selectedTrail, onSelectTrail }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const { getTrailCoordinates } = useTrails();
  const [viewState, setViewState] = useState({
    longitude: userLocation?.longitude || 28.0473,
    latitude: userLocation?.latitude || -26.2041,
    zoom: userLocation ? 11 : 9
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  // Clean up markers when component unmounts or trails change
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);

  // Effect to recenter map on selected trail
  useEffect(() => {
    if (selectedTrail && mapRef.current) {
      const { latitude, longitude } = getTrailCoordinates(selectedTrail.location);
      if (latitude !== null && longitude !== null) {
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          speed: 1.5
        });
      }
    }
  }, [selectedTrail, getTrailCoordinates]);

  // Effect to add markers when map is loaded
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add new markers
      trails.forEach(trail => {
        const { latitude, longitude } = getTrailCoordinates(trail.location);
        
        if (latitude !== null && longitude !== null) {
          // Create marker element
          const el = document.createElement('div');
          el.className = 'trail-marker';
          el.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="${
              trail.difficulty === 'Easy' ? '#4CAF50' : 
              trail.difficulty === 'Moderate' ? '#FF9800' : '#F44336'
            }">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `;
          el.style.cursor = 'pointer';

          // Create and add marker
          const marker = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current.getMap());

          // Add click event
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelectTrail(trail);
          });

          markersRef.current.push(marker);
        }
      });
    }
  }, [mapLoaded, trails, onSelectTrail, getTrailCoordinates]);

  const trailPaths = useMemo(() => ({
    type: 'FeatureCollection',
    features: trails.map(trail => {
      const coordinates = trail.gpsRoute.map(point => {
        const lng = point.longitude || point._longitude;
        const lat = point.latitude || point._latitude;
        return [parseFloat(lng), parseFloat(lat)];
      }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));
      
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        },
        properties: {
          id: trail.id,
          name: trail.name,
          difficulty: trail.difficulty
        }
      };
    }).filter(feature => feature.geometry.coordinates.length > 0)
  }), [trails]);

  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 13,
        speed: 1.5
      });
    }
  };

  return (
    <div style={{borderRadius: '8px', overflow: 'hidden', height: '600px', border: '1px solid #ccc', position: 'relative'}}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{width: '100%', height: '100%'}}
        mapStyle="mapbox://styles/mapbox/outdoors-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={() => setMapLoaded(true)}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-right" />

        {userLocation && (
          <div>
            {/* User location marker using mapboxgl directly */}
            {mapLoaded && mapRef.current && (() => {
              const userMarker = new mapboxgl.Marker()
                .setLngLat([userLocation.longitude, userLocation.latitude])
                .addTo(mapRef.current.getMap());
              
              // Store reference to clean up later
              markersRef.current.push(userMarker);
              return null;
            })()}
          </div>
        )}

        {mapLoaded && trailPaths.features.length > 0 && (
          <Source id="trail-paths" type="geojson" data={trailPaths}>
            <Layer
              id="trail-line"
              type="line"
              paint={{
                'line-color': [
                  'match', 
                  ['get', 'difficulty'], 
                  'Easy', '#4CAF50', 
                  'Moderate', '#FF9800', 
                  'Hard', '#F44336', 
                  '#9C27B0'
                ],
                'line-width': 3,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {selectedTrail && (() => {
          const { latitude, longitude } = getTrailCoordinates(selectedTrail.location);
          
          if (latitude === null || longitude === null) return null;
          
          return (
            <Popup
              longitude={longitude}
              latitude={latitude}
              onClose={() => onSelectTrail(null)}
              closeButton={true}
              closeOnClick={false}
              anchor="top"
            >
              <div style={{ color: '#333', maxWidth: '250px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{selectedTrail.name}</h3>
                <p style={{ margin: '4px 0' }}><strong>Difficulty:</strong> {selectedTrail.difficulty}</p>
                <p style={{ margin: '4px 0' }}><strong>Distance:</strong> {selectedTrail.distance} km</p>
                <p style={{ margin: '4px 0' }}><strong>Elevation Gain:</strong> {selectedTrail.elevationGain} m</p>
                {selectedTrail.tags && selectedTrail.tags.length > 0 && (
                  <p style={{ margin: '4px 0' }}><strong>Tags:</strong> {selectedTrail.tags.join(', ')}</p>
                )}
              </div>
            </Popup>
          );
        })()}
      </Map>
      
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
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Recenter
        </button>
      )}
    </div>
  );
}