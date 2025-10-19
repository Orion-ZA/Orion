import React, { useState } from 'react';
import {
  Star,
  AlertTriangle,
  MessageSquare,
  Image,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Tag,
  Heart,
} from 'lucide-react';
import ReviewsPopup from './ReviewsPopup';
import ReviewsCarousel from './ReviewsCarousel';
import { getDifficultyColor, getDifficultyIcon } from './trails/TrailUtils';

const ReviewsTrailCard = ({
  trail,
  alerts,
  reviews,
  user,
  userSaved,
  handleTrailAction,
  loadedImages,
  setLoadedImages,
  onShowAlertsPopup,
  onHideAlertsPopup,
  onOpenModal,
  onOpenTrailDetail,
}) => {
  // Helper function to check if an alert is expired
  const isAlertExpired = alert => {
    if (!alert || !alert.isTimed || !alert.expiresAt) return false;

    try {
      const now = new Date();
      const expiresAt = alert.expiresAt.toDate
        ? alert.expiresAt.toDate()
        : new Date(alert.expiresAt);
      return now >= expiresAt;
    } catch (error) {
      console.warn('Error checking alert expiration:', error);
      return false;
    }
  };

  const trailAlerts = alerts[trail.id];
  // Filter out expired alerts
  const activeAlerts = trailAlerts ? trailAlerts.filter(alert => !isAlertExpired(alert)) : [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewsPopup, setShowReviewsPopup] = useState(false);

  // Check if trail is favorited using userSaved data
  const isFavorited = userSaved?.favourites?.includes(trail.id) || false;

  // Toggle favorite status using database
  const toggleFavorite = e => {
    e.stopPropagation();
    if (!user || !handleTrailAction) return;

    handleTrailAction('favourites', trail.id);
  };

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(prev => (prev + 1) % trail.photos.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(prev => (prev - 1 + trail.photos.length) % trail.photos.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  return (
    <div className='trail-card'>
      {/* Trail Header with Alerts */}
      <div className='trail-header'>
        <h4>{trail.name}</h4>
        {activeAlerts && activeAlerts.length > 0 && (
          <div
            className='alerts-count-header'
            onMouseEnter={e => onShowAlertsPopup(e, activeAlerts)}
            onMouseLeave={onHideAlertsPopup}
          >
            <AlertTriangle size={16} />
            <span className='alert-count'>{activeAlerts.length}</span>
          </div>
        )}
      </div>

      {/* Trail Images */}
      <div className='trail-images'>
        {trail.photos && trail.photos.length > 0 ? (
          <div className='image-carousel'>
            {/* Navigation Arrows */}
            {trail.photos.length > 1 && (
              <>
                <button
                  className='carousel-arrow carousel-arrow-left'
                  onClick={prevImage}
                  aria-label='Previous image'
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className='carousel-arrow carousel-arrow-right'
                  onClick={nextImage}
                  aria-label='Next image'
                >
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
                    onError={e => (e.target.style.display = 'none')}
                  />
                ) : (
                  <div className='image-loading'>
                    <img
                      src={photoUrl}
                      alt={`Trail ${trail.name} ${currentImageIndex + 1}`}
                      style={{ display: 'none' }}
                      onLoad={() => {
                        setLoadedImages(prev => new Set([...prev, imageKey]));
                      }}
                      onError={e => {
                        e.target.style.display = 'none';
                        setLoadedImages(prev => new Set([...prev, imageKey]));
                      }}
                    />
                    <Loader2 className='animate-spin' size={16} />
                    <span>Loading...</span>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className='trail-image'>
            <div className='mock-image'>
              <div className='mock-image-content'>
                <Image size={32} />
                <span>No images available</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trail Info */}
      <div className='trail-info'>
        <div className='trail-rating'>
          <Star size={18} fill='currentColor' />
          <span className='rating-text'>
            {trail.averageRating ? trail.averageRating.toFixed(1) : 'N/A'}
            {trail.reviewCount > 0 && ` (${trail.reviewCount})`}
          </span>
        </div>

        {/* Difficulty Badge */}
        {trail.difficulty && (
          <div
            className='trail-difficulty-badge'
            style={{ backgroundColor: getDifficultyColor(trail.difficulty) }}
          >
            <span className='difficulty-icon'>{getDifficultyIcon(trail.difficulty)}</span>
            <span className='difficulty-text'>{trail.difficulty}</span>
          </div>
        )}

        {/* Tags */}
        <div className='trail-tags'>
          <Tag size={14} />
          <div className='tags-list'>
            {trail.tags && Array.isArray(trail.tags) && trail.tags.length > 0 ? (
              <>
                {trail.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className='tag-item'>
                    {typeof tag === 'string' ? tag : String(tag)}
                  </span>
                ))}
                {trail.tags.length > 3 && (
                  <span className='tag-more'>+{trail.tags.length - 3}</span>
                )}
              </>
            ) : (
              <span className='tag-item no-tags'>No tags</span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className='trail-divider'></div>

      {/* Trail Actions */}
      <div className='trail-actions'>
        <div className='reviews-trail-contribution-buttons'>
          <button
            className={`reviews-trail-contribution-btn reviews-trail-review-btn ${!user ? 'disabled' : ''}`}
            onClick={() => onOpenModal(trail.id, 'review')}
            title={user ? 'Add Review' : 'Please log in to review'}
            disabled={!user}
          >
            <MessageSquare size={18} />
          </button>
          <button
            className='reviews-trail-contribution-btn reviews-trail-image-btn'
            onClick={() => onOpenModal(trail.id, 'images')}
            title='Add Images'
          >
            <Image size={18} />
          </button>
          <button
            className='reviews-trail-contribution-btn reviews-trail-alert-btn'
            onClick={() => onOpenModal(trail.id, 'alert')}
            title='Add Alert'
          >
            <AlertTriangle size={18} />
          </button>
          <button
            className='reviews-trail-contribution-btn reviews-trail-details-btn'
            onClick={e => {
              e.stopPropagation();
              onOpenTrailDetail && onOpenTrailDetail(trail);
            }}
            title='View Trail Details'
          >
            <ExternalLink size={18} />
          </button>
          <button
            className={`reviews-trail-contribution-btn reviews-trail-favorite-btn ${isFavorited ? 'favorited' : ''}`}
            onClick={toggleFavorite}
            title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Recent Reviews */}
      <ReviewsCarousel reviews={reviews[trail.id] || []} trailName={trail.name} />

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
