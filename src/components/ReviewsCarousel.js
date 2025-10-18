import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const ReviewsCarousel = ({ reviews, trailName }) => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const intervalRef = useRef(null);
  const autoScrollDelay = 4000; // 4 seconds

  // Auto-scroll effect
  useEffect(() => {
    if (!reviews || reviews.length <= 1 || !isAutoScrolling) return;

    intervalRef.current = setInterval(() => {
      setCurrentReviewIndex((prevIndex) => 
        (prevIndex + 1) % reviews.length
      );
    }, autoScrollDelay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reviews, isAutoScrolling]);

  // Pause auto-scroll on hover
  const handleMouseEnter = () => {
    setIsAutoScrolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsAutoScrolling(true);
  };

  // Manual navigation
  const goToPrevious = () => {
    setCurrentReviewIndex((prevIndex) => 
      prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentReviewIndex((prevIndex) => 
      (prevIndex + 1) % reviews.length
    );
  };

  // Handle dot click
  const goToReview = (index) => {
    setCurrentReviewIndex(index);
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="reviews-carousel">
        <h5>Recent Reviews</h5>
        <div className="no-reviews">
          <span>No reviews available</span>
        </div>
      </div>
    );
  }

  const currentReview = reviews[currentReviewIndex];

  return (
    <div className="reviews-carousel">
      <h5>Recent Reviews</h5>
      
      <div 
        className="reviews-carousel-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Review Display */}
        <div className="review-display">
          <div className="review-content">
            <div className="review-header">
              <span className="review-author">{currentReview.userName || "Anonymous"}</span>
              {currentReview.rating && (
                <div className="review-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={14} 
                      fill={star <= currentReview.rating ? "currentColor" : "none"} 
                      color={star <= currentReview.rating ? "#fbbf24" : "#6b7280"}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className={`review-text ${!currentReview.message || currentReview.message.length === 0 ? 'no-text' : ''}`}>
              {currentReview.message && currentReview.message.length > 0 
                ? currentReview.message 
                : "No review text available"
              }
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        {reviews.length > 1 && (
          <>
            {/* Arrow Navigation */}
            <div className="review-navigation">
              <button 
                className="review-nav-btn review-nav-prev"
                onClick={goToPrevious}
                aria-label="Previous review"
              >
                <ChevronLeft size={16} />
              </button>
              
              <button 
                className="review-nav-btn review-nav-next"
                onClick={goToNext}
                aria-label="Next review"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Dot Indicators */}
            <div className="review-dots">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  className={`review-dot ${index === currentReviewIndex ? 'active' : ''}`}
                  onClick={() => goToReview(index)}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>

            {/* Review Counter */}
            <div className="review-counter">
              {currentReviewIndex + 1} of {reviews.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewsCarousel;
