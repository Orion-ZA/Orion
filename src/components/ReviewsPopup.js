import React from 'react';
import { Star, X } from 'lucide-react';
import './ReviewsPopup.css';

const ReviewsPopup = ({ isVisible, reviews, trailName, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="reviews-popup-overlay" onClick={onClose}>
      <div className="reviews-popup" onClick={(e) => e.stopPropagation()}>
        <div className="reviews-popup-header">
          <h3>Reviews for {trailName}</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="reviews-popup-content">
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <span className="review-author">{review.userName || "Anonymous"}</span>
                    {review.rating && (
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={16} 
                            fill={star <= review.rating ? "currentColor" : "none"} 
                            color={star <= review.rating ? "#fbbf24" : "#6b7280"}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="review-text">{review.message}</p>
                  <span className="review-date">
                    {new Date(review.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews">
              <p>No reviews yet for this trail.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsPopup;
