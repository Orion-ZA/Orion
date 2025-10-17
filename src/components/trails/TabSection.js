import React from 'react';
import { MessageSquare, Image, Bell, Plus, Upload, AlertTriangle, Star } from 'lucide-react';

const TabSection = ({ 
  activeTab, 
  setActiveTab, 
  reviews, 
  trail, 
  reviewSortBy, 
  setReviewSortBy, 
  loadingReviews, 
  getSortedReviews, 
  onOpenContributionModal, 
  currentImageIndex, 
  setCurrentImageIndex 
}) => {
  return (
    <div className="trail-detail-tab-section">
      {/* Tab Navigation */}
      <div className="trail-detail-tab-nav">
        <button
          className={`trail-detail-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <MessageSquare size={18} />
          Reviews ({reviews.length})
        </button>
        <button
          className={`trail-detail-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          <Image size={18} />
          Media ({trail?.photos?.length || 0})
        </button>
        <button
          className={`trail-detail-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={18} />
          Alerts
        </button>
      </div>

      {/* Tab Content */}
      <div className="trail-detail-tab-content">
        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="trail-detail-tab-panel">
            <div className="trail-detail-reviews-header">
              <button
                className="trail-detail-contribute-btn"
                onClick={() => onOpenContributionModal('review')}
                title="Add a review"
              >
                <Plus size={16} />
                Add Review
              </button>
              {reviews.length > 0 && (
                <div className="trail-detail-review-sort">
                  <label htmlFor="review-sort">Sort by:</label>
                  <select
                    id="review-sort"
                    value={reviewSortBy}
                    onChange={(e) => setReviewSortBy(e.target.value)}
                    className="trail-detail-sort-select"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>
              )}
            </div>
            
            {loadingReviews ? (
              <div className="trail-detail-loading">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              <div className="trail-detail-reviews-container">
                <div className="trail-detail-reviews-list">
                  {getSortedReviews().map((review) => (
                    <div key={review.id} className="trail-detail-review">
                      <div className="trail-detail-review-header">
                        <div className="trail-detail-review-author">
                          <strong>{review.userName || 'Anonymous'}</strong>
                        </div>
                        <div className="trail-detail-review-rating">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={i < (review.rating || 0) ? "currentColor" : "none"}
                              color={i < (review.rating || 0) ? "#ffc107" : "rgba(255, 255, 255, 0.3)"}
                            />
                          ))}
                        </div>
                        <div className="trail-detail-review-date">
                          {new Date(review.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="trail-detail-review-content">
                        <p>{review.comment || review.message || 'No comment provided'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="trail-detail-no-reviews">No reviews yet. Be the first to review this trail!</p>
            )}
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="trail-detail-tab-panel">
            <div className="trail-detail-media-header">
              <button
                className="trail-detail-contribute-btn"
                onClick={() => onOpenContributionModal('image')}
                title="Upload images"
              >
                <Upload size={16} />
                Upload Images
              </button>
            </div>
            <div className="trail-detail-media-gallery">
              {trail?.photos && trail.photos.length > 0 ? (
                <div className="trail-detail-media-grid">
                  {trail.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="trail-detail-media-item"
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={photo}
                        alt={`Trail photo ${index + 1}`}
                        className="trail-detail-media-thumbnail"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="trail-detail-no-media">No photos available for this trail.</p>
              )}
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="trail-detail-tab-panel">
            <div className="trail-detail-alerts-header">
              <button
                className="trail-detail-contribute-btn"
                onClick={() => onOpenContributionModal('alert')}
                title="Add an alert"
              >
                <AlertTriangle size={16} />
                Add Alert
              </button>
            </div>
            <div className="trail-detail-alerts-content">
              {/* Trail Status Alert */}
              <div className="trail-detail-alert-item">
                <div className="trail-detail-alert-header">
                  <Bell size={20} />
                  <h4>Trail Status</h4>
                </div>
                <div className="trail-detail-status-info">
                  <p>Status: <span className={`status-${trail?.status || 'unknown'}`}>{trail?.status || 'Unknown'}</span></p>
                  {trail?.status === 'closed' && (
                    <p className="trail-detail-closure-notice">
                      ⚠️ This trail is currently closed. Please check back later or contact local authorities for more information.
                    </p>
                  )}
                </div>
              </div>

              {/* Safety Tips */}
              <div className="trail-detail-alert-item">
                <div className="trail-detail-alert-header">
                  <Bell size={20} />
                  <h4>Safety Tips</h4>
                </div>
                <div className="trail-detail-safety-tips">
                  <ul>
                    <li>Always bring enough water and snacks</li>
                    <li>Check weather conditions before starting</li>
                    <li>Inform someone of your hiking plans</li>
                    <li>Bring a first aid kit and emergency supplies</li>
                    <li>Stay on marked trails</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabSection;
