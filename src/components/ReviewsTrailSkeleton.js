import React from 'react';
import { Loader2 } from 'lucide-react';

const ReviewsTrailSkeleton = () => (
  <div className="trail-card">
    <div className="trail-image">
      <div className="image-loading">
        <Loader2 className="animate-spin" size={16} />
        <span>Loading...</span>
      </div>
    </div>
    <div className="trail-header">
      <div className="skeleton-text skeleton-title" />
      <div className="skeleton-text skeleton-rating" />
    </div>
    <div className="trail-actions">
      <div className="skeleton-button" />
      <div className="skeleton-button" />
      <div className="skeleton-button" />
    </div>
    <div className="recent-reviews">
      <div className="skeleton-text skeleton-subtitle" />
      <div className="skeleton-review" />
      <div className="skeleton-review" />
    </div>
  </div>
);

export default ReviewsTrailSkeleton;
