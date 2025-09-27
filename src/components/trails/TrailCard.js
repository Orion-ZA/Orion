import React from 'react';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { getDifficultyColor, getDifficultyIcon } from './TrailUtils';

const TrailCard = ({ 
  trail, 
  activeTab, 
  alerts, 
  loadingStates, 
  trails,
  onShowAlertsPopup,
  onHideAlertsPopup,
  onOpenStatusConfirmModal,
  onOpenReviewModal
}) => {
  const trailAlerts = alerts[trail.id];

  return (
    <li key={trail.id} className="trail-card">
      <div className="trail-header">
        <h4>{trail.name}</h4>
        {/* Alerts Count - positioned in header */}
        {loadingStates.alerts ? (
          <div className="alerts-loading-small">Loading...</div>
        ) : (
          trailAlerts && trailAlerts.length > 0 && (
            <div 
              className="alerts-count-header"
              onMouseEnter={(e) => onShowAlertsPopup(e, trailAlerts)}
              onMouseLeave={onHideAlertsPopup}
            >
              <AlertTriangle size={16} className="alert-icon" />
              <span className="alert-count">{trailAlerts.length}</span>
            </div>
          )
        )}
      </div>


      {/* Trail Info */}
      <div className="trail-info">
        <div className="trail-details-grid">
          <div className="trail-detail-item">
            <span 
              className="trail-difficulty"
              style={{ backgroundColor: getDifficultyColor(trail.difficulty) }}
            >
              <span className="trail-difficulty-icon">
                {getDifficultyIcon(trail.difficulty)}
              </span>
              <span className="trail-difficulty-text">{trail.difficulty}</span>
            </span>
          </div>
          <div className="trail-detail-item">
            <span className="trail-distance">
              <span className="trail-detail-label">Distance</span>
              <span className="trail-detail-value">{trail.distance} km</span>
            </span>
          </div>
          {trail.elevationGain && (
            <div className="trail-detail-item">
              <span className="trail-elevation">
                <span className="trail-detail-label">Elevation</span>
                <span className="trail-detail-value">+{trail.elevationGain}m</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="trail-actions">
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
                className="complete-btn"
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
