import React from 'react';
import { Star } from 'lucide-react';

const ContributionModal = ({
  showContributionModal,
  contributionType,
  newReview,
  setNewReview,
  newRating,
  setNewRating,
  isAnonymous,
  setIsAnonymous,
  newImages,
  alertMessage,
  setAlertMessage,
  alertType,
  setAlertType,
  uploading,
  onCloseContributionModal,
  onAddReview,
  onAddImages,
  onAddAlert,
  onImageUpload,
}) => {
  if (!showContributionModal) return null;

  return (
    <div className='trail-detail-modal-overlay' onClick={onCloseContributionModal}>
      <div className='trail-detail-modal-content' onClick={e => e.stopPropagation()}>
        <div className='trail-detail-modal-header'>
          <h3>
            {contributionType === 'review' && 'Add Review'}
            {contributionType === 'image' && 'Upload Images'}
            {contributionType === 'alert' && 'Add Alert'}
          </h3>
          <button className='trail-detail-modal-close' onClick={onCloseContributionModal}>
            ×
          </button>
        </div>

        <div className='trail-detail-modal-body'>
          {/* Review Form */}
          {contributionType === 'review' && (
            <>
              <div className='trail-detail-form-group'>
                <label>Rating</label>
                <div className='trail-detail-rating-input'>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type='button'
                      className='trail-detail-star-btn'
                      onClick={() => setNewRating(star)}
                    >
                      <Star
                        size={20}
                        fill={star <= newRating ? 'currentColor' : 'none'}
                        color={star <= newRating ? 'gold' : '#ccc'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className='trail-detail-form-group'>
                <label>Your Review</label>
                <textarea
                  value={newReview}
                  onChange={e => setNewReview(e.target.value)}
                  placeholder='Share your experience on this trail...'
                  className='trail-detail-textarea'
                  rows={4}
                />
              </div>

              <div className='trail-detail-form-group'>
                <label className='trail-detail-checkbox-label'>
                  <input
                    type='checkbox'
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                  />
                  Post anonymously
                </label>
              </div>
            </>
          )}

          {/* Image Upload */}
          {contributionType === 'image' && (
            <div className='trail-detail-form-group'>
              <label>Select Images</label>
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={onImageUpload}
                className='trail-detail-file-input'
              />
              {newImages.length > 0 && (
                <div className='trail-detail-image-preview'>
                  <p>{newImages.length} image(s) selected</p>
                </div>
              )}
            </div>
          )}

          {/* Alert Form */}
          {contributionType === 'alert' && (
            <>
              <div className='trail-detail-form-group'>
                <label>Alert Type</label>
                <select
                  value={alertType}
                  onChange={e => setAlertType(e.target.value)}
                  className='trail-detail-select'
                >
                  <option value='general'>General</option>
                  <option value='safety'>Safety</option>
                  <option value='weather'>Weather</option>
                  <option value='maintenance'>Maintenance</option>
                  <option value='wildlife'>Wildlife</option>
                </select>
              </div>

              <div className='trail-detail-form-group'>
                <label>Alert Message</label>
                <textarea
                  value={alertMessage}
                  onChange={e => setAlertMessage(e.target.value)}
                  placeholder='Describe the alert or important information...'
                  className='trail-detail-textarea'
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        <div className='trail-detail-modal-footer'>
          <button
            className='trail-detail-btn trail-detail-btn-secondary'
            onClick={onCloseContributionModal}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className='trail-detail-btn trail-detail-btn-primary'
            onClick={() => {
              if (contributionType === 'review') onAddReview();
              if (contributionType === 'image') onAddImages();
              if (contributionType === 'alert') onAddAlert();
            }}
            disabled={uploading}
          >
            {uploading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContributionModal;
