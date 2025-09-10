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
  selectedTrail,
  setSelectedTrail,
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
      });
    }
  };

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
              onClick={() => setSelectedTrail(trail)}
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

        {/* Trail popup */}
        {selectedTrail && (
          <Popup
            longitude={selectedTrail.longitude}
            latitude={selectedTrail.latitude}
            anchor="bottom"
            onClose={() => setSelectedTrail(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="trail-popup">
              <h3>{selectedTrail.name}</h3>
              <p><strong>Difficulty:</strong> {selectedTrail.difficulty}</p>
              <p><strong>Distance:</strong> {selectedTrail.distance} km</p>
              {selectedTrail.elevationGain && (
                <p><strong>Elevation Gain:</strong> {selectedTrail.elevationGain} m</p>
              )}
              {selectedTrail.description && (
                <p><strong>Description:</strong> {selectedTrail.description}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default TrailMap;
