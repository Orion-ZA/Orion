import React from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import "mapbox-gl/dist/mapbox-gl.css";
import { getDifficultyColor, getDifficultyIcon } from './TrailUtils';
import './TrailMap.css';

const TrailMap = ({
  viewport,
  setViewport,
  mapRef,
  trails,
  hoveredTrail,
  setHoveredTrail,
  selectedTrail,
  setSelectedTrail,
  onTrailClick,
  userLocation,
  mapBearing,
  setMapBearing,
  mapPitch,
  setMapPitch,
  mapCenter,
  setMapCenter
}) => {
  const handleMapLoad = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Track map rotation and pitch
      map.on('rotate', () => {
        setMapBearing(map.getBearing());
      });
      
      map.on('pitch', () => {
        setMapPitch(map.getPitch());
      });
      
      map.on('move', () => {
        const center = map.getCenter();
        setMapCenter({
          lat: center.lat,
          lng: center.lng
        });
        
        // Clear hover card when map is moved by user
        if (hoveredTrail) {
          setHoveredTrail(null);
        }
      });

      // Note: Removed map click handler to prevent interference with hover functionality
    }
  };

  // Debug: Log current state
  console.log('TrailMap render - hoveredTrail:', hoveredTrail);
  console.log('TrailMap render - trails count:', trails.length);

  return (
    <div className="trails-map-container">
      <Map
        ref={mapRef}
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        onLoad={handleMapLoad}
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/standard"
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
          >
            <div className="user-location-marker">
              <div className="user-location-pulse"></div>
            </div>
          </Marker>
        )}

        {/* Trail markers */}
        {trails
          .filter(trail => 
            trail.longitude && 
            trail.latitude && 
            !isNaN(trail.longitude) && 
            !isNaN(trail.latitude) &&
            typeof trail.longitude === 'number' &&
            typeof trail.latitude === 'number'
          )
          .map(trail => (
            <Marker
              key={trail.id}
              longitude={trail.longitude}
              latitude={trail.latitude}
              anchor="bottom"
              onClick={() => {
                // If clicking on the same trail that's already selected, unselect it
                if (selectedTrail && selectedTrail.id === trail.id) {
                  setSelectedTrail(null);
                  setHoveredTrail(null);
                } else {
                  // Otherwise, select the trail and zoom to it
                  if (onTrailClick) {
                    onTrailClick(trail);
                  }
                }
              }}
            >
              <div 
                className="trail-marker-wrapper"
                onMouseEnter={() => {
                  console.log('Mouse enter on trail:', trail.name);
                  setHoveredTrail(trail);
                }}
                onMouseLeave={() => {
                  console.log('Mouse leave on trail:', trail.name);
                  setHoveredTrail(null);
                }}
              >
                <div 
                  className="trail-marker"
                  style={{
                    backgroundColor: getDifficultyColor(trail.difficulty),
                    borderColor: getDifficultyColor(trail.difficulty)
                  }}
                >
                  {getDifficultyIcon(trail.difficulty)}
                </div>
              </div>
            </Marker>
          ))}

        {/* Trail routes */}
        {trails
          .filter(trail => 
            trail.route && 
            Array.isArray(trail.route) && 
            trail.route.length > 0 &&
            trail.longitude && 
            trail.latitude && 
            !isNaN(trail.longitude) && 
            !isNaN(trail.latitude)
          )
          .map(trail => (
            <Source key={`route-${trail.id}`} id={`route-${trail.id}`} type="geojson" data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: trail.route
              }
            }}>
              <Layer
                id={`route-${trail.id}`}
                type="line"
                paint={{
                  'line-color': getDifficultyColor(trail.difficulty),
                  'line-width': 3,
                  'line-opacity': 0.8
                }}
              />
            </Source>
          ))}

        {/* Trail hover card */}
        {hoveredTrail && (() => {
          console.log('Rendering hover card for:', hoveredTrail.name);
          return (
            <Marker
              longitude={hoveredTrail.longitude}
              latitude={hoveredTrail.latitude}
              anchor="bottom"
              offset={[0, -50]}
            >
              <div className="trail-mini-card" onClick={(e) => e.stopPropagation()}>
                <div className="trail-mini-header">
                  <h4>{hoveredTrail.name}</h4>
                  <div className="trail-mini-difficulty" style={{ backgroundColor: getDifficultyColor(hoveredTrail.difficulty) }}>
                    {getDifficultyIcon(hoveredTrail.difficulty)}
                  </div>
                </div>
                <div className="trail-mini-details">
                  <span className="trail-mini-distance">{hoveredTrail.distance} km</span>
                  {hoveredTrail.elevationGain && (
                    <span className="trail-mini-elevation">• {hoveredTrail.elevationGain}m</span>
                  )}
                </div>
              </div>
            </Marker>
          );
        })()}
      </Map>
    </div>
  );
};

export default TrailMap;


