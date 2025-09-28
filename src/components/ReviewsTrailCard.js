import React, { useState } from 'react';
import { Star, AlertTriangle, MessageSquare, Image, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ReviewsPopup from './ReviewsPopup';

const ReviewsTrailCard = ({ 
  trail, 
  alerts, 
  reviews, 
  user, 
  loadedImages, 
  setLoadedImages,
  onShowAlertsPopup,
  onHideAlertsPopup,
  onOpenModal 
}) => {
  const trailAlerts = alerts[trail.id];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewsPopup, setShowReviewsPopup] = useState(false);

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % trail.photos.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + trail.photos.length) % trail.photos.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  return (
    <div className="trail-card">
      {/* Trail Header with Alerts */}
      <div className="trail-header">
        <h4>{trail.name}</h4>
        {trailAlerts && trailAlerts.length > 0 && (
          <div 
            className="alerts-count-header"
            onMouseEnter={(e) => onShowAlertsPopup(e, trailAlerts)}
            onMouseLeave={onHideAlertsPopup}
          >
            <AlertTriangle size={16} />
            <span className="alert-count">{trailAlerts.length}</span>
          </div>
        )}
      </div>

      {/* Trail Images */}
      <div className="trail-images">
        {trail.photos && trail.photos.length > 0 ? (
          <div className="image-carousel">
            {/* Navigation Arrows */}
            {trail.photos.length > 1 && (
              <>
                <button className="carousel-arrow carousel-arrow-left" onClick={prevImage} aria-label="Previous image">
                  <ChevronLeft size={20} />
                </button>
                <button className="carousel-arrow carousel-arrow-right" onClick={nextImage} aria-label="Next image">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            
            {/* Current Image */}
            <div className={`trail-image ${isTransitioning ? 'transitioning' : ''}`}>
              {(() => {
                const imageKey = `${trail.id}-${currentImageIndex}`;
                const isLoaded = loadedImages.has(imageKey);
                const photoUrl = trail.photos[currentImageIndex];
                
                return isLoaded ? (
                  <img
                    src={photoUrl}
                    alt={`Trail ${trail.name} ${currentImageIndex + 1}`}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : (
                  <div className="image-loading">
                    <img
                      src={photoUrl}
                      alt={`Trail ${trail.name} ${currentImageIndex + 1}`}
                      style={{ display: "none" }}
                      onLoad={() => {
                        setLoadedImages(prev => new Set([...prev, imageKey]));
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        setLoadedImages(prev => new Set([...prev, imageKey]));
                      }}
                    />
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading...</span>
                  </div>
                );
              })()}
            </div>
            
          </div>
        ) : (
          <div className="trail-image">
            <div className="mock-image">
              <div className="mock-image-content">
                <Image size={32} />
                <span>No images available</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trail Info */}
      <div className="trail-info">
        <div className="trail-rating">
          <Star size={18} fill="currentColor" />
          <span className="rating-text">
            {trail.averageRating ? trail.averageRating.toFixed(1) : "N/A"}
            {trail.reviewCount > 0 && ` (${trail.reviewCount})`}
          </span>
        </div>
      </div>

      {/* Trail Actions */}
      <div className="trail-actions">
        <h5 className="actions-heading">Contribute</h5>
        <div className="actions-buttons">
          <button 
            className={`reviews-media-action-btn reviews-media-review-btn ${!user ? 'disabled' : ''}`}
            onClick={() => onOpenModal(trail.id, "review")}
            title={user ? "Add Review" : "Please log in to review"}
            disabled={!user}
          >
            <MessageSquare size={16} />
            <span>Review</span>
          </button>
          <button 
            className="reviews-media-action-btn reviews-media-image-btn"
            onClick={() => onOpenModal(trail.id, "images")}
          >
            <Image size={16} />
            <span>Images</span>
          </button>
          <button 
            className="reviews-media-action-btn reviews-media-alert-btn"
            onClick={() => onOpenModal(trail.id, "alert")}
          >
            <AlertTriangle size={16} />
            <span>Alert</span>
          </button>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="recent-reviews">
        <h5>Recent Reviews</h5>
        {reviews[trail.id] && reviews[trail.id].length > 0 ? (
          <div className="reviews-list">
            {reviews[trail.id].slice(0, 2).map((rev) => (
              <div key={rev.id} className="review-item">
                <div className="review-content">
                  <span className="review-author">{rev.userName || "Anonymous"}</span>
                  {rev.rating && (
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          fill={star <= rev.rating ? "currentColor" : "none"} 
                          color={star <= rev.rating ? "#fbbf24" : "#6b7280"}
                          data-testid="star"
                        />
                      ))}
                    </div>
                  )}
                  <p className="review-text">{rev.message}</p>
                </div>
              </div>
            ))}
            {reviews[trail.id].length > 2 && (
              <div 
                className="more-reviews clickable"
                onClick={() => setShowReviewsPopup(true)}
              >
                +{reviews[trail.id].length - 2} more reviews
              </div>
            )}
          </div>
        ) : (
          <div className="no-reviews">
            <span>No reviews yet</span>
          </div>
        )}
      </div>

      {/* Reviews Popup */}
      <ReviewsPopup
        isVisible={showReviewsPopup}
        reviews={reviews[trail.id] || []}
        trailName={trail.name}
        onClose={() => setShowReviewsPopup(false)}
      />
    </div>
  );
};

export default ReviewsTrailCard;
