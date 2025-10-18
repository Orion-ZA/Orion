import React from 'react';
import { Lock, Unlock, AlertTriangle, ChevronDown, ChevronRight, MapPin, Calendar, User, Eye, EyeOff, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDifficultyColor, getDifficultyIcon } from './TrailUtils';

const TrailCard = ({ 
  trail, 
  activeTab, 
  alerts, 
  loadingStates, 
  trails,
  expandedTrails,
  onToggleExpansion,
  onShowAlertsPopup,
  onHideAlertsPopup,
  onOpenStatusConfirmModal,
  onOpenReviewModal
}) => {
  // Helper function to check if an alert is expired
  const isAlertExpired = (alert) => {
    if (!alert.isTimed || !alert.expiresAt) return false;
    
    const now = new Date();
    const expiresAt = alert.expiresAt.toDate ? alert.expiresAt.toDate() : new Date(alert.expiresAt);
    return now >= expiresAt;
  };

  const trailAlerts = alerts[trail.id];
  // Filter out expired alerts
  const activeAlerts = trailAlerts ? trailAlerts.filter(alert => !isAlertExpired(alert)) : [];

  const isExpanded = expandedTrails.has(trail.id);
  const isSubmittedTab = activeTab === 'submitted';

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const navigate = useNavigate();

  const handleShowOnMap = () => {
    // Create a clean, serializable trail object for navigation
    const cleanTrail = {
      id: trail.id,
      name: trail.name,
      description: trail.description,
      latitude: trail.latitude || trail.location?.latitude,
      longitude: trail.longitude || trail.location?.longitude,
      distance: trail.distance,
      difficulty: trail.difficulty,
      elevationGain: trail.elevationGain,
      status: trail.status,
      createdAt: trail.createdAt,
      lastUpdated: trail.lastUpdated,
      tags: trail.tags,
      photos: trail.photos,
      gpsRoute: trail.gpsRoute,
      location: trail.location
    };

    // Navigate to Trails page with trail data to center and highlight
    navigate('/trails', {
      state: {
        trailToCenter: cleanTrail,
        action: 'centerTrail'
      }
    });
  };

  return (
    <li key={trail.id} className="my-trails-trail-card">
      <div className="my-trails-trail-header">
        <div className="my-trails-trail-title-container">
          {isSubmittedTab && (
            <button 
              className="my-trails-expand-button"
              onClick={() => onToggleExpansion(trail.id)}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <h4>{trail.name}</h4>
        </div>
        {/* Alerts Count - positioned in header */}
        {loadingStates[trail.id] ? (
          <div className="alerts-loading-small">Loading...</div>
        ) : (
          activeAlerts && activeAlerts.length > 0 && (
            <div 
              className="trail-alerts-count-header"
              onMouseEnter={(e) => onShowAlertsPopup(e, activeAlerts)}
              onMouseLeave={onHideAlertsPopup}
            >
              <AlertTriangle size={16} className="trail-alert-icon" />
              <span className="trail-alert-count">{activeAlerts.length}</span>
            </div>
          )
        )}
      </div>


      {/* Trail Info */}
      <div className="my-trails-trail-info">
        <div className="my-trails-trail-details-grid">
          <div className="my-trails-trail-detail-item">
            <span 
              className="my-trails-trail-difficulty"
              style={{ backgroundColor: getDifficultyColor(trail.difficulty) }}
            >
              <span className="trail-difficulty-icon">
                {getDifficultyIcon(trail.difficulty)}
              </span>
              <span className="trail-difficulty-text">{trail.difficulty}</span>
            </span>
          </div>
          <div className="my-trails-trail-detail-item">
            <span className="my-trails-trail-distance">
              <span className="my-trails-trail-detail-label">Distance</span>
              <span className="my-trails-trail-detail-value">{trail.distance} km</span>
            </span>
          </div>
          {trail.elevationGain && (
            <div className="my-trails-trail-detail-item">
              <span className="my-trails-trail-elevation">
                <span className="my-trails-trail-detail-label">Elevation</span>
                <span className="my-trails-trail-detail-value">+{trail.elevationGain}m</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details for Submitted Trails */}
      {isSubmittedTab && isExpanded && (
        <div className="my-trails-expanded-details">
          <div className="my-trails-expanded-section">
            <h5 className="my-trails-expanded-title">
              <MapPin size={16} />
              Location Details
            </h5>
            <div className="my-trails-expanded-content">
              <div className="my-trails-detail-row">
                <span className="my-trails-detail-label">Coordinates:</span>
                <span className="my-trails-detail-value">
                  {trail.location?.latitude?.toFixed(6)}, {trail.location?.longitude?.toFixed(6)}
                </span>
              </div>
              {trail.gpsRoute && trail.gpsRoute.length > 0 && (
                <div className="my-trails-detail-row">
                  <span className="my-trails-detail-label">GPS Points:</span>
                  <span className="my-trails-detail-value">{trail.gpsRoute.length} waypoints</span>
                </div>
              )}
            </div>
          </div>

          <div className="my-trails-expanded-section">
            <h5 className="my-trails-expanded-title">
              <Calendar size={16} />
              Submission Info
            </h5>
            <div className="my-trails-expanded-content">
              <div className="my-trails-detail-row">
                <span className="my-trails-detail-label">Created:</span>
                <span className="my-trails-detail-value">{formatDate(trail.createdAt)}</span>
              </div>
              {trail.lastUpdated && (
                <div className="my-trails-detail-row">
                  <span className="my-trails-detail-label">Last Updated:</span>
                  <span className="my-trails-detail-value">{formatDate(trail.lastUpdated)}</span>
                </div>
              )}
              <div className="my-trails-detail-row">
                <span className="my-trails-detail-label">Status:</span>
                <span className={`my-trails-detail-value ${trail.status === 'open' ? 'status-open' : 'status-closed'}`}>
                  {trail.status === 'open' ? (
                    <>
                      <Eye size={14} style={{ marginRight: '4px' }} />
                      Open to Public
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} style={{ marginRight: '4px' }} />
                      Closed
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {trail.description && (
            <div className="my-trails-expanded-section">
              <h5 className="my-trails-expanded-title">
                <User size={16} />
                Description
              </h5>
              <div className="my-trails-expanded-content">
                <p className="my-trails-description">{trail.description}</p>
              </div>
            </div>
          )}

          {trail.tags && trail.tags.length > 0 && (
            <div className="my-trails-expanded-section">
              <h5 className="my-trails-expanded-title">
                <MapPin size={16} />
                Tags
              </h5>
              <div className="my-trails-expanded-content">
                <div className="my-trails-tags">
                  {trail.tags.map((tag, index) => (
                    <span key={index} className="my-trails-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {trail.photos && trail.photos.length > 0 && (
            <div className="my-trails-expanded-section">
              <h5 className="my-trails-expanded-title">
                <MapPin size={16} />
                Photos
              </h5>
              <div className="my-trails-expanded-content">
                <div className="my-trails-photos">
                  {trail.photos.slice(0, 3).map((photo, index) => (
                    <img 
                      key={index} 
                      src={photo} 
                      alt={`Trail photo ${index + 1}`}
                      className="my-trails-photo"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ))}
                  {trail.photos.length > 3 && (
                    <div className="my-trails-photo-more">
                      +{trail.photos.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show on Map Button for Expanded Submitted Trails */}
      {isSubmittedTab && isExpanded && (
        <div className="my-trails-expanded-actions">
          <button 
            className="my-trails-show-map-button"
            onClick={handleShowOnMap}
            title="Show trail on map"
          >
            <Map size={16} />
            Show on Map
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="my-trails-trail-actions">
        {activeTab !== "completed" && activeTab !== "submitted" && (
          <>
            {/* Check if trail is in completed list */}
            {trails.completed.some(completedTrail => completedTrail.id === trail.id) ? (
              <div className="completed-status">
                <span className="completed-icon">✓</span>
                <span className="completed-text">Completed</span>
              </div>
            ) : (
              <button
                className="my-trails-complete-btn"
                onClick={() => onOpenReviewModal(trail.id, trail.name)}
              >
                Mark as Completed
              </button>
            )}
          </>
        )}
        {activeTab === "submitted" && (
          <div className="submitted-actions">
            <div className="submitted-info">
              <span className="submitted-date">
                Submitted: {new Date(trail.createdAt?.toDate?.() || trail.createdAt).toLocaleDateString()}
              </span>
              <span 
                className={`status-badge ${trail.status === 'open' ? 'status-open' : 'status-closed'}`}
                onClick={() => onOpenStatusConfirmModal(trail.id, trail.name, trail.status)}
                title={`Click to ${trail.status === 'open' ? 'close' : 'reopen'} trail`}
              >
                {trail.status === 'open' ? (
                  <>
                    <Unlock size={14} style={{ marginRight: '4px', display: 'inline-block' }} />
                    Open
                  </>
                ) : (
                  <>
                    <Lock size={14} style={{ marginRight: '4px', display: 'inline-block' }} />
                    Closed
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </li>
  );
};

export default TrailCard;
