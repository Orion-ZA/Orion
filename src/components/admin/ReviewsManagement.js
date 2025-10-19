import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Trash2, Star, MessageSquare, Calendar, User, MapPin } from 'lucide-react';
import './ReviewsManagement.css';

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const trailsRef = collection(db, 'Trails');
      const trailsSnapshot = await getDocs(trailsRef);

      const allReviews = [];

      for (const trailDoc of trailsSnapshot.docs) {
        const reviewsRef = collection(db, 'Trails', trailDoc.id, 'reviews');
        const q = query(reviewsRef, orderBy('timestamp', 'desc'));
        const reviewsSnapshot = await getDocs(q);

        const trailData = trailDoc.data();

        reviewsSnapshot.docs.forEach(reviewDoc => {
          allReviews.push({
            id: reviewDoc.id,
            trailId: trailDoc.id,
            trailName: trailData.name || 'Unnamed Trail',
            ...reviewDoc.data(),
          });
        });
      }

      // Sort by timestamp (most recent first)
      allReviews.sort((a, b) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return bTime - aTime;
      });

      setReviews(allReviews);
    } catch (err) {
      setError('Failed to fetch reviews: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId, trailId) => {
    try {
      await deleteDoc(doc(db, 'Trails', trailId, 'reviews', reviewId));
      setReviews(reviews.filter(review => review.id !== reviewId));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete review: ' + err.message);
    }
  };

  const formatDate = timestamp => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderStars = rating => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Star key={i} className={`admin-star ${i <= rating ? 'filled' : 'empty'}`} />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className='admin-reviews-management'>
        <div className='admin-reviews-loading'>
          <div className='admin-loading-spinner'></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='admin-reviews-management'>
        <div className='admin-reviews-error'>
          <MessageSquare className='admin-error-icon' />
          <p>{error}</p>
          <button onClick={fetchReviews} className='admin-retry-button'>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='admin-reviews-management'>
      <div className='admin-reviews-header'>
        <h2>Reviews Management</h2>
        <div className='admin-reviews-stats'>
          <span className='admin-stat-item'>
            <MessageSquare className='admin-stat-icon' />
            Total Reviews: {reviews.length}
          </span>
        </div>
      </div>

      <div className='admin-reviews-list'>
        {reviews.length === 0 ? (
          <div className='admin-no-reviews'>
            <MessageSquare className='admin-no-reviews-icon' />
            <p>No reviews found</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className='admin-review-card'>
              <div className='admin-review-header'>
                <div className='admin-review-trail-info'>
                  <h3 className='admin-trail-name'>{review.trailName}</h3>
                  <div className='admin-review-rating'>
                    {renderStars(review.rating || 0)}
                    <span className='admin-rating-text'>({review.rating || 0}/5)</span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(review)}
                  className='admin-delete-button'
                  title='Delete Review'
                >
                  <Trash2 className='admin-delete-icon' />
                </button>
              </div>

              <div className='admin-review-content'>
                {review.comment && <p className='admin-review-comment'>"{review.comment}"</p>}
              </div>

              <div className='admin-review-details'>
                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>User ID:</span>
                  <span className='admin-detail-value'>{review.userId || 'N/A'}</span>
                </div>

                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Trail ID:</span>
                  <span className='admin-detail-value'>{review.trailId || 'N/A'}</span>
                </div>

                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Posted:</span>
                  <span className='admin-detail-value'>{formatDate(review.timestamp)}</span>
                </div>

                {review.photos && review.photos.length > 0 && (
                  <div className='admin-detail-row admin-full-width'>
                    <span className='admin-detail-label'>Photos:</span>
                    <span className='admin-detail-value'>{review.photos.length} photo(s)</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <div className='admin-delete-modal-overlay'>
          <div className='admin-delete-modal'>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this review?</p>
            <div className='admin-review-preview'>
              <p className='admin-review-preview-trail'>Trail: {deleteConfirm.trailName}</p>
              <p className='admin-review-preview-rating'>Rating: {deleteConfirm.rating}/5</p>
              {deleteConfirm.comment && (
                <p className='admin-review-preview-comment'>"{deleteConfirm.comment}"</p>
              )}
            </div>
            <p className='admin-warning-text'>This action cannot be undone.</p>
            <div className='admin-modal-actions'>
              <button onClick={() => setDeleteConfirm(null)} className='admin-cancel-button'>
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReview(deleteConfirm.id, deleteConfirm.trailId)}
                className='admin-confirm-delete-button'
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
