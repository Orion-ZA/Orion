import React from 'react';
import { TrendingUp, Clock, Users, Navigation } from 'lucide-react';

const TrailInfo = ({ trail, authorName, onDirections, estimateDuration }) => {
  return (
    <div className='trail-detail-info'>
      <div className='trail-detail-title-section'>
        <h1 className='trail-detail-title'>{trail.name}</h1>
        <div className='trail-detail-location'>
          <button
            className='trail-detail-directions-btn'
            onClick={onDirections}
            title='Get directions to this trail'
          >
            <Navigation size={16} />
            Get Directions
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className='trail-detail-details-grid'>
        <div className='trail-detail-detail-card'>
          <div className='trail-detail-detail-icon'>
            <TrendingUp size={20} />
          </div>
          <div className='trail-detail-detail-info'>
            <div className='trail-detail-detail-label'>Difficulty</div>
            <div className='trail-detail-detail-value'>{trail.difficulty}</div>
          </div>
        </div>

        <div className='trail-detail-detail-card'>
          <div className='trail-detail-detail-icon'>
            <Clock size={20} />
          </div>
          <div className='trail-detail-detail-info'>
            <div className='trail-detail-detail-label'>Duration</div>
            <div className='trail-detail-detail-value'>{estimateDuration(trail.distance)}</div>
          </div>
        </div>

        <div className='trail-detail-detail-card'>
          <div className='trail-detail-detail-icon'>
            <TrendingUp size={20} />
          </div>
          <div className='trail-detail-detail-info'>
            <div className='trail-detail-detail-label'>Distance</div>
            <div className='trail-detail-detail-value'>{trail.distance} km</div>
          </div>
        </div>

        <div className='trail-detail-detail-card'>
          <div className='trail-detail-detail-icon'>
            <Users size={20} />
          </div>
          <div className='trail-detail-detail-info'>
            <div className='trail-detail-detail-label'>Author</div>
            <div className='trail-detail-detail-value'>{authorName}</div>
          </div>
        </div>

        {trail.elevationGain && trail.elevationGain > 0 && (
          <div className='trail-detail-detail-card'>
            <div className='trail-detail-detail-icon'>
              <TrendingUp size={20} />
            </div>
            <div className='trail-detail-detail-info'>
              <div className='trail-detail-detail-label'>Elevation Gain</div>
              <div className='trail-detail-detail-value'>{trail.elevationGain} m</div>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {trail.description && (
        <div className='trail-detail-description'>
          <h3>Description</h3>
          <p>{trail.description}</p>
        </div>
      )}

      {/* Tags */}
      {trail.tags && trail.tags.length > 0 && (
        <div className='trail-detail-tags'>
          <h3>Tags</h3>
          <div className='trail-detail-tag-list'>
            {trail.tags.map((tag, index) => (
              <span key={index} className='trail-detail-tag'>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Route Information */}
      {trail.route && trail.route.length > 0 && (
        <div className='trail-detail-route'>
          <h3>Route Information</h3>
          <div className='trail-detail-route-info'>
            <p>
              <strong>Route Points:</strong> {trail.route.length} waypoints
            </p>
            <p>
              <strong>Route Type:</strong> {trail.routeType || 'Custom'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailInfo;
