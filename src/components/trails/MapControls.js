import React from 'react';
import { Plus, Minus, Compass, MapPin, User, Loader2 } from 'lucide-react';
import './MapControls.css';

const MapControls = ({
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onRecenter,
  onFindLocation,
  mapBearing,
  mapPitch,
  mapCenter,
  userLocation,
  needsRecenter,
  showFindLocation,
  isLoadingLocation
}) => {
  return (
    <div className="trails-map-controls">
      <button onClick={onZoomIn} className="map-control-btn" title="Zoom In">
        <Plus size={18} />
      </button>
      <button onClick={onZoomOut} className="map-control-btn" title="Zoom Out">
        <Minus size={18} />
      </button>
      {mapBearing !== 0 || mapPitch !== 0 ? (
        <button onClick={onResetNorth} className="map-control-btn" title="Reset North">
          <Compass size={18} />
        </button>
      ) : null}
      {needsRecenter ? (
        <button onClick={onRecenter} className="map-control-btn" title="Recenter on Location">
          <MapPin size={18} />
        </button>
      ) : null}
      {showFindLocation ? (
        <button 
          onClick={onFindLocation} 
          className="map-control-btn" 
          title={isLoadingLocation ? "Finding Location..." : "Find My Location"}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <Loader2 size={18} className="spinning" />
          ) : (
            <User size={18} />
          )}
        </button>
      ) : null}
    </div>
  );
};

export default MapControls;
