import React, { useMemo } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import "mapbox-gl/dist/mapbox-gl.css";
import { getDifficultyColor, getDifficultyIcon } from './TrailUtils';
import { Edit3, X, MapPin } from 'lucide-react';
import './TrailMap.css';

const normalizePoint = (point) => {
  if (!point) return null;

  if (Array.isArray(point)) {
    if (point.length < 2) return null;
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
    return [lng, lat];
  }

  if (typeof point === 'object') {
    if (Array.isArray(point.coordinates)) {
      return normalizePoint(point.coordinates);
    }

    const lngCandidate = point.lng ?? point.longitude;
    const latCandidate = point.lat ?? point.latitude;
    if (lngCandidate == null || latCandidate == null) return null;

    const lng = Number(lngCandidate);
    const lat = Number(latCandidate);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
    return [lng, lat];
  }

  return null;
};

const sanitizeCoordinates = (coords) => {
  if (!coords) return [];

  if (Array.isArray(coords)) {
    return coords.map(normalizePoint).filter(Boolean);
  }

  if (typeof coords === 'object' && Array.isArray(coords.coordinates)) {
    return sanitizeCoordinates(coords.coordinates);
  }

  return [];
};

const prepareTrails = (trails) => {
  if (!Array.isArray(trails)) return [];

  return trails
    .map((trail) => {
      const normalized = normalizePoint([trail?.longitude, trail?.latitude]);
      if (!normalized) return null;

      const sanitizedRoute = sanitizeCoordinates(trail?.route);

      return {
        ...trail,
        longitude: normalized[0],
        latitude: normalized[1],
        sanitizedRoute: sanitizedRoute.length >= 2 ? sanitizedRoute : null,
      };
    })
    .filter(Boolean);
};

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
  const sanitizedSubmissionRoute = useMemo(
    () => sanitizeCoordinates(submissionRoute),
    [submissionRoute]
  );

  const preparedTrails = useMemo(() => prepareTrails(trails), [trails]);

  const hasSubmissionRoute = showSubmissionPanel && sanitizedSubmissionRoute.length > 1;

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
        {hasSubmissionRoute && (
          <Source
            id="submission-route"
            type="geojson"
            data={{
              type: "Feature",
              geometry: { type: "LineString", coordinates: sanitizedSubmissionRoute },
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
        {showSubmissionPanel && sanitizedSubmissionRoute.length > 0 && (
          sanitizedSubmissionRoute.map((point, index) => (
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
        {preparedTrails.map((trail) => (
          <Marker
            key={trail.id}
            longitude={trail.longitude}
            latitude={trail.latitude}
            anchor="bottom"
            onClick={() => {
              if (selectedTrail && selectedTrail.id === trail.id) {
                setSelectedTrail(null);
                setHoveredTrail(null);
              } else if (onTrailClick) {
                onTrailClick(trail);
              }
            }}
          >
            <div
              className="trail-marker-wrapper"
              data-testid="trail-marker-wrapper"
              onMouseEnter={() => setHoveredTrail(trail)}
              onMouseLeave={() => setHoveredTrail(null)}
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
        {preparedTrails
          .map((trail) => {
            if (!trail.sanitizedRoute) return null;

            return (
              <Source key={`route-${trail.id}`} id={`route-${trail.id}`} type="geojson" data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: trail.sanitizedRoute
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
            );
          })
          .filter(Boolean)}

        {/* Trail hover card */}
        {hoveredTrail && (() => {
          const hoverPoint = normalizePoint([hoveredTrail.longitude, hoveredTrail.latitude]);
          if (!hoverPoint) return null;
          const [hoverLng, hoverLat] = hoverPoint;

          return (
            <Marker
              longitude={hoverLng}
              latitude={hoverLat}
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


