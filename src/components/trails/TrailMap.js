import React from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import "mapbox-gl/dist/mapbox-gl.css";
import { getDifficultyColor, getDifficultyIcon } from './TrailUtils';
import { Edit3, X, MapPin } from 'lucide-react';
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
  onMapClick,
  userLocation,
  mapBearing,
  setMapBearing,
  mapPitch,
  setMapPitch,
  mapCenter,
  setMapCenter,
  submissionLocation,
  showSubmissionPanel,
  submissionRoute,
  onCloseSubmission,
  isLoading
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


  return (
    <div className="trails-map-container">
      {/* Map-scoped Loading Overlay */}
      {/** Render a compact loader centered over the map without blocking the entire page */}
      {isLoading && (
        <div className="map-loader-overlay">
          <div className="map-loader-stack">
            <div className="map-spinner"></div>
            <div className="map-loader-title">Loading trails…</div>
          </div>
        </div>
      )}
      {/* Submission Mode Alert Popup */}
      {showSubmissionPanel && (
        <div className="submission-mode-popup">
          <div className="popup-content">
            <div className="popup-icon">
              <Edit3 size={16} />
            </div>
            <div className="popup-text">
              <h3>Trail Submission Mode - Click on the map to select a location</h3>
            </div>
            <button 
              onClick={onCloseSubmission}
              className="popup-close-btn"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        onLoad={handleMapLoad}
        onClick={onMapClick}
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

        {/* Submission location marker */}
        {submissionLocation && showSubmissionPanel && (
          <Marker
            longitude={submissionLocation.longitude}
            latitude={submissionLocation.latitude}
            anchor="center"
          >
            <div className="submission-location-marker">
              <div className="submission-marker-icon">
                <MapPin size={20} />
              </div>
            </div>
          </Marker>
        )}

        {/* Submission route */}
        {submissionRoute && submissionRoute.length > 1 && showSubmissionPanel && (
          <Source
            id="submission-route"
            type="geojson"
            data={{
              type: "Feature",
              geometry: { type: "LineString", coordinates: submissionRoute },
            }}
          >
            <Layer
              id="submission-route-layer"
              type="line"
              paint={{ 
                "line-color": "#5bc0be", 
                "line-width": 4,
                "line-opacity": 0.8
              }}
            />
          </Source>
        )}

        {/* Submission route points */}
        {submissionRoute && submissionRoute.length > 0 && showSubmissionPanel && (
          submissionRoute
            .filter(point => 
              Array.isArray(point) && 
              point.length === 2 && 
              !isNaN(point[0]) && 
              !isNaN(point[1]) &&
              point[0] >= -180 && point[0] <= 180 &&
              point[1] >= -90 && point[1] <= 90
            )
            .map((point, index) => (
              <Marker
                key={`route-point-${index}`}
                longitude={point[0]}
                latitude={point[1]}
                anchor="center"
              >
                <div className="route-point-marker">
                  <span className="route-point-number">{index + 1}</span>
                </div>
              </Marker>
            ))
        )}

        {/* Trail markers */}
        {trails
          .filter(trail => 
            trail.longitude && 
            trail.latitude && 
            !isNaN(trail.longitude) && 
            !isNaN(trail.latitude) &&
            typeof trail.longitude === 'number' &&
            typeof trail.latitude === 'number' &&
            trail.longitude >= -180 && trail.longitude <= 180 &&
            trail.latitude >= -90 && trail.latitude <= 90
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
          .filter(trail => {
            const hasValidRoute = trail.route && 
              Array.isArray(trail.route) && 
              trail.route.length > 0 &&
              trail.longitude && 
              trail.latitude && 
              !isNaN(trail.longitude) && 
              !isNaN(trail.latitude) &&
              // Validate that all route coordinates are valid
              trail.route.every(point => 
                Array.isArray(point) && 
                point.length === 2 && 
                !isNaN(point[0]) && 
                !isNaN(point[1]) &&
                point[0] >= -180 && point[0] <= 180 &&
                point[1] >= -90 && point[1] <= 90
              );
            
            
            return hasValidRoute;
          })
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


