import React, { useState, useEffect } from 'react';

const ReviewModal = ({ trailName, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    };
  }, [isOpen]);

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      alert("Please enter a rating between 1 and 5");
      return;
    }
    onSubmit(rating, comment);
    setRating(5);
    setComment('');
  };

  const handleClose = () => {
    onClose();
    setRating(5);
    setComment('');
  };

  // Handle overlay click (close modal when clicking outside content)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className={`modal-overlay ${isOpen ? 'open' : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className="modal-content">
        <button className="modal-close-btn" onClick={handleClose} aria-label="Close modal">
          ×
        </button>
        <h3>Review: {trailName}</h3>
        
        <div className="input-group">
          <label>
            Rating (1-5)
          </label>
          <div className="rating-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows="4"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
