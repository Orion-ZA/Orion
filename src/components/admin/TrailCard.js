import React from 'react';
import { ChevronDown, ChevronRight, MapPin, Calendar, User, Star, AlertCircle, Edit, Trash2, MessageSquare, AlertTriangle, Ruler, Mountain, Target, Tag, XCircle, Wrench, CloudRain, Info } from 'lucide-react';
import { formatDate, formatLocation, renderStars, getAlertTypeColor, truncateUserId, getAlertTypeIcon, getDifficultyColor } from '../../utils/trailUtils';
import './TrailCard.css';

const TrailCard = ({ 
  trail, 
  isExpanded, 
  onToggleExpansion, 
  onEdit, 
  onDelete,
  reviews = [],
  alerts = [],
  trailCounts = {},
  loadingStates = {},
  onDeleteReview,
  onDeleteAlert
}) => {
  const reviewsForTrail = reviews[String(trail.id)] || [];
  const alertsForTrail = alerts[String(trail.id)] || [];
  const counts = trailCounts[String(trail.id)] || { reviews: 0, alerts: 0 };

  // Function to render alert type icons
  const renderAlertTypeIcon = (type) => {
    const iconName = getAlertTypeIcon(type);
    const iconProps = { className: "trail-card-alert-type-icon", size: 16 };
    
    switch (iconName) {
      case 'AlertTriangle':
        return <AlertTriangle {...iconProps} />;
      case 'XCircle':
        return <XCircle {...iconProps} />;
      case 'Wrench':
        return <Wrench {...iconProps} />;
      case 'CloudRain':
        return <CloudRain {...iconProps} />;
      case 'Info':
        return <Info {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  return (
    <div className="trail-card-item">
      {/* Trail Header */}
      <div className="trail-card-header">
        <div className="trail-card-info-main">
          <h3 className="trail-card-name">{String(trail.name || 'Unnamed Trail')}</h3>
          <div className="trail-card-meta">
            <div className="trail-card-meta-item">
              <MapPin className="trail-card-meta-icon" />
              <span>{formatLocation(trail.location)}</span>
            </div>
            <div className="trail-card-meta-item">
              <Calendar className="trail-card-meta-icon" />
              <span>{formatDate(trail.createdAt)}</span>
            </div>
            <div className="trail-card-meta-item">
              <User className="trail-card-meta-icon" />
              <span title={String(trail.createdBy || 'Unknown')}>
                {truncateUserId(String(trail.createdBy || 'Unknown'))}
              </span>
            </div>
            {trail.distance && (
              <div className="trail-card-meta-item">
                <Ruler className="trail-card-meta-icon" />
                <span>{trail.distance} km</span>
              </div>
            )}
            {trail.elevationGain && (
              <div className="trail-card-meta-item">
                <Mountain className="trail-card-meta-icon" />
                <span>{trail.elevationGain} m</span>
              </div>
            )}
            <div className="trail-card-meta-item">
              <Target className="trail-card-meta-icon" style={{ color: getDifficultyColor(trail.difficulty) }} />
              <span style={{ color: getDifficultyColor(trail.difficulty) }}>
                {String(trail.difficulty || 'Unknown')}
              </span>
            </div>
            <div className="trail-card-meta-item">
              <span className={`trail-card-status-badge trail-card-status-${String(trail.status || 'open')}`}>
                {String(trail.status || 'open').toUpperCase()}
              </span>
            </div>
            {trail.tags && trail.tags.length > 0 && (
              <div className="trail-card-meta-item">
                <Tag className="trail-card-meta-icon" />
                <span>{trail.tags.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="trail-card-actions">
          <button
            onClick={() => onEdit(trail)}
            className="trail-card-edit-button"
            title="Edit Trail"
          >
            <Edit className="trail-card-edit-icon" />
          </button>
          <button
            onClick={() => onDelete(String(trail.id), String(trail.name || 'Unnamed Trail'))}
            className="trail-card-delete-button"
            title="Delete Trail"
          >
            <Trash2 className="trail-card-delete-icon" />
          </button>
          <button
            onClick={() => onToggleExpansion(String(trail.id))}
            className="trail-card-expand-button"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>

      {/* Trail Counters - Bottom Right */}
      <div className="trail-card-counters-bottom">
        <div className="trail-card-counter-item">
          <MessageSquare className="trail-card-counter-icon" />
          {loadingStates.reviews?.[String(trail.id)] ? (
            <div className="trail-card-counter-loading">
              <div className="trail-card-loading-spinner-tiny"></div>
            </div>
          ) : (
            <span className="trail-card-counter-text">{counts.reviews || 0}</span>
          )}
        </div>
        <div className="trail-card-counter-item">
          <AlertTriangle className="trail-card-counter-icon" />
          {loadingStates.alerts?.[String(trail.id)] ? (
            <div className="trail-card-counter-loading">
              <div className="trail-card-loading-spinner-tiny"></div>
            </div>
          ) : (
            <span className="trail-card-counter-text">{counts.alerts || 0}</span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="trail-card-expanded-content">
          {/* Reviews Section */}
          <div className="trail-card-content-section">
            <div className="trail-card-section-header">
              <MessageSquare className="trail-card-section-icon" />
              <h4>Reviews ({reviewsForTrail.length})</h4>
            </div>
            <div className="trail-card-scrollable-container">
              {loadingStates.reviews?.[String(trail.id)] ? (
                <div className="trail-card-loading-section">
                  <div className="trail-card-loading-spinner-small"></div>
                  <p>Loading reviews...</p>
                </div>
              ) : reviewsForTrail.length === 0 ? (
                <div className="trail-card-empty-section">
                  <p>No reviews yet</p>
                </div>
              ) : (
                reviewsForTrail.map((review) => (
                  <div key={review.id} className="trail-card-review-item">
                    <div className="trail-card-review-header">
                      <div className="trail-card-review-rating">
                        {renderStars(typeof review.rating === 'number' ? review.rating : 0)}
                        <span className="trail-card-rating-text">({typeof review.rating === 'number' ? review.rating : 0}/5)</span>
                      </div>
                      <button
                        onClick={() => onDeleteReview(review.id, String(trail.id), String(trail.name || 'Unnamed Trail'))}
                        className="trail-card-review-delete-button"
                        title="Delete Review"
                      >
                        <Trash2 className="trail-card-delete-icon" />
                      </button>
                    </div>
                    <p className={`trail-card-review-comment ${!(review.comment || review.message) ? 'no-comment' : ''}`}>
                      {(review.comment || review.message) ? `"${String(review.comment || review.message)}"` : "No comment provided"}
                    </p>
                    <div className="trail-card-review-meta">
                      <span className="trail-card-review-user" title={String(review.userId || 'Unknown')}>
                        User: {truncateUserId(String(review.userId || 'Unknown'))}
                      </span>
                      <span className="trail-card-review-date">{formatDate(review.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alerts Section */}
          <div className="trail-card-content-section">
            <div className="trail-card-section-header">
              <AlertTriangle className="trail-card-section-icon" />
              <h4>Alerts ({alertsForTrail.length})</h4>
            </div>
            <div className="trail-card-scrollable-container">
              {loadingStates.alerts?.[String(trail.id)] ? (
                <div className="trail-card-loading-section">
                  <div className="trail-card-loading-spinner-small"></div>
                  <p>Loading alerts...</p>
                </div>
              ) : alertsForTrail.length === 0 ? (
                <div className="trail-card-empty-section">
                  <p>No alerts for this trail</p>
                </div>
              ) : (
                alertsForTrail.map((alert) => (
                  <div key={alert.id} className={`trail-card-alert-item ${alert.isActive ? 'active' : 'inactive'}`}>
                    <div className="trail-card-alert-header">
                      <div className="trail-card-alert-type">
                        <div className="trail-card-alert-type-content">
                          {renderAlertTypeIcon(alert.type)}
                          <span 
                            className="trail-card-alert-type-text"
                            style={{ color: getAlertTypeColor(alert.type) }}
                          >
                            {String(alert.type || 'Unknown')}
                          </span>
                        </div>
                        <span className={`trail-card-alert-status ${alert.isActive ? 'active' : 'inactive'}`}>
                          {alert.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="trail-card-alert-delete-button"
                        title="Delete Alert"
                      >
                        <Trash2 className="trail-card-delete-icon" />
                      </button>
                    </div>
                    <p className="trail-card-alert-message">{String(alert.message || alert.comment || 'No message')}</p>
                    <div className="trail-card-alert-meta">
                      <span className="trail-card-alert-date">{formatDate(alert.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailCard;
